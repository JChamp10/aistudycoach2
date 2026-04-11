const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP } = require('../services/gamification.service');
const aiService = require('../services/ai.service');
const multer = require('multer');
const { aiLimiter } = require('../middleware/rateLimit.middleware');
const { checkAILimits } = require('../middleware/usage.middleware');

const router = express.Router();
router.use(authenticate);

// Multer for file uploads (memory storage — send to AI)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── GET all notes for user ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// ─── POST create a blank/manual note ──────────────────────────────────────
router.post('/', async (req, res) => {
  const { title, content, source } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const result = await query(
      `INSERT INTO notes (user_id, title, content, source)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, title, content || '', source || 'scratch']
    );
    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// ─── POST AI Compose — generate note from topic using Groq ────────────────
router.post('/ai-compose', aiLimiter, checkAILimits, async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic is required' });

  try {
    const prompt = `You are an expert study assistant. Create comprehensive, well-structured study notes on the topic: "${topic}".

Format the notes with:
- A brief overview (2-3 sentences)
- Key Concepts (bullet points)
- Important Details & Examples
- Summary / Key Takeaways

Keep it concise but thorough — ideal for a student studying this topic.`;

    const content = await aiService.generateText(prompt);

    const result = await query(
      `INSERT INTO notes (user_id, title, content, source)
       VALUES ($1, $2, $3, 'ai') RETURNING *`,
      [req.user.id, `AI Notes: ${topic}`, content]
    );

    await awardXP(req.user.id, 'study_session_30min');
    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate AI notes' });
  }
});

// ─── POST Scan / OCR — extract text from image ────────────────────────────
router.post('/scan', aiLimiter, checkAILimits, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `Please extract and transcribe all text from this image of handwritten or printed notes. 
Format it clearly with proper structure, preserving headings, bullet points and any mathematical notation where possible.
If there are diagrams, describe them briefly in [brackets].`;

    // Use AI vision to extract text from image
    const content = await aiService.extractTextFromImage(base64, mimeType, prompt);

    const title = req.body.title || `Scanned Note — ${new Date().toLocaleDateString()}`;
    const result = await query(
      `INSERT INTO notes (user_id, title, content, source)
       VALUES ($1, $2, $3, 'scan') RETURNING *`,
      [req.user.id, title, content]
    );

    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scan note' });
  }
});

// ─── POST Lesson Plan — extract key info from PDF or image ────────────────
router.post('/lesson', aiLimiter, checkAILimits, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const prompt = `You are an expert study assistant. Analyze this lesson plan or educational document and extract:
1. Learning Objectives
2. Key Topics & Concepts
3. Important Definitions
4. Key Facts to Remember
5. Potential Exam Questions

Format clearly for student study use.`;

    const content = await aiService.extractTextFromImage(base64, mimeType, prompt);

    const title = req.body.title || `Lesson Plan — ${new Date().toLocaleDateString()}`;
    const result = await query(
      `INSERT INTO notes (user_id, title, content, source)
       VALUES ($1, $2, $3, 'lesson') RETURNING *`,
      [req.user.id, title, content]
    );

    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process lesson plan' });
  }
});

// ─── DELETE a note ─────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [
      req.params.id,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ─── POST Transmute — convert note into flashcard deck ────────────────────
router.post('/:id/transmute', aiLimiter, checkAILimits, async (req, res) => {
  const { deckTitle } = req.body;
  try {
    const noteResult = await query(
      'SELECT * FROM notes WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (!noteResult.rows.length) return res.status(404).json({ error: 'Note not found' });

    const note = noteResult.rows[0];

    const prompt = `Convert these study notes into 8-12 flashcards in JSON format.
Each flashcard should have a "front" (question/term) and "back" (answer/definition).
Focus on the most important facts and concepts.

Notes:
${note.content}

Return ONLY valid JSON array: [{"front": "...", "back": "..."}, ...]`;

    const raw = await aiService.generateText(prompt);

    // Parse flashcards from AI response
    let cards = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) cards = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI flashcards' });
    }

    // Create deck
    const deckResult = await query(
      `INSERT INTO flashcard_decks (user_id, title, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, deckTitle || note.title, `Transmuted from note: ${note.title}`]
    );
    const deck = deckResult.rows[0];

    // Insert cards
    for (const card of cards) {
      await query(
        `INSERT INTO flashcards (deck_id, user_id, front, back)
         VALUES ($1, $2, $3, $4)`,
        [deck.id, req.user.id, card.front, card.back]
      );
    }

    // Delete the note after transmutation
    await query('DELETE FROM notes WHERE id = $1', [req.params.id]);

    await awardXP(req.user.id, 'free_recall');
    res.json({ deck, cardCount: cards.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Transmutation failed' });
  }
});

module.exports = router;
