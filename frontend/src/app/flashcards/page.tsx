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
              disabled={currentIdx === 0}
              className="w-10 h-10 rounded-xl border border-surface-border flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500/50 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setFlipped(!flipped)} className="btn-ghost text-sm px-6">
              {flipped ? 'Show Question' : 'Reveal Answer'}
            </button>
            <button onClick={() => { if (currentIdx < cards.length - 1) { setCurrentIdx(prev => prev + 1); setFlipped(false); } }}
              disabled={currentIdx === cards.length - 1}
              className="w-10 h-10 rounded-xl border border-surface-border flex items-center justify-center text-slate-400 hover:text-white hover:border-brand-500/50 disabled:opacity-30 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {flipped && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-3">
                <p className="text-center text-sm text-slate-400">How well did you know this?</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '😰 Hard', diff: 'hard' as const, color: 'border-red-500/40 hover:bg-red-500/10 text-red-400 hover:border-red-500' },
                    { label: '🤔 Medium', diff: 'medium' as const, color: 'border-amber-500/40 hover:bg-amber-500/10 text-amber-400 hover:border-amber-500' },
                    { label: '😊 Easy', diff: 'easy' as const, color: 'border-green-500/40 hover:bg-green-500/10 text-green-400 hover:border-green-500' },
                  ].map(({ label, diff, color }) => (
                    <button key={diff} onClick={() => handleRate(diff)} disabled={reviewing}
                      className={`border rounded-xl py-3 font-semibold transition-all disabled:opacity-50 text-sm ${color}`}>
                      {reviewing ? '...' : label}
                    </button>
                  ))}
                </div>
                <div className="card !p-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>Memory strength</span>
                    <span>{Math.round((card?.memory_strength || 0) * 100)}%</span>
                  </div>
                  <div className="xp-bar">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500 transition-all"
                      style={{ width: `${(card?.memory_strength || 0) * 100}%` }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppLayout>
    );
  }

  if (mode === 'create') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setMode('home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-2xl font-extrabold">Create Flashcards</h1>
        </div>

        <div className="card space-y-3">
          <h2 className="font-bold text-sm text-slate-400 uppercase tracking-widest">Select Deck</h2>
          <div className="flex flex-wrap gap-2">
            {decks.map(d => (
              <button key={d.id} onClick={() => setSelectedDeck(d)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${selectedDeck?.id === d.id ? 'bg-brand-500/20 border-brand-500/50 text-brand-400' : 'border-surface-border text-slate-400 hover:text-white'}`}>
                {d.title} ({d.card_count})
              </button>
            ))}
            <button onClick={() => setShowCreateDeck(true)} className="px-4 py-2 rounded-xl border border-dashed border-surface-border text-slate-500 hover:text-white hover:border-brand-500/40 text-sm transition-all flex items-center gap-1">
              <Plus className="w-3 h-3" /> New Deck
            </button>
          </div>
          {showCreateDeck && (
            <div className="flex gap-2 mt-2">
              <input value={deckTitle} onChange={e => setDeckTitle(e.target.value)} placeholder="Deck name..." className="input flex-1" onKeyDown={e => e.key === 'Enter' && createDeck()} />
              <button onClick={createDeck} className="btn-primary px-4">Create</button>
              <button onClick={() => setShowCreateDeck(false)} className="btn-ghost px-3"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>

        {selectedDeck && (
          <>
            <div className="card space-y-4">
              <h2 className="font-bold">Add Card to "{selectedDeck.title}"</h2>
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
                <Sparkles className="w-5 h-5 text-brand-400" /> Generate from Notes (AI)
              </h2>
              <textarea value={generatingNotes} onChange={e => setGeneratingNotes(e.target.value)}
                placeholder="Paste your notes here and AI will create 10 flashcards automatically..."
                className="input min-h-[120px] resize-none" />
              <button onClick={generateFromNotes} disabled={generating || !generatingNotes.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {generating ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate 10 Cards</>}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );

  return (
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
            <p className="text-slate-400 mt-2">Spaced repetition learning system.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode('create')} className="btn-ghost flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create
            </button>
            <button onClick={loadDueCards} className="btn-primary flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Study Now
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28" />)}
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20 card border-dashed">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-bold mb-2">No decks yet</h2>
            <p className="text-slate-500 mb-6">Create your first deck to get started!</p>
            <button onClick={() => setMode('create')} className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Create First Deck
            </button>
          </div>
        ) : (
          <div className="relative">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Your Decks</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {decks.map((deck, i) => (
                <motion.div
                  key={deck.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="card snap-start flex-shrink-0 w-52 cursor-pointer hover:border-brand-500/40 transition-all group"
                  onClick={() => { setSelectedDeck(deck); setMode('create'); }}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-3 group-hover:bg-brand-500/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="font-bold truncate">{deck.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{deck.card_count} cards</p>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: decks.length * 0.07 }}
                className="card snap-start flex-shrink-0 w-52 cursor-pointer border-dashed hover:border-brand-500/40 transition-all flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-white"
                onClick={() => setMode('create')}
              >
                <Plus className="w-8 h-8" />
                <span className="text-sm font-medium">New Deck</span>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
