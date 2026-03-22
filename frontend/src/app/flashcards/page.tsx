'use client';
import { useEffect, useState, useRef } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi } from '@/lib/api';
import { BookOpen, Plus, X, ChevronLeft, Sparkles, Zap, RotateCcw, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from 'framer-motion';

interface Card { id: string; question: string; answer: string; memory_strength: number; }
interface Deck { id: string; title: string; card_count: number; }
type Screen = 'home' | 'study' | 'create' | 'result';

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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FlashcardsPage() {
  const [screen, setScreen] = useState<Screen>('home');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Create
  const [deckTitle, setDeckTitle] = useState('');
  const [cardQ, setCardQ] = useState('');
  const [cardA, setCardA] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);

  // Study
  const [swipeStack, setSwipeStack] = useState<Card[]>([]);
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
        toast('No cards in this deck yet! Add some first.');
        setSelectedDeck(deck);
        setScreen('create');
        setLoading(false);
        return;
      }
      setCards(c);
      setSelectedDeck(deck);
      const shuffled = [...c].sort(() => Math.random() - 0.5);
      setSwipeStack(shuffled);
      setEasyCount(0);
      setHardCount(0);
      setSessionXP(0);
      setScreen('study');
    } catch { toast.error('Failed to load cards'); }
    finally { setLoading(false); }
  };

  const handleSwipe = async (dir: 'left' | 'right') => {
    const card = swipeStack[swipeStack.length - 1];
    const difficulty = dir === 'right' ? 'easy' : 'hard';
    if (dir === 'right') setEasyCount(e => e + 1);
    else setHardCount(h => h + 1);
    try {
      const res = await flashcardApi.reviewCard(card.id, difficulty);
      setSessionXP(prev => prev + (res.data.xp?.xpGained || 0));
    } catch {}
    const newStack = swipeStack.slice(0, -1);
    setSwipeStack(newStack);
    if (newStack.length === 0) setScreen('result');
  };

  const createDeck = async () => {
    if (!deckTitle.trim()) return;
    try {
      const res = await flashcardApi.createDeck({ title: deckTitle });
      toast.success('Deck created!');
      setDeckTitle('');
      setSelectedDeck(res.data.deck);
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
    if (!selectedDeck || !genNotes.trim()) return;
    setGenerating(true);
    try {
      const res = await flashcardApi.generateFromNotes({ deck_id: selectedDeck.id, notes: genNotes, count: 10 });
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
    toast.success(`${f.name} ready!`);
  };

  const generateFromPdf = async () => {
    if (!selectedDeck || !pdfFile) return;
    setGeneratingPdf(true);
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('deck_id', selectedDeck.id);
      formData.append('count', '10');
      const res = await flashcardApi.generateFromPdf(formData);
      toast.success(`Generated ${res.data.generated} cards from PDF!`);
      setPdfFile(null);
      if (pdfRef.current) pdfRef.current.value = '';
      loadDecks();
    } catch { toast.error('Failed to generate from PDF'); }
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
          <button
            onClick={() => { setSelectedDeck(null); setScreen('create'); }}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Deck
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" />)}
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
              <motion.div key={deck.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="card hover:border-brand-500/40 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-brand-400" />
                  </div>
                  <button
                    onClick={() => { setSelectedDeck(deck); setScreen('create'); }}
                    className="text-xs text-slate-500 hover:text-brand-400 transition-colors px-2 py-1 rounded-lg hover:bg-brand-500/10">
                    + Add cards
                  </button>
                </div>
                <h3 className="font-bold text-lg group-hover:text-brand-400 transition-colors">{deck.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{deck.card_count} cards</p>
                <button
                  onClick={() => loadDeckCards(deck)}
                  className="mt-4 w-full btn-primary text-sm py-2">
                  Study this deck →
                </button>
              </motion.div>
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
                <SwipeCard
                  card={card}
                  onSwipe={isTop ? handleSwipe : undefined}
                  isTop={isTop}
                />
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────
  if (screen === 'result') {
    const total = easyCount + hardCount || 1;
    const pct = Math.round((easyCount / total) * 100);
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-12 space-y-6">
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
                className="btn-primary px-4 disabled:opacity-50">
                Create
              </button>
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
            {/* Manual card */}
            <div className="card space-y-4">
              <h2 className="font-bold">Add a Card Manually</h2>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Question</label>
                <input value={cardQ} onChange={e => setCardQ(e.target.value)}
                  placeholder="Front of card..." className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Answer</label>
                <input value={cardA} onChange={e => setCardA(e.target.value)}
                  placeholder="Back of card..." className="input"
                  onKeyDown={e => e.key === 'Enter' && addCard()} />
              </div>
              <button onClick={addCard} disabled={!cardQ.trim() || !cardA.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </div>

            {/* AI from notes */}
            <div className="card space-y-4 border-brand-500/20 bg-brand-500/5">
              <h2 className="font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-400" /> Generate from Notes
              </h2>
              <textarea value={genNotes} onChange={e => setGenNotes(e.target.value)}
                placeholder="Paste your notes and AI will create 10 flashcards..."
                className="input min-h-[100px] resize-none" />
              <button onClick={generateFromNotes}
                disabled={generating || !genNotes.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50">
                {generating
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Generating...</>
                  : <><Sparkles className="w-4 h-4" /> Generate 10 Cards</>}
              </button>
            </div>

            {/* PDF upload */}
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
              <button onClick={generateFromPdf}
                disabled={generatingPdf || !pdfFile}
                className="w-full border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl py-2.5 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
                {generatingPdf
                  ? <><div className="w-4 h-4 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" /> Processing PDF...</>
                  : <><Sparkles className="w-4 h-4" /> Generate from PDF</>}
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
