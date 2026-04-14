const express = require('express');
const { query } = require('../db/pool');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(authenticate);

const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limit: 10,
    features: ['10 AI Questions/day', 'Basic Flashcards', 'Public Profile']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    limit: 100,
    features: ['100 AI Questions/day', 'PDF Analysis', 'Priority Support']
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    price: 19.99,
    limit: Infinity,
    features: ['Unlimited AI Questions', 'Early access features', 'Custom Themes', 'No Ads']
  }
};

router.get('/plans', (req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

// Simulated Checkout
router.post('/checkout', async (req, res) => {
  const { planId } = req.body;
  
  if (!PLANS[planId]) {
    return res.status(400).json({ error: 'Invalid plan selected' });
  }

  try {
    // In a real app, we'd hit Stripe here.
    // Since we're simulating, we'll just update the user's plan immediately.
    
    await query(
      'UPDATE users SET plan = $1, ai_calls_today = 0 WHERE id = $2',
      [planId, req.user.id]
    );

    res.json({ 
      success: true, 
      message: `Successfully upgraded to ${PLANS[planId].name}!`,
      plan: planId
    });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to complete checkout' });
  }
});

module.exports = router;
