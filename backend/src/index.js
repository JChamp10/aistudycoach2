require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const https = require('https');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/test-groq', (req, res) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.json({ error: 'No GROQ_API_KEY found' });

  const body = JSON.stringify({
    model: 'llama3-8b-8192',
    messages: [{ role: 'user', content: 'Say hello in one word' }],
    max_tokens: 10,
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Content-Length': Buffer.byteLength(body),
    },
  };

  let data = '';
  const groqReq = https.request(options, (groqRes) => {
    groqRes.on('data', chunk => data += chunk);
    groqRes.on('end', () => {
      try {
        res.json({ raw: JSON.parse(data), keyPrefix: key.slice(0, 8) });
      } catch (e) {
        res.json({ rawText: data, keyPrefix: key.slice(0, 8) });
      }
    });
  });
  groqReq.on('error', e => res.json({ error: e.message }));
  groqReq.write(body);
  groqReq.end();
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/study', require('./routes/study.routes'));
app.use('/api/flashcards', require('./routes/flashcard.routes'));
app.use('/api/homework', require('./routes/homework.routes'));
app.use('/api/quiz', require('./routes/quiz.routes'));
app.use('/api/planner', require('./routes/planner.routes'));
app.use('/api/leaderboard', require('./routes/leaderboard.routes'));
app.use('/api/marketplace', require('./routes/marketplace.routes'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
