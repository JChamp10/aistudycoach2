'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import { BookOpen, Plus, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Card {
  id: string;
  question: string;
  answer: string;
  memory_strength: number;
  deck_title?: string;
}

interface Deck {
  id: string;
  title: string;
  card_count: number;
}

type Mode = 'home' | 'study' | 'create';

export default function FlashcardsPage() {
  const [mode, setMode] = useState<Mode>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [sessionXP, setSessionXP] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [deckTitle, setDeckTitle] = useState('');
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [generatingNotes, setGeneratingNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadDecks(); }, []);

  const loadDecks = async () => {
    try {
      const res = await flashcardApi.decks();
      setDecks(res.data.decks || []);
    } catch { toast.error('Failed to load decks'); }
    finally { setLoading(false); }
  };

  const loadDueCards = async () => {
    setLoading(true);
    try {
      const res = await flashcardApi.dueCards();
      const c = res.data.cards || [];
      if (c.length === 0) { toast('No cards due for review! Create some first.'); return; }
      setCards(c);
      setCurrentIdx(0);
      setFlipped(false);
      setCompleted(false);
      setSessionXP(0);
      setMode('study');
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  };

  const handleRate = async (difficulty: 'easy' | 'medium' | 'hard') => {
    const card = cards[currentIdx];
    setReviewing(true);
    try {
      const res = await flashcardApi.reviewCard(card.id, difficulty);
      setSessionXP(prev => prev + (res.data.xp?.xpGained || 0));
      if (currentIdx + 1 >= cards.length) setCompleted(true);
      else { setCurrentIdx(prev => prev + 1); setFlipped(false); }
    } catch { toast.error('Failed to record review'); }
    finally { setReviewing(false); }
  };

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
      loadDecks();
    } catch { toast.error('Failed to add card'); }
  };

  const generateFromNotes = async () => {
    if (!selectedDeck || !generatingNotes.trim()) return;
    setGenerating(true);
    try {
      const res = await flashcardApi.generateFromNotes({ deck_id: selectedDeck.id, notes: generatingNotes, count: 10 });
      toast.success(`Generated ${res.data.generated} cards!`);
      setGeneratingNotes('');
      loadDecks();
    } catch { toast.error('Failed to generate cards'); }
    finally { setGenerating(false); }
  };

  const handleDragEnd = (e: any) => {
    if (dragStart === null) return;
    const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStart - endX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && currentIdx < cards.length - 1) { setCurrentIdx(prev => prev + 1); setFlipped(false); }
      else if (diff < 0 && currentIdx > 0) { setCurrentIdx(prev => prev - 1); setFlipped(false); }
    }
    setDragStart(null);
  };

  const card = cards[currentIdx];

  if (mode === 'study') {
    if (completed) return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-20">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-3xl font-extrabold mb-3">Session Complete!</h2>
          <p className="text-slate-400 mb-8">You reviewed {cards.length} cards and earned <span className="text-brand-400 font-bold">+{sessionXP} XP</span>!</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setMode('home')} className="btn-ghost">Back</button>
            <button onClick={loadDueCards} className="btn-primary">Study Again</button>
          </div>
        </div>
      </AppLayout>
    );

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setMode('home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" /> Back
            </button>
            <div className="text-sm text-slate-400 font-mono">{currentIdx + 1} / {cards.length}</div>
            {sessionXP > 0 && <div className="text-sm text-brand-400 font-bold">+{sessionXP} XP</div>}
          </div>

          <div className="xp-bar h-1.5">
            <div className="xp-bar-fill" style={{ width: `${(currentIdx / cards.length) * 100}%` }} />
          </div>

          <div className="flex justify-center gap-2 py-2">
            {cards.map((_, i) => (
              <button key={i} onClick={() => { setCurrentIdx(i); setFlipped(false); }}
                className={`transition-all duration-300 rounded-full ${i === currentIdx ? 'w-6 h-2 bg-brand-500' : 'w-2 h-2 bg-surface-border hover:bg-slate-500'}`} />
            ))}
          </div>

          <div
            className="relative h-72 cursor-pointer select-none"
            onMouseDown={e => setDragStart(e.clientX)}
            onMouseUp={handleDragEnd}
            onTouchStart={e => setDragStart(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
            onClick={() => { if (dragStart === null) setFlipped(!flipped); }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <div className="flashcard-container h-full">
                  <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
                    <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4 border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-transparent">
                      <div className="text-xs text-brand-400/60 uppercase tracking-widest font-semibold">Question</div>
                      <p className="text-xl font-semibold px-4">{card?.question}</p>
                      <div className="text-xs text-slate-600 mt-2">Click to flip · Swipe to navigate</div>
                    </div>
                    <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
                      <div className="text-xs text-green-400/60 uppercase tracking-widest font-semibold">Answer</div>
                      <p className="text-xl font-semibold text-green-300 px-4">{card?.answer}</p>
                      {card?.deck_title && <div className="badge bg-surface-border text-slate-400">{card.deck_title}</div>}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={() => { if (currentIdx > 0) { setCurrentIdx(prev => prev - 1); setFlipped(false); } }}
              disabled={currentIdx === 0
