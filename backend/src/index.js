require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['X-AI-Calls-Used', 'X-AI-Calls-Limit'],
}));
const { apiLimiter } = require('./middleware/rateLimit.middleware');
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/users',       require('./routes/user.routes'));
app.use('/api/flashcards',  require('./routes/flashcard.routes'));
app.use('/api/homework',    require('./routes/homework.routes'));
app.use('/api/leaderboard', require('./routes/leaderboard.routes'));
app.use('/api/notes',       require('./routes/notes.routes'));
app.use('/api/study',       require('./routes/study.routes'));
app.use('/api/quiz',        require('./routes/quiz.routes'));
app.use('/api/social',      require('./routes/social.routes'));
app.use('/api/billing',     require('./routes/billing.routes'));
app.use('/api/calendar',    require('./routes/calendar.routes'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
