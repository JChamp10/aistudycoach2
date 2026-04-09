const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { getLevelFromXP } = require('../services/gamification.service');

const router = express.Router();
router.use(authenticate);

router.get('/profile', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.xp, u.streak,
        u.avatar_url, u.bio, u.role, u.created_at, u.last_study_date,
        COUNT(DISTINCT ss.id) AS total_sessions,
        COALESCE(SUM(ss.duration_minutes), 0) AS total_study_minutes
      FROM users u
      LEFT JOIN study_sessions ss ON ss.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id
    `, [req.user.id]);

    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const achResult = await query(`
      SELECT a.*, ua.earned_at FROM achievements a
      JOIN user_achievements ua ON ua.achievement_id = a.id
      WHERE ua.user_id = $1 ORDER BY ua.earned_at DESC
    `, [req.user.id]);

    const levelInfo = getLevelFromXP(user.xp);
    res.json({ ...user, level: levelInfo, achievements: achResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  const { username, bio, avatar_url } = req.body;
  try {
    const result = await query(`
      UPDATE users SET
        username = COALESCE($1, username),
        bio = COALESCE($2, bio),
        avatar_url = COALESCE($3, avatar_url),
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, username, email, bio, avatar_url, xp, streak
    `, [username, bio, avatar_url, req.user.id]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const sessionStats = await query(`
      SELECT type, COUNT(*) AS count, AVG(score) AS avg_score
      FROM study_sessions WHERE user_id = $1 GROUP BY type
    `, [req.user.id]);

    const heatmap = await query(`
      SELECT DATE(created_at) AS date, COUNT(*) AS sessions, SUM(duration_minutes) AS minutes
      FROM study_sessions
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at) ORDER BY date
    `, [req.user.id]);

    const subjects = await query(`
      SELECT name, mastery_score, color FROM subjects
      WHERE user_id = $1 ORDER BY mastery_score DESC
    `, [req.user.id]);

    res.json({ sessionStats: sessionStats.rows, heatmap: heatmap.rows, subjects: subjects.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/achievements', async (req, res) => {
  try {
    const result = await query(`
      SELECT a.*, ua.earned_at,
        CASE WHEN ua.user_id IS NOT NULL THEN true ELSE false END AS earned
      FROM achievements a
      LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
      ORDER BY earned DESC, a.xp_reward DESC
    `, [req.user.id]);
    res.json({ achievements: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

// ─── Promo Code Redemption ────────────────────────────────────────────────────
const VALID_CODES = (process.env.PROMO_CODES || 'LEGENDFOUNDER2026,JCHAMPVIP').split(',').map(c => c.trim().toUpperCase());

router.post('/redeem-code', async (req, res) => {
  const { code } = req.body;
  if (!code?.trim()) return res.status(400).json({ error: 'Code is required' });

  const normalized = code.trim().toUpperCase();
  if (!VALID_CODES.includes(normalized)) {
    return res.status(400).json({ error: 'Invalid or expired promo code' });
  }

  try {
    await query(
      "UPDATE users SET plan = 'legend' WHERE id = $1",
      [req.user.id]
    );
    res.json({ success: true, plan: 'legend', message: '🎉 You are now a Legend! Enjoy infinite AI.' });
  } catch (err) {
    console.error('Redeem code error:', err);
    res.status(500).json({ error: 'Failed to redeem code' });
  }
});

module.exports = router;
