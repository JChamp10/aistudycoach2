require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('./db/pool');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Routes
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/users',       require('./routes/user.routes'));
app.use('/api/study',       require('./routes/study.routes'));
app.use('/api/flashcards',  require('./routes/flashcard.routes'));
app.use('/api/homework',    require('./routes/homework.routes'));
app.use('/api/quiz',        require('./routes/quiz.routes'));
app.use('/api/planner',     require('./routes/planner.routes'));
app.use('/api/leaderboard', require('./routes/leaderboard.routes'));
app.use('/api/kahoot',      require('./routes/kahoot.routes'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Socket.io Multiplayer Kahoot ──────────────────────────────────────────────

// roomCode → { hostId, players: {socketId: {name, score, answered}}, questions, currentQ, status, deck_id, topic }
const rooms = {};

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoomState(code) {
  const room = rooms[code];
  if (!room) return null;
  return {
    code,
    status: room.status,
    hostId: room.hostId,
    players: Object.values(room.players),
    currentQ: room.currentQ,
    totalQ: room.questions.length,
    question: room.status === 'playing' ? room.questions[room.currentQ] : null,
  };
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id, 'user:', socket.userId);

  // Host creates a room
  socket.on('create_room', async ({ deckId, topic, questions }) => {
    const code = generateCode();
    const userResult = await query('SELECT username FROM users WHERE id = $1', [socket.userId]);
    const username = userResult.rows[0]?.username || 'Host';

    rooms[code] = {
      hostId: socket.userId,
      hostSocketId: socket.id,
      players: {
        [socket.id]: { id: socket.userId, socketId: socket.id, name: username, score: 0, answered: false, isHost: true },
      },
      questions: questions || [],
      currentQ: 0,
      status: 'waiting',
      deckId,
      topic,
      answersThisRound: {},
    };

    socket.join(code);
    socket.roomCode = code;
    socket.emit('room_created', { code, state: getRoomState(code) });
    console.log(`Room ${code} created by ${username}`);
  });

  // Player joins a room
  socket.on('join_room', async ({ code, }) => {
    const room = rooms[code];
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.status !== 'waiting') return socket.emit('error', { message: 'Game already started' });

    const userResult = await query('SELECT username FROM users WHERE id = $1', [socket.userId]);
    const username = userResult.rows[0]?.username || 'Player';

    room.players[socket.id] = { id: socket.userId, socketId: socket.id, name: username, score: 0, answered: false, isHost: false };
    socket.join(code);
    socket.roomCode = code;

    io.to(code).emit('room_updated', { state: getRoomState(code) });
    socket.emit('joined_room', { code, state: getRoomState(code) });
    console.log(`${username} joined room ${code}`);
  });

  // Host starts the game
  socket.on('start_game', ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostSocketId !== socket.id) return;
    if (room.questions.length === 0) return socket.emit('error', { message: 'No questions loaded' });

    room.status = 'playing';
    room.currentQ = 0;
    Object.values(room.players).forEach(p => { p.answered = false; });
    room.answersThisRound = {};

    io.to(code).emit('game_started', { state: getRoomState(code) });
    sendQuestion(code);
  });

  // Player submits answer
  socket.on('submit_answer', ({ code, answer, timeLeft }) => {
    const room = rooms[code];
    if (!room || room.status !== 'playing') return;
    const player = room.players[socket.id];
    if (!player || player.answered) return;

    player.answered = true;
    const correct = answer === room.questions[room.currentQ]?.correct_answer;
    const points = correct ? Math.max(100, timeLeft * 50) : 0;
    player.score += points;
    room.answersThisRound[socket.id] = { answer, correct, points };

    socket.emit('answer_result', { correct, points, score: player.score });
    io.to(code).emit('player_answered', {
      playerId: socket.id,
      playerName: player.name,
      allAnswered: Object.values(room.players).every(p => p.answered),
      playerCount: Object.keys(room.players).length,
      answeredCount: Object.values(room.players).filter(p => p.answered).length,
    });

    // Auto advance if everyone answered
    const total = Object.keys(room.players).length;
    const answered = Object.values(room.players).filter(p => p.answered).length;
    if (answered >= total) advanceQuestion(code);
  });

  // Host manually advances
  socket.on('next_question', ({ code }) => {
    const room = rooms[code];
    if (!room || room.hostSocketId !== socket.id) return;
    advanceQuestion(code);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code || !rooms[code]) return;
    const room = rooms[code];
    delete room.players[socket.id];

    if (socket.id === room.hostSocketId) {
      io.to(code).emit('host_left', {});
      delete rooms[code];
    } else {
      io.to(code).emit('room_updated', { state: getRoomState(code) });
    }
  });
});

function sendQuestion(code) {
  const room = rooms[code];
  if (!room) return;
  const q = room.questions[room.currentQ];
  Object.values(room.players).forEach(p => { p.answered = false; });
  room.answersThisRound = {};

  io.to(code).emit('new_question', {
    questionIndex: room.currentQ,
    total: room.questions.length,
    question: q.question,
    options: q.options,
    timeLimit: 10,
  });
}

function advanceQuestion(code) {
  const room = rooms[code];
  if (!room) return;

  // Show scoreboard first
  const scores = Object.values(room.players)
    .map(p => ({ name: p.name, score: p.score, isHost: p.isHost }))
    .sort((a, b) => b.score - a.score);

  io.to(code).emit('round_ended', {
    correctAnswer: room.questions[room.currentQ]?.correct_answer,
    scores,
  });

  room.currentQ++;
  if (room.currentQ >= room.questions.length) {
    room.status = 'finished';
    setTimeout(() => {
      io.to(code).emit('game_over', { scores });
      delete rooms[code];
    }, 3000);
  } else {
    setTimeout(() => sendQuestion(code), 3000);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
