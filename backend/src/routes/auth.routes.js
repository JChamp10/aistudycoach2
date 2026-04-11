const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, region } = req.body;
  try {
    const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email or username already registered' });

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (username, email, password_hash, region) VALUES ($1, $2, $3, $4) RETURNING id, username, email, xp, streak, region, plan, created_at',
      [username, email, password_hash, region || 'Global']
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/dev-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden in production' });
  try {
    // Return a fully mocked user to bypass any local database requirement issues!
    const mockUser = {
      id: 'dev-uuid-1234',
      username: 'DevUser',
      email: 'dev@local.host',
      xp: 1000,
      streak: 5,
      region: 'Global',
      plan: 'free',
      ai_calls_today: 0,
      created_at: new Date().toISOString()
    };
    const token = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.json({ token, user: mockUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dev login failed' });
  }
});

module.exports = router;
