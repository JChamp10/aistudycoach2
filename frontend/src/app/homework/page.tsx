'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { homeworkApi } from '@/lib/api';
import { HelpCircle, Send, Upload, X, FileText, Clock, ChevronLeft, Trash2, Calculator, LineChart, MessageSquare, Brain, Search, Sparkles, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSFX } from '@/lib/useSFX';
import { TypewriterText, ThinkingPulse } from '@/components/layout/TypewriterText';
import { useAuthStore } from '@/lib/store';
import { clsx } from 'clsx';

// ─── Math Suite ──────────────────────────────────────
function MathSuite() {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);
  const [equations, setEquations] = useState(['y = x^2', 'y = \\sin(x)', '']);
  const [loaded, setLoaded] = useState(false);
  const darkMode = useAuthStore(state => state.darkMode);
  
  // Equation Solver State
  const [eqInput, setEqInput] = useState('');
  const [eqResult, setEqResult] = useState('');
  const [solving, setSolving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initDesmos = () => {
      if (!containerRef.current) return;
      const Desmos = (window as any).Desmos;
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }
      calculatorRef.current = Desmos.GraphingCalculator(containerRef.current, {
        keypad: true,
        expressions: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsTopbar: true,
        border: false,
        invertedColors: darkMode,
        fontSize: 14,
      });
      equations.filter(e => e.trim()).forEach((eq, i) => {
        calculatorRef.current.setExpression({ id: `eq${i}`, latex: eq });
      });
      setLoaded(true);
    };

    const loadDesmos = () => {
      if ((window as any).Desmos) { initDesmos(); return; }
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.onload = initDesmos;
      document.head.appendChild(script);
    };

    loadDesmos();
    return () => { calculatorRef.current?.destroy(); };
  }, [darkMode]);

  const updateEquation = (idx: number, val: string) => {
    const newEqs = [...equations];
    newEqs[idx] = val;
    if (idx === equations.length - 1 && val.trim()) newEqs.push('');
    setEquations(newEqs);
    if (calculatorRef.current) calculatorRef.current.setExpression({ id: `eq${idx}`, latex: val });
  };

  const removeEquation = (idx: number) => {
    if (equations.length <= 1) return;
    const newEqs = equations.filter((_, i) => i !== idx);
    setEquations(newEqs);
    if (calculatorRef.current) calculatorRef.current.removeExpression({ id: `eq${idx}` });
  };

  const solveEquation = async () => {
    if (!eqInput.trim()) return;
    setSolving(true);
    setEqResult('');
    try {
      const res = await homeworkApi.ask({ question: `Please solve this mathematical equation step-by-step and show the final answer prominently: ${eqInput}` });
      setEqResult(res.data.answer || res.data.explanation || 'No response.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to solve equation');
    } finally {
      setSolving(false);
    }
  };

  const presets = [
    { label: 'Quadratic', eq: 'y = x^2' },
    { label: 'Sine', eq: 'y = \\sin(x)' },
    { label: 'Circle', eq: 'x^2 + y^2 = 25' },
    { label: 'Logistic', eq: 'y = \\frac{1}{1+e^{-x}}' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 h-full">
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-6 overflow-y-auto pr-2">
        <div className="card !p-6 space-y-6">
           <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
             <Calculator className="w-4 h-4 text-brand-500" /> Analytical Solver
           </h3>
           <textarea 
             value={eqInput}
             onChange={e => setEqInput(e.target.value)}
             onKeyDown={e => {
               if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 solveEquation();
               }
             }}
             placeholder="Equation input (Latex supported)..."
             className="w-full input !rounded-lg !py-4 text-sm font-mono h-28 resize-none"
           />
           <button 
             onClick={solveEquation} 
             disabled={solving || !eqInput.trim()}
             className="btn-primary w-full py-4 text-[10px] font-bold uppercase tracking-widest"
           >
             {solving ? 'Processing...' : 'Solve Equation'}
           </button>

           {eqResult && (
             <div className="mt-4 p-5 rounded-xl text-sm font-medium leading-relaxed max-h-80 overflow-y-auto"
               style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', border: '1px solid var(--border-primary)' }}>
               <TypewriterText text={eqResult} speed={10} />
             </div>
           )}
        </div>

        <div className="card !p-6 flex-1 flex flex-col min-h-0 space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
             <LineChart className="w-4 h-4 text-brand-500" /> Plot Libraries
          </h3>
          <div className="flex flex-wrap gap-2">
            {presets.map(p => (
              <button key={p.label} onClick={() => {
                const eq = p.eq;
                const idx = equations.findIndex(e => !e.trim());
                const targetIdx = idx === -1 ? equations.length : idx;
                const newEqs = [...equations];
                if (idx === -1) newEqs.push(eq); else newEqs[idx] = eq;
                if (newEqs[newEqs.length - 1].trim()) newEqs.push('');
                setEquations(newEqs);
                if (calculatorRef.current) calculatorRef.current.setExpression({ id: `eq${targetIdx}`, latex: eq });
              }}
                className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest hover:border-brand-500 hover:text-brand-500 transition-all"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 overflow-y-auto flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Functions</div>
            {equations.map((eq, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={eq} onChange={e => updateEquation(i, e.target.value)}
                  placeholder={`f(x) ${i + 1}`}
                  className="input flex-1 !h-10 !text-sm font-mono" />
                {equations.length > 1 && (
                  <button onClick={() => removeEquation(i)}
                    className="p-2 rounded-lg transition-all"
                    style={{ backgroundColor: 'var(--bg-muted)', color: 'var(--text-faint)' }}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 card !p-0 border-2 overflow-hidden relative min-h-[500px] shadow-2xl">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 space-y-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="w-10 h-10 rounded-full border-4 border-t-brand-500 animate-spin" style={{ borderColor: 'var(--bg-muted)' }} />
            <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>Initializing Engine</div>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}


interface Message {
  role: 'user' | 'assistant';
  content: string;
  fileName?: string;
  isNew?: boolean;
}

interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  created_at: string;
}

export default function HomeworkPage() {
  const [tab, setTab] = useState<'chat' | 'math'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { playSfx } = useSFX();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const r = await homeworkApi.history();
      setHistory(r.data.history || []);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.type.startsWith('image/')) return toast.error('Only PDF and image files supported');
    if (f.size > 10 * 1024 * 1024) return toast.error('Limit: 10MB');
    setFile(f);
    toast.success(`${f.name} uploaded.`);
  };

  const removeFile = () => {
    setFile(null);
    setPdfProgress('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const sendMessage = async () => {
    if (loading || (!input.trim() && !file)) return;
    const userMsg: Message = {
      role: 'user',
      content: input || `Analyzing document: ${file?.name}`,
      fileName: file?.name,
    };
    setMessages(prev => [...prev, userMsg]);
    const sentInput = input;
    setInput('');
    setLoading(true);
    playSfx('send');

    try {
      let res;
      if (file) {
        setPdfProgress('Extracting data...');
        const formData = new FormData();
        if (file.type.startsWith('image/')) {
          formData.append('image', file);
          formData.append('question', sentInput || 'Explain and solve the problem in this image.');
          res = await homeworkApi.askImage(formData);
        } else {
          formData.append('pdf', file);
          formData.append('question', sentInput || 'Please analyze this document and provide a summary.');
          res = await homeworkApi.askPdf(formData);
        }
        setFile(null);
        setPdfProgress('');
        if (fileRef.current) fileRef.current.value = '';
      } else {
        res = await homeworkApi.ask({ question: sentInput });
      }
      const answer = res.data.answer || res.data.explanation || 'Protocol response unavailable.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer, isNew: true }]);
      playSfx('pop');
      loadHistory();
    } catch (err: any) {
      toast.error('Connection timeout or logic error.');
      setMessages(prev => prev.slice(0, -1));
      setPdfProgress('');
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setMessages([
      { role: 'user', content: item.question },
      { role: 'assistant', content: item.answer },
    ]);
    setHistoryOpen(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const newChat = () => {
    setMessages([]);
    setInput('');
    setFile(null);
    setPdfProgress('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)] pt-6 pb-6 px-4 md:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
           <div>
              <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-3xl font-extrabold uppercase tracking-tight">AI Assistant</h1>
                 <div className="h-px w-12 bg-slate-200 dark:bg-slate-800" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-500">Live Node</span>
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Multi-modal problem solving & mathematical verification.</p>
           </div>

           <div className="flex gap-2 p-1.5 backdrop-blur rounded-xl border shadow-sm w-full md:w-auto" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
             <button 
               onClick={() => setTab('chat')}
               className={clsx(
                 "flex-1 md:flex-initial flex items-center justify-center gap-3 px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                 tab === 'chat' ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
               )}
               style={tab !== 'chat' ? { color: 'var(--text-muted)' } : {}}
             >
               <MessageSquare className="w-4 h-4" /> Synthesis
             </button>
             <button 
               onClick={() => setTab('math')}
               className={clsx(
                 "flex-1 md:flex-initial flex items-center justify-center gap-3 px-8 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                 tab === 'math' ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
               )}
               style={tab !== 'math' ? { color: 'var(--text-muted)' } : {}}
             >
               <LineChart className="w-4 h-4" /> Computation
             </button>
           </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {tab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full h-full flex gap-6"
              >
                {/* Secondary Sidebar (History) */}
                <AnimatePresence>
                  {historyOpen && (
                    <motion.aside
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 300, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="hidden lg:flex flex-col card !p-0 overflow-hidden"
                    >
                      <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
                         <h2 className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Interaction Log</h2>
                         <button onClick={() => setHistoryOpen(false)} className="hover:text-slate-900 dark:hover:text-white" style={{ color: 'var(--text-faint)' }}><X className="w-4 h-4" /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2">
                         {history.map(item => (
                            <button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group">
                               <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mb-1">{item.question}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Retrieve Protocol</div>
                            </button>
                         ))}
                      </div>
                    </motion.aside>
                  )}
                </AnimatePresence>

                {/* Main Interaction Area */}
                <div className="flex-1 flex flex-col min-w-0 card !p-0 shadow-2xl relative overflow-hidden">
                   {/* Top Toolbar */}
                   <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <button onClick={() => setHistoryOpen(!historyOpen)} className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all", historyOpen ? "bg-brand-500/10 border-brand-500/30 text-brand-500" : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white")}>
                            <Clock className="w-3.5 h-3.5" /> Log
                         </button>
                         <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                         <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 opacity-60">System Ready</span>
                      </div>
                      <button onClick={newChat} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">Clear Interface</button>
                   </div>

                   {/* Dialogue Thread */}
                   <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12">
                      {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-md mx-auto">
                           <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-inner">
                              <Brain className="w-10 h-10 text-brand-500" />
                           </div>
                           <div>
                              <h2 className="text-2xl font-extrabold uppercase tracking-tight mb-2">Initialize Consult</h2>
                              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest leading-relaxed">Present a complex problem or upload a primary source document for synthesis.</p>
                           </div>
                        </div>
                      )}

                      {messages.map((msg, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={clsx("flex gap-6", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                           <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border shadow-sm", msg.role === 'user' ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" : "bg-slate-950 dark:bg-white border-slate-950 dark:border-white")}>
                              {msg.role === 'user' ? <Search className="w-5 h-5 text-slate-400" /> : <Sparkles className="w-5 h-5 text-brand-500" />}
                           </div>
                           <div className={clsx("flex-1 max-w-2xl px-8 py-6 rounded-2xl border text-sm font-medium leading-relaxed", msg.role === 'user' ? "bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-sm")}>
                              {msg.role === 'assistant' && msg.isNew ? (
                                <TypewriterText text={msg.content} speed={12} onComplete={() => setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isNew: false } : m))} />
                              ) : (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                              )}
                           </div>
                        </motion.div>
                      ))}

                      {loading && (
                        <div className="flex gap-6">
                           <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center flex-shrink-0 animate-pulse">
                              <Sparkles className="w-5 h-5 text-brand-500" />
                           </div>
                           <ThinkingPulse />
                        </div>
                      )}
                      <div ref={bottomRef} />
                   </div>

                   {/* Input Terminal */}
                   <div className="flex-shrink-0 p-8 border-t border-slate-100 dark:border-slate-900 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl">
                      <div className="flex gap-4 items-center">
                         <div className="relative">
                            <button onClick={() => !loading && fileRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-brand-500 transition-all group">
                               <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-500" />
                            </button>
                            {file && <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full border-2 border-white dark:border-slate-950" />}
                         </div>
                         <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />
                         <input 
                           value={input} 
                           onChange={e => setInput(e.target.value)} 
                           onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && sendMessage()}
                           placeholder={pdfProgress || "Enter analytical query..."}
                           className="input flex-1 !h-14 !rounded-lg !py-0 !px-8 text-base shadow-sm"
                           disabled={loading} 
                         />
                         <button onClick={sendMessage} disabled={loading || (!input.trim() && !file)} className="w-14 h-14 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-30 disabled:scale-100">
                            <Send className="w-6 h-6" />
                         </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            )}

            {tab === 'math' && (
              <motion.div key="math" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="w-full h-full">
                <MathSuite />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
