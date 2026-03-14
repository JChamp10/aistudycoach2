const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const aiService = require('../services/ai.service');

const router = express.Router();
router.use(authenticate);

// Generate questions from a deck
router.post('/questions/deck', async (req, res) => {
  const { deck_id, count } = req.body;
  try {
    const cards = await query(
      'SELECT question, answer FROM flashcards WHERE deck_id = $1 AND user_id = $2 ORDER BY RANDOM() LIMIT $3',
      [deck_id, req.user.id, count || 10]
    );
    if (cards.rows.length < 2) return res.status(400).json({ error: 'Need at least 2 cards in deck' });

    const questions = cards.rows.map(card => {
      const wrong = cards.rows
        .filter(c => c.answer !== card.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.answer);
      const options = [...wrong, card.answer].sort(() => Math.random() - 0.5);
      return { question: card.question, options, correct_answer: card.answer };
    });

    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate questions from deck' });
  }
});

// Generate questions from a topic using AI
router.post('/questions/ai', async (req, res) => {
  const { topic, difficulty, count } = req.body;
  try {
    const raw = await aiService.generateQuizQuestions(topic, difficulty || 'medium', count || 10);
    const questions = raw.map(q => ({
      question: q.question,
      options: q.options,
      correct_answer: q.correct || q.correct_answer || q.answer || q.options[0],
    }));
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate AI questions' });
  }
});

// Save a completed room's scores
router.post('/results', async (req, res) => {
  const { scores, topic, deck_id } = req.body;
  try {
    await query(
      'INSERT INTO kahoot_rooms (host_id, deck_id, topic, questions, status) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, deck_id || null, topic || null, JSON.stringify([]), 'finished']
    );
    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.json({ saved: false });
  }
});

module.exports = router;
