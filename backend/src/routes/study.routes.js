const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP, updateStreak } = require('../services/gamification.service');
const aiService = require('../services/ai.service');

const router = express.Router();
router.use(authenticate);

router.post('/session', async (req, res) => {
  const { type, score, duration_minutes, subject_id, metadata } = req.body;
  try {
    let xpAction = 'study_session_30min';
    if (duration_minutes >= 60) xpAction = 'study_session_1hr';
    if (type === 'free_recall') xpAction = 'free_recall';

    const xpResult = await awardXP(req.user.id, xpAction);
    const streakResult = await updateStreak(req.user.id);

    const result = await query(`
      INSERT INTO study_sessions (user_id, subject_id, type, score, duration_minutes, xp_earned, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [req.user.id, subject_id, type, score, duration_minutes, xpResult.xpGained, metadata]);

    res.status(201).json({ session: result.rows[0], xp: xpResult, streak: streakResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record session' });
  }
});

router.get('/sessions', async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  try {
    const result = await query(`
      SELECT ss.*, s.name AS subject_name
      FROM study_sessions ss
      LEFT JOIN subjects s ON s.id = ss.subject_id
      WHERE ss.user_id = $1
      ORDER BY ss.created_at DESC LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    res.json({ sessions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post('/recall', async (req, res) => {
  const { topic, topicSummary, userResponse, subject_id } = req.body;
  try {
    const feedback = await aiService.analyzeFreeRecallResponse(topic, topicSummary, userResponse);

    const result = await query(`
      INSERT INTO recall_sessions (user_id, subject_id, topic, topic_summary, user_response, ai_feedback, score)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [req.user.id, subject_id, topic, topicSummary, userResponse, JSON.stringify(feedback), feedback.score]);

    const xpResult = await awardXP(req.user.id, 'free_recall');
    await updateStreak(req.user.id);

    res.json({ session: result.rows[0], feedback, xp: xpResult });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process recall session' });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const result = await query('SELECT * FROM subjects WHERE user_id = $1 ORDER BY name', [req.user.id]);
    res.json({ subjects: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/subjects', async (req, res) => {
  const { name, color } = req.body;
  try {
    const result = await query(
      'INSERT INTO subjects (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, color || '#6366f1']
    );
    res.status(201).json({ subject: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

module.exports = router;
