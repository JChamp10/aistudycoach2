const { query } = require('../db/pool');

const FREE_AI_LIMIT = parseInt(process.env.FREE_AI_LIMIT) || 10;

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
      'SELECT username, plan, ai_calls_today, last_ai_call_date FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { username, plan, ai_calls_today, last_ai_call_date } = result.rows[0];
    const PRO_AI_LIMIT = 100;

    // Owner account bypass
    if (username === 'jchamp101' && plan !== 'free') {
      res.set('X-AI-Calls-Used', '0');
      res.set('X-AI-Calls-Limit', 'Infinity');
      return next();
    }

    // Legend users bypass limit completely
    if (plan === 'legend') {
      res.set('X-AI-Calls-Used', '0');
      res.set('X-AI-Calls-Limit', 'Infinity');
      return next();
    }

    // Current Tier Limit
    const currentLimit = (plan === 'pro') ? PRO_AI_LIMIT : FREE_AI_LIMIT;
    
    // Free & Pro users logic
    const today = new Date().toISOString().split('T')[0];
    const lastCallDate = last_ai_call_date ? last_ai_call_date.toISOString().split('T')[0] : null;

    if (lastCallDate !== today) {
      // It's a new day, reset their count
      await query(
        'UPDATE users SET ai_calls_today = 1, last_ai_call_date = CURRENT_DATE WHERE id = $1',
        [req.user.id]
      );
      res.set('X-AI-Calls-Used', '1');
      res.set('X-AI-Calls-Limit', String(currentLimit));
      return next();
    }

    if (ai_calls_today >= currentLimit) {
      return res.status(403).json({ 
        error: 'REQUIRES_UPGRADE', 
        message: `Daily AI limit reached (${currentLimit}/${currentLimit} used). Upgrade to Legend for unlimited AI!`,
        ai_calls_today,
        ai_limit: currentLimit,
      });
    }

    // Increment usage
    await query(
      'UPDATE users SET ai_calls_today = ai_calls_today + 1 WHERE id = $1',
      [req.user.id]
    );

    // Attach usage info to response header so frontend can read it
    res.set('X-AI-Calls-Used', String((ai_calls_today || 0) + 1));
    res.set('X-AI-Calls-Limit', String(currentLimit));

    next();
  } catch (err) {
    console.error('Error checking AI limit:', err);
    // If columns are missing, just let them through rather than blocking
    next();
  }
};

module.exports = { checkAILimits, FREE_AI_LIMIT };
