'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi } from '@/lib/api';
import {
  BookOpen, Plus, X, ChevronLeft, Sparkles, Zap, RotateCcw,
  Upload, FileText, Pencil, Trash2, Check, Eye, Share2, Brain
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';

interface Card { id: string; question: string; answer: string; memory_strength: number; }
interface Deck { id: string; title: string; card_count: number; is_public?: boolean; share_token?: string; }
type Screen = 'home' | 'study' | 'create' | 'result' | 'view-cards' | 'hard-quiz' | 'recall';

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

// ─── Hard Quiz ────────────────────────────────────────────────────────────────
function HardQuiz({ cards, onDone }: { cards: Card[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [options] = useState(() => cards.map(card => {
    const wrong = cards.filter(c => c.id !== card.id).sort(() => Math.random() - 0.5).slice(0, 3).map(c => c.answer);
    return [...wrong, card.answer].sort(() => Math.random() - 0.5);
  }));

  const card = cards[idx];
  const colors = [
    'border-red-500/40 hover:bg-red-500/10 text-red-400',
    'border-blue-500/40 hover:bg-blue-500/10 text-blue-400',
    'border-amber-500/40 hover:bg-amber-500/10 text-amber-400',
    'border-green-500/40 hover:bg-green-500/10 text-green-400',
  ];

  const handleAnswer = (ans: string) => {
    if (confirmed) return;
    setSelected(ans);
    setConfirmed(true);
    if (ans === card.answer) setScore(s => s + 1);
  };

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
        {options[idx]?.map((opt, i) => {
          let cls = `border ${colors[i % 4]} rounded-xl p-3 text-sm font-medium text-left transition-all`;
          if (confirmed) {
            if (opt === card.answer) cls = 'border border-green-500 bg-green-500/20 text-green-400 rounded-xl p-3 text-sm font-medium text-left';
            else if (opt === selected) cls = 'border border-red-500 bg-red-500/20 text-red-400 rounded-xl p-3 text-sm font-medium text-left opacity-60';
            else cls = 'border border-surface-border text-slate-600 rounded-xl p-3 text-sm font-medium text-left opacity-30';
          }
          return (
            <button key={opt} onClick={() => handleAnswer(opt)} disabled={confirmed} className={cls}>
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
    if (f.type !== 'application/pdf') return toast.error('Only PDF files supported');
    setPdfFile(f);
    setPdfLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', f);
      formData.append('question', 'Extract and return all the text content from this document as plain text.');
      const res = await homeworkApi.askPdf(formData);
      setMaterialText(res.data.answer || '');
      toast.success(`${f.name} loaded!`);
    } catch {
      toast.error('Failed to read PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const startRecall = () => {
    if (!materialText.trim()) return toast.error('Add your study material first!');
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
    if (!recall.trim()) return toast.error('Write something first!');
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('generating');
    try {
      const prompt = `You are a study gap analyzer.

STUDY MATERIAL:
---
${materialText.slice(0, 4000)}
---

STUDENT'S FREE RECALL:
---
${recall}
---

Compare the student's recall against the study material. Find concepts, facts, and details from the material that the student MISSED or got WRONG.

For each gap, return:
- question: a flashcard question targeting that gap
- answer: the correct answer
- source: the EXACT sentence or phrase from the study material above that contains this information (copy it word for word)

Return ONLY a valid JSON array, no other text:
[{"question": "...", "answer": "...", "source": "..."}, ...]

Generate 5-8 items maximum. Only include things the student actually missed.`;

      const res = await homeworkApi.ask({ question: prompt });
      const raw = res.data.answer || '[]';
      let parsed: { question: string; answer: string; source: string; }[] = [];
      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        const start = clean.indexOf('[');
        const end = clean.lastIndexOf(']');
        parsed = JSON.parse(clean.slice(start, end + 1));
      } catch {
        toast.error('Could not parse gap analysis');
        setPhase('recall');
        return;
      }

      setGapResults(parsed);

      const saved: Card[] = [];
      for (const gap of parsed) {
        try {
          const r = await flashcardApi.createCard({ deck_id: deck.id, question: gap.question, answer: gap.answer });
          saved.push(r.data.card);
        } catch {}
      }
      setSavedCards(saved);
      setPhase('done');
    } catch {
      toast.error('Failed to generate gap cards');
      setPhase('recall');
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timerColor = timeLeft > 60 ? 'text-green-400' : timeLeft > 30 ? 'text-amber-400' : 'text-red-400';

  if (phase === 'upload') return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">📚</div>
        <h2 className="text-2xl font-extrabold">Free Recall</h2>
        <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
          Upload your study material, write what you remember, and AI will find your gaps and show exactly where in the source they came from.
        </p>
      </div>
      <div className="card space-y-4 border-brand-500/20 bg-brand-500/5">
        <h3 className="font-bold flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">1</span>
          Add your study material
        </h3>
        <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
        {pdfFile ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-sm">
            <FileText className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span className="text-brand-300 truncate flex-1">{pdfFile.name}</span>
            {pdfLoading
              ? <div className="w-4 h-4 rounded-full border-2 border-brand-400/30 border-t-brand-400 animate-spin flex-shrink-0" />
              : <button onClick={() => { setPdfFile(null); setMaterialText(''); if (pdfRef.current) pdfRef.current.value = ''; }}
                  className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                  <X className="w-4 h-4" />
                </button>
            }
          </div>
        ) : (
          <button onClick={() => pdfRef.current?.click()} disabled={pdfLoading}
            className="w-full border-2 border-dashed border-brand-500/30 rounded-xl py-5 text-brand-400 hover:border-brand-500/60 hover:bg-brand-500/5 transition-all flex flex-col items-center gap-2 disabled:opacity-50">
            <Upload className="w-5 h-5" />
            <span className="text-sm font-medium">Upload PDF study material</span>
            <span className="text-xs text-slate-500">Max 10MB</span>
          </button>
        )}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex-1 h-px bg-surface-border" />
          or paste notes below
          <div className="flex-1 h-px bg-surface-border" />
        </div>
        <textarea
          value={materialText}
          onChange={e => setMaterialText(e.target.value)}
          placeholder="Paste your notes, textbook excerpt, lecture slides, or study guide here..."
          className="input min-h-[140px] resize-none text-sm"
        />
        {materialText.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <Check className="w-3 h-3" /> {materialText.length} characters loaded
          </div>
        )}
      </div>
      <button onClick={startRecall} disabled={!materialText.trim() || pdfLoading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-base font-bold">
        <Brain className="w-5 h-5" /> Start Free Recall →
      </button>
    </div>
  );

  if (phase === 'recall') return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            Write what you remember
          </h3>
          <p className="text-xs text-slate-400 ml-8">Don't look at your notes!</p>
        </div>
        <div className={`font-mono font-bold text-2xl ${timerColor}`}>
          {mins}:{secs.toString().padStart(2, '0')}
        </div>
      </div>
      <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
        <motion.div className="h-full rounded-full bg-brand-500"
          animate={{ width: `${(timeLeft / 120) * 100}%` }}
          transition={{ duration: 0.9, ease: 'linear' }} />
      </div>
      <textarea
        value={recall}
        onChange={e => setRecall(e.target.value)}
        placeholder="Write everything you can remember from your study material...

- Key concepts and definitions
- Important facts and dates
- Formulas or processes
- Anything else you recall

The AI will compare this against your material and show you exactly what you missed and where it came from."
        className="input resize-none text-sm leading-relaxed"
        style={{ minHeight: '260px' }}
        autoFocus
      />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{recall.length} characters written</span>
        {timeLeft === 0 && <span className="text-amber-400 font-medium animate-pulse">⏰ Time's up — submit when ready!</span>}
      </div>
      <button onClick={submit} disabled={!recall.trim()}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-base font-bold">
        <Sparkles className="w-5 h-5" /> Find My Gaps & Generate Cards
      </button>
    </div>
  );

  if (phase === 'generating') return (
    <div className="text-center py-20 space-y-5">
      <div className="w-14 h-14 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto" />
      <div className="font-bold text-xl">Analyzing your recall...</div>
      <div className="text-slate-400 text-sm">Comparing against your material and finding gaps</div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl mb-3">{gapResults.length > 0 ? '🧠' : '🎉'}</div>
        <h2 className="text-2xl font-extrabold">
          {gapResults.length > 0 ? "Here's what you missed" : 'Perfect Recall!'}
        </h2>
        <p className="text-slate-400 text-sm mt-2">
          {gapResults.length > 0
            ? `${gapResults.length} gaps found · ${savedCards.length} cards added to "${deck.title}"`
            : 'You remembered everything! No gaps found.'}
        </p>
      </div>
      {gapResults.length > 0 && (
        <div className="space-y-3">
          {gapResults.map((gap, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card border-brand-500/20 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-red-400 font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold">{gap.question}</div>
                  <div className="text-sm text-green-400 mt-1 font-medium">{gap.answer}</div>
                </div>
              </div>
              {gap.source && (
                <div className="ml-7 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <div className="text-xs text-amber-400 font-semibold uppercase tracking-widest flex-shrink-0 mt-0.5">Source</div>
                  <div className="text-xs text-amber-300/80 italic leading-relaxed">"{gap.source}"</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      <button onClick={() => onDone(savedCards)} className="btn-primary w-full py-3 font-bold">Done</button>
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
  const [recallDeck, setRecallDeck] = useState<Deck | null>(null);

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
      loadDecks();
    } catch { toast.error('Failed to share deck'); }
  };

  const exportToQuizlet = (deck: Deck) => {
    flashcardApi.deckCards(deck.id).then(res => {
      const c = res.data.cards || [];
      if (c.length === 0) return toast.error('No cards to export');
      const content = c.map((card: Card) => `${card.question}\t${card.answer}`).join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.title.replace(/\s+/g, '_')}_quizlet.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded! Import this file into Quizlet 🎉');
    }).catch(() => toast.error('Failed to export'));
  };

  const importFromQuizlet = async (e: React.ChangeEvent<HTMLInputElement>, deck: Deck) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    const lines = text.split('\n').filter(l => l.trim());
    const pairs = lines.map(l => {
      const parts = l.split('\t');
      return parts.length >= 2
        ? { question: parts[0].trim(), answer: parts.slice(1).join('\t').trim() }
        : null;
    }).filter(Boolean) as { question: string; answer: string }[];
    if (pairs.length === 0) return toast.error('No valid cards found. Make sure the file uses tab-separated format.');
    const toastId = toast.loading(`Importing ${pairs.length} cards...`);
    let imported = 0;
    for (const pair of pairs) {
      try {
        await flashcardApi.createCard({ deck_id: deck.id, question: pair.question, answer: pair.answer });
        imported++;
      } catch {}
    }
    toast.dismiss(toastId);
    toast.success(`Imported ${imported} cards from Quizlet!`);
    loadDecks();
    if (e.target) e.target.value = '';
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
          <div className="flex gap-2">
            <button onClick={() => {
              if (decks.length === 0) { toast('Create a deck first!'); return; }
              setRecallDeck(decks[0]);
              setScreen('recall');
            }} className="btn-ghost flex items-center gap-2">
              <Brain className="w-4 h-4" /> Free Recall
            </button>
            <button onClick={() => { setSelectedDeck(null); setGeneratedCards([]); setPdfCards([]); setScreen('create'); }}
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Deck
            </button>
          </div>
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
                  <div className="flex gap-1 flex-wrap justify-end">
                    <button onClick={() => openViewCards(deck)}
                      className="text-xs text-slate-500 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-brand-500/10 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button onClick={() => { setSelectedDeck(deck); setGeneratedCards([]); setPdfCards([]); setScreen('create'); }}
                      className="text-xs text-slate-500 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-brand-500/10">
                      + Add
                    </button>
                    <button onClick={() => { setRecallDeck(deck); setScreen('recall'); }}
                      className="text-xs text-slate-500 hover:text-purple-400 transition-colors px-2 py-1 rounded-lg hover:bg-purple-500/10 flex items-center gap-1"
                      title="Free Recall">
                      <Brain className="w-3 h-3" />
                    </button>
                    <button onClick={() => handleShare(deck)}
                      className="text-xs text-slate-500 hover:text-green-400 transition-colors px-2 py-1 rounded-lg hover:bg-green-500/10 flex items-center gap-1"
                      title="Copy share link">
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => exportToQuizlet(deck)}
                      className="text-xs text-slate-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10"
                      title="Export to Quizlet">
                      ↓
                    </button>
                    <label className="text-xs text-slate-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10 cursor-pointer"
                      title="Import from Quizlet">
                      ↑
                      <input type="file" accept=".txt" className="hidden"
                        onChange={e => importFromQuizlet(e, deck)} />
                    </label>
                    <button onClick={() => deleteDeck(deck)} disabled={deletingDeck === deck.id}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10 flex items-center gap-1 disabled:opacity-50">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg group-hover:text-brand-400 transition-colors">{deck.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{deck.card_count} cards</p>
                {deck.is_public && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-green-400">
                    <Share2 className="w-3 h-3" /> Shared publicly
                  </div>
                )}
                <button onClick={() => loadDeckCards(deck)} className="mt-4 w-full btn-primary text-sm py-2">
                  Study this deck →
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );

  // ── FREE RECALL ───────────────────────────────────────────────────────────
  if (screen === 'recall') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          {decks.length > 1 && (
            <select value={recallDeck?.id || ''}
              onChange={e => setRecallDeck(decks.find(d => d.id === e.target.value) || null)}
              className="input text-sm flex-1">
              {decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          )}
        </div>
        {recallDeck && (
          <RecallMode deck={recallDeck} onDone={(newCards) => {
            if (newCards.length > 0) toast.success(`${newCards.length} gap cards added to "${recallDeck.title}"!`);
            setScreen('home');
            loadDecks();
          }} />
        )}
      </div>
    </AppLayout>
  );

  // ── VIEW CARDS ────────────────────────────────────────────────────────────
  if (screen === 'view-cards') return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold">{selectedDeck?.title}</h1>
            <p className="text-sm text-slate-500">{deckCards.length} cards · click ✏️ to edit</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setGeneratedCards([]); setPdfCards([]); setScreen('create'); }}
              className="btn-ghost flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add
            </button>
            <button onClick={() => loadDeckCards(selectedDeck!)} className="btn-primary text-sm">
              Study →
            </button>
          </div>
        </div>
        {cardsLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : deckCards.length === 0 ? (
          <div className="text-center py-16 card border-dashed">
            <p className="text-slate-500 mb-4">No cards yet.</p>
            <button onClick={() => setScreen('create')} className="btn-primary mx-auto flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Cards
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {deckCards.map(card => (
              <CardRow key={card.id} card={card} onSave={saveCard} onDelete={deleteCard} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );

  // ── STUDY ─────────────────────────────────────────────────────────────────
  if (screen === 'study') return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> {selectedDeck?.title}
          </button>
          <div className="flex gap-4 text-sm">
            <span className="text-red-400 font-bold">😰 {hardCount}</span>
            <span className="text-green-400 font-bold">😊 {easyCount}</span>
          </div>
          <div className="text-sm text-slate-400">{swipeStack.length} left</div>
        </div>
        <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all"
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
    </AppLayout>
  );

  // ── HARD QUIZ ─────────────────────────────────────────────────────────────
  if (screen === 'hard-quiz') return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => setScreen('result')}
          className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ChevronLeft className="w-5 h-5" /> Back to results
        </button>
        <HardQuiz cards={hardCards} onDone={() => setScreen('result')} />
      </div>
    </AppLayout>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === 'result') {
    const total = easyCount + hardCount || 1;
    const pct = Math.round((easyCount / total) * 100);
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-10 space-y-6">
          <div className="text-7xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <h1 className="text-3xl font-extrabold">Session Complete!</h1>
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
            <div className="h-2 bg-surface-border rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-green-500"
                style={{ width: `${pct}%` }} />
            </div>
            <div className="text-sm text-slate-400">{pct}% accuracy</div>
            {sessionXP > 0 && (
              <div className="flex items-center justify-center gap-2 text-brand-400 font-bold">
                <Zap className="w-5 h-5" /> +{sessionXP} XP earned
              </div>
            )}
          </div>
          <div className="space-y-3">
            {hardCards.length > 0 && (
              <button onClick={() => setScreen('hard-quiz')}
                className="w-full card border-red-500/20 bg-red-500/5 hover:border-red-500/40 transition-all text-left flex items-center gap-3 !py-3 !px-4">
                <div className="text-2xl">😰</div>
                <div>
                  <div className="font-bold text-red-400">Quiz your {hardCards.length} hard cards</div>
                  <div className="text-xs text-slate-500">Multiple choice on what you struggled with</div>
                </div>
              </button>
            )}
            <button onClick={() => { setRecallDeck(selectedDeck); setScreen('recall'); }}
              className="w-full card border-brand-500/20 bg-brand-500/5 hover:border-brand-500/40 transition-all text-left flex items-center gap-3 !py-3 !px-4">
              <div className="text-2xl">🧠</div>
              <div>
                <div className="font-bold text-brand-400">Free Recall</div>
                <div className="text-xs text-slate-500">Upload material · write recall · AI finds your gaps with sources</div>
              </div>
            </button>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setScreen('home')} className="btn-ghost">All Decks</button>
            <button onClick={() => loadDeckCards(selectedDeck!)} className="btn-primary">Study Again</button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── CREATE ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setScreen('home')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
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
              <input value={deckTitle} onChange={e => setDeckTitle(e.target.value)}
                placeholder="Deck name..." className="input flex-1"
                onKeyDown={e => e.key === 'Enter' && createDeck()} />
              <button onClick={createDeck} disabled={!deckTitle.trim()}
                className="btn-primary px-4 disabled:opacity-50">Create</button>
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
              <h2 className="font-bold">Add a Card Manually</h2>
              <input value={cardQ} onChange={e => setCardQ(e.target.value)}
                placeholder="Question / front of card..." className="input" />
              <input value={cardA} onChange={e => setCardA(e.target.value)}
                placeholder="Answer / back of card..." className="input"
                onKeyDown={e => e.key === 'Enter' && addCard()} />
              <button onClick={addCard} disabled={!cardQ.trim() || !cardA.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </div>

            <div className="card space-y-3 border-amber-500/20 bg-amber-500/5">
              <h2 className="font-bold flex items-center gap-2">
                <span className="text-amber-400 text-lg">⇄</span> Quizlet Import / Export
              </h2>
              <p className="text-xs text-slate-400">
                Export your deck as a .txt file to import into Quizlet, or import a Quizlet export here.
              </p>
              <div className="flex gap-2">
                <button onClick={() => exportToQuizlet(selectedDeck)}
                  className="flex-1 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2">
                  ↓ Export for Quizlet
                </button>
                <label className="flex-1 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl py-2 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer">
                  ↑ Import from Quizlet
                  <input type="file" accept=".txt" className="hidden"
                    onChange={e => importFromQuizlet(e, selectedDeck)} />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                In Quizlet: Create set → Import → paste file contents. Tab separates term/definition.
              </p>
            </div>

            <div className="card space-y-4 border-brand-500/20 bg-brand-500/5">
              <h2 className="font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" /> Generate from Notes
              </h2>
              <textarea value={genNotes} onChange={e => setGenNotes(e.target.value)}
                placeholder="Paste your notes and AI will create 10 flashcards..."
                className="input min-h-[100px] resize-none" />
              <button onClick={generateFromNotes} disabled={generating || !genNotes.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {generating
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generating...</>
                  : <><Sparkles className="w-4 h-4" /> Generate 10 Cards</>}
              </button>
              <AnimatePresence>
                {generatedCards.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-2 pt-2 border-t border-brand-500/20">
                    <p className="text-xs text-brand-400 font-semibold uppercase tracking-widest">
                      {generatedCards.length} cards generated — edit below
                    </p>
                    {generatedCards.map(card => (
                      <CardRow key={card.id} card={card} onSave={saveCard} onDelete={deleteCard} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="card space-y-4 border-blue-500/20 bg-blue-500/5">
              <h2 className="font-bold flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" /> Generate from PDF
              </h2>
              <p className="text-sm text-slate-400">Upload a PDF and AI will extract 10 flashcards automatically.</p>
              <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfFile} />
              {pdfFile ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-blue-300 truncate flex-1">{pdfFile.name}</span>
                  <span className="text-slate-500 text-xs">{(pdfFile.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => { setPdfFile(null); if (pdfRef.current) pdfRef.current.value = ''; }}
                    className="text-slate-500 hover:text-red-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => pdfRef.current?.click()}
                  className="w-full border-2 border-dashed border-blue-500/30 rounded-xl py-8 text-blue-400 hover:border-blue-500/60 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-medium">Click to upload PDF</span>
                  <span className="text-xs text-slate-500">Max 10MB</span>
                </button>
              )}
              <AnimatePresence>
                {generatingPdf && pdfProgress && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin flex-shrink-0" />
                    <span className="text-sm text-blue-300">{pdfProgress}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <button onClick={generateFromPdf} disabled={generatingPdf || !pdfFile}
                className="w-full border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {generatingPdf
                  ? <><div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" /> Processing...</>
                  : <><Sparkles className="w-4 h-4" /> Generate from PDF</>}
              </button>
              <AnimatePresence>
                {pdfCards.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="space-y-2 pt-2 border-t border-blue-500/20">
                    <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest">
                      {pdfCards.length} cards from PDF — edit below
                    </p>
                    {pdfCards.map(card => (
                      <CardRow key={card.id} card={card} onSave={saveCard} onDelete={deleteCard} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
