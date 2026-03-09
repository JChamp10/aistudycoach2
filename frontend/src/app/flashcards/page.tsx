'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import { BookOpen, RotateCcw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: string;
  question: string;
  answer: string;
  memory_strength: number;
  deck_title?: string;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);

  useEffect(() => {
    flashcardApi.dueCards()
      .then(r => setCards(r.data.cards))
      .catch(() => toast.error('Failed to load cards'))
      .finally(() => setLoading(false));
  }, []);

  const handleRate = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const card = cards[currentIdx];
    setReviewing(difficulty);
    try {
      const res = await flashcardApi.reviewCard(card.id, difficulty);
      setSessionXP(prev => prev + (res.data.xp?.xpGained || 0));
      if (currentIdx + 1 >= cards.length) {
        setCompleted(true);
      } else {
        setCurrentIdx(prev => prev + 1);
        setFlipped(false);
      }
    } catch {
      toast.error('Failed to record review');
    } finally {
      setReviewing(null);
    }
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div></AppLayout>;

  if (completed || cards.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-16">
          <div className="text-6xl mb-4">{cards.length === 0 ? '✨' : '🎉'}</div>
          <h2 className="text-2xl font-extrabold mb-2">{cards.length === 0 ? 'All caught up!' : 'Session complete!'}</h2>
          <p className="text-slate-400 mb-6">{cards.length === 0 ? 'No cards due for review today.' : `You reviewed ${cards.length} cards and earned +${sessionXP} XP!`}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard" className="btn-ghost">Back to dashboard</Link>
            <Link href="/dashboard" className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create cards</Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const card = cards[currentIdx];
  const progress = (currentIdx / cards.length) * 100;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold flex items-center gap-2"><BookOpen className="w-6 h-6 text-brand-400" /> Flashcard Review</h1>
          <div className="text-sm text-slate-400">{currentIdx + 1} / {cards.length}</div>
        </div>

        <div className="xp-bar h-2"><div className="xp-bar-fill" style={{ width: `${progress}%` }} /></div>
        {sessionXP > 0 && <div className="text-right text-sm text-brand-400 font-semibold">+{sessionXP} XP earned</div>}

        <div className="flashcard-container h-64 cursor-pointer select-none" onClick={() => setFlipped(!flipped)}>
          <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
            <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4 border-brand-500/20">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Question</div>
              <p className="text-xl font-semibold">{card.question}</p>
              <div className="text-xs text-slate-600 mt-2">Click to reveal answer</div>
            </div>
            <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4 border-green-500/20 bg-green-500/5">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Answer</div>
              <p className="text-xl font-semibold text-green-300">{card.answer}</p>
              {card.deck_title && <div className="badge bg-surface-border text-slate-400">{card.deck_title}</div>}
            </div>
          </div>
        </div>

        {!flipped && (
          <div className="text-center">
            <button onClick={() => setFlipped(true)} className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-2 mx-auto">
              <RotateCcw className="w-4 h-4" /> Flip card
            </button>
          </div>
        )}

        <AnimatePresence>
          {flipped && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <p className="text-center text-sm text-slate-400">How well did you know this?</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Hard',   diff: 'hard'   as const, color: 'border-red-500/30 hover:bg-red-500/10 text-red-400' },
                  { label: 'Medium', diff: 'medium' as const, color: 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400' },
                  { label: 'Easy',   diff: 'easy'   as const, color: 'border-green-500/30 hover:bg-green-500/10 text-green-400' },
                ].map(({ label, diff, color }) => (
                  <button key={diff} onClick={() => handleRate(diff)} disabled={reviewing !== null} className={`border rounded-xl py-3 font-semibold transition-all disabled:opacity-50 ${color}`}>
                    {reviewing === diff ? '...' : label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card !p-4">
          <div className="flex justify-between items-center mb-2 text-xs text-slate-500">
            <span>Memory strength</span>
            <span>{Math.round((card.memory_strength || 0) * 100)}%</span>
          </div>
          <div className="xp-bar">
            <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all" style={{ width: `${(card.memory_strength || 0) * 100}%` }} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
