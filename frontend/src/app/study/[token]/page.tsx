'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { flashcardApi } from '@/lib/api';
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Card { id: string; question: string; answer: string; }
interface Deck { title: string; creator_name: string; card_count: number; }

function SwipeCard({ card, onSwipe, isTop }: {
  card: Card; onSwipe?: (dir: 'left' | 'right') => void; isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const hardOpacity = useTransform(x, [-100, -20, 0], [1, 0, 0]);
  const easyOpacity = useTransform(x, [0, 20, 100], [0, 0, 1]);
  const controls = useAnimation();
  const [flipped, setFlipped] = useState(false);

  const handleDragEnd = async (_: any, info: any) => {
    if (info.offset.x < -120) {
      await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
      onSwipe?.('left');
    } else if (info.offset.x > 120) {
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
      style={{ x, rotate, opacity, position: 'absolute', width: '100%' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className={isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
    >
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
      <div className="select-none rounded-2xl border" style={{ height: '320px' }}
        onClick={() => isTop && setFlipped(f => !f)}>
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center gap-4 p-6 bg-gray-900 border border-gray-700"
            style={{ backfaceVisibility: 'hidden' }}>
            <div className="text-xs text-blue-400 uppercase tracking-widest font-semibold">Question</div>
            <p className="text-xl font-bold leading-relaxed">{card.question}</p>
            <div className="text-xs text-gray-600">Tap to flip · Drag to rate</div>
          </div>
          <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center gap-4 p-6 bg-gray-900 border border-green-900"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <div className="text-xs text-green-400 uppercase tracking-widest font-semibold">Answer</div>
            <p className="text-xl font-bold text-green-300 leading-relaxed">{card.answer}</p>
          </div>
        </div>
      </div>
      {isTop && (
        <div className="flex justify-center gap-6 mt-5">
          <button onClick={() => triggerSwipe('left')}
            className="w-14 h-14 rounded-full border-2 border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-2xl flex items-center justify-center transition-all hover:scale-110">
            😰
          </button>
          <button onClick={() => setFlipped(f => !f)}
            className="w-14 h-14 rounded-full border-2 border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-400 flex items-center justify-center transition-all hover:scale-110">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => triggerSwipe('right')}
            className="w-14 h-14 rounded-full border-2 border-green-500/40 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-2xl flex items-center justify-center transition-all hover:scale-110">
            😊
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function PublicStudyPage() {
  const { token } = useParams<{ token: string }>();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [swipeStack, setSwipeStack] = useState<Card[]>([]);
  const [easyCount, setEasyCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [hardCards, setHardCards] = useState<Card[]>([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<'pick' | 'swipe' | 'browse'>('pick');

  useEffect(() => {
    if (!token) return;
    flashcardApi.getPublicDeck(token as string)
      .then(r => {
        setDeck(r.data.deck);
        const c = r.data.cards || [];
        setCards(c);
        setSwipeStack([...c].sort(() => Math.random() - 0.5));
      })
      .catch(() => setError('Deck not found or no longer shared.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSwipe = (dir: 'left' | 'right') => {
    const card = swipeStack[swipeStack.length - 1];
    if (dir === 'right') setEasyCount(e => e + 1);
    else { setHardCount(h => h + 1); setHardCards(prev => [...prev, card]); }
    const newStack = swipeStack.slice(0, -1);
    setSwipeStack(newStack);
    if (newStack.length === 0) setDone(true);
  };

  const restart = () => {
    setSwipeStack([...cards].sort(() => Math.random() - 0.5));
    setEasyCount(0);
    setHardCount(0);
    setHardCards([]);
    setDone(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-6xl">😕</div>
      <h1 className="text-2xl font-bold text-white">Deck not found</h1>
      <p className="text-gray-400">{error}</p>
      <Link href="/" className="mt-4 px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all">
        Go to StudyCoach
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold">{deck?.title}</div>
            <div className="text-xs text-gray-400">by {deck?.creator_name} · {cards.length} cards</div>
          </div>
        </div>
        <Link href="/register"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold transition-all">
          Sign up free →
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Mode picker */}
        {mode === 'pick' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold">{deck?.title}</h1>
              <p className="text-gray-400 mt-2">{cards.length} cards · shared by {deck?.creator_name}</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setMode('swipe')}
                className="p-6 rounded-2xl border border-blue-500/30 bg-blue-500/5 hover:border-blue-500 text-left transition-all group">
                <div className="text-3xl mb-3">🃏</div>
                <h2 className="text-xl font-extrabold group-hover:text-blue-400 transition-colors">Swipe Mode</h2>
                <p className="text-gray-400 text-sm mt-1">Tinder-style flashcards. Swipe right if you knew it, left if you didn't.</p>
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setMode('browse'); setCurrentIdx(0); setFlipped(false); }}
                className="p-6 rounded-2xl border border-gray-700 hover:border-gray-500 text-left transition-all group">
                <div className="text-3xl mb-3">📖</div>
                <h2 className="text-xl font-extrabold group-hover:text-white transition-colors">Browse Mode</h2>
                <p className="text-gray-400 text-sm mt-1">Flip through cards one by one at your own pace.</p>
              </motion.button>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Want to track your progress and earn XP?</p>
              <Link href="/register" className="text-blue-400 hover:underline text-sm font-medium">Create a free account →</Link>
            </div>
          </div>
        )}

        {/* Swipe mode */}
        {mode === 'swipe' && !done && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setMode('pick')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex gap-4 text-sm">
                <span className="text-red-400 font-bold">😰 {hardCount}</span>
                <span className="text-green-400 font-bold">😊 {easyCount}</span>
              </div>
              <div className="text-sm text-gray-400">{swipeStack.length} left</div>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${((cards.length - swipeStack.length) / cards.length) * 100}%` }} />
            </div>
            <div className="relative" style={{ height: '420px' }}>
              {swipeStack.slice(-3).map((card, i, arr) => {
                const isTop = i === arr.length - 1;
                const offset = arr.length - 1 - i;
                return (
                  <div key={card.id} style={{
                    position: 'absolute', width: '100%',
                    transform: `scale(${1 - offset * 0.04}) translateY(${offset * 12}px)`,
                    zIndex: i,
                  }}>
                    <SwipeCard card={card} onSwipe={isTop ? handleSwipe : undefined} isTop={isTop} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Swipe done */}
        {mode === 'swipe' && done && (
          <div className="text-center py-10 space-y-6">
            <div className="text-7xl">{Math.round(easyCount / (easyCount + hardCount || 1) * 100) >= 80 ? '🎉' : '💪'}</div>
            <h1 className="text-3xl font-extrabold">Done!</h1>
            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                <div className="text-3xl font-bold text-green-400">{easyCount}</div>
                <div className="text-xs text-gray-500 mt-1">😊 Easy</div>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-500/20">
                <div className="text-3xl font-bold text-red-400">{hardCount}</div>
                <div className="text-xs text-gray-500 mt-1">😰 Hard</div>
              </div>
            </div>
            {hardCards.length > 0 && (
              <div className="text-left p-4 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
                <h3 className="font-bold text-red-400 text-sm">Cards to review:</h3>
                {hardCards.map(c => (
                  <div key={c.id} className="text-sm">
                    <div className="font-medium">{c.question}</div>
                    <div className="text-gray-400 mt-0.5">{c.answer}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button onClick={restart} className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold transition-all">
                Study Again
              </button>
              <Link href="/register" className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all">
                Save Progress →
              </Link>
            </div>
          </div>
        )}

        {/* Browse mode */}
        {mode === 'browse' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setMode('pick')} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="text-sm text-gray-400">{currentIdx + 1} / {cards.length}</div>
              <div className="w-16" />
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }} />
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={currentIdx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                className="select-none rounded-2xl border border-gray-700 cursor-pointer"
                style={{ height: '300px' }}
                onClick={() => setFlipped(f => !f)}>
                <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.5s', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                  <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center gap-4 p-6 bg-gray-900"
                    style={{ backfaceVisibility: 'hidden' }}>
                    <div className="text-xs text-blue-400 uppercase tracking-widest font-semibold">Question</div>
                    <p className="text-xl font-bold">{cards[currentIdx]?.question}</p>
                    <div className="text-xs text-gray-600">Tap to flip</div>
                  </div>
                  <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center gap-4 p-6 bg-gray-900 border border-green-900"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <div className="text-xs text-green-400 uppercase tracking-widest font-semibold">Answer</div>
                    <p className="text-xl font-bold text-green-300">{cards[currentIdx]?.answer}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <button onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setFlipped(false); }}
                disabled={currentIdx === 0}
                className="w-12 h-12 rounded-xl border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setFlipped(f => !f)}
                className="px-6 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all">
                {flipped ? 'Show Question' : 'Reveal Answer'}
              </button>
              <button onClick={() => { setCurrentIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
                disabled={currentIdx === cards.length - 1}
                className="w-12 h-12 rounded-xl border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 disabled:opacity-30 transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
