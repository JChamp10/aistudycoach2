'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import { BookOpen, Plus, X, ChevronLeft, Sparkles, Zap, Clock, Trophy, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';

interface Card {
  id: string;
  question: string;
  answer: string;
  memory_strength: number;
}

interface Deck {
  id: string;
  title: string;
  card_count: number;
}

type Screen = 'home' | 'pick-mode' | 'swipe' | 'kahoot' | 'create' | 'result';

const KAHOOT_TIME = 10;

function generateOptions(cards: Card[], correctCard: Card): string[] {
  const wrong = cards
    .filter(c => c.id !== correctCard.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.answer);
  const all = [...wrong, correctCard.answer].sort(() => Math.random() - 0.5);
  return all;
}

// ─── Tinder Swipe Card ───────────────────────────────────────────────────────
function SwipeCard({
  card, onSwipe, isTop, zIndex,
}: {
  card: Card;
  onSwipe?: (dir: 'left' | 'right') => void;
  isTop: boolean;
  zIndex: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const hardOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);
  const easyOpacity = useTransform(x, [0, 20, 100], [0, 0, 1]);
  const controls = useAnimation();
  const [flipped, setFlipped] = useState(false);

  const handleDragEnd = async (_: any, info: any) => {
    const threshold = 120;
    if (info.offset.x < -threshold) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe?.('left');
    } else if (info.offset.x > threshold) {
      await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe?.('right');
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  const triggerSwipe = async (dir: 'left' | 'right') => {
    await controls.start({ x: dir === 'left' ? -500 : 500, opacity: 0, transition: { duration: 0.3 } });
    onSwipe?.(dir);
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex, position: 'absolute', width: '100%' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="cursor-grab active:cursor-grabbing"
    >
      {/* Hard / Easy labels */}
      {isTop && (
        <>
          <motion.div style={{ opacity: hardOpacity }}
            className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 border-red-500 text-red-400 font-extrabold text-lg rotate-[-12deg]">
            HARD
          </motion.div>
          <motion.div style={{ opacity: easyOpacity }}
            className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 border-green-500 text-green-400 font-extrabold text-lg rotate-[12deg]">
            EASY
          </motion.div>
        </>
      )}

      <div
        className="flashcard-container select-none"
        style={{ height: '340px' }}
        onClick={() => isTop && setFlipped(f => !f)}
      >
        <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4 border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="text-xs text-brand-400/60 uppercase tracking-widest font-semibold">Question</div>
            <p className="text-xl font-bold px-6 leading-relaxed">{card.question}</p>
            <div className="text-xs text-slate-600 mt-2">Tap to flip · Swipe to rate</div>
          </div>
          <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4 border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <div className="text-xs text-green-400/60 uppercase tracking-widest font-semibold">Answer</div>
            <p className="text-xl font-bold text-green-300 px-6 leading-relaxed">{card.answer}</p>
            <div className="text-xs text-slate-600 mt-2">← Hard · Easy →</div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      {isTop && (
        <div className="flex justify-center gap-6 mt-5">
          <button onClick={() => triggerSwipe('left')}
            className="w-14 h-14 rounded-full border-2 border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95">
            😰
          </button>
          <button onClick={() => setFlipped(f => !f)}
            className="w-14 h-14 rounded-full border-2 border-surface-border bg-surface-muted hover:bg-surface-card text-slate-400 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => triggerSwipe('right')}
            className="w-14 h-14 rounded-full border-2 border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95">
            😊
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Create state
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  // Swipe state
  const [swipeStack, setSwipeStack] = useState<Card[]>([]);
  const [easyCount, setEasyCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  // Kahoot state
  const [kahootIdx, setKahootIdx] = useState(0);
  const [kahootScore, setKahootScore] = useState(0);
  const [kahootTimeLeft, setKahootTimeLeft] = useState(KAHOOT_TIME);
  const [kahootSelected, setKahootSelected] = useState<string | null>(null);
  const [kahootConfirmed, setKahootConfirmed] = useState(false);
  const [kahootOptions, setKahootOptions] = useState<string[]>([]);
  const [kahootResults, setKahootResults] = useState<boolean[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadDecks(); }, []);

  const loadDecks = async () => {
    try {
      const res = await flashcardApi.decks();
      setDecks(res.data.decks || []);
    } catch { toast.error('Failed to load decks'); }
    finally { setLoading(false); }
  };

  const loadDeckCards = async (deck: Deck) => {
    setLoading(true);
    try {
      const res = await flashcardApi.deckCards(deck.id);
      const c = res.data.cards || [];
      if (c.length === 0) { toast('No cards in this deck yet! Add some first.'); setLoading(false); return; }
      setCards(c);
      setSelectedDeck(deck);
      setScreen('pick-mode');
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  };

  // ── Swipe mode ──
  const startSwipe = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setSwipeStack(shuffled);
    setEasyCount(0);
    setHardCount(0);
    setSessionXP(0);
    setScreen('swipe');
  };

  const handleSwipe = async (dir: 'left' | 'right') => {
    const card = swipeStack[swipeStack.length - 1];
    const difficulty = dir === 'right' ? 'easy' : 'hard';
    if (dir === 'right') setEasyCount(e => e + 1);
    else setHardCount(h => h + 1);
    try {
      const res = await flashcardApi.reviewCard(card.id, difficulty);
      setSessionXP(prev => prev + (res.data.xp?.xpGained || 0));
    } catch {}
    const newStack = swipeStack.slice(0, -1);
    setSwipeStack(newStack);
    if (newStack.length === 0) setScreen('result');
  };

  // ── Kahoot mode ──
  const startKahoot = () => {
    if (cards.length < 2) { toast.error('Need at least 2 cards for Kahoot mode!'); return; }
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setKahootIdx(0);
    setKahootScore(0);
    setKahootResults([]);
    setKahootOptions(generateOptions(shuffled, shuffled[0]));
    setKahootSelected(null);
    setKahootConfirmed(false);
    setKahootTimeLeft(KAHOOT_TIME);
    setScreen('kahoot');
  };

  useEffect(() => {
    if (screen !== 'kahoot') { if (timerRef.current) clearInterval(timerRef.current); return; }
    if (kahootConfirmed) return;
    timerRef.current = setInterval(() => {
      setKahootTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleKahootAnswer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [screen, kahootIdx, kahootConfirmed]);

  const handleKahootAnswer = (answer: string | null) => {
    if (kahootConfirmed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setKahootSelected(answer);
    setKahootConfirmed(true);
    const correct = answer === cards[kahootIdx].answer;
    if (correct) setKahootScore(s => s + Math.max(100, kahootTimeLeft * 50));
    setKahootResults(r => [...r, correct]);
  };

  const nextKahoot = () => {
    const nextIdx = kahootIdx + 1;
    if (nextIdx >= cards.length) { setScreen('result'); return; }
    setKahootIdx(nextIdx);
    setKahootOptions(generateOptions(cards, cards[nextIdx]));
    setKahootSelected(null);
    setKahootConfirmed(false);
    setKahootTimeLeft(KAHOOT_TIME);
  };

  // ── Create ──
  const createDeck = async () => {
    if (!deckTitle.trim()) return;
    try {
      await flashcardApi.createDeck({ title: deckTitle });
      toast.success('Deck created!');
      setDeckTitle('');
      setShowCreateDeck(false);
      loadDecks();
    } catch { toast.error('Failed to create deck'); }
  };

  const addCard = async () => {
    if (!selectedDeck || !cardQ.trim() || !cardA.trim()) return;
    try {
      await flashcardApi.createCard({ deck_id: selectedDeck.id, question: cardQ, answer: cardA });
      toast.success('Card added!');
      setCardQ('');
      setCardA('');
    } catch { toast.error('Failed to add card'); }
  };

  const generateFromNotes = async () => {
    if (!selectedDeck || !genNotes.trim()) return;
    setGenerating(true);
    try {
      const res = await flashcardApi.generateFromNotes({ deck_id: selectedDeck.id, notes: genNotes, count: 10 });
      toast.success(`Generated ${res.data.generated} cards!`);
      setGenNotes('');
      loadDecks();
    } catch { toast.error('Failed to generate'); }
    finally { setGenerating(false); }
  };

  // ─── SCREENS ───────────────────────────────────────────────────────────────

  // HOME
  if (screen === 'home') return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-brand-400" />
              </div>
              Flashcards
            </h1>
            <p className="text-slate-400 mt-2">Pick a deck to study or create new cards.</p>
          </div>
          <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Deck
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20 card border-dashed">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-bold mb-2">No decks yet</h2>
            <p className="text-slate-500 mb-6">Create your first deck to get started!</p>
            <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Create First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck, i) => (
              <motion.div key={deck.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="card hover:border-brand-500/40 transition-all group cursor-pointer"
                onClick={() => loadDeckCards(deck)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedDeck(deck); setScreen('create'); }}
                    className="text-xs text-slate-500 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-brand-500/10">
                    + Add cards
                  </button>
                </div>
                <h3 className="font-bold text-lg group-hover:text-brand-400 transition-colors">{deck.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{deck.card_count} cards</p>
                <div className="flex gap-2 mt-4">
                  <div className="badge bg-brand-500/10 text-brand-400 border-brand-500/20 text-xs">Swipe</div>
                  <div className="badge bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">⚡ Kahoot</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );

  // PICK MODE
  if (screen === 'pick-mode') return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6">
        <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold mb-2">{selectedDeck?.title}</h1>
          <p className="text-slate-400">{cards.length} cards · Choose your study mode</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={startSwipe}
            className="card border-brand-500/30 hover:border-brand-500 text-left group transition-all bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🃏
              </div>
              <div>
                <h2 className="text-xl font-extrabold group-hover:text-brand-400 transition-colors">Swipe Mode</h2>
                <p className="text-slate-400 text-sm mt-1">Tinder-style flashcards. Swipe right if you knew it, left if you didn't.</p>
                <div className="flex gap-2 mt-2">
                  <span className="badge bg-green-500/10 text-green-400 border-green-500/20 text-xs">← Hard</span>
                  <span className="badge bg-brand-500/10 text-brand-400 border-brand-500/20 text-xs">Easy →</span>
                </div>
              </div>
            </div>
          </motion.button>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={startKahoot}
            className="card border-amber-500/30 hover:border-amber-500 text-left group transition-all bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div>
                <h2 className="text-xl font-extrabold group-hover:text-amber-400 transition-colors">Kahoot Mode</h2>
                <p className="text-slate-400 text-sm mt-1">10 seconds per question. Pick the right answer from 4 choices. Race the clock!</p>
                <div className="flex gap-2 mt-2">
                  <span className="badge bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">⏱ Timed</span>
                  <span className="badge bg-orange-500/10 text-orange-400 border-orange-500/20 text-xs">🏆 Scored</span>
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </AppLayout>
  );

  // SWIPE MODE
  if (screen === 'swipe') return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen('pick-mode')} className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> Quit
          </button>
          <div className="flex gap-4 text-sm">
            <span className="text-red-400 font-bold">😰 {hardCount}</span>
            <span className="text-green-400 font-bold">😊 {easyCount}</span>
          </div>
          <div className="text-sm text-slate-400">{swipeStack.length} left</div>
        </div>

        <div className="xp-bar h-1.5">
          <div className="xp-bar-fill" style={{ width: `${((cards.length - swipeStack.length) / cards.length) * 100}%` }} />
        </div>

        <div className="relative" style={{ height: '420px' }}>
          {swipeStack.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">Loading...</div>
          ) : (
            swipeStack.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1;
              const offset = arr.length - 1 - i;
              return (
                <div key={card.id} style={{
                  position: 'absolute', width: '100%',
                  transform: `scale(${1 - offset * 0.04}) translateY(${offset * 12}px)`,
                  zIndex: i,
                }}>
                  <SwipeCard card={card} onSwipe={isTop ? handleSwipe : undefined} isTop={isTop} zIndex={i} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );

  // KAHOOT MODE
  if (screen === 'kahoot') {
    const currentCard = cards[kahootIdx];
    const timerPct = (kahootTimeLeft / KAHOOT_TIME) * 100;
    const colors = ['bg-red-500/80 border-red-500', 'bg-blue-500/80 border-blue-500', 'bg-amber-500/80 border-amber-500', 'bg-green-500/80 border-green-500'];
    const hoverColors = ['hover:bg-red-500/20', 'hover:bg-blue-500/20', 'hover:bg-amber-500/20', 'hover:bg-green-500/20'];
    const textColors = ['text-red-400', 'text-blue-400', 'text-amber-400', 'text-green-400'];

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={() => setScreen('pick-mode')} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5" /> Quit
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">{kahootIdx + 1}/{cards.length}</span>
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-amber-400">{kahootScore.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Timer bar */}
          <div className="relative h-3 bg-surface-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: kahootTimeLeft > 5 ? '#22c55e' : '#ef4444' }}
              animate={{ width: `${timerPct}%` }}
              transition={{ duration: 0.9, ease: 'linear' }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
              {kahootTimeLeft}s
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div key={kahootIdx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="card border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent min-h-[120px] flex items-center justify-center">
              <h2 className="text-xl font-bold text-center px-4">{currentCard?.question}</h2>
            </motion.div>
          </AnimatePresence>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {kahootOptions.map((opt, i) => {
              let style = `border ${hoverColors[i]} ${textColors[i]} border-surface-border`;
              if (kahootConfirmed) {
                if (opt === currentCard.answer) style = `${colors[i]} text-white border`;
                else if (opt === kahootSelected) style = 'bg-red-900/30 border border-red-500/50 text-red-400 opacity-60';
                else style = 'border border-surface-border text-slate-600 opacity-40';
              } else if (opt === kahootSelected) {
                style = `${colors[i]} text-white border`;
              }
              return (
                <motion.button key={opt} whileTap={{ scale: 0.97 }}
                  onClick={() => !kahootConfirmed && handleKahootAnswer(opt)}
                  disabled={kahootConfirmed}
                  className={`p-4 rounded-2xl font-semibold text-sm text-left transition-all min-h-[70px] flex items-center ${style}`}>
                  <span className="font-mono mr-2 opacity-60">{['▲', '◆', '●', '■'][i]}</span>
                  {opt}
                </motion.button>
              );
            })}
          </div>

          {kahootConfirmed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3">
              <div className={`text-lg font-extrabold ${kahootSelected === currentCard.answer ? 'text-green-400' : 'text-red-400'}`}>
                {kahootSelected === currentCard.answer ? '✅ Correct!' : `❌ Correct answer: ${currentCard.answer}`}
              </div>
              <button onClick={nextKahoot} className="btn-primary px-8">
                {kahootIdx + 1 >= cards.length ? 'See Results →' : 'Next →'}
              </button>
            </motion.div>
          )}

          {!kahootConfirmed && kahootTimeLeft === 0 && (
            <div className="text-center text-red-400 font-bold text-lg">⏰ Time's up!</div>
          )}
        </div>
      </AppLayout>
    );
  }

  // RESULT SCREEN
  if (screen === 'result') {
    const isKahoot = kahootResults.length > 0;
    const correctCount = kahootResults.filter(Boolean).length;
    const pct = isKahoot ? Math.round((correctCount / cards.length) * 100) : Math.round((easyCount / (easyCount + hardCount)) * 100);

    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-12 space-y-6">
          <div className="text-7xl mb-2">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h1 className="text-3xl font-extrabold">{isKahoot ? 'Kahoot Complete!' : 'Session Complete!'}</h1>

          {isKahoot ? (
            <div className="card space-y-4">
              <div className="text-5xl font-extrabold text-amber-400">{kahootScore.toLocaleString()}</div>
              <div className="text-slate-400">points</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-500/10 rounded-xl p-3">
                  <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                  <div className="text-xs text-slate-500">Correct</div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-3">
                  <div className="text-2xl font-bold text-red-400">{cards.length - correctCount}</div>
                  <div className="text-xs text-slate-500">Wrong</div>
                </div>
                <div className="bg-brand-500/10 rounded-xl p-3">
                  <div className="text-2xl font-bold text-brand-400">{pct}%</div>
                  <div className="text-xs text-slate-500">Accuracy</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">{easyCount}</div>
                  <div className="text-xs text-slate-500 mt-1">😊 Easy</div>
                </div>
                <div className="bg-red-500/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">{hardCount}</div>
                  <div className="text-xs text-slate-500 mt-1">😰 Hard</div>
                </div>
              </div>
              {sessionXP > 0 && (
                <div className="flex items-center justify-center gap-2 text-brand-400 font-bold">
                  <Zap className="w-5 h-5" /> +{sessionXP} XP earned
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button onClick={() => setScreen('home')} className="btn-ghost">All Decks</button>
            <button onClick={() => setScreen('pick-mode')} className="btn-primary">Play Again</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // CREATE SCREEN
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-2xl font-extrabold">
            {selectedDeck ? `Add to "${selectedDeck.title}"` : 'Create New Deck'}
          </h1>
        </div>

        {!selectedDeck && (
          <div className="card space-y-3">
            <h2 className="font-bold">New Deck</h2>
            <div className="flex gap-2">
              <input value={deckTitle} onChange={e => setDeckTitle(e.target.value)} placeholder="Deck name..." className="input flex-1" onKeyDown={e => e.key === 'Enter' && createDeck()} />
              <button onClick={createDeck} disabled={!deckTitle.trim()} className="btn-primary px-4 disabled:opacity-50">Create</button>
            </div>
            {decks.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Or add to existing deck:</p>
                <div className="flex flex-wrap gap-2">
                  {decks.map(d => (
                    <button key={d.id} onClick={() => setSelectedDeck(d)}
                      className="px-3 py-1.5 rounded-xl border border-surface-border text-sm text-slate-400 hover:text-white hover:border-brand-500/40 transition-all">
                      {d.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedDeck && (
          <>
            <div className="card space-y-4">
              <h2 className="font-bold">Add a Card</h2>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Question</label>
                <input value={cardQ} onChange={e => setCardQ(e.target.value)} placeholder="Front of card..." className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Answer</label>
                <input value={cardA} onChange={e => setCardA(e.target.value)} placeholder="Back of card..." className="input" onKeyDown={e => e.key === 'Enter' && addCard()} />
              </div>
              <button onClick={addCard} disabled={!cardQ.trim() || !cardA.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </div>

            <div className="card space-y-4 border-brand-500/20 bg-brand-500/5">
              <h2 className="font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" /> AI Generate from Notes
              </h2>
              <textarea value={genNotes} onChange={e => setGenNotes(e.target.value)}
                placeholder="Paste notes here and AI will generate 10 cards..."
                className="input min-h-[100px] resize-none" />
              <button onClick={generateFromNotes} disabled={generating || !genNotes.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {generating
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generating...</>
                  : <><Sparkles className="w-4 h-4" /> Generate 10 Cards</>}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
