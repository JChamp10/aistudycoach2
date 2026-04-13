const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');

    if (decoded.userId === 'dev-uuid-1234' && process.env.NODE_ENV !== 'production') {
      req.user = {
        id: 'dev-uuid-1234',
        username: 'DevUser',
        email: 'dev@local.host',
        xp: 1000,
        streak: 5,
        role: 'user',
        plan: 'free',
        ai_calls_today: 0,
        region: 'Global',
        avatar_url: null,
      };
      return next();
    }

    const result = await query(
      'SELECT id, username, email, xp, streak, role, plan, ai_calls_today, region, avatar_url FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin };
