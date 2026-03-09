const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP, updateStreak } = require('../services/gamification.service');
const aiService = require('../services/ai.service');

const router = express.Router();
router.use(authenticate);

router.post('/generate', async (req, res) => {
  const { topic, difficulty, count, subject_id, deck_id } = req.body;
  try {
    const questions = await aiService.generateQuizQuestions(topic, difficulty, count || 5);
    const saved = [];
    for (const q of questions) {
      const result = await query(`
        INSERT INTO quiz_questions (subject_id, deck_id, question, options, correct_answer, explanation, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `, [subject_id, deck_id, q.question, JSON.stringify(q.options), q.correct, q.explanation, difficulty]);
      saved.push(result.rows[0]);
    }
    res.json({ questions: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

router.post('/submit', async (req, res) => {
  const { answers, sessionId } = req.body;
  try {
    let correct = 0;
    const results = [];

    for (const ans of answers) {
      const qResult = await query('SELECT * FROM quiz_questions WHERE id = $1', [ans.questionId]);
      const q = qResult.rows[0];
      const isCorrect = q.correct_answer === ans.userAnswer;
      if (isCorrect) correct++;

      await query(`
        INSERT INTO quiz_attempts (user_id, session_id, question_id, user_answer, is_correct)
        VALUES ($1, $2, $3, $4, $5)
      `, [req.user.id, sessionId, ans.questionId, ans.userAnswer, isCorrect]);

      results.push({ questionId: ans.questionId, isCorrect, correctAnswer: q.correct_answer, explanation: q.explanation });
    }

    const score = correct / answers.length;
    const xpGained = correct * 5;
    const xpResult = await awardXP(req.user.id, 'quiz_complete', xpGained);
    if (score === 1.0) await awardXP(req.user.id, 'quiz_perfect_score');
    await updateStreak(req.user.id);

    res.json({ score, correct, total: answers.length, results, xp: xpResult });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

module.exports = router;
