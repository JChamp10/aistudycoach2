const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

router.get('/global', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, username, xp, streak, avatar_url,
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
      SELECT u.id, u.username, u.avatar_url,
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

module.exports = router;
