'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import {
  BookOpen, Plus, ChevronLeft,
  Trash2, Eye, Brain,
  Clock3, Layers3, Frown, Smile, Trophy, ChevronRight, X
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
  const [deletingDeck, setDeletingDeck] = useState<string | null>(null);
  const [recallDeck, setRecallDeck] = useState<Deck | null>(null);

  const [deckTitle, setDeckTitle] = useState('');
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');

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
    if (!confirm(`Delete "${deck.title}"?`)) return;
    setDeletingDeck(deck.id);
    try { await flashcardApi.deleteDeck(deck.id); loadDecks(); } finally { setDeletingDeck(null); }
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
    if (!selectedDeck) return;
    const res = await flashcardApi.createCard({ deck_id: selectedDeck.id, question: cardQ, answer: cardA });
    setDeckCards(prev => [...prev, res.data.card]); setCardQ(''); setCardA(''); loadDecks();
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 pt-10">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Knowledge Decks</h1>
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Repository management</p>
           </div>
           <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="btn-primary flex items-center gap-2 !px-6 !py-3">
             <Plus className="w-4 h-4" /> Initialize Deck
           </button>
        </header>

        {!loading && dueCardsData.length > 0 && (
          <div className="card flex items-center justify-between p-8" style={{ backgroundColor: 'var(--brand-900)', borderColor: 'var(--brand-800)', boxShadow: '0 10px 30px -10px var(--brand-900)' }}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                <Clock3 className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">Scheduled Reviews</h2>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--brand-300)' }}>{dueCardsData.length} cards require attention</p>
              </div>
            </div>
            <button onClick={startDueSession} className="btn-primary !bg-white !text-slate-900 border-none !px-8 flex items-center gap-2">
              Start Session <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map(deck => (
            <div key={deck.id} className="card group hover:border-brand-500/50 transition-all p-0 overflow-hidden shadow-lg hover:shadow-brand-500/5">
               <div className="h-24 p-6 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-muted)' }}>
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-brand-500 w-5 h-5" />
                    <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Archived Node</div>
                  </div>
                  <div className="flex gap-2">
                     <button title="View Cards" onClick={() => openViewCards(deck)} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all border border-transparent hover:border-slate-300" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></button>
                     <button title="Delete Deck" onClick={() => deleteDeck(deck)} className="w-9 h-9 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-all border border-transparent hover:border-red-200" style={{ color: 'var(--text-muted)' }}><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="p-6">
                  <h3 className="text-xl font-black tracking-tight mb-1 uppercase" style={{ color: 'var(--text-primary)' }}>{deck.title}</h3>
                  <div className="flex items-center gap-3 mb-8" style={{ color: 'var(--text-muted)' }}>
                     <Layers3 className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{deck.card_count} Knowledge Nodes</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                     <button onClick={() => loadDeckCards(deck)} className="btn-primary flex-1 text-[10px] py-3 uppercase tracking-widest">Study All</button>
                     <button onClick={() => loadDeckCards(deck, true)} className="flex-1 text-[10px] py-3 uppercase tracking-widest border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-xl font-black transition-all">Weak Links</button>
                  </div>
                  <button onClick={() => loadQuiz(deck, true)} className="w-full text-[10px] py-3 uppercase tracking-widest border border-brand-500/30 text-brand-500 hover:bg-brand-500/10 rounded-xl font-black transition-all">Quiz Weak Links</button>
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
      <div className={clsx("flex flex-col transition-all duration-700 pt-10", focusMode ? "fixed inset-0 z-[100] h-screen overflow-hidden" : "min-h-screen")}
           style={focusMode ? { backgroundImage: 'url(/cafe_pixel_bg.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backgroundBlendMode: 'darken' } : {}}>
        <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center">
          
          <div className="w-full mb-12 flex items-center justify-between">
            <button onClick={() => { setFocusMode(false); setScreen('home'); }}
              className="flex items-center gap-2 transition-all font-black uppercase tracking-[0.2em] text-[10px]" style={{ color: 'var(--text-muted)' }}>
              <ChevronLeft className="w-3.5 h-3.5" /> Terminate Session
            </button>
            
            <div className="flex items-center gap-8">
               <div className="flex gap-6 text-[11px] font-black tracking-widest uppercase items-center">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-danger, #ef4444)' }}><X className="w-4 h-4" /> {hardCount}</span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--color-success, #22c55e)' }}><Smile className="w-4 h-4" /> {easyCount}</span>
              </div>
              <button onClick={() => setFocusMode(!focusMode)} className={clsx("flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest")} style={{
                  borderColor: focusMode ? 'var(--brand-500)' : 'var(--border-primary)',
                  backgroundColor: focusMode ? 'var(--brand-500-alpha, rgba(220,123,30,0.1))' : 'transparent',
                  color: focusMode ? 'var(--brand-500)' : 'var(--text-muted)'
              }}>
                <Brain className="w-3.5 h-3.5" /> {focusMode ? "Isolation On" : "Isolation Mode"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-xl mb-16">
            <div className="flex justify-between items-end mb-3">
              <div className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>Knowledge Propagation</div>
              <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{swipeStack.length} nodes remaining</div>
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
        </div>
      </div>
    </AppLayout>
  );

  // ── RECALL ────────────────────────────────────────────────────────────────
  if (screen === 'recall') return (
     <AppLayout><div className="max-w-xl mx-auto py-10"><button onClick={() => setScreen('home')} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:opacity-80" style={{ color: 'var(--text-muted)' }}><ChevronLeft className="w-4 h-4" /> Cancel Vectoring</button>{recallDeck && <RecallMode deck={recallDeck} onDone={() => setScreen('home')} />}</div></AppLayout>
  );

  // ── HARD QUIZ ─────────────────────────────────────────────────────────────
  if (screen === 'hard-quiz') return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-10">
        <button onClick={() => setScreen('home')} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
          <ChevronLeft className="w-4 h-4" /> Cancel Quiz
        </button>
        <HardQuiz cards={cards} onDone={() => setScreen('home')} />
      </div>
    </AppLayout>
  );

  // ── VIEW CARDS ────────────────────────────────────────────────────────────
  if (screen === 'view-cards') return (
     <AppLayout><div className="max-w-3xl mx-auto space-y-10 py-10"><button onClick={() => setScreen('home')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:opacity-80" style={{ color: 'var(--text-muted)' }}><ChevronLeft className="w-4 h-4" /> Back to Repository</button><div><h1 className="text-3xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>{selectedDeck?.title}</h1><p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Database entry verification</p></div><div className="grid gap-4">{deckCards.map(c => <CardRow key={c.id} card={c} onSave={saveCard} onDelete={deleteCard} />)}</div></div></AppLayout>
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
         <h1 className="text-5xl font-black uppercase tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>Session Summarized</h1>
         <p className="text-lg font-medium mb-12" style={{ color: 'var(--text-muted)' }}>Performance analysis for this learning cycle.</p>
         <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-16">
            <div className="card" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
               <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-success, #22c55e)' }}>Validated</div>
               <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{easyCount}</div>
            </div>
            <div className="card" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
               <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-danger, #ef4444)' }}>Requires Review</div>
               <div className="text-4xl font-black" style={{ color: 'var(--text-primary)' }}>{hardCount}</div>
            </div>
         </div>
         <div className="flex justify-center gap-6">
            <button onClick={() => setScreen('home')} className="btn-ghost !px-12 !py-4 text-xs tracking-widest uppercase">Repository</button>
            <button onClick={() => loadDeckCards(selectedDeck!)} className="btn-primary !px-12 !py-4 text-xs tracking-widest uppercase">Re-iterate</button>
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
               <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Module Addition</h2>
               <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Add new knowledge nodes to {selectedDeck?.title || 'System Repository'}.</p>
             </div>
             
             {/* If we're creating a new deck, prompt for title */}
             {!selectedDeck ? (
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-faint)' }}>Repository Title</label>
                 <input value={deckTitle} onChange={e => setDeckTitle(e.target.value)} placeholder="E.g. Advanced AI Concepts" className="input" />
                 <button onClick={createDeck} className="btn-primary w-full py-4 tracking-widest uppercase text-xs mt-6">Initialize Repository</button>
               </div>
             ) : (
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-faint)' }}>Query</label>
                     <input value={cardQ} onChange={e => setCardQ(e.target.value)} placeholder="Enter knowledge query..." className="input" />
                  </div>
                  <div>
                     <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--text-faint)' }}>Solution</label>
                     <input value={cardA} onChange={e => setCardA(e.target.value)} placeholder="Enter solution vector..." className="input" onKeyDown={e => e.key === 'Enter' && addCard()} />
                  </div>
                  <button onClick={addCard} className="btn-primary w-full py-4 tracking-widest uppercase text-xs mt-4">Commit Card</button>
               </div>
             )}
          </div>
       </div>
    </AppLayout>
  );
}
