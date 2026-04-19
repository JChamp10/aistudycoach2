import { useState, useRef, useEffect } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { flashcardApi, homeworkApi } from '@/lib/api';
import { Card, Deck } from './types';

interface RecallModeProps {
  deck: Deck;
  onDone: (generatedCards: Card[]) => void;
}

export function RecallMode({ deck, onDone }: RecallModeProps) {
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
    <div className="card space-y-6" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>AI Recall Generator</h2>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Upload or paste study material to generate flashcards.</p>
      </div>
      <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdf} />
      <button onClick={() => pdfRef.current?.click()} className="w-full py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group hover:bg-brand-500/5 hover:border-brand-500/50" style={{ borderColor: 'var(--border-primary)' }}>
        <Upload className="w-8 h-8 group-hover:text-brand-500" style={{ color: 'var(--text-muted)' }} />
        <span className="text-xs font-black uppercase tracking-widest group-hover:text-brand-600" style={{ color: 'var(--text-faint)' }}>
           {pdfLoading ? 'Reading PDF...' : pdfFile ? pdfFile.name : 'Upload PDF'}
        </span>
      </button>
      <div className="space-y-4">
         <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Manual Entry</div>
         <textarea value={materialText} onChange={e => setMaterialText(e.target.value)} className="input min-h-[120px] text-sm font-medium" placeholder="Or paste primary reading material here..." />
      </div>
      <button onClick={startRecall} disabled={!materialText.trim()} className="btn-primary w-full py-4 uppercase tracking-[0.2em] text-xs">Initialize Recall</button>
    </div>
  );

  if (phase === 'recall') return (
    <div className="space-y-6 text-center">
      <div className="card inline-block px-8 py-3 mx-auto" style={{ backgroundColor: 'var(--text-primary)', borderColor: 'var(--text-primary)' }}>
        <div className="text-2xl font-black tracking-widest font-mono" style={{ color: 'var(--bg-primary)' }}>
          {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>Knowledge Extraction</h2>
        <p className="text-sm font-medium italic" style={{ color: 'var(--text-muted)' }}>Document every detail you can synthesize from memory.</p>
      </div>
      <textarea value={recall} onChange={e => setRecall(e.target.value)} className="input min-h-[400px] text-sm font-medium leading-relaxed" placeholder="Detailed recall synthesis..." />
      <button onClick={submit} className="btn-primary w-full py-4 text-xs tracking-widest uppercase">Analyze Synthesis</button>
    </div>
  );

  if (phase === 'generating') return (
    <div className="flex flex-col items-center justify-center py-32 space-y-6">
       <div className="w-12 h-12 border-4 border-t-brand-500 rounded-full animate-spin" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--brand-500)' }} />
       <div className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>Analyzing Knowledge Gaps</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>Recall Analysis</h2>
        <div className="text-xs font-black text-brand-500 uppercase tracking-widest">{gapResults.length} Gaps Detected</div>
      </div>
      {gapResults.map((gap, i) => (
        <div key={i} className="card transition-all hover:border-brand-500/30" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
          <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-danger, #ef4444)' }}>Identified Gap</div>
          <div className="font-bold text-base leading-relaxed mb-3" style={{ color: 'var(--text-primary)' }}>{gap.question}</div>
          <div className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-success, #22c55e)' }}>Recall Solution</div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{gap.answer}</div>
          {gap.source && <div className="text-[10px] italic mt-3 pt-3" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--border-subtle)' }}>Source Excerpt: "{gap.source}"</div>}
        </div>
      ))}
      <button onClick={() => onDone(savedCards)} className="btn-primary w-full py-4 text-xs uppercase tracking-widest">Commit Gaps to Deck</button>
    </div>
  );
}
