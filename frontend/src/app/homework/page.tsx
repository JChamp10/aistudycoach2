'use client';
import { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { homeworkApi } from '@/lib/api';
import { HelpCircle, Send, Upload, X, FileText, Clock, ChevronLeft, Trash2, Calculator, LineChart, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSFX } from '@/lib/useSFX';
import { TypewriterText, ThinkingPulse } from '@/components/layout/TypewriterText';
import { useAuthStore } from '@/lib/store';

// ─── Desmos Graphing & Equation Solver ──────────────────────────────────────
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
      // If already initialized, destroy first
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
        backgroundColor: darkMode ? '#0f1115' : '#ffffff',
        textColor: darkMode ? '#ffffff' : '#000000',
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
      console.error('solveEquation error:', err);
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
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Settings & Solver Panel */}
      <div className="w-full md:w-80 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div className="card !rounded-2xl p-4 bg-surface-card border-2 border-surface-border space-y-4">
           <h3 className="font-extrabold flex items-center gap-2 text-text-primary">
             <Calculator className="w-5 h-5 text-duo-yellow" /> AI Equation Solver
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
             placeholder="e.g. 2x + 5 = 15"
             className="w-full input !rounded-xl !py-2 text-sm font-mono h-24 resize-none"
           />
           <button 
             onClick={solveEquation} 
             disabled={solving || !eqInput.trim()}
             className="btn-primary w-full py-2.5 text-sm"
           >
             {solving ? 'Solving...' : 'Solve Step-by-Step'}
           </button>

           {eqResult && (
             <div className="mt-4 p-3 bg-surface border-2 border-surface-border rounded-xl text-sm font-medium text-text-primary whitespace-pre-wrap max-h-64 overflow-y-auto w-full break-words">
               <TypewriterText text={eqResult} speed={10} />
             </div>
           )}
        </div>

        <div className="card !rounded-2xl p-4 bg-surface-card border-2 border-surface-border flex-1 flex flex-col min-h-0">
          <h3 className="font-extrabold flex items-center gap-2 text-text-primary mb-3 text-sm">
             <LineChart className="w-4 h-4 text-brand-500" /> Graphing Presets
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
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
                className="px-3 py-1.5 rounded-lg border-2 border-surface-border text-xs font-bold text-text-muted hover:border-brand-500 hover:text-brand-500 transition-colors">
                {p.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Active Scripts</div>
            {equations.map((eq, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={eq} onChange={e => updateEquation(i, e.target.value)}
                  placeholder={`Equation ${i + 1}`}
                  className="input flex-1 !h-9 !text-sm font-mono" />
                {equations.length > 1 && (
                  <button onClick={() => removeEquation(i)}
                    className="text-text-muted hover:text-red-500 p-1 bg-surface rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desmos Container */}
      <div className="flex-1 card !rounded-2xl border-2 border-surface-border overflow-hidden relative min-h-[400px]">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-card z-10">
            <div className="w-8 h-8 rounded-full border-4 border-surface-border border-t-brand-500 animate-spin" />
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
    if (f.type !== 'application/pdf' && !f.type.startsWith('image/')) return toast.error('Only PDF and image files are supported');
    if (f.size > 10 * 1024 * 1024) return toast.error('File must be under 10MB');
    setFile(f);
    toast.success(`${f.name} attached!`);
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
      content: input || `Please help me with this PDF: ${file?.name}`,
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
        setPdfProgress('Reading doc...');
        await new Promise(r => setTimeout(r, 400));
        const formData = new FormData();
        if (file.type.startsWith('image/')) {
          setPdfProgress('Analyzing image...');
          await new Promise(r => setTimeout(r, 400));
          formData.append('image', file);
          formData.append('question', sentInput || 'Explain and solve the problem in this image.');
          res = await homeworkApi.askImage(formData);
        } else {
          setPdfProgress('Extracting text...');
          await new Promise(r => setTimeout(r, 400));
          formData.append('pdf', file);
          formData.append('question', sentInput || 'Please explain and help me understand this document');
          res = await homeworkApi.askPdf(formData);
        }
        setFile(null);
        setPdfProgress('');
        if (fileRef.current) fileRef.current.value = '';
      } else {
        res = await homeworkApi.ask({ question: sentInput });
      }
      const answer = res.data.answer || res.data.explanation || 'No response received.';
      setMessages(prev => [...prev, { role: 'assistant', content: answer, isNew: true }]);
      playSfx('pop');
      loadHistory();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to get answer');
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

  const suggestions = [
    'Explain the Pythagorean theorem',
    'How does photosynthesis work?',
    'What caused World War I?',
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-4rem)] pt-4 pb-4 px-2 sm:px-0">
        
        {/* Top Header / Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 mb-4 bg-surface-card rounded-2xl border-b-4 border-x-2 border-t-2 border-surface-border shadow-sm">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <div className="w-12 h-12 rounded-xl bg-duo-blue border-b-4 border-duo-blueShadow flex items-center justify-center">
              {tab === 'chat' ? <HelpCircle className="w-6 h-6 text-white" /> : <Calculator className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary">
                {tab === 'chat' ? 'AI Homework Helper' : 'Math Suite'}
              </h1>
              <p className="text-xs font-bold text-text-muted">
                {tab === 'chat' ? 'Your personal tutor for any subject' : 'Graphing calculator & equation solver'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-surface-muted rounded-xl border-2 border-surface-border">
            <button 
              onClick={() => setTab('chat')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === 'chat' 
                  ? 'bg-brand-500 text-white shadow-sm' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> Chat
            </button>
            <button 
              onClick={() => setTab('math')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                tab === 'math' 
                  ? 'bg-brand-500 text-white shadow-sm' 
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
              }`}
            >
              <LineChart className="w-4 h-4" /> Math
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 flex gap-4 overflow-hidden relative">
          
          <AnimatePresence mode="wait">
            {tab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-full flex gap-4"
              >
                {/* History panel inside chat tab */}
                <AnimatePresence>
                  {historyOpen && (
                    <>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-20 md:hidden"
                        onClick={() => setHistoryOpen(false)} />

                      <motion.aside
                        initial={{ x: -280, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -280, opacity: 0 }}
                        className="w-72 flex-shrink-0 flex flex-col card !rounded-2xl z-30 absolute md:relative h-full overflow-hidden border-2 border-surface-border">
                        <div className="flex items-center justify-between px-4 py-4 border-b-2 border-surface-border">
                          <h2 className="font-extrabold flex items-center gap-2 text-text-primary">
                            <Clock className="w-5 h-5 text-duo-yellow" /> History
                          </h2>
                          <button onClick={() => setHistoryOpen(false)} className="text-text-muted p-1 rounded-xl">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                          {historyLoading ? (
                            <div className="skeleton h-16 rounded-xl" />
                          ) : history.map(item => (
                            <button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left px-3 py-3 rounded-xl hover:bg-surface-elevated border-2 border-transparent hover:border-surface-border transition-all">
                              <div className="text-sm font-bold text-text-primary truncate">{item.question}</div>
                            </button>
                          ))}
                        </div>
                      </motion.aside>
                    </>
                  )}
                </AnimatePresence>

                {/* Main chat UI */}
                <div className="flex-1 flex flex-col min-w-0 card !rounded-2xl border-2 border-surface-border relative">
                  
                  <div className="flex-shrink-0 pb-3 pt-3 px-4 border-b-2 border-surface-border flex items-center gap-3">
                    <button onClick={() => setHistoryOpen(!historyOpen)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 font-bold transition-all ${
                        historyOpen ? 'bg-brand-500/10 border-brand-500/30 text-brand-500' : 'border-surface-border text-text-muted'
                      }`}>
                      <Clock className="w-4 h-4" /> History
                    </button>
                    <div className="flex-1" />
                    {messages.length > 0 && (
                      <button onClick={newChat} className="text-sm px-3 py-1.5 rounded-xl border-2 border-surface-border text-text-muted font-bold">
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-6 px-4 py-4">
                    {messages.length === 0 && (
                      <div className="text-center py-16">
                        <div className="text-7xl animate-bounce-pop mb-6">🤖</div>
                        <h2 className="text-2xl font-extrabold text-text-primary">Stuck on a problem?</h2>
                        <p className="text-text-muted font-bold mb-6 max-w-sm mx-auto">Upload an image of your homework, or type out the question below.</p>
                      </div>
                    )}
                    
                    {messages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-lg bg-duo-blue flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                            <HelpCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div className={`max-w-[75%] rounded-2xl px-5 py-4 text-[15px] font-medium leading-relaxed border-2 border-b-4 ${
                          msg.role === 'user' ? 'bg-brand-500 border-brand-600 text-white rounded-tr-sm' : 'rounded-tl-sm'
                        }`} style={msg.role === 'assistant' ? { background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' } : {}}>
                          {msg.role === 'assistant' && msg.isNew ? (
                            <TypewriterText text={msg.content} speed={15} onComplete={() => setMessages(prev => prev.map((m, idx) => idx === i ? { ...m, isNew: false } : m))} />
                          ) : (
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {loading && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-lg bg-duo-blue flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                          <HelpCircle className="w-4 h-4 text-white" />
                        </div>
                        <ThinkingPulse />
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input area */}
                  <div className="flex-shrink-0 p-4 border-t-2 border-surface-border bg-surface-card rounded-b-2xl">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => !loading && fileRef.current?.click()} 
                        disabled={loading}
                        className="w-14 h-14 rounded-2xl border-2 border-surface-border flex items-center justify-center hover:border-duo-blue hover:text-duo-blue transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-6 h-6" />
                      </button>
                      <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFile} />
                      <input 
                        value={input} 
                        onChange={e => setInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && sendMessage()} 
                        placeholder="Type your question..." 
                        className="input flex-1 h-14" 
                        disabled={loading} 
                      />
                      <button 
                        onClick={sendMessage} 
                        disabled={loading || (!input.trim() && !file)} 
                        className="btn-primary w-14 h-14 !p-0 flex items-center justify-center disabled:opacity-50"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'math' && (
              <motion.div 
                key="math"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full"
              >
                <MathSuite />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AppLayout>
  );
}
