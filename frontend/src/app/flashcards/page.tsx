'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi } from '@/lib/api';
import {
  BookOpen, Plus, X, ChevronLeft, Sparkles, Zap, RotateCcw,
  Upload, FileText, Pencil, Trash2, Check, Eye, Share2, Brain, ScanSearch,
  ArrowRight, Clock3, Layers3, Flame
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useSFX } from '@/lib/useSFX';
import { clsx } from 'clsx';

interface Card { id: string; question: string; answer: string; memory_strength: number; }
interface Deck { id: string; title: string; card_count: number; is_public?: boolean; share_token?: string; }
type Screen = 'home' | 'study' | 'create' | 'result' | 'view-cards' | 'hard-quiz' | 'recall';

// ─── Swipe Card ───────────────────────────────────────────────────────────────
function SwipeCard({ card, onSwipe, isTop }: {
  card: Card; onSwipe?: (dir: 'left' | 'right') => void; isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1.02, 0.95]);
  const hardOpacity = useTransform(x, [-120, -30, 0], [1, 0, 0]);
  const easyOpacity = useTransform(x, [0, 30, 120], [0, 0, 1]);
  const controls = useAnimation();
  const [flipped, setFlipped] = useState(false);
  const { playSfx } = useSFX();

  const handleDragEnd = async (_: any, info: any) => {
    const swipeThreshold = 80;
    const velocityThreshold = 300;
    const shouldSwipeLeft = info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold;
    const shouldSwipeRight = info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold;

    if (shouldSwipeLeft) {
      playSfx('pop');
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.25 } });
      onSwipe?.('left');
    } else if (shouldSwipeRight) {
      playSfx('success');
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.25 } });
      onSwipe?.('right');
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 18, mass: 0.8 } });
    }
  };

  const triggerSwipe = async (dir: 'left' | 'right') => {
    playSfx(dir === 'right' ? 'success' : 'pop');
    await controls.start({ x: dir === 'left' ? -600 : 600, opacity: 0, transition: { duration: 0.25 } });
    onSwipe?.(dir);
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, scale, position: 'absolute', width: '100%' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={controls}
      className={isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
      whileTap={isTop ? { cursor: 'grabbing' } : undefined}
    >
      {isTop && (
        <>
          <motion.div
            className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 font-extrabold text-lg rotate-[-12deg]"
            style={{ borderColor: '#ef4444', color: '#ef4444', opacity: hardOpacity as any }}>
            HARD 😰
          </motion.div>
          <motion.div
            className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 font-extrabold text-lg rotate-[12deg]"
            style={{ borderColor: '#22c55e', color: '#22c55e', opacity: easyOpacity as any }}>
            EASY 😊
          </motion.div>
        </>
      )}
      <div className="flashcard-container select-none" style={{ height: '360px' }}
        onClick={() => { if (isTop) { playSfx('flip'); setFlipped(f => !f); } }}>
        <div className={`flashcard-inner w-full h-full ${flipped ? 'flipped' : ''}`}>
          <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ borderColor: 'var(--border-brand)', background: 'var(--gradient-card)' }}>
            <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--brand-400)', opacity: 0.6 }}>Question</div>
            <p className="text-xl font-bold px-6 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{card.question}</p>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Tap to flip · Drag to rate</div>
          </div>
          <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'var(--gradient-card)' }}>
            <div className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#22c55e', opacity: 0.6 }}>Answer</div>
            <p className="text-xl font-bold px-6 leading-relaxed" style={{ color: '#22c55e' }}>{card.answer}</p>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>← Hard · Easy →</div>
          </div>
        </div>
      </div>
      {isTop && (
        <div className="flex justify-center gap-6 mt-5">
          <button onClick={() => triggerSwipe('left')}
            className="w-14 h-14 rounded-full border-2 text-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            😰
          </button>
          <button onClick={() => { playSfx('flip'); setFlipped(f => !f); }}
            className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-muted)', color: 'var(--text-faint)' }}>
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => triggerSwipe('right')}
            className="w-14 h-14 rounded-full border-2 text-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ borderColor: 'rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
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

// ─── Hard Quiz ────────────────────────────────────────────────────────────────
function HardQuiz({ cards, onDone }: { cards: Card[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [options] = useState(() => cards.map(card => {
    const otherAnswers = Array.from(new Set(
      cards.filter(c => c.id !== card.id && c.answer !== card.answer).map(c => c.answer)
    ));
    const wrong = otherAnswers.sort(() => Math.random() - 0.5).slice(0, 3);
    return [...wrong, card.answer].sort(() => Math.random() - 0.5);
  }));

  const card = cards[idx];
  const next = () => {
    if (idx + 1 >= cards.length) { setFinished(true); return; }
    setIdx(i => i + 1);
    setSelected(null);
    setConfirmed(false);
  };

  if (finished) return (
    <div className="text-center space-y-4 py-6">
      <div className="text-5xl">{score === cards.length ? '🎉' : score >= cards.length / 2 ? '👍' : '💪'}</div>
      <h3 className="text-2xl font-extrabold">Quiz Complete!</h3>
      <div className="card">
        <div className="text-3xl font-bold text-brand-400">{score}/{cards.length}</div>
        <div className="text-slate-400 text-sm mt-1">correct on your hard cards</div>
      </div>
      <button onClick={onDone} className="btn-primary px-10">Done</button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-red-400 font-bold">😰 Hard card quiz</span>
        <span className="text-slate-400">{idx + 1} / {cards.length}</span>
      </div>
      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-red-500 transition-all"
          style={{ width: `${(idx / cards.length) * 100}%` }} />
      </div>
      <div className="card border-red-500/20 bg-red-500/5 text-center py-6 px-4">
        <p className="font-bold text-lg">{card.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {options[idx]?.map((opt) => {
          let cls = `border border-slate-700 hover:bg-slate-700/50 rounded-xl p-3 text-sm font-medium text-left transition-all`;
          if (confirmed) {
            if (opt === card.answer) cls = 'border border-green-500 bg-green-500/20 text-green-400 rounded-xl p-3 text-sm font-medium text-left';
            else if (opt === selected) cls = 'border border-red-500 bg-red-500/20 text-red-400 rounded-xl p-3 text-sm font-medium text-left opacity-60';
            else cls = 'border border-surface-border text-slate-600 rounded-xl p-3 text-sm font-medium text-left opacity-30';
          }
          return (
            <button key={opt} onClick={() => { if (!confirmed) { setSelected(opt); setConfirmed(true); if (opt === card.answer) setScore(s => s + 1); } }} disabled={confirmed} className={cls}>
              {opt}
            </button>
          );
        })}
      </div>
      {confirmed && (
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-3">
          <div className={`font-bold ${selected === card.answer ? 'text-green-400' : 'text-red-400'}`}>
            {selected === card.answer ? '✅ Correct!' : `❌ Answer: ${card.answer}`}
          </div>
          <button onClick={next} className="btn-primary px-8">
            {idx + 1 >= cards.length ? 'Finish →' : 'Next →'}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── Free Recall Mode ─────────────────────────────────────────────────────────
function RecallMode({ deck, onDone }: {
  deck: Deck;
  onDone: (generatedCards: Card[]) => void;
}) {
  const [phase, setPhase] = useState<'upload' | 'recall' | 'generating' | 'done'>('upload');
  const [materialText, setMaterialText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [recall, setRecall] = useState('');
  const [gapResults, setGapResults] = useState<{ question: string; answer: string; source: string; }[]>([]);
  const [savedCards, setSavedCards] = useState<Card[]>([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfFile(f);
    setPdfLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', f);
      formData.append('question', 'Extract all text content.');
      const res = await homeworkApi.askPdf(formData);
      setMaterialText(res.data.answer || '');
    } catch { toast.error('Failed to read PDF'); } finally { setPdfLoading(false); }
  };

  const startRecall = () => {
    setPhase('recall');
    setTimeLeft(120);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const submit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('generating');
    try {
      const prompt = `Find gaps in this recall: ${recall}\nBased on: ${materialText}\nReturn JSON array: [{"question":"", "answer":"", "source":""}]`;
      const res = await homeworkApi.ask({ question: prompt });
      const clean = (res.data.answer || '[]').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setGapResults(parsed);
      const saved: Card[] = [];
      for (const gap of parsed) {
        const r = await flashcardApi.createCard({ deck_id: deck.id, question: gap.question, answer: gap.answer });
        saved.push(r.data.card);
      }
      setSavedCards(saved);
      setPhase('done');
    } catch { setPhase('recall'); }
  };

  if (phase === 'upload') return (
    <div className="card space-y-4">
      <h2 className="text-xl font-bold">1. Study Material</h2>
      <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
      <button onClick={() => pdfRef.current?.click()} className="btn-ghost w-full py-8 border-dashed">
        {pdfLoading ? 'Loading...' : pdfFile ? pdfFile.name : 'Upload PDF'}
      </button>
      <textarea value={materialText} onChange={e => setMaterialText(e.target.value)} className="input min-h-[100px]" placeholder="Or paste notes..." />
      <button onClick={startRecall} disabled={!materialText.trim()} className="btn-primary w-full">Start Recall</button>
    </div>
  );

  if (phase === 'recall') return (
    <div className="space-y-4 text-center">
      <div className="text-3xl font-mono font-bold">{Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
      <textarea value={recall} onChange={e => setRecall(e.target.value)} className="input min-h-[300px]" placeholder="Write everything you remember..." />
      <button onClick={submit} className="btn-primary w-full">Submit Recall</button>
    </div>
  );

  if (phase === 'generating') return <div className="text-center py-20 font-bold">Analyzing gaps...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Results</h2>
      {gapResults.map((gap, i) => (
        <div key={i} className="card border-red-500/20">
          <div className="font-bold">{gap.question}</div>
          <div className="text-green-400">{gap.answer}</div>
          {gap.source && <div className="text-xs italic text-slate-500 mt-1">"{gap.source}"</div>}
        </div>
      ))}
      <button onClick={() => onDone(savedCards)} className="btn-primary w-full">Done</button>
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
  const [dueCardsData, setDueCardsData] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState<string | null>(null);
  const [recallDeck, setRecallDeck] = useState<Deck | null>(null);

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
  const [genCount, setGenCount] = useState(0); 
  const pdfRef = useRef<HTMLInputElement>(null);

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
    setSwipeStack([...dueCardsData].sort(() => Math.random() - 0.5));
    setHardCards([]); setEasyCount(0); setHardCount(0); setSessionXP(0);
    setScreen('study');
  };

  const loadDeckCards = async (deck: Deck) => {
    setLoading(true);
    try {
      const res = await flashcardApi.deckCards(deck.id);
      const c = res.data.cards || [];
      if (c.length === 0) {
        setSelectedDeck(deck); setScreen('create');
        return;
      }
      setCards(c); setSelectedDeck(deck);
      setSwipeStack([...c].sort(() => Math.random() - 0.5));
      setHardCards([]); setEasyCount(0); setHardCount(0); setSessionXP(0);
      setScreen('study');
    } catch { toast.error('Failed to load cards'); } finally { setLoading(false); }
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

  const handleShare = async (deck: Deck) => {
    try {
      const res = await flashcardApi.shareDeck(deck.id);
      await navigator.clipboard.writeText(`${window.location.origin}/study/${res.data.token}`);
      toast.success('Link copied!');
    } catch { toast.error('Failed to share'); }
  };

  const exportToQuizlet = (deck: Deck) => {
    flashcardApi.deckCards(deck.id).then(res => {
      const content = (res.data.cards || []).map((card: Card) => `${card.question}\t${card.answer}`).join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${deck.title}_quizlet.txt`;
      a.click();
    });
  };

  const importFromQuizlet = async (e: React.ChangeEvent<HTMLInputElement>, deck: Deck) => {
    const text = await e.target.files?.[0]?.text();
    if (!text) return;
    const pairs = text.split('\n').map(l => l.split('\t')).filter(p => p.length >= 2);
    for (const p of pairs) await flashcardApi.createCard({ deck_id: deck.id, question: p[0], answer: p[1] });
    loadDecks();
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

  const generateFromNotes = async () => {
    setGenerating(true);
    const res = await flashcardApi.generateFromNotes({ deck_id: selectedDeck!.id, notes: genNotes, count: genCount });
    setGeneratedCards(res.data.cards || []); setGenerating(false); loadDecks();
  };

  const generateFromPdf = async () => {
    setGeneratingPdf(true); setPdfProgress('Processing...');
    const formData = new FormData();
    formData.append('pdf', pdfFile!);
    formData.append('deck_id', selectedDeck!.id);
    const res = await flashcardApi.generateFromPdf(formData);
    setPdfCards(res.data.cards || []); setGeneratingPdf(false); loadDecks();
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (screen === 'home') return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8 pt-6">
        <header>
           <h1 className="text-4xl font-black tracking-tight mb-2">Flashcard Decks</h1>
           <p className="text-slate-500 font-medium">Capture your knowledge, master your recall.</p>
        </header>

        {!loading && dueCardsData.length > 0 && (
          <div className="card border-brand-500/30 flex items-center justify-between p-6 bg-gradient-to-r from-brand-500/10 to-transparent">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2"><Clock3 className="text-orange-500" /> Due Today</h2>
              <p className="text-sm text-slate-500">{dueCardsData.length} cards need review.</p>
            </div>
            <button onClick={startDueSession} className="btn-primary">Review Now →</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="card border-dashed border-slate-700 flex flex-col items-center justify-center py-12 hover:border-brand-500 transition-all group">
            <Plus className="w-8 h-8 text-slate-700 group-hover:text-brand-500 mb-2" />
            <span className="font-bold text-slate-600 group-hover:text-brand-500">Create New Deck</span>
          </button>
          {decks.map(deck => (
            <div key={deck.id} className="card group hover:border-brand-500/50 transition-all p-0 overflow-hidden">
               <div className="h-20 bg-slate-800 p-5 flex items-center justify-between">
                  <BookOpen className="text-brand-400 w-6 h-6" />
                  <div className="flex gap-2">
                     <button onClick={() => openViewCards(deck)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"><Eye className="w-4 h-4" /></button>
                     <button onClick={() => deleteDeck(deck)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="p-5">
                  <h3 className="text-xl font-black mb-1">{deck.title}</h3>
                  <p className="text-sm text-slate-500 mb-6">{deck.card_count} cards</p>
                  <button onClick={() => loadDeckCards(deck)} className="btn-primary w-full text-sm">Study Now →</button>
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
      <div className={clsx("min-h-screen flex flex-col transition-all duration-700", focusMode ? "bg-slate-950 pt-10" : "pt-6")}>
        <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center">
          
          <div className="w-full mb-12 flex items-center justify-between">
            <button onClick={() => { setFocusMode(false); setScreen('home'); }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-all font-bold uppercase tracking-widest text-xs">
              <ChevronLeft className="w-4 h-4" /> Exit Session
            </button>
            
            <div className="flex items-center gap-6">
               <div className="flex gap-4 text-xs font-black tracking-widest">
                <span className="text-red-400">😰 {hardCount}</span>
                <span className="text-green-400">😊 {easyCount}</span>
              </div>
              <button onClick={() => setFocusMode(!focusMode)} className={clsx("flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-[0.2em]", focusMode ? "border-brand-500/50 bg-brand-500/10 text-brand-400" : "border-slate-700 text-slate-400")}>
                <Brain className="w-3.5 h-3.5" /> {focusMode ? "Focus Active" : "Focus Mode"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-xl mb-12">
            <div className="flex justify-between items-end mb-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Session Mastery</div>
              <div className="text-xs font-black text-slate-400">{swipeStack.length} cards remaining</div>
            </div>
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div className="h-full bg-brand-500" initial={{ width: 0 }} animate={{ width: `${((cards.length - swipeStack.length) / cards.length) * 100}%` }} />
            </div>
          </div>

          <div className="relative w-full max-w-xl flex flex-col items-center" style={{ height: '520px' }}>
            {swipeStack.slice(-3).map((card, i, arr) => {
              const isTop = i === arr.length - 1;
              const offset = arr.length - 1 - i;
              return (
                <motion.div key={card.id} style={{ position: 'absolute', width: '100%', zIndex: i }} animate={{ scale: 1 - offset * 0.05, y: offset * 16, opacity: 1 - offset * 0.3 }}>
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
     <AppLayout><div className="max-w-xl mx-auto"><button onClick={() => setScreen('home')} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4" /> Back</button>{recallDeck && <RecallMode deck={recallDeck} onDone={() => setScreen('home')} />}</div></AppLayout>
  );

  // ── VIEW CARDS ────────────────────────────────────────────────────────────
  if (screen === 'view-cards') return (
     <AppLayout><div className="max-w-2xl mx-auto space-y-6"><button onClick={() => setScreen('home')} className="flex items-center gap-2 text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4" /> Back</button><h1 className="text-2xl font-black">{selectedDeck?.title}</h1>{deckCards.map(c => <CardRow key={c.id} card={c} onSave={saveCard} onDelete={deleteCard} />)}</div></AppLayout>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === 'result') return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-20 text-center">
         <div className="text-6xl mb-6">{easyCount > hardCount ? '✨' : '🔥'}</div>
         <h1 className="text-5xl font-black mb-4">Round Finished</h1>
         <p className="text-slate-500 mb-12">You mastered {easyCount} concepts. Keep going.</p>
         <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-12">
            <div className="card border-green-500/30 bg-green-500/5"><div className="text-3xl font-black text-green-400">{easyCount}</div>Easy</div>
            <div className="card border-red-500/30 bg-red-500/5"><div className="text-3xl font-black text-red-400">{hardCount}</div>Hard</div>
         </div>
         <div className="flex justify-center gap-4">
            <button onClick={() => setScreen('home')} className="btn-ghost px-8">All Decks</button>
            <button onClick={() => loadDeckCards(selectedDeck!)} className="btn-primary px-8">Study Again</button>
         </div>
      </div>
    </AppLayout>
  );

  // ── CREATE ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
       <div className="max-w-2xl mx-auto space-y-6">
          <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-slate-400 hover:text-white"><ChevronLeft className="w-4 h-4" /> Back</button>
          <div className="card space-y-4">
             <h2 className="text-xl font-bold">Add to {selectedDeck?.title || 'New Deck'}</h2>
             <input value={cardQ} onChange={e => setCardQ(e.target.value)} placeholder="Question" className="input" />
             <input value={cardA} onChange={e => setCardA(e.target.value)} placeholder="Answer" className="input" />
             <button onClick={addCard} className="btn-primary w-full">Add Card</button>
          </div>
       </div>
    </AppLayout>
  );
}
