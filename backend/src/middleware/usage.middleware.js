const { query } = require('../db/pool');

const FREE_AI_LIMIT = parseInt(process.env.FREE_AI_LIMIT) || 5;

const checkAILimits = async (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Bypass for mock dev user
  if (req.user.id === 'dev-uuid-1234' && process.env.NODE_ENV !== 'production') {
    return next();
  }

  try {
    const result = await query(
      'SELECT plan, ai_calls_today, last_ai_call_date FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { plan, ai_calls_today, last_ai_call_date } = result.rows[0];

    // Pro users bypass limit completely
    if (plan === 'pro') {
      return next();
    }

    // Free users logic
    const today = new Date().toISOString().split('T')[0];
    const lastCallDate = last_ai_call_date ? last_ai_call_date.toISOString().split('T')[0] : null;

    if (lastCallDate !== today) {
      // It's a new day, reset their count
      await query(
        'UPDATE users SET ai_calls_today = 1, last_ai_call_date = CURRENT_DATE WHERE id = $1',
        [req.user.id]
      );
      return next();
    }

    if (ai_calls_today >= FREE_AI_LIMIT) {
      return res.status(403).json({ 
        error: 'REQUIRES_UPGRADE', 
        message: 'Daily AI limit reached on the free plan.' 
      });
    }

    // Increment usage
    await query(
      'UPDATE users SET ai_calls_today = ai_calls_today + 1 WHERE id = $1',
      [req.user.id]
    );

    next();
  } catch (err) {
    console.error('Error checking AI limit:', err);
    res.status(500).json({ error: 'Internal server error validating usage limits' });
  }
};

module.exports = { checkAILimits, FREE_AI_LIMIT };
