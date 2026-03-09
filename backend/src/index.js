require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const flashcardRoutes = require('./routes/flashcard.routes');
const studyRoutes = require('./routes/study.routes');
const plannerRoutes = require('./routes/planner.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const homeworkRoutes = require('./routes/homework.routes');
const quizRoutes = require('./routes/quiz.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message || 'Internal server error' }));

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
module.exports = app;
