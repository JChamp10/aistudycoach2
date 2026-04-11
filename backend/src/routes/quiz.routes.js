const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP, updateStreak } = require('../services/gamification.service');
const aiService = require('../services/ai.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
});

const router = express.Router();
router.use(authenticate);

router.post('/generate', async (req, res) => {
  let { topic, difficulty, count, subject_id, deck_id } = req.body;
  try {
    if (!topic && deck_id) {
      const deckCards = await query(
        'SELECT question, answer FROM flashcards WHERE deck_id = $1 AND user_id = $2',
        [deck_id, req.user.id]
      );
      if (deckCards.rows.length === 0) {
        return res.status(400).json({ error: 'This deck has no cards to generate a quiz from.' });
      }
      topic = `Flashcards Content: ${deckCards.rows.map(c => `Question: ${c.question}, Answer: ${c.answer}`).join('; ')}`;
    }
    const questions = await aiService.generateQuizQuestions(topic, difficulty, count || 5);
    const saved = [];
    for (const q of questions) {
      let correctAnswer = q.correct || q.correct_answer || q.answer || '';
      if (['A', 'B', 'C', 'D'].includes(correctAnswer) && Array.isArray(q.options)) {
        const index = correctAnswer.charCodeAt(0) - 65;
        if (q.options[index]) correctAnswer = q.options[index];
      }
      const result = await query(`
        INSERT INTO quiz_questions (subject_id, deck_id, question, options, correct_answer, explanation, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `, [subject_id || null, deck_id || null, q.question, JSON.stringify(q.options), correctAnswer, q.explanation || '', difficulty]);
      saved.push(result.rows[0]);
    }
    res.json({ questions: saved });
  } catch (err) {
    console.error('Quiz generate error:', err);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

router.post('/generate-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
  const { difficulty, count, subject_id, deck_id } = req.body;
  
  try {
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.slice(0, 6000); // 6k chars limit for AI context
    if (!text.trim()) return res.status(400).json({ error: 'Could not extract text from PDF' });

    const questions = await aiService.generateQuizQuestions(`Notes: ${text}`, difficulty, parseInt(count) || 5);
    const saved = [];
    for (const q of questions) {
      let correctAnswer = q.correct || q.correct_answer || q.answer || '';
      if (['A', 'B', 'C', 'D'].includes(correctAnswer) && Array.isArray(q.options)) {
        const index = correctAnswer.charCodeAt(0) - 65;
        if (q.options[index]) correctAnswer = q.options[index];
      }
      const result = await query(`
        INSERT INTO quiz_questions (subject_id, deck_id, question, options, correct_answer, explanation, difficulty)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
      `, [subject_id || null, deck_id || null, q.question, JSON.stringify(q.options), correctAnswer, q.explanation || '', difficulty]);
      saved.push(result.rows[0]);
    }
    res.json({ questions: saved });
  } catch (err) {
    console.error('Quiz PDF generate error:', err);
    res.status(500).json({ error: 'Failed to generate quiz from PDF' });
  }
});

router.post('/submit', async (req, res) => {
  const { answers, sessionId } = req.body;
  try {
    let correct = 0;
    const results = [];

    for (const ans of answers) {
      const qResult = await query('SELECT * FROM quiz_questions WHERE id = $1', [ans.questionId]);
      if (!qResult.rows[0]) continue;
      const q = qResult.rows[0];
      const isCorrect = q.correct_answer === ans.userAnswer;
      if (isCorrect) correct++;

      try {
        await query(`
          INSERT INTO quiz_attempts (user_id, session_id, question_id, user_answer, is_correct)
          VALUES ($1, $2, $3, $4, $5)
        `, [req.user.id, sessionId || null, ans.questionId, ans.userAnswer, isCorrect]);
      } catch (e) {
        console.log('quiz_attempts insert skipped:', e.message);
      }

      results.push({
        questionId: ans.questionId,
        isCorrect,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      });
    }

    const total = answers.length;
    const score = total > 0 ? correct / total : 0;
    const xpGained = correct * 5;
    const xpResult = await awardXP(req.user.id, 'quiz_complete', xpGained);
    if (score === 1.0) await awardXP(req.user.id, 'quiz_perfect_score');
    await updateStreak(req.user.id);

    res.json({ score, correct, total, results, xp: xpResult });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

module.exports = router;
