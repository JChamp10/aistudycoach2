'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { kahootApi, flashcardApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Gamepad2, Users, Plus, Zap, Trophy, Crown, CheckCircle, XCircle, Loader } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
const QUESTION_TIME = 10;

type Screen = 'lobby' | 'host-setup' | 'host-waiting' | 'join' | 'playing' | 'round-end' | 'game-over';

interface Player { name: string; score: number; isHost: boolean; socketId?: string; }
interface Question { question: string; options: string[]; correct_answer?: string; }
interface RoomState { code: string; status: string; players: Player[]; currentQ: number; totalQ: number; question: Question | null; }

const COLORS = [
  'bg-red-500 hover:bg-red-400 border-red-400',
  'bg-blue-500 hover:bg-blue-400 border-blue-400',
  'bg-amber-500 hover:bg-amber-400 border-amber-400',
  'bg-green-500 hover:bg-green-400 border-green-400',
];
const SHAPES = ['▲', '◆', '●', '■'];

export default function KahootPage() {
  const { user, token } = useAuthStore();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  // Host setup
  const [setupMode, setSetupMode] = useState<'deck' | 'ai'>('deck');
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeck, setSelectedDeck] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generatingQ, setGeneratingQ] = useState(false);

  // Playing
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; points: number; score: number } | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);

  // Round end / game over
  const [roundScores, setRoundScores] = useState<Player[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [finalScores, setFinalScores] = useState<Player[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    flashcardApi.decks().then(r => setDecks(r.data.decks || [])).catch(() => {});
  }, []);

  // Connect socket
  useEffect(() => {
    if (!token) return;
    const s = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => console.log('Socket connected'));
    s.on('connect_error', e => console.error('Socket error:', e.message));

    s.on('room_created', ({ code, state }) => {
      setRoomState(state);
      setScreen('host-waiting');
      toast.success(`Room created! Code: ${code}`);
    });

    s.on('joined_room', ({ state }) => {
      setRoomState(state);
      setScreen('host-waiting');
    });

    s.on('room_updated', ({ state }) => setRoomState(state));

    s.on('game_started', ({ state }) => {
      setRoomState(state);
      setScreen('playing');
    });

    s.on('new_question', ({ question, options, questionIndex: qi, total, timeLimit }) => {
      setCurrentQuestion({ question, options });
      setQuestionIndex(qi);
      setTotalQuestions(total);
      setTimeLeft(timeLimit || QUESTION_TIME);
      setSelected(null);
      setAnswered(false);
      setAnswerResult(null);
      setAnsweredCount(0);
      setScreen('playing');
      startTimer(timeLimit || QUESTION_TIME, s, roomState?.code || '');
    });

    s.on('answer_result', (result) => {
      setAnswerResult(result);
    });

    s.on('player_answered', ({ answeredCount: ac, playerCount: pc }) => {
      setAnsweredCount(ac);
      setPlayerCount(pc);
    });

    s.on('round_ended', ({ correctAnswer: ca, scores }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setCorrectAnswer(ca);
      setRoundScores(scores);
      setScreen('round-end');
    });

    s.on('game_over', ({ scores }) => {
      setFinalScores(scores);
      setScreen('game-over');
    });

    s.on('host_left', () => {
      toast.error('Host left the game');
      setScreen('lobby');
      cleanup();
    });

    s.on('error', ({ message }) => toast.error(message));

    setSocket(s);
    socketRef.current = s;

    return () => { s.disconnect(); };
  }, [token]);

  const startTimer = (seconds: number, s: Socket, code: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let t = seconds;
    setTimeLeft(t);
    timerRef.current = setInterval(() => {
      t--;
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current!);
        if (!answered) s.emit('submit_answer', { code, answer: null, timeLeft: 0 });
      }
    }, 1000);
  };

  const cleanup = () => {
    setRoomState(null);
    setCurrentQuestion(null);
    setQuestions([]);
    setIsHost(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const generateQuestions = async () => {
    setGeneratingQ(true);
    try {
      let res;
      if (setupMode === 'deck') {
        if (!selectedDeck) return toast.error('Select a deck');
        res = await kahootApi.questionsFromDeck({ deck_id: selectedDeck, count: 10 });
      } else {
        if (!aiTopic.trim()) return toast.error('Enter a topic');
        res = await kahootApi.questionsFromAI({ topic: aiTopic, difficulty: aiDifficulty, count: 10 });
      }
      setQuestions(res.data.questions || []);
      toast.success(`${res.data.questions.length} questions ready!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate questions');
    } finally {
      setGeneratingQ(false);
    }
  };

  const createRoom = () => {
    if (!socket || questions.length === 0) return toast.error('Generate questions first');
    setIsHost(true);
    socket.emit('create_room', { questions, deckId: selectedDeck || null, topic: aiTopic || null });
  };

  const joinRoom = () => {
    if (!socket || !joinCode.trim()) return toast.error('Enter a room code');
    setIsHost(false);
    socket.emit('join_room', { code: joinCode.toUpperCase() });
  };

  const startGame = () => {
    if (!socket || !roomState) return;
    socket.emit('start_game', { code: roomState.code });
  };

  const submitAnswer = (answer: string) => {
    if (answered || !socket || !roomState) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(answer);
    setAnswered(true);
    socket.emit('submit_answer', { code: roomState.code, answer, timeLeft });
  };

  const timerPct = (timeLeft / QUESTION_TIME) * 100;

  // ── LOBBY ──────────────────────────────────────────────────────────────────
  if (screen === 'lobby') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-amber-400" />
            </div>
            Multiplayer Kahoot
          </h1>
          <p className="text-slate-400 mt-2">Host a live game or join a friend's room.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setScreen('host-setup')}
            className="card border-amber-500/30 hover:border-amber-500 text-left group bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
              👑
            </div>
            <h2 className="text-xl font-extrabold group-hover:text-amber-400 transition-colors">Host a Game</h2>
            <p className="text-slate-400 text-sm mt-2">Create a room, pick your questions, and invite friends with a 6-letter code.</p>
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setScreen('join')}
            className="card border-brand-500/30 hover:border-brand-500 text-left group bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
              🎮
            </div>
            <h2 className="text-xl font-extrabold group-hover:text-brand-400 transition-colors">Join a Game</h2>
            <p className="text-slate-400 text-sm mt-2">Enter a room code from your host to jump into a live game.</p>
          </motion.button>
        </div>
      </div>
    </AppLayout>
  );

  // ── JOIN ───────────────────────────────────────────────────────────────────
  if (screen === 'join') return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6 py-10">
        <button onClick={() => setScreen('lobby')} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <div className="text-center">
          <div className="text-5xl mb-4">🎮</div>
          <h1 className="text-3xl font-extrabold">Join a Game</h1>
          <p className="text-slate-400 mt-2">Enter the 6-letter room code</p>
        </div>
        <div className="card space-y-4">
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            maxLength={6}
            className="input text-center text-3xl font-mono tracking-[0.5em] uppercase"
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
          />
          <button onClick={joinRoom} disabled={joinCode.length !== 6} className="btn-primary w-full py-3 disabled:opacity-50">
            Join Room →
          </button>
        </div>
      </div>
    </AppLayout>
  );

  // ── HOST SETUP ─────────────────────────────────────────────────────────────
  if (screen === 'host-setup') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <button onClick={() => setScreen('lobby')} className="text-slate-400 hover:text-white text-sm">← Back</button>
        <h1 className="text-2xl font-extrabold">Set Up Your Game</h1>

        <div className="flex gap-2 p-1 bg-surface-muted rounded-xl">
          {[{ k: 'deck', l: '🃏 From Flashcard Deck' }, { k: 'ai', l: '✨ AI Generated' }].map(t => (
            <button key={t.k} onClick={() => setSetupMode(t.k as any)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${setupMode === t.k ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t.l}
            </button>
          ))}
        </div>

        {setupMode === 'deck' ? (
          <div className="card space-y-3">
            <h2 className="font-bold">Select a Deck</h2>
            {decks.length === 0
              ? <p className="text-slate-500 text-sm">No decks yet. Create flashcards first!</p>
              : <div className="grid grid-cols-2 gap-2">
                  {decks.map((d: any) => (
                    <button key={d.id} onClick={() => setSelectedDeck(d.id)}
                      className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${selectedDeck === d.id ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'border-surface-border text-slate-400 hover:text-white'}`}>
                      <div className="font-semibold">{d.title}</div>
                      <div className="text-xs opacity-60 mt-0.5">{d.card_count} cards</div>
                    </button>
                  ))}
                </div>
            }
          </div>
        ) : (
          <div className="card space-y-4">
            <h2 className="font-bold">AI Question Generator</h2>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Topic</label>
              <input value={aiTopic} onChange={e => setAiTopic(e.target.value)}
                placeholder="e.g. World War II, Photosynthesis, Python basics..."
                className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Difficulty</label>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map(d => (
                  <button key={d} onClick={() => setAiDifficulty(d)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${aiDifficulty === d ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'border-surface-border text-slate-400 hover:text-white'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={generateQuestions} disabled={generatingQ}
            className="btn-ghost flex items-center gap-2 disabled:opacity-50">
            {generatingQ ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</> : '⚡ Generate Questions'}
          </button>
          {questions.length > 0 && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" /> {questions.length} questions ready
            </div>
          )}
        </div>

        <button onClick={createRoom} disabled={questions.length === 0}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
          <Plus className="w-5 h-5" /> Create Room
        </button>
      </div>
    </AppLayout>
  );

  // ── HOST WAITING ROOM ──────────────────────────────────────────────────────
  if (screen === 'host-waiting') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎮</div>
          <h1 className="text-2xl font-extrabold">Waiting for Players</h1>
          <p className="text-slate-400 mt-1">Share the code with your friends</p>
        </div>

        <div className="card text-center border-brand-500/30 bg-brand-500/5">
          <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Room Code</div>
          <div className="text-6xl font-black font-mono tracking-[0.2em] text-brand-400">
            {roomState?.code}
          </div>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Players ({roomState?.players.length || 0})
            </h2>
          </div>
          <div className="space-y-2">
            {roomState?.players.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-muted">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {p.name[0].toUpperCase()}
                </div>
                <span className="font-medium">{p.name}</span>
                {p.isHost && <Crown className="w-4 h-4 text-amber-400 ml-auto" />}
              </motion.div>
            ))}
          </div>
        </div>

        {isHost && (
          <button onClick={startGame}
            disabled={(roomState?.players.length || 0) < 1}
            className="btn-primary w-full py-4 text-lg font-extrabold disabled:opacity-50">
            Start Game! 🚀
          </button>
        )}
        {!isHost && (
          <div className="text-center text-slate-400 text-sm animate-pulse">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </AppLayout>
  );

  // ── PLAYING ────────────────────────────────────────────────────────────────
  if (screen === 'playing') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400 font-mono">{questionIndex + 1} / {totalQuestions}</div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Users className="w-4 h-4" /> {answeredCount}/{playerCount} answered
          </div>
        </div>

        {/* Timer */}
        <div className="relative h-3 bg-surface-border rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full transition-colors"
            style={{ background: timeLeft > 5 ? '#22c55e' : '#ef4444' }}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.9, ease: 'linear' }} />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">{timeLeft}s</div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div key={questionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="card border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent min-h-[120px] flex items-center justify-center">
            <h2 className="text-xl font-bold text-center px-4">{currentQuestion?.question}</h2>
          </motion.div>
        </AnimatePresence>

        {/* Options */}
        <div className="grid grid-cols-2 gap-3">
          {currentQuestion?.options.map((opt, i) => {
            let cls = `${COLORS[i]} border text-white`;
            if (answered) {
              if (opt === selected) cls = answerResult?.correct ? 'bg-green-500 border-green-400 text-white' : 'bg-red-700 border-red-500 text-white opacity-80';
              else cls = 'bg-surface-muted border-surface-border text-slate-500 opacity-40';
            }
            return (
              <motion.button key={opt} whileTap={{ scale: 0.97 }}
                onClick={() => submitAnswer(opt)}
                disabled={answered}
                className={`p-4 rounded-2xl font-bold text-sm text-left min-h-[70px] flex items-center gap-2 transition-all border ${cls}`}>
                <span className="text-lg opacity-80">{SHAPES[i]}</span>
                {opt}
              </motion.button>
            );
          })}
        </div>

        {/* Answer feedback */}
        <AnimatePresence>
          {answerResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card text-center border ${answerResult.correct ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <div className={`text-2xl font-extrabold ${answerResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                {answerResult.correct ? '✅ Correct!' : '❌ Wrong!'}
              </div>
              {answerResult.correct && (
                <div className="text-brand-400 font-bold mt-1">+{answerResult.points} points · {answerResult.score} total</div>
              )}
            </motion.div>
          )}
          {!answerResult && answered && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center text-slate-400 text-sm animate-pulse">
              Waiting for other players...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Host next button */}
        {isHost && answered && (
          <button onClick={() => socket?.emit('next_question', { code: roomState?.code })}
            className="btn-primary w-full">
            Next Question →
          </button>
        )}
      </div>
    </AppLayout>
  );

  // ── ROUND END ──────────────────────────────────────────────────────────────
  if (screen === 'round-end') return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-5 py-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <h2 className="text-2xl font-extrabold">Scoreboard</h2>
          <div className="text-sm text-slate-400 mt-1">Correct answer: <span className="text-green-400 font-semibold">{correctAnswer}</span></div>
        </div>
        <div className="space-y-2">
          {roundScores.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${i === 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-surface-border bg-surface-card'}`}>
              <div className="w-8 text-center font-bold text-slate-500">{i === 0 ? '👑' : `#${i + 1}`}</div>
              <div className="flex-1 font-semibold">{p.name}</div>
              <div className="font-bold text-brand-400 flex items-center gap-1">
                <Zap className="w-4 h-4" />{p.score.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
        {isHost && (
          <button onClick={() => socket?.emit('next_question', { code: roomState?.code })} className="btn-primary w-full py-3">
            Next Question →
          </button>
        )}
        {!isHost && <div className="text-center text-slate-500 text-sm animate-pulse">Waiting for host...</div>}
      </div>
    </AppLayout>
  );

  // ── GAME OVER ──────────────────────────────────────────────────────────────
  if (screen === 'game-over') return (
    <AppLayout>
      <div className="max-w-md mx-auto text-center py-10 space-y-6">
        <div className="text-7xl">🏆</div>
        <h1 className="text-3xl font-extrabold">Game Over!</h1>
        <div className="card space-y-3">
          {finalScores.map((p, i) => (
            <motion.div key={p.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === 0 ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-surface-muted'}`}>
              <div className="text-2xl">{['🥇', '🥈', '🥉'][i] || `#${i + 1}`}</div>
              <div className="flex-1 font-bold text-left">{p.name}</div>
              <div className="font-extrabold text-brand-400 flex items-center gap-1">
                <Trophy className="w-4 h-4" />{p.score.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
        <button onClick={() => { setScreen('lobby'); cleanup(); }} className="btn-primary px-10">
          Play Again
        </button>
      </div>
    </AppLayout>
  );

  return null;
}
