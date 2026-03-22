'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import {
  BookOpen, Plus, X, ChevronLeft, Sparkles, Zap, RotateCcw,
  Upload, FileText, Pencil, Trash2, Check, Eye, Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';

interface Card { id: string; question: string; answer: string; memory_strength: number; }
interface Deck { id: string; title: string; card_count: number; is_public?: boolean; share_token?: string; }
type Screen = 'home' | 'study' | 'create' | 'result' | 'view-cards' | 'hard-review';

// ─── Swipe Card ───────────────────────────────────────────────────────────────
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
      <div className="flashcard-container select-none" style={{ height: '320px' }}
        onClick={() => isTop && setFlipped(f => !f)}>
        <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4 border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="text-xs text-brand-400/60 uppercase tracking-widest font-semibold">Question</div>
            <p className="text-xl font-bold px-6 leading-relaxed">{card.question}</p>
            <div className="text-xs text-slate-600">Tap to flip · Drag to rate</div>
          </div>
          <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4 border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <div className="text-xs text-green-400/60 uppercase tracking-widest font-semibold">Answer</div>
            <p className="text-xl font-bold text-green-300 px-6 leading-relaxed">{card.answer}</p>
            <div className="text-xs text-slate-600">← Hard · Easy →</div>
          </div>
        </div>
      </div>
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

// ─── Editable Card Row ────────────────────────────────────────────────────────
function CardRow({ card, onSave, onDelete }: {
  card: Card;
  onSave: (id: string, q: string, a: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [q, setQ] = useState(card.question);
  const [a, setA] = useState(card.answer);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!q.trim() || !a.trim()) return;
    setSaving(true);
    await onSave(card.id, q, a);
    setEditing(false);
    setSaving(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`card !p-4 space-y-2 ${editing ? 'border-brand-500/40' : ''}`}>
      {editing ? (
        <>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Question</label>
            <input value={q} onChange={e => setQ(e.target.value)} className="input text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Answer</label>
            <input value={a} onChange={e => setA(e.target.value)} className="input text-sm"
              onKeyDown={e => e.key === 'Enter' && save()} />
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-all disabled:opacity-50">
              <Check className="w-3 h-3" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setQ(card.question); setA(card.answer); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted border border-surface-border text-slate-400 text-xs font-medium hover:text-white transition-all">
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{card.question}</div>
            <div className="text-sm text-slate-400 mt-1">{card.answer}</div>
            <div className="mt-2">
              <div className="h-1 w-20 bg-surface-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                  style={{ width: `${(card.memory_strength || 0) * 100}%` }} />
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 flex-shrink-0">
            <button onClick={() => setEditing(true)}
              className="w-7 h-7 rounded-lg bg-surface-muted hover:bg-brand-500/20 border border-surface-border hover:border-brand-500/40 text-slate-500 hover:text-brand-400 flex items-center justify-center transition-all">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(card.id)}
              className="w-7 h-7 rounded-lg bg-surface-muted hover:bg-red-500/20 border border-surface-border hover:border-red-500/40 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Hard Card Review ─────────────────────────────────────────────────────────
function HardCardReview({ cards, onDone }: { cards: Card[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  if (cards.length === 0) return null;
  const card = cards[idx];
  const isLast = idx === cards.length - 1;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-red-400 font-bold">😰 Hard cards</span>
        <span className="text-slate-400">{idx + 1} / {cards.length}</span>
      </div>
      <div className="flashcard-container select-none cursor-pointer" style={{ height: '240px' }}
        onClick={() => setFlipped(f => !f)}>
        <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-3 border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
            <div className="text-xs text-red-400/60 uppercase tracking-widest font-semibold">Question</div>
            <p className="text-lg font-bold px-4 leading-relaxed">{card.question}</p>
            <div className="text-xs text-slate-600">Tap to reveal</div>
          </div>
          <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-3 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <div className="text-xs text-green-400/60 uppercase tracking-widest font-semibold">Answer</div>
            <p className="text-lg font-bold text-green-300 px-4 leading-relaxed">{card.answer}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        {isLast
          ? <button onClick={onDone} className="btn-primary px-8">Done ✓</button>
          : <button onClick={() => { setIdx(i => i + 1); setFlipped(false); }} className="btn-primary px-8">Next →</button>
        }
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState<string | null>(null);

  // Create
  const [deckTitle, setDeckTitle] = useState('');
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Card[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');
  const [pdfCards, setPdfCards] = useState<Card[]>([]);
  const pdfRef = useRef<HTMLInputElement>(null);

  // Study
  const [swipeStack, setSwipeStack] = useState<Card[]>([]);
  const [hardCards, setHardCards] = useState<Card[]>([]);
  const [easyCount, setEasyCount] = useState(0);
  const [hardCount, setHardCount] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);

  useEffect(() => { loadDecks(); }, []);

  const loadDecks = async () => {
    setLoading(true);
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
      if (c.length === 0) {
        toast('No cards in this deck yet!');
        setSelectedDeck(deck);
        setGeneratedCards([]);
        setPdfCards([]);
        setScreen('create');
        setLoading(false);
        return;
      }
      setCards(c);
      setSelectedDeck(deck);
      const shuffled = [...c].sort(() => Math.random() - 0.5);
      setSwipeStack(shuffled);
      setHardCards([]);
      setEasyCount(0);
      setHardCount(0);
      setSessionXP(0);
      setScreen('study');
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  };

  const openViewCards = async (deck: Deck) => {
    setSelectedDeck(deck);
    setCardsLoading(true);
    setScreen('view-cards');
    try {
      const res = await flashcardApi.deckCards(deck.id);
      setDeckCards(res.data.cards || []);
    } catch { toast.error('Failed to load cards'); }
    finally { setCardsLoading(false); }
  };

  const deleteDeck = async (deck: Deck) => {
    if (!confirm(`Delete "${deck.title}" and all its cards? This cannot be undone.`)) return;
    setDeletingDeck(deck.id);
    try {
      await flashcardApi.deleteDeck(deck.id);
      toast.success('Deck deleted');
      loadDecks();
    } catch { toast.error('Failed to delete deck'); }
    finally { setDeletingDeck(null); }
  };

  const handleShare = async (deck: Deck) => {
    try {
      const res = await flashcardApi.shareDeck(deck.id);
      const url = `${window.location.origin}/study/${res.data.token}`;
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied! 🔗');
    } catch { toast.error('Failed to share deck'); }
  };

  const handleSwipe = async (dir: 'left' | 'right') => {
    const card = swipeStack[swipeStack.length - 1];
    const difficulty = dir === 'right' ? 'easy' : 'hard';
    if (dir === 'right') setEasyCount(e => e + 1);
    else { setHardCount(h => h + 1); setHardCards(prev => [...prev, card]); }
    try {
      const res = await flashcardApi.reviewCard(card.id, difficulty);
      setSessionXP(prev => prev + (res.data.xp?.xpGained || 0));
    } catch {}
    const newStack = swipeStack.slice(0, -1);
    setSwipeStack(newStack);
    if (newStack.length === 0) setScreen('result');
  };

  const saveCard = async (id: string, question: string, answer: string) => {
    try {
      await flashcardApi.updateCard(id, { question, answer });
      setDeckCards(prev => prev.map(c => c.id === id ? { ...c, question, answer } : c));
      setGeneratedCards(prev => prev.map(c => c.id === id ? { ...c, question, answer } : c));
      setPdfCards(prev => prev.map(c => c.id === id ? { ...c, question, answer } : c));
      toast.success('Card updated!');
    } catch { toast.error('Failed to update card'); }
  };

  const deleteCard = async (id: string) => {
    try {
      await flashcardApi.deleteCard(id);
      setDeckCards(prev => prev.filter(c => c.id !== id));
      setGeneratedCards(prev => prev.filter(c => c.id !== id));
      setPdfCards(prev => prev.filter(c => c.id !== id));
      toast.success('Card deleted');
      loadDecks();
    } catch { toast.error('Failed to delete card'); }
  };

  const createDeck = async () => {
    if (!deckTitle.trim()) return;
    try {
      const res = await flashcardApi.createDeck({ title: deckTitle });
      toast.success('Deck created!');
      setDeckTitle('');
      setSelectedDeck(res.data.deck);
      setGeneratedCards([]);
      setPdfCards([]);
      loadDecks();
    } catch { toast.error('Failed to create deck'); }
  };

  const addCard = async () => {
    if (!selectedDeck || !cardQ.trim() || !cardA.trim()) return;
    try {
      const res = await flashcardApi.createCard({ deck_id: selectedDeck.id, question: cardQ, answer: cardA });
      toast.success('Card added!');
      setCardQ(''); setCardA('');
      setDeckCards(prev => [...prev, res.data.card]);
      loadDecks();
    } catch { toast.error('Failed to add card'); }
  };

  const generateFromNotes = async () => {
    if (!selectedDeck || !genNotes.trim()) return;
    setGenerating(true);
    setGeneratedCards([]);
    try {
      const res = await flashcardApi.generateFromNotes({ deck_id: selectedDeck.id, notes: genNotes, count: 10 });
      setGeneratedCards(res.data.cards || []);
      toast.success(`Generated ${res.data.generated} cards!`);
      setGenNotes('');
      loadDecks();
    } catch { toast.error('Failed to generate'); }
    finally { setGenerating(false); }
  };

  const handlePdfFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') return toast.error('Only PDF files supported');
    if (f.size > 10 * 1024 * 1024) return toast.error('Max 10MB');
    setPdfFile(f);
    setPdfCards([]);
    toast.success(`${f.name} ready!`);
  };

  const generateFromPdf = async () => {
    if (!selectedDeck || !pdfFile) return;
    setGeneratingPdf(true);
    setPdfCards([]);
    setPdfProgress('Reading PDF...');
    try {
      await new Promise(r => setTimeout(r, 500));
      setPdfProgress('Extracting text...');
      await new Promise(r => setTimeout(r, 500));
      setPdfProgress('AI generating cards...');
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('deck_id', selectedDeck.id);
      formData.append('count', '10');
      const res = await flashcardApi.generateFromPdf(formData);
      setPdfProgress('');
      setPdfCards(res.data.cards || []);
      toast.success(`Generated ${res.data.generated} cards from PDF!`);
      setPdfFile(null);
      if (pdfRef.current) pdfRef.current.value = '';
      loadDecks();
    } catch { toast.error('Failed to generate from PDF'); setPdfProgress(''); }
    finally { setGeneratingPdf(false); }
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
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
          <button onClick={() => { setSelectedDeck(null); setGeneratedCards([]); setPdfCards([]); setScreen('create'); }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Deck
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-40" />)}
          </div>
        ) : decks.length === 0 ? (
          <div className="text-center py-20 card border-dashed">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <h2 className="text-xl font-bold mb-2">No decks yet</h2>
            <p className="text-slate-500 mb-6">Create your first deck to get started!</p>
            <button onClick={() => { setSelectedDeck(null); setScreen('create'); }}
              className="btn-primary flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Create First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {decks.map((deck, i) => (
              <motion.div key={deck.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card hover:border-brand-500/40 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openViewCards(deck)}
                      className="text-xs text-slate-500 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-brand-500/10 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button onClick={() => { setSelectedDeck(deck); setGeneratedCards([]); setPdfCards([]); setScreen('create'); }
