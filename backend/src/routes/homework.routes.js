const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');
const { awardXP } = require('../services/gamification.service');
const aiService = require('../services/ai.service');
const { aiLimiter } = require('../middleware/rateLimit.middleware');
const { checkAILimits } = require('../middleware/usage.middleware');

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

router.post('/ask', aiLimiter, checkAILimits, async (req, res) => {
  const { question, subject, history } = req.body;
  if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });
  try {
    const messages = [
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: question }
    ];
    const result = await aiService.explainHomework(question, subject, messages);
    try {
      await query(
        'INSERT INTO homework_help (user_id, question, answer, subject) VALUES ($1, $2, $3, $4)',
        [req.user.id, question, result.explanation, subject || null]
      );
      await awardXP(req.user.id, 'homework_question');
    } catch (e) {
      console.log('homework save skipped:', e.message);
    }
    res.json({ answer: result.explanation, steps: result.steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get answer' });
  }
});

router.post('/ask-pdf', aiLimiter, checkAILimits, upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
  const question = req.body.question || 'Please explain and help me understand this document';
  try {
    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData.text.slice(0, 6000);
    if (!text.trim()) return res.status(400).json({ error: 'Could not extract text from PDF' });
    const combined = `The student uploaded a PDF. Here is its content:\n\n${text}\n\nStudent question: ${question}`;
    const result = await aiService.explainHomework(combined, null);
    try {
      await query(
        'INSERT INTO homework_help (user_id, question, answer, subject) VALUES ($1, $2, $3, $4)',
        [req.user.id, `[PDF] ${req.file.originalname}: ${question}`, result.explanation, 'PDF Upload']
      );
      await awardXP(req.user.id, 'homework_question');
    } catch (e) {
      console.log('homework save skipped:', e.message);
    }
    res.json({ answer: result.explanation, steps: result.steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
});

router.post('/ask-image', aiLimiter, checkAILimits, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
  const question = req.body.question || 'Explain and solve the problem in this image.';
  const subject = req.body.subject || 'General';
  
  try {
    const base64 = req.file.buffer.toString('base64');
    const result = await aiService.explainHomeworkFromImage(base64, question, subject);
    
    try {
      await query(
        'INSERT INTO homework_help (user_id, question, answer, subject) VALUES ($1, $2, $3, $4)',
        [req.user.id, `[IMG] ${req.file.originalname}: ${question}`, result.explanation, subject]
      );
      await awardXP(req.user.id, 'homework_question');
    } catch (e) {
      console.log('homework image save skipped:', e.message);
    }
    
    res.json({ answer: result.explanation, steps: result.steps || [] });
  } catch (err) {
    console.error('Homework ask-image error:', err);
    res.status(500).json({ error: 'Failed to analyze image with AI' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM homework_help WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30',
      [req.user.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;
