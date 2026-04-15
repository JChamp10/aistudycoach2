'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { quizApi, flashcardApi } from '@/lib/api';
import { Zap, Play, CheckCircle2, XCircle, Loader2, BookOpen, FileText, Upload, Brain, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSFX } from '@/lib/useSFX';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';

export default function QuizPage() {
  const [decks, setDecks] = useState<any[]>([]);
  const [topic, setTopic] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [phase, setPhase] = useState<'setup' | 'generating' | 'quiz' | 'result'>('setup');
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const { playSfx } = useSFX();

  useEffect(() => {
    flashcardApi.decks().then(res => setDecks(res.data.decks || []));
  }, []);

  const generateQuiz = async () => {
    if (phase === 'generating') return;
    if (!topic.trim() && !selectedDeckId && !pdfFile) {
      return toast.error('Enter a topic, select a deck, or upload a PDF!');
    }
    setPhase('generating');
    try {
      let res;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        formData.append('difficulty', difficulty);
        formData.append('count', '5');
        res = await quizApi.generateFromPdf(formData);
      } else {
        const payload: any = { difficulty, count: 5 };
        if (selectedDeckId) payload.deck_id = selectedDeckId;
        else payload.topic = topic;
        res = await quizApi.generate(payload);
      }
      
      const q = res.data.questions || [];
      if (q.length === 0) {
        toast.error('No questions were generated');
        return setPhase('setup');
      }
      setQuestions(q);
      setCurrentIdx(0);
      setAnswers([]);
      setPhase('quiz');
    } catch {
      toast.error('Failed to generate quiz');
      setPhase('setup');
    }
  };

  const submitAnswer = () => {
    if (!selectedOpt) return;
    setIsRevealed(true);
    const q = questions[currentIdx];
    const isCorrect = selectedOpt === q.correct_answer;
    
    if (isCorrect) playSfx('success');
    else playSfx('pop');

    setAnswers(prev => [...prev, { questionId: q.id, userAnswer: selectedOpt }]);
    
    setTimeout(() => {
      if (currentIdx + 1 < questions.length) {
        setCurrentIdx(c => c + 1);
        setSelectedOpt(null);
        setIsRevealed(false);
      } else {
        finishQuiz();
      }
    }, 1200);
  };

  const finishQuiz = async () => {
    setPhase('generating');
    try {
      const newAnswers = [...answers];
      if (selectedOpt && !isRevealed) {
         newAnswers.push({ questionId: questions[currentIdx].id, userAnswer: selectedOpt });
      }
      const res = await quizApi.submit({ answers: newAnswers, sessionId: `quiz_${Date.now()}` });
      setQuizResult(res.data);
      playSfx('success');
      
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#dc7b1e', '#f4b940', '#ffffff']
      });

      setPhase('result');
    } catch {
      toast.error('Failed to submit results');
      setPhase('setup');
    }
  };

  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (focusMode) document.body.classList.add('focus-mode');
    else document.body.classList.remove('focus-mode');
    return () => document.body.classList.remove('focus-mode');
  }, [focusMode]);

  if (phase === 'setup') return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-10 pt-10 pb-24">
        <header className="text-center">
           <div className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] mb-8 shadow-sm"
             style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
              <Zap className="w-3.5 h-3.5" /> High Precision Assessment
           </div>
           <h1 className="text-4xl font-extrabold mb-3 tracking-tight uppercase">Knowledge Verification</h1>
           <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Generate a focused evaluation to validate your recall.</p>
        </header>

        <div className="card !p-10 space-y-10">
           <section>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Input Parameters</label>
              <div className="space-y-4">
                <input 
                  value={topic}
                  onChange={e => { setTopic(e.target.value); setSelectedDeckId(''); }}
                  placeholder="Subject or specific topic..."
                  className="input !text-lg !py-4"
                />
                
                {decks.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-1 flex items-center pointer-events-none">
                      <BookOpen className="w-4 h-4 ml-4" style={{ color: 'var(--text-faint)' }} />
                    </div>
                    <select 
                      className="input !pl-11" 
                      value={selectedDeckId} 
                      onChange={e => { setSelectedDeckId(e.target.value); setTopic(''); setPdfFile(null); }}
                    >
                      <option value="">-- Use Specific Deck --</option>
                      {decks.map(d => <option key={d.id} value={d.id}>{d.title} ({d.card_count} cards)</option>)}
                    </select>
                  </div>
                )}

                <label className={clsx(
                  "relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all",
                  pdfFile ? "border-brand-500 bg-brand-500/5 transition-colors" : "hover:border-brand-500/40"
                )} style={!pdfFile ? { borderColor: 'var(--border-primary)' } : {}}>
                   <input type="file" accept=".pdf" className="hidden" onChange={e => {
                     const file = e.target.files?.[0];
                     if (file) { setPdfFile(file); setTopic(''); setSelectedDeckId(''); }
                   }} />
                   {pdfFile ? (
                      <div className="flex items-center gap-3 text-brand-500 font-black uppercase text-xs">
                        <FileText className="w-5 h-5" /> {pdfFile.name}
                      </div>
                   ) : (
                      <div className="flex flex-col items-center gap-3" style={{ color: 'var(--text-faint)' }}>
                        <Upload className="w-6 h-6" /> 
                        <span className="text-[10px] font-black uppercase tracking-widest">Analyze PDF Source</span>
                      </div>
                   )}
                </label>
              </div>
           </section>

           <section>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4">Complexity Level</label>
              <div className="grid grid-cols-3 gap-3">
                 {['easy', 'medium', 'hard'].map(level => (
                   <button 
                     key={level}
                     onClick={() => setDifficulty(level)}
                     className={clsx(
                       "py-3 rounded-lg border-2 font-bold uppercase text-[10px] tracking-widest transition-all",
                       difficulty === level ? "border-brand-500 bg-brand-500/10 text-brand-500" : "border-slate-200 dark:border-slate-800 text-slate-400"
                     )}
                   >
                     {level}
                   </button>
                 ))}
              </div>
           </section>

           <button onClick={generateQuiz} className="btn-primary w-full !py-5 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
             Initialize Assessment <Play className="w-3.5 h-3.5 fill-current" />
           </button>
        </div>
      </div>
    </AppLayout>
  );

  if (phase === 'generating') return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col items-center justify-center h-[70vh] text-center space-y-8">
         <div className="w-16 h-16 rounded-full border-4 border-t-brand-500 animate-spin" style={{ borderColor: 'var(--bg-muted)' }} />
         <div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Compiling Evaluation</h2>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Optimizing challenge parameters.</p>
         </div>
      </div>
    </AppLayout>
  );

  if (phase === 'quiz') {
    const q = questions[currentIdx];
    const opts = q.options as string[];
    
    return (
      <AppLayout>
        <div className={clsx("min-h-screen flex flex-col transition-all duration-700", focusMode ? "bg-slate-950 pt-10" : "pt-10")}>
          <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center">
             
             <div className="w-full mb-12 flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--text-faint)' }}>
                  Query {currentIdx + 1} / {questions.length}
                </div>
                <button 
                  onClick={() => setFocusMode(!focusMode)}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-widest",
                    focusMode ? "border-brand-500/50 bg-brand-500/10 text-brand-500 shadow-[0_0_15px_rgba(220,123,30,0.1)]" : "text-slate-400 hover:border-slate-300 dark:hover:border-white"
                  )}
                  style={!focusMode ? { borderColor: 'var(--border-primary)', color: 'var(--text-faint)' } : {}}
                >
                  <Brain className="w-3.5 h-3.5" />
                  {focusMode ? "Isolation Active" : "Isolation Mode"}
                </button>
             </div>

             <div className="w-full mb-16">
               <div className="h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    className="h-full bg-brand-500 shadow-[0_0_10px_rgba(220,123,30,0.3)]"
                    initial={{ width: `${(currentIdx / questions.length) * 100}%` }}
                    animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                  />
               </div>
             </div>

             <AnimatePresence mode="wait">
               <motion.div 
                 key={currentIdx}
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -15 }}
                 className="w-full max-w-2xl px-4"
               >
                 <div className="text-center mb-12">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 opacity-70">Objective Inquiry</div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">
                      {q.question}
                    </h2>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {opts.map((opt, i) => {
                     const isSelected = selectedOpt === opt;
                     const isCorrectAnswer = opt === q.correct_answer;
                     
                     let bgClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-500/40";
                     if (isRevealed) {
                       if (isCorrectAnswer) bgClass = "bg-green-500/10 border-green-500/60 text-green-600 dark:text-green-400";
                       else if (isSelected) bgClass = "bg-red-500/10 border-red-500/60 text-red-600 dark:text-red-400";
                       else bgClass = "opacity-40 grayscale";
                     } else if (isSelected) {
                       bgClass = "border-emerald-500 bg-emerald-500/5 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                     }

                     return (
                       <button 
                         key={i} 
                         onClick={() => !isRevealed && setSelectedOpt(opt)}
                         disabled={isRevealed}
                         className={clsx(
                           "p-8 rounded-lg border-2 text-base font-bold text-left transition-all duration-300",
                           bgClass
                         )}
                       >
                         <div className="flex items-center justify-between gap-4">
                            <span>{opt}</span>
                            {isRevealed && isCorrectAnswer && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                            {isRevealed && isSelected && !isCorrectAnswer && <XCircle className="w-6 h-6 text-red-500" />}
                         </div>
                       </button>
                     );
                   })}
                 </div>
               </motion.div>
             </AnimatePresence>

             <div className="mt-16 w-full max-w-md">
               <button 
                 onClick={submitAnswer} 
                 disabled={!selectedOpt || isRevealed}
                 className={clsx(
                   "btn-primary w-full !py-5 text-xs font-black uppercase tracking-[0.3em] transition-all",
                   (!selectedOpt || isRevealed) && "opacity-20 grayscale cursor-not-allowed"
                 )}
               >
                 Confirm Verification
               </button>
             </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (phase === 'result') {
    const accuracy = Math.round((quizResult.correct / quizResult.total) * 100);
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto text-center pt-20 space-y-12 pb-24">
           <div className="flex justify-center">
              <div className="w-24 h-24 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-700 shadow-2xl">
                 <Trophy className="w-10 h-10 text-brand-500" />
              </div>
           </div>
           
           <div>
              <h1 className="text-5xl font-black uppercase tracking-tight mb-4">Evaluation Summary</h1>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">{accuracy}% Recall Efficiency Achieved</p>
           </div>

           <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
              <div className="card !p-8" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
                 <div className="text-4xl font-black text-brand-500 mb-2">+{quizResult.xp?.xpGained || 0}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>XP Allocation</div>
              </div>
              <div className="card !p-8" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
                 <div className="text-4xl font-black mb-2">{quizResult.correct}/{quizResult.total}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Successful Recalls</div>
              </div>
           </div>

           <div className="flex justify-center pt-6">
              <button onClick={() => { setPhase('setup'); setTopic(''); setSelectedDeckId(''); }} className="btn-primary !px-16 !py-5 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                Close Session <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </AppLayout>
    );
  }
}
