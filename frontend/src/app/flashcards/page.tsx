'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import {
  BookOpen, Plus, ChevronLeft,
  Trash2, Eye, Brain,
  Clock3, Layers3, Smile, Trophy, ChevronRight, X, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Card, Deck, Screen } from '@/components/flashcards/types';
import { SwipeCard } from '@/components/flashcards/SwipeCard';
import { CardRow } from '@/components/flashcards/CardRow';
import { HardQuiz } from '@/components/flashcards/HardQuiz';
import { RecallMode } from '@/components/flashcards/RecallMode';

export default function FlashcardsPage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [dueCardsData, setDueCardsData] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const [confirmDeleteDeck, setConfirmDeleteDeck] = useState<string | null>(null);
  const [recallDeck, setRecallDeck] = useState<Deck | null>(null);

  const [deckTitle, setDeckTitle] = useState('');
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  const [swipeStack, setSwipeStack] = useState<Card[]>([]);
  const [hardCards, setHardCards] = useState<Card[]>([]);
  const [easyCount, setEasyCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (focusMode) document.body.classList.add('focus-mode');
    else document.body.classList.remove('focus-mode');
    return () => document.body.classList.remove('focus-mode');
  }, [focusMode]);

  useEffect(() => { loadDecks(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (screen !== 'study') return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        const flipBtn = document.querySelector('[data-flip-btn]') as HTMLButtonElement;
        if (flipBtn) flipBtn.click();
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const rightBtn = document.querySelector('[data-swipe-right]') as HTMLButtonElement;
        if (rightBtn) rightBtn.click();
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const leftBtn = document.querySelector('[data-swipe-left]') as HTMLButtonElement;
        if (leftBtn) leftBtn.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen]);

  const loadDecks = async () => {
    setLoading(true);
    try {
      const [resDecks, resDue] = await Promise.all([flashcardApi.decks(), flashcardApi.dueCards()]);
      setDecks(resDecks.data.decks || []);
      setDueCardsData(resDue.data.cards || []);
    } catch { toast.error('Failed to load decks'); } finally { setLoading(false); }
  };

  const startDueSession = () => {
    setCards(dueCardsData);
    setSelectedDeck({ id: 'due', title: 'Due Today', card_count: dueCardsData.length });
    setSwipeStack([...dueCardsData].sort((a, b) => (b.memory_strength || 0) - (a.memory_strength || 0)));
    setHardCards([]); setEasyCount(0); setHardCount(0); setSessionXP(0);
    setScreen('study');
  };

  const loadDeckCards = async (deck: Deck, hardOnly: boolean = false) => {
    setLoading(true);
    try {
      const res = await flashcardApi.deckCards(deck.id);
      let c: Card[] = res.data.cards || [];
      if (c.length === 0) {
        setSelectedDeck(deck); setScreen('create');
        return;
      }
      if (hardOnly) {
        c = c.filter(card => (card.memory_strength || 0) < 0.6);
        if (c.length === 0) {
          toast.success('No weak areas! You know this deck well.');
          return;
        }
      }
      setCards(c); setSelectedDeck(deck);
      setSwipeStack([...c].sort((a, b) => (b.memory_strength || 0) - (a.memory_strength || 0)));
      setHardCards([]); setEasyCount(0); setHardCount(0); setSessionXP(0);
      setScreen('study');
    } catch { toast.error('Failed to load cards'); } finally { setLoading(false); }
  };

  const loadQuiz = async (deck: Deck, hardOnly: boolean = false) => {
    setLoading(true);
    try {
      const res = await flashcardApi.deckCards(deck.id);
      let c: Card[] = res.data.cards || [];
      if (c.length === 0) {
        toast.error('Deck is empty'); return;
      }
      if (hardOnly) {
        c = c.filter(card => (card.memory_strength || 0) < 0.6);
        if (c.length === 0) {
          toast.success('No weak areas! You know this deck well.');
          return;
        }
      }
      if (c.length < 4) {
        toast.error('Need at least 4 cards to generate a quiz.');
        return;
      }
      setCards(c); setSelectedDeck(deck);
      setScreen('hard-quiz');
    } catch { toast.error('Failed to load quiz'); } finally { setLoading(false); }
  };

  const openViewCards = async (deck: Deck) => {
    setSelectedDeck(deck); setCardsLoading(true); setScreen('view-cards');
    try {
      const res = await flashcardApi.deckCards(deck.id);
      setDeckCards(res.data.cards || []);
    } catch { toast.error('Failed to load cards'); } finally { setCardsLoading(false); }
  };

  const deleteDeck = async (deck: Deck) => {
    if (confirmDeleteDeck !== deck.id) {
      setConfirmDeleteDeck(deck.id);
      setTimeout(() => setConfirmDeleteDeck(null), 3000);
      return;
    }
    setDeletingDeckId(deck.id);
    try { await flashcardApi.deleteDeck(deck.id); loadDecks(); } finally { setDeletingDeckId(null); setConfirmDeleteDeck(null); }
  };

  const handleSwipe = (dir: 'left' | 'right') => {
    const card = swipeStack[swipeStack.length - 1];
    const difficulty = dir === 'right' ? 'easy' : 'hard';
    if (dir === 'right') setEasyCount(e => e + 1);
    else { setHardCount(h => h + 1); setHardCards(prev => [...prev, card]); }

    const newStack = swipeStack.slice(0, -1);
    setSwipeStack(newStack);
    if (newStack.length === 0) {
      setFocusMode(false);
      setScreen('result');
    }

    flashcardApi.reviewCard(card.id, difficulty).then(res => {
      setSessionXP(prev => prev + (res.data.xp?.xpGained || 0));
    }).catch(() => {});
  };

  const saveCard = async (id: string, question: string, answer: string) => {
    await flashcardApi.updateCard(id, { question, answer });
    setDeckCards(prev => prev.map(c => c.id === id ? { ...c, question, answer } : c));
  };

  const deleteCard = async (id: string) => {
    await flashcardApi.deleteCard(id);
    setDeckCards(prev => prev.filter(c => c.id !== id));
    loadDecks();
  };

  const createDeck = async () => {
    const res = await flashcardApi.createDeck({ title: deckTitle });
    setSelectedDeck(res.data.deck); setScreen('create'); loadDecks();
  };

  const addCard = async () => {
    if (!selectedDeck || !cardQ.trim() || !cardA.trim()) return;
    await flashcardApi.createCard({ deck_id: selectedDeck.id, question: cardQ, answer: cardA });
    setCardQ(''); setCardA('');
    loadDecks();
    toast.success('Card added!');
    setAddingCard(false);
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 pt-10">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>My Flashcards</h1>
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Your card collection</p>
           </div>
           <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="btn-primary flex items-center gap-2 !px-6 !py-3">
             <Plus className="w-4 h-4" /> New Deck
           </button>
        </header>

        {!loading && dueCardsData.length > 0 && (
          <div className="card flex items-center justify-between p-8" style={{ backgroundColor: 'var(--brand-900)', borderColor: 'var(--brand-800)', boxShadow: '0 10px 30px -10px var(--brand-900)' }}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                <Clock3 className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Cards Due Today</h2>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-300)' }}>{dueCardsData.length} cards ready for review</p>
              </div>
            </div>
            <button onClick={startDueSession} className="btn-primary !bg-white !text-slate-900 border-none !px-8 flex items-center gap-2">
              Start Review <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {!loading && decks.length === 0 && (
          <div className="card text-center py-16 px-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>No decks yet</h2>
            <p className="text-sm font-medium mb-8 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>Create your first deck to start adding flashcards and building your knowledge.</p>
            <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="btn-primary !px-8 !py-4 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Your First Deck
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div key={deck.id} className="card group hover:border-brand-500/50 transition-all p-0 overflow-hidden shadow-lg hover:shadow-brand-500/5">
               <div className="h-24 p-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-muted)' }}>
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-brand-500 w-5 h-5" />
                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Deck</div>
                  </div>
                  <div className="flex gap-2">
                     <button title="View Cards" onClick={() => openViewCards(deck)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all border border-transparent hover:border-slate-300" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></button>
                     <button
                       title={confirmDeleteDeck === deck.id ? "Click again to confirm" : "Delete Deck"}
                       onClick={() => deleteDeck(deck)}
                       className={clsx("w-9 h-9 rounded-lg flex items-center justify-center transition-all border", confirmDeleteDeck === deck.id
                         ? "bg-red-500/20 border-red-500/50 text-red-500"
                         : "border-transparent hover:border-red-200 hover:bg-red-500/10 text-red-500/60")}
                       style={{}}
                     >
                       {deletingDeckId === deck.id ? (
                         <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                       ) : (
                         confirmDeleteDeck === deck.id ? <Sparkles className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />
                       )}
                     </button>
                  </div>
               </div>
               <div className="p-6">
                  <h3 className="text-xl font-black tracking-tight mb-1 uppercase" style={{ color: 'var(--text-primary)' }}>{deck.title}</h3>
                  <div className="flex items-center gap-3 mb-8" style={{ color: 'var(--text-muted)' }}>
                     <Layers3 className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{deck.card_count} cards</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                     <button onClick={() => loadDeckCards(deck)} className="btn-primary flex-1 text-[10px] py-3 uppercase tracking-widest">Study</button>
                     <button onClick={() => loadDeckCards(deck, true)} className="flex-1 text-[10px] py-3 uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl font-black transition-all">Practice More</button>
                  </div>
                  <button onClick={() => loadQuiz(deck, true)} className="w-full text-[10px] py-3 uppercase tracking-widest border border-brand-500/30 text-brand-500 hover:bg-brand-500/10 rounded-xl font-black transition-all">Quiz Mode</button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );

  // ── STUDY ─────────────────────────────────────────────────────────────────
  if (screen === 'study') return (
    <AppLayout>
      <div className={clsx("flex flex-col transition-all duration-700 pt-10", focusMode ? "fixed inset-0 z-[100] h-screen overflow-hidden" : "min-h-screen")}>
        {focusMode && <div className="absolute inset-0 z-0 focus-bg-animated" style={{ backgroundImage: 'url(/cafe_pixel_bg.png)', backgroundColor: 'rgba(0,0,0,0.6)', backgroundBlendMode: 'darken' }} />}
        <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center relative z-10">

          {/* Floating exit button - top right, always accessible */}
          <button onClick={() => { setFocusMode(false); setScreen('home'); }}
            className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-black uppercase tracking-widest text-[10px]"
            style={{
              borderColor: 'var(--border-primary)',
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              color: 'var(--text-muted)'
            }}>
            <X className="w-3.5 h-3.5" /> End Review
          </button>

          <div className="w-full mb-12 mt-8">
            <div className="flex items-center gap-8">
               <div className="flex gap-6 text-[11px] font-black tracking-widest uppercase items-center">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-danger, #ef4444)' }}><X className="w-4 h-4" /> {hardCount}</span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-success, #22c55e)' }}><Smile className="w-4 h-4" /> {easyCount}</span>
              </div>
              <button onClick={() => setFocusMode(!focusMode)} className={clsx("flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ml-auto")} style={{
                  borderColor: focusMode ? 'var(--brand-500)' : 'var(--border-primary)',
                  backgroundColor: focusMode ? 'var(--brand-500-alpha, rgba(220,123,30,0.1))' : 'transparent',
                  color: focusMode ? 'var(--brand-500)' : 'var(--text-muted)'
              }}>
                <Brain className="w-3.5 h-3.5" /> {focusMode ? "Exit Focus" : "Focus Mode"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-xl mb-16">
            <div className="flex justify-between items-end mb-3">
              <div className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>Progress</div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{swipeStack.length} cards left</div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden shadow-inner" style={{ backgroundColor: 'var(--bg-muted)' }}>
              <motion.div className="h-full bg-brand-500 shadow-[0_0_10px_rgba(220,123,30,0.3)]" initial={{ width: 0 }} animate={{ width: `${((cards.length - swipeStack.length) / cards.length) * 100}%` }} />
            </div>
          </div>

          <div className="relative w-full max-w-xl flex flex-col items-center" style={{ height: '520px' }}>
            {swipeStack.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1;
              const offset = arr.length - 1 - i;
              return (
                <motion.div key={card.id} style={{ position: 'absolute', width: '100%', zIndex: i }} animate={{ scale: 1 - offset * 0.05, y: offset * 20, opacity: 1 - offset * 0.4 }}>
                  <SwipeCard card={card} onSwipe={isTop ? handleSwipe : undefined} isTop={isTop} />
                </motion.div>
              );
            })}
          </div>

          {/* Keyboard hint */}
          <div className="mt-8 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Space to flip &nbsp;·&nbsp; Arrow keys to swipe
          </div>
        </div>
      </div>
    </AppLayout>
  );

  // ── RECALL ────────────────────────────────────────────────────────────────
  if (screen === 'recall') return (
     <AppLayout><div className="max-w-xl mx-auto py-10"><button onClick={() => setScreen('home')} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-80" style={{ color: 'var(--text-muted)' }}><ChevronLeft className="w-4 h-4" /> Back</button>{recallDeck && <RecallMode deck={recallDeck} onDone={() => setScreen('home')} />}</div></AppLayout>
  );

  // ── HARD QUIZ ─────────────────────────────────────────────────────────────
  if (screen === 'hard-quiz') return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-10">
        <button onClick={() => setScreen('home')} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Exit Quiz
        </button>
        <HardQuiz cards={cards} onDone={() => setScreen('home')} />
      </div>
    </AppLayout>
  );

  // ── VIEW CARDS ────────────────────────────────────────────────────────────
  if (screen === 'view-cards') return (
     <AppLayout><div className="max-w-3xl mx-auto space-y-10 py-10">
       <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}><ChevronLeft className="w-4 h-4" /> Back to My Flashcards</button>
       <div>
         <h1 className="text-3xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{selectedDeck?.title}</h1>
         <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{deckCards.length} cards in this deck</p>
       </div>
       {cardsLoading ? (
         <div className="space-y-4">
           {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}
         </div>
       ) : deckCards.length === 0 ? (
         <div className="card text-center py-12">
           <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>No cards in this deck yet.</p>
           <button onClick={() => setScreen('create')} className="btn-primary mt-4 !px-6 !py-3 inline-flex items-center gap-2">
             <Plus className="w-4 h-4" /> Add Cards
           </button>
         </div>
       ) : (
         <div className="grid gap-4">{deckCards.map(c => <CardRow key={c.id} card={c} onSave={saveCard} onDelete={deleteCard} />)}</div>
       )}
     </div></AppLayout>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === 'result') return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-24 text-center">
         <div className="flex justify-center mb-10">
            <div className="w-24 h-24 rounded-3xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-2xl">
               <Trophy className="w-10 h-10 text-brand-500" />
            </div>
         </div>
         <h1 className="text-5xl font-black uppercase tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Review Complete!</h1>
         <p className="text-lg font-medium mb-12" style={{ color: 'var(--text-muted)' }}>Great work. Here's how your session went.</p>
         <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-16">
            <div className="card" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
               <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-success, #22c55e)' }}>Got It</div>
               <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{easyCount}</div>
            </div>
            <div className="card" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
               <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-danger, #ef4444)' }}>Need Practice</div>
               <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{hardCount}</div>
            </div>
         </div>
         <div className="flex justify-center gap-4 flex-wrap">
            <button onClick={() => setScreen('home')} className="btn-ghost !px-8 !py-4 text-xs tracking-widest uppercase">My Flashcards</button>
            <button onClick={() => loadDeckCards(selectedDeck!)} className="btn-primary !px-8 !py-4 text-xs tracking-widest uppercase">Study Again</button>
            {hardCount > 0 && (
              <button onClick={() => loadQuiz(selectedDeck!, true)} className="btn-primary !px-8 !py-4 text-xs tracking-widest uppercase" style={{ backgroundColor: 'var(--color-danger, #ef4444)', borderColor: 'rgba(239, 68, 68, 0.4)' }}>Practice More</button>
            )}
         </div>
      </div>
    </AppLayout>
  );

  // ── CREATE ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
       <div className="max-w-2xl mx-auto space-y-10 py-10">
          <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}><ChevronLeft className="w-4 h-4" /> Back</button>
          <div className="card space-y-8 !p-10" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
             <div>
               <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{selectedDeck ? 'Add Cards' : 'Create New Deck'}</h2>
               <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                 {selectedDeck
                   ? `Add cards to "${selectedDeck.title}".`
                   : 'Give your deck a name to get started.'}
               </p>
             </div>

             {/* If we're creating a new deck, prompt for title */}
             {!selectedDeck ? (
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-faint)' }}>Deck Name</label>
                 <input value={deckTitle} onChange={e => setDeckTitle(e.target.value)} placeholder="e.g. Biology Chapter 5" className="input" onKeyDown={e => e.key === 'Enter' && deckTitle.trim() && createDeck()} />
                 <button onClick={createDeck} disabled={!deckTitle.trim()} className="btn-primary w-full py-4 tracking-widest uppercase text-xs mt-6">Create Deck</button>
               </div>
             ) : (
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-faint)' }}>Front (Question)</label>
                     <input value={cardQ} onChange={e => setCardQ(e.target.value)} placeholder="What do you want to be asked?" className="input" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-faint)' }}>Back (Answer)</label>
                     <input value={cardA} onChange={e => setCardA(e.target.value)} placeholder="The answer" className="input" onKeyDown={e => e.key === 'Enter' && cardQ.trim() && cardA.trim() && addCard()} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => { if (cardQ.trim() && cardA.trim()) { addCard(); setAddingCard(true); } }}
                      disabled={!cardQ.trim() || !cardA.trim()}
                      className="btn-primary flex-1 py-4 tracking-widest uppercase text-xs"
                    >
                      Add Card
                    </button>
                    <button onClick={() => setScreen('home')} className="btn-ghost !px-6 py-4 text-xs tracking-widest uppercase">
                      Done
                    </button>
                  </div>
               </div>
             )}
          </div>
       </div>
    </AppLayout>
  );
}
