const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const aiService = require('../services/ai.service');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { from, to } = req.query;
  try {
    const result = await query(`
      SELECT * FROM study_plans
      WHERE user_id = $1
        AND scheduled_date >= COALESCE($2::date, CURRENT_DATE)
        AND scheduled_date <= COALESCE($3::date, CURRENT_DATE + INTERVAL '30 days')
      ORDER BY scheduled_date ASC
    `, [req.user.id, from, to]);
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

router.post('/generate', async (req, res) => {
  const { subjects, dailyHours } = req.body;
  try {
    const plan = await aiService.generateStudyPlan(subjects, dailyHours || 2);
    const saved = [];
    for (const item of plan) {
      const result = await query(`
        INSERT INTO study_plans (user_id, subject, scheduled_date, duration_minutes, task_description)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING RETURNING *
      `, [req.user.id, item.subject, item.date, item.duration, item.task]);
      if (result.rows[0]) saved.push(result.rows[0]);
    }
    res.json({ plans: saved, generated: saved.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate plan' });
  }
});

router.put('/:id', async (req, res) => {
  const { is_completed, task_description, duration_minutes } = req.body;
  try {
    const result = await query(`
      UPDATE study_plans SET
        is_completed = COALESCE($1, is_completed),
        task_description = COALESCE($2, task_description),
        duration_minutes = COALESCE($3, duration_minutes)
      WHERE id = $4 AND user_id = $5 RETURNING *
    `, [is_completed, task_description, duration_minutes, req.params.id, req.user.id]);
    res.json({ plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM study_plans WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;
