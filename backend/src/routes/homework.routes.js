const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP } = require('../services/gamification.service');
const aiService = require('../services/ai.service');

const router = express.Router();
router.use(authenticate);

router.post('/', async (req, res) => {
  const { question, context, subject_id, image_url } = req.body;
  try {
    const aiResult = await aiService.explainHomework(question, context);

    const result = await query(`
      INSERT INTO homework_questions (user_id, subject_id, question, image_url, ai_explanation, ai_steps)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.user.id, subject_id, question, image_url, aiResult.explanation, JSON.stringify(aiResult.steps)]);

    await awardXP(req.user.id, 'homework_question');
    res.json({ question: result.rows[0], explanation: aiResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process question' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM homework_questions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ questions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
