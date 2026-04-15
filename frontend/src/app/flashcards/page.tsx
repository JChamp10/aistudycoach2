'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi } from '@/lib/api';
import {
  BookOpen, Plus, X, ChevronLeft, Sparkles, Zap, RotateCcw,
  Upload, FileText, Pencil, Trash2, Check, Eye, Share2, Brain, ScanSearch,
  ArrowRight, Clock3, Layers3, Flame, Frown, Smile, Trophy, Play, CheckCircle2, ChevronRight
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
            className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-widest rotate-[-12deg]"
            style={{ borderColor: '#ef4444', color: '#ef4444', opacity: hardOpacity as any }}>
            Hard
          </motion.div>
          <motion.div
            className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-widest rotate-[12deg]"
            style={{ borderColor: '#22c55e', color: '#22c55e', opacity: easyOpacity as any }}>
            Easy
          </motion.div>
        </>
      )}
      <div className="flashcard-container select-none" style={{ height: '360px' }}
        onClick={() => { if (isTop) { playSfx('flip'); setFlipped(f => !f); } }}>
        <div className={clsx("flashcard-inner w-full h-full", flipped && "flipped")}>
          <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ borderColor: 'var(--border-brand)', background: 'var(--gradient-card)' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: 'var(--text-faint)' }}>Question</div>
            <p className="text-xl font-black px-8 leading-relaxed text-slate-900 dark:text-white" style={{ color: 'var(--text-primary)' }}>{card.question}</p>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Interaction required</div>
          </div>
          <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'var(--gradient-card)' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black text-green-500/60">Solution</div>
            <p className="text-xl font-black px-8 leading-relaxed text-green-600 dark:text-green-400">{card.answer}</p>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Rate your recall</div>
          </div>
        </div>
      </div>
      {isTop && (
        <div className="flex justify-center gap-8 mt-8">
          <button onClick={() => triggerSwipe('left')}
            className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-red-500/10"
            style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#ef4444' }}>
            <Frown className="w-6 h-6" />
          </button>
          <button onClick={() => { playSfx('flip'); setFlipped(f => !f); }}
            className="w-14 h-14 rounded-2xl border flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => triggerSwipe('right')}
            className="w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/10"
            style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.05)', color: '#22c55e' }}>
            <Smile className="w-6 h-6" />
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
      className={clsx("card !p-5 space-y-3 transition-all", editing && "ring-2 ring-brand-500/20 border-brand-500/40")}>
      {editing ? (
        <>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Question</label>
              <input value={q} onChange={e => setQ(e.target.value)} className="input text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-faint)' }}>Answer</label>
              <input value={a} onChange={e => setA(e.target.value)} className="input text-sm"
                onKeyDown={e => e.key === 'Enter' && save()} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Confirm'}
            </button>
            <button onClick={() => { setEditing(false); setQ(card.question); setA(card.answer); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] mb-1">Knowledge Node</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{card.question}</div>
            <div className="text-sm text-slate-500 mt-2 font-medium">{card.answer}</div>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1 flex-1 rounded-full overflow-hidden max-w-[120px]" style={{ backgroundColor: 'var(--bg-muted)' }}>
                <div className="h-full rounded-full bg-brand-500"
                  style={{ width: `${(card.memory_strength || 0) * 100}%` }} />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Strength: {Math.round((card.memory_strength || 0) * 100)}%</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditing(true)}
              className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(card.id)}
              className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
              style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
              <Trash2 className="w-4 h-4" />
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
    <div className="text-center space-y-8 py-10">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
          <Trophy className="w-10 h-10 text-brand-500" />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-black uppercase tracking-tight">Assessment Complete</h3>
        <p className="text-slate-500 mt-2 font-medium">Session metrics summarized below.</p>
      </div>
      <div className="card max-w-xs mx-auto">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Final Accuracy</div>
        <div className="text-5xl font-black text-slate-900 dark:text-white mb-2">{Math.round((score/cards.length)*100)}%</div>
        <div className="text-sm font-bold text-slate-400">{score} of {cards.length} correct</div>
      </div>
      <button onClick={onDone} className="btn-primary !px-12">Return to Dashboard</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-red-500">
           <Brain className="w-4 h-4" />
           <span className="text-[11px] font-black uppercase tracking-widest">Targeted Assessment</span>
        </div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{idx + 1} / {cards.length}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-red-500 transition-all duration-500"
          style={{ width: `${((idx + 1) / cards.length) * 100}%` }} />
      </div>
      <div className="card border-slate-200 dark:border-slate-800 !p-12 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 opacity-70">Knowledge Query</div>
        <p className="font-black text-2xl tracking-tight text-slate-900 dark:text-white leading-relaxed">{card.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {options[idx]?.map((opt) => {
          let cls = `border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-500/40 rounded-xl p-4 text-sm font-bold text-left transition-all`;
          if (confirmed) {
            if (opt === card.answer) cls = 'border-2 border-green-500 bg-green-500/5 text-green-600 dark:text-green-400 rounded-xl p-4 text-sm font-black text-left';
            else if (opt === selected) cls = 'border-2 border-red-500 bg-red-500/5 text-red-600 dark:text-red-400 rounded-xl p-4 text-sm font-black text-left opacity-60';
            else cls = 'border border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 rounded-xl p-4 text-sm font-bold text-left opacity-30';
          }
          return (
            <button key={opt} onClick={() => { if (!confirmed) { setSelected(opt); setConfirmed(true); if (opt === card.answer) setScore(s => s + 1); } }} disabled={confirmed} className={cls}>
              {opt}
            </button>
          );
        })}
      </div>
      {confirmed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 pt-6">
          <div className={clsx("flex items-center gap-2 font-black uppercase tracking-widest text-xs", selected === card.answer ? 'text-green-500' : 'text-red-500')}>
            {selected === card.answer ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {selected === card.answer ? 'Validation Successful' : `Correction: ${card.answer}`}
          </div>
          <button onClick={next} className="btn-primary !px-12 flex items-center gap-2">
            Proceed <ChevronRight className="w-4 h-4" />
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
    <div className="card space-y-6">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Recall Vectoring</h2>
        <p className="text-sm text-slate-500 font-medium">Input study material to begin the assessment.</p>
      </div>
      <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
      <button onClick={() => pdfRef.current?.click()} className="w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all group">
        <Upload className="w-8 h-8 text-slate-300 group-hover:text-brand-500" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-brand-600">
           {pdfLoading ? 'Analyzing Data...' : pdfFile ? pdfFile.name : 'Upload Source PDF'}
        </span>
      </button>
      <div className="space-y-4">
         <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Entry</div>
         <textarea value={materialText} onChange={e => setMaterialText(e.target.value)} className="input min-h-[120px] text-sm font-medium" placeholder="Or paste primary reading material here..." />
      </div>
      <button onClick={startRecall} disabled={!materialText.trim()} className="btn-primary w-full py-4 uppercase tracking-[0.2em] text-xs">Initialize Recall</button>
    </div>
  );

  if (phase === 'recall') return (
    <div className="space-y-6 text-center">
      <div className="card !bg-slate-950 inline-block px-8 py-3 mx-auto">
        <div className="text-2xl font-black text-white tracking-widest font-mono">
          {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">Knowledge Extraction</h2>
        <p className="text-sm text-slate-500 font-medium italic">Document every detail you can synthesize from memory.</p>
      </div>
      <textarea value={recall} onChange={e => setRecall(e.target.value)} className="input min-h-[400px] text-sm font-medium leading-relaxed" placeholder="Detailed recall synthesis..." />
      <button onClick={submit} className="btn-primary w-full py-4 text-xs tracking-widest uppercase">Analyze Synthesis</button>
    </div>
  );

  if (phase === 'generating') return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
       <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-brand-500 rounded-full animate-spin" />
       <div className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Analyzing Knowledge Gaps</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight">Recall Analysis</h2>
        <div className="text-xs font-black text-brand-500 uppercase tracking-widest">{gapResults.length} Gaps Detected</div>
      </div>
      {gapResults.map((gap, i) => (
        <div key={i} className="card border-slate-200 dark:border-slate-800 hover:border-brand-500/30 transition-all">
          <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Identified Gap</div>
          <div className="font-bold text-slate-900 dark:text-white text-base leading-relaxed mb-3">{gap.question}</div>
          <div className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1.5">Recall Solution</div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">{gap.answer}</div>
          {gap.source && <div className="text-[10px] italic text-slate-400 mt-3 border-t border-slate-100 dark:border-slate-800 pt-3">Source Excerpt: "{gap.source}"</div>}
        </div>
      ))}
      <button onClick={() => onDone(savedCards)} className="btn-primary w-full py-4 text-xs uppercase tracking-widest">Commit Gaps to Deck</button>
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
      <div className="max-w-5xl mx-auto space-y-10 pt-10">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase tracking-tight mb-2">Knowledge Decks</h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Repository management</p>
           </div>
           <button onClick={() => { setSelectedDeck(null); setScreen('create'); }} className="btn-primary flex items-center gap-2 !px-6 !py-3">
             <Plus className="w-4 h-4" /> Initialize Deck
           </button>
        </header>

        {!loading && dueCardsData.length > 0 && (
          <div className="card border-brand-500/30 flex items-center justify-between p-8 shadow-xl shadow-brand-500/5" style={{ backgroundColor: 'var(--brand-900)' }}>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
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
               <div className="h-24 bg-slate-100 dark:bg-slate-900 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-brand-500 w-5 h-5" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Archived Node</div>
                  </div>
                  <div className="flex gap-2">
                     <button title="View Cards" onClick={() => openViewCards(deck)} className="w-9 h-9 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><Eye className="w-4 h-4" /></button>
                     <button title="Delete Deck" onClick={() => deleteDeck(deck)} className="w-9 h-9 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all border border-transparent hover:border-red-200 dark:hover:border-red-900/40"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="p-6">
                  <h3 className="text-xl font-black tracking-tight mb-1 uppercase">{deck.title}</h3>
                  <div className="flex items-center gap-3 text-slate-400 mb-8">
                     <Layers3 className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-bold uppercase tracking-widest">{deck.card_count} Knowledge Nodes</span>
                  </div>
                  <button onClick={() => loadDeckCards(deck)} className="btn-primary w-full text-xs py-3 uppercase tracking-widest">Study Now</button>
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
      <div className={clsx("min-h-screen flex flex-col transition-all duration-700", focusMode ? "bg-slate-950 pt-10" : "pt-10")}>
        <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center">
          
          <div className="w-full mb-12 flex items-center justify-between">
            <button onClick={() => { setFocusMode(false); setScreen('home'); }}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all font-black uppercase tracking-[0.2em] text-[10px]">
              <ChevronLeft className="w-3.5 h-3.5" /> Terminate Session
            </button>
            
            <div className="flex items-center gap-8">
               <div className="flex gap-6 text-[11px] font-black tracking-widest uppercase items-center">
                <span className="text-red-500 flex items-center gap-1.5"><Frown className="w-4 h-4" /> {hardCount}</span>
                <span className="text-green-500 flex items-center gap-1.5"><Smile className="w-4 h-4" /> {easyCount}</span>
              </div>
              <button onClick={() => setFocusMode(!focusMode)} className={clsx("flex items-center gap-2 px-5 py-2 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest", focusMode ? "border-brand-500/50 bg-brand-500/10 text-brand-500 shadow-[0_0_15px_rgba(220,123,30,0.1)]" : "border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-white")}>
                <Brain className="w-3.5 h-3.5" /> {focusMode ? "Isolation On" : "Isolation Mode"}
              </button>
            </div>
          </div>

          <div className="w-full max-w-xl mb-16">
            <div className="flex justify-between items-end mb-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Knowledge Propagation</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{swipeStack.length} nodes remaining</div>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
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
     <AppLayout><div className="max-w-xl mx-auto py-10"><button onClick={() => setScreen('home')} className="mb-10 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white"><ChevronLeft className="w-4 h-4" /> Cancel Vectoring</button>{recallDeck && <RecallMode deck={recallDeck} onDone={() => setScreen('home')} />}</div></AppLayout>
  );

  // ── VIEW CARDS ────────────────────────────────────────────────────────────
  if (screen === 'view-cards') return (
     <AppLayout><div className="max-w-3xl mx-auto space-y-10 py-10"><button onClick={() => setScreen('home')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /> Back to Repository</button><div><h1 className="text-3xl font-black uppercase tracking-tight mb-2">{selectedDeck?.title}</h1><p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Database entry verification</p></div><div className="grid gap-4">{deckCards.map(c => <CardRow key={c.id} card={c} onSave={saveCard} onDelete={deleteCard} />)}</div></div></AppLayout>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === 'result') return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-24 text-center">
         <div className="flex justify-center mb-10">
            <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-700 shadow-2xl">
               <Trophy className="w-10 h-10 text-brand-500" />
            </div>
         </div>
         <h1 className="text-5xl font-black uppercase tracking-tight mb-4">Session Summarized</h1>
         <p className="text-lg text-slate-500 font-medium mb-12">Performance analysis for this learning cycle.</p>
         <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-16">
            <div className="card border-slate-200 dark:border-slate-800">
               <div className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">Validated</div>
               <div className="text-4xl font-black text-slate-900 dark:text-white">{easyCount}</div>
            </div>
            <div className="card border-slate-200 dark:border-slate-800">
               <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">Requires Review</div>
               <div className="text-4xl font-black text-slate-900 dark:text-white">{hardCount}</div>
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
          <button onClick={() => setScreen('home')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronLeft className="w-4 h-4" /> Back</button>
          <div className="card space-y-8 !p-10">
             <div>
               <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Module Addition</h2>
               <p className="text-sm text-slate-500 font-medium">Add new knowledge nodes to {selectedDeck?.title || 'System Repository'}.</p>
             </div>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Query</label>
                   <input value={cardQ} onChange={e => setCardQ(e.target.value)} placeholder="Enter knowledge query..." className="input" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Solution</label>
                   <input value={cardA} onChange={e => setCardA(e.target.value)} placeholder="Enter solution vector..." className="input" />
                </div>
             </div>
             <button onClick={addCard} className="btn-primary w-full py-4 tracking-widest uppercase text-xs">Commit Card</button>
          </div>
       </div>
    </AppLayout>
  );
}
