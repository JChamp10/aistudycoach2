const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP, updateStreak } = require('../services/gamification.service');
const aiService = require('../services/ai.service');

const router = express.Router();
router.use(authenticate);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files allowed'));
  },
});

router.get('/decks', async (req, res) => {
  try {
    const result = await query(`
      SELECT fd.*, COUNT(f.id) AS card_count
      FROM flashcard_decks fd
      LEFT JOIN flashcards f ON f.deck_id = fd.id
      WHERE fd.user_id = $1
      GROUP BY fd.id ORDER BY fd.created_at DESC
    `, [req.user.id]);
    res.json({ decks: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

router.post('/decks', async (req, res) => {
  const { title, description, subject_id, is_public } = req.body;
  try {
    const result = await query(`
      INSERT INTO flashcard_decks (user_id, title, description, subject_id, is_public)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [req.user.id, title, description, subject_id, is_public || false]);
    res.status(201).json({ deck: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

router.get('/decks/:id/cards', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM flashcards WHERE deck_id = $1 AND user_id = $2 ORDER BY created_at ASC',
      [req.params.id, req.user.id]
    );
    res.json({ cards: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

router.get('/due', async (req, res) => {
  try {
    const result = await query(`
      SELECT f.*, fd.title AS deck_title FROM flashcards f
      JOIN flashcard_decks fd ON fd.id = f.deck_id
      WHERE f.user_id = $1 AND f.next_review_date <= CURRENT_DATE
      ORDER BY f.next_review_date ASC LIMIT 50
    `, [req.user.id]);
    res.json({ cards: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

router.post('/', async (req, res) => {
  const { deck_id, question, answer } = req.body;
  try {
    const result = await query(
      'INSERT INTO flashcards (deck_id, user_id, question, answer) VALUES ($1, $2, $3, $4) RETURNING *',
      [deck_id, req.user.id, question, answer]
    );
    await query('UPDATE flashcard_decks SET card_count = card_count + 1 WHERE id = $1', [deck_id]);
    res.status(201).json({ card: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

router.post('/generate', async (req, res) => {
  const { notes, deck_id, count } = req.body;
  try {
    const generated = await aiService.generateFlashcardsFromNotes(notes, count || 10);
    const insertedCards = [];
    for (const card of generated) {
      const result = await query(
        'INSERT INTO flashcards (deck_id, user_id, question, answer) VALUES ($1, $2, $3, $4) RETURNING *',
        [deck_id, req.user.id, card.question, card.answer]
      );
      insertedCards.push(result.rows[0]);
    }
    await query('UPDATE flashcard_decks SET card_count = card_count + $1 WHERE id = $2', [insertedCards.length, deck_id]);
    res.json({ cards: insertedCards, generated: insertedCards.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

router.post('/generate-pdf', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
  const { deck_id, count } = req.body;
  if (!deck_id) return res.status(400).json({ error: 'deck_id is required' });
  try {
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.slice(0, 6000);
    if (!text.trim()) return res.status(400).json({ error: 'Could not extract text from PDF' });
    const generated = await aiService.generateFlashcardsFromNotes(text, parseInt(count) || 10);
    const insertedCards = [];
    for (const card of generated) {
      const result = await query(
        'INSERT INTO flashcards (deck_id, user_id, question, answer) VALUES ($1, $2, $3, $4) RETURNING *',
        [deck_id, req.user.id, card.question, card.answer]
      );
      insertedCards.push(result.rows[0]);
    }
    await query('UPDATE flashcard_decks SET card_count = card_count + $1 WHERE id = $2', [insertedCards.length, deck_id]);
    res.json({ cards: insertedCards, generated: insertedCards.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate flashcards from PDF' });
  }
});

router.post('/:id/review', async (req, res) => {
  const { difficulty } = req.body;
  try {
    const cardResult = await query(
      'SELECT * FROM flashcards WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!cardResult.rows[0]) return res.status(404).json({ error: 'Card not found' });
    const card = cardResult.rows[0];
    const qualityMap = { easy: 5, medium: 3, hard: 1 };
    const q = qualityMap[difficulty] || 3;
    let ef = parseFloat(card.ease_factor) || 2.5;
    let interval = parseInt(card.interval_days) || 1;

    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    ef = Math.max(1.3, ef);
    if (q < 3) interval = 1;
    else if (interval === 1) interval = 6;
    else interval = Math.round(interval * ef);

    const memoryStrength = Math.min(1.0, (parseFloat(card.memory_strength) || 0) + (q / 20));
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    await query(`
      UPDATE flashcards SET
        ease_factor = $1, interval_days = $2, memory_strength = $3,
        next_review_date = $4, times_reviewed = times_reviewed + 1
      WHERE id = $5
    `, [ef, interval, memoryStrength, nextReview.toISOString().split('T')[0], card.id]);

    const xpAction = memoryStrength >= 0.9 ? 'flashcard_mastered' : 'flashcard_review';
    const xpResult = await awardXP(req.user.id, xpAction);
    await updateStreak(req.user.id);

    res.json({
      nextReviewDate: nextReview.toISOString().split('T')[0],
      interval,
      memoryStrength,
      xp: xpResult,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record review' });
  }
});
router.put('/:id', async (req, res) => {
  const { question, answer } = req.body;
  try {
    const result = await query(
      'UPDATE flashcards SET question = $1, answer = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [question, answer, req.params.id, req.user.id]
    );
    res.json({ card: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM flashcards WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});
router.put('/:id', async (req, res) => {
  const { question, answer } = req.body;
  try {
    const result = await query(
      'UPDATE flashcards SET question = $1, answer = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [question, answer, req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Card not found' });
    res.json({ card: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const card = await query(
      'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING deck_id',
      [req.params.id, req.user.id]
    );
    if (card.rows[0]) {
      await query(
        'UPDATE flashcard_decks SET card_count = GREATEST(card_count - 1, 0) WHERE id = $1',
        [card.rows[0].deck_id]
      );
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

router.delete('/decks/:id', async (req, res) => {
  try {
    await query('DELETE FROM flashcards WHERE deck_id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    await query('DELETE FROM flashcard_decks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});
module.exports = router;
