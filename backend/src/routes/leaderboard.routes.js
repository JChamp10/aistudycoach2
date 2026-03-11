const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/global', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, username, xp, streak, avatar_url, region,
        RANK() OVER (ORDER BY xp DESC) AS rank
      FROM users
      ORDER BY xp DESC LIMIT 50
    `);
    res.json({ leaderboard: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/weekly', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.avatar_url, u.region,
        COALESCE(SUM(ss.xp_earned), 0) AS weekly_xp,
        RANK() OVER (ORDER BY COALESCE(SUM(ss.xp_earned), 0) DESC) AS rank
      FROM users u
      LEFT JOIN study_sessions ss
        ON ss.user_id = u.id AND ss.created_at >= DATE_TRUNC('week', NOW())
      GROUP BY u.id
      ORDER BY weekly_xp DESC LIMIT 50
    `);
    res.json({ leaderboard: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly leaderboard' });
  }
});

router.get('/regional', async (req, res) => {
  try {
    const userResult = await query('SELECT region FROM users WHERE id = $1', [req.user.id]);
    const region = userResult.rows[0]?.region || 'Global';

    const result = await query(`
      SELECT id, username, xp, streak, avatar_url, region,
        RANK() OVER (ORDER BY xp DESC) AS rank
      FROM users
      WHERE region = $1
      ORDER BY xp DESC LIMIT 50
    `, [region]);
    res.json({ leaderboard: result.rows, region });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch regional leaderboard' });
  }
});

module.exports = router;
