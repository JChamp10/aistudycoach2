const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { getLevelFromXP } = require('../services/gamification.service');

const router = express.Router();
router.use(authenticate);

router.get('/profile', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.email, u.xp, u.streak, u.plan, u.ai_calls_today,
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
      RETURNING id, username, email, bio, avatar_url, xp, streak, plan, ai_calls_today
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
// ─── AI Usage Info (for all users) ────────────────────────────────────────────
router.get('/usage', async (req, res) => {
  try {
    const result = await query(
      'SELECT plan, ai_calls_today, last_ai_call_date, username FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const { plan, ai_calls_today, last_ai_call_date, username } = result.rows[0];
    const FREE_AI_LIMIT = parseInt(process.env.FREE_AI_LIMIT) || 10;
    const isUnlimited = plan === 'pro' || plan === 'legend' || username === 'jchamp101';
    
    const today = new Date().toISOString().split('T')[0];
    const lastCallDate = last_ai_call_date ? last_ai_call_date.toISOString().split('T')[0] : null;
    const usedToday = lastCallDate === today ? (ai_calls_today || 0) : 0;
    
    res.json({
      plan: plan || 'free',
      ai_calls_today: usedToday,
      ai_limit: isUnlimited ? Infinity : FREE_AI_LIMIT,
      remaining: isUnlimited ? Infinity : Math.max(0, FREE_AI_LIMIT - usedToday),
      unlimited: isUnlimited,
      isAdmin: username === 'jchamp101',
    });
  } catch (err) {
    console.error('Usage fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch usage' });
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
    // Ensure the plan column exists
    try {
      await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free'`);
    } catch (e) { /* column may already exist */ }
    
    await query("UPDATE users SET plan = 'legend' WHERE id = $1", [req.user.id]);
    res.json({ success: true, plan: 'legend', message: '🎉 You are now a Legend! Enjoy infinite AI.' });
  } catch (err) {
    console.error('Redeem code error:', err);
    res.status(500).json({ error: 'Failed to redeem code: ' + err.message });
  }
});

// ─── Admin Panel (jchamp101 only) ─────────────────────────────────────────────
const requireAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT username FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0 || result.rows[0].username !== 'jchamp101') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed' });
  }
};

// Reset AI calls for self
router.post('/admin/reset-ai', requireAdmin, async (req, res) => {
  try {
    await query('UPDATE users SET ai_calls_today = 0 WHERE id = $1', [req.user.id]);
    res.json({ success: true, message: 'AI usage reset to 0' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set plan for yourself
router.post('/admin/set-plan', requireAdmin, async (req, res) => {
  const { plan } = req.body;
  if (!['free', 'pro', 'legend'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan: free, pro, or legend' });
  }
  try {
    try { await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free'`); } catch(e) {}
    await query('UPDATE users SET plan = $1 WHERE id = $2', [plan, req.user.id]);
    res.json({ success: true, plan, message: `Plan set to ${plan}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add XP
router.post('/admin/add-xp', requireAdmin, async (req, res) => {
  const { amount } = req.body;
  const xp = parseInt(amount) || 100;
  try {
    await query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xp, req.user.id]);
    const result = await query('SELECT xp FROM users WHERE id = $1', [req.user.id]);
    res.json({ success: true, xp: result.rows[0].xp, message: `+${xp} XP added` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set streak
router.post('/admin/set-streak', requireAdmin, async (req, res) => {
  const { streak } = req.body;
  const val = parseInt(streak) || 0;
  try {
    await query('UPDATE users SET streak = $1 WHERE id = $2', [val, req.user.id]);
    res.json({ success: true, streak: val, message: `Streak set to ${val}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin overview)
router.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, email, xp, streak, plan, ai_calls_today, created_at FROM users ORDER BY xp DESC LIMIT 50'
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear Leaderboard (Reset all XP/Streaks)
router.post('/admin/clear-leaderboard', requireAdmin, async (req, res) => {
  try {
    await query('UPDATE users SET xp = 0, streak = 0');
    await query('TRUNCATE TABLE study_sessions RESTART IDENTITY CASCADE');
    res.json({ success: true, message: '🏆 Leaderboards cleared! Everyone is back at 0.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public Profile View
router.get('/public/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await query(`
      SELECT id, username, xp, streak, plan, avatar_url, bio, role, created_at, region
      FROM users WHERE username = $1
    `, [username]);

    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Achievements
    const achResult = await query(`
      SELECT a.*, ua.earned_at FROM achievements a
      JOIN user_achievements ua ON ua.achievement_id = a.id
      WHERE ua.user_id = $1 ORDER BY ua.earned_at DESC
    `, [user.id]);

    const levelInfo = getLevelFromXP(user.xp);
    res.json({ user: { ...user, level: levelInfo, achievements: achResult.rows } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

module.exports = router;

