const express = require('express');
const { query, getClient } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

const COMMISSION_RATE = parseFloat(process.env.COMMISSION_RATE) || 0.15;

router.get('/', async (req, res) => {
  const { type, search, sort = 'rating', limit = 20, offset = 0 } = req.query;
  try {
    let conditions = ['mi.is_active = true'];
    const params = [];
    let paramIdx = 1;

    if (type) { conditions.push(`mi.item_type = $${paramIdx++}`); params.push(type); }
    if (search) {
      conditions.push(`(mi.title ILIKE $${paramIdx} OR mi.description ILIKE $${paramIdx + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      paramIdx += 2;
    }

    const orderMap = {
      rating: 'mi.rating_avg DESC',
      price_asc: 'mi.price ASC',
      price_desc: 'mi.price DESC',
      newest: 'mi.created_at DESC',
      popular: 'mi.download_count DESC'
    };
    const orderClause = orderMap[sort] || 'mi.rating_avg DESC';
    params.push(limit, offset);

    const result = await query(`
      SELECT mi.*, u.username AS creator_name, u.avatar_url AS creator_avatar
      FROM marketplace_items mi
      JOIN users u ON u.id = mi.creator_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderClause}
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `, params);

    res.json({ items: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch marketplace items' });
  }
});

router.get('/my/listings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketplace_items WHERE creator_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ listings: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

router.get('/my/purchases', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, mi.title, mi.item_type, mi.subject, u.username AS creator_name
      FROM purchases p
      JOIN marketplace_items mi ON mi.id = p.item_id
      JOIN users u ON u.id = mi.creator_id
      WHERE p.user_id = $1 ORDER BY p.purchase_date DESC
    `, [req.user.id]);
    res.json({ purchases: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await query(`
      SELECT mi.*, u.username AS creator_name, u.avatar_url AS creator_avatar, u.bio AS creator_bio
      FROM marketplace_items mi
      JOIN users u ON u.id = mi.creator_id
      WHERE mi.id = $1 AND mi.is_active = true
    `, [req.params.id]);
    if (!item.rows[0]) return res.status(404).json({ error: 'Item not found' });

    const reviews = await query(`
      SELECT r.*, u.username, u.avatar_url FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.item_id = $1 ORDER BY r.created_at DESC LIMIT 20
    `, [req.params.id]);

    const purchased = await query('SELECT id FROM purchases WHERE user_id = $1 AND item_id = $2', [req.user.id, req.params.id]);
    res.json({ item: item.rows[0], reviews: reviews.rows, alreadyPurchased: purchased.rows.length > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, price, item_type, subject, preview_content, deck_id, homework_content } = req.body;
  const validTypes = ['flashcard_pack', 'study_guide', 'exam_prep', 'homework'];
  const finalType = validTypes.includes(item_type) ? item_type : 'flashcard_pack';
  try {
    const result = await query(`
      INSERT INTO marketplace_items (creator_id, title, description, price, item_type, subject, preview_content, deck_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [req.user.id, title, description, price || 0, finalType, subject, JSON.stringify(preview_content || homework_content), deck_id || null]);
    await query('UPDATE users SET role = $1 WHERE id = $2 AND role = $3', ['creator', req.user.id, 'student']);
    res.status(201).json({ item: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

router.post('/:id/purchase', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const item = await client.query('SELECT * FROM marketplace_items WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!item.rows[0]) throw new Error('Item not found');
    const mi = item.rows[0];

    const existing = await client.query('SELECT id FROM purchases WHERE user_id = $1 AND item_id = $2', [req.user.id, mi.id]);
    if (existing.rows.length > 0) throw new Error('Already purchased');
    if (mi.creator_id === req.user.id) throw new Error('Cannot purchase your own item');

    const commission = parseFloat((mi.price * COMMISSION_RATE).toFixed(2));
    const creatorPayout = parseFloat((mi.price - commission).toFixed(2));

    const purchase = await client.query(`
      INSERT INTO purchases (user_id, item_id, amount_paid, commission_amount, creator_payout)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.user.id, mi.id, mi.price, commission, creatorPayout]);

    await client.query('UPDATE marketplace_items SET download_count = download_count + 1 WHERE id = $1', [mi.id]);
    await client.query('COMMIT');
    res.json({ purchase: purchase.rows[0], message: 'Purchase successful' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/:id/review', async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const purchased = await query('SELECT id FROM purchases WHERE user_id = $1 AND item_id = $2', [req.user.id, req.params.id]);
    if (!purchased.rows.length) return res.status(403).json({ error: 'Must purchase before reviewing' });

    await query(`
      INSERT INTO reviews (user_id, item_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, item_id) DO UPDATE SET rating = $3, comment = $4
    `, [req.user.id, req.params.id, rating, comment]);

    const avgResult = await query('SELECT AVG(rating) AS avg, COUNT(*) AS count FROM reviews WHERE item_id = $1', [req.params.id]);
    await query('UPDATE marketplace_items SET rating_avg = $1, rating_count = $2 WHERE id = $3',
      [parseFloat(avgResult.rows[0].avg).toFixed(2), avgResult.rows[0].count, req.params.id]);

    res.json({ message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
