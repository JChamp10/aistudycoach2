const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

// List people I follow
router.get('/following', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.xp, u.streak, u.avatar_url, u.plan
      FROM users u
      JOIN follows f ON f.following_id = u.id
      WHERE f.follower_id = $1
    `, [req.user.id]);
    res.json({ following: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Follow someone
router.post('/follow/:id', async (req, res) => {
  const { id } = req.params;
  if (id === req.user.id) return res.status(400).json({ error: "You can't follow yourself" });

  try {
    await query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, id]
    );
    res.json({ success: true, message: 'Now following!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unfollow someone
router.delete('/unfollow/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.id, id]
    );
    res.json({ success: true, message: 'Unfollowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
