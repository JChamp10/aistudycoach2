'use client';
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { quizApi, flashcardApi } from '@/lib/api';
import { Zap, Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSFX } from '@/lib/useSFX';
import confetti from 'canvas-confetti';

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
    }, 1500);
  };

  const finishQuiz = async () => {
    setPhase('generating'); // repurpose as loading screen
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
        colors: ['#22c55e', '#eab308', '#3b82f6', '#ef4444']
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
      <div className="max-w-xl mx-auto space-y-8 pt-8 pb-20">
        <header className="text-center">
           <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-500 mb-6">
              <Zap className="w-3.5 h-3.5" /> High Performance Quiz
           </div>
           <h1 className="text-4xl font-black mb-2 tracking-tight">Challenge Your Memory</h1>
           <p className="text-slate-500 font-medium">Generate an AI-powered quiz to solidify your recall.</p>
        </header>

        <div className="card !p-8 space-y-8">
           <section>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Quiz Source</label>
              <div className="space-y-4">
                <input 
                  value={topic}
                  onChange={e => { setTopic(e.target.value); setSelectedDeckId(''); }}
                  placeholder="Enter any topic (e.g., Quantum Physics)..."
                  className="input !text-lg !py-4"
                />
                
                {decks.length > 0 && (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                    </div>
                    <select 
                      className="input !pl-11" 
                      value={selectedDeckId} 
                      onChange={e => { setSelectedDeckId(e.target.value); setTopic(''); setPdfFile(null); }}
                    >
                      <option value="">-- Or Select a Deck --</option>
                      {decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                    </select>
                  </div>
                )}

                <label className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${pdfFile ? 'border-brand-500 bg-brand-500/5' : 'border-slate-700 hover:border-slate-500'}`}>
                   <input type="file" accept=".pdf" className="hidden" onChange={e => {
                     const file = e.target.files?.[0];
                     if (file) { setPdfFile(file); setTopic(''); setSelectedDeckId(''); }
                   }} />
                   {pdfFile ? (
                      <div className="flex items-center gap-2 text-brand-500 font-bold">
                        <FileText className="w-5 h-5" /> {pdfFile.name}
                      </div>
                   ) : (
                      <div className="text-slate-500 flex items-center gap-2 font-medium">
                        <Upload className="w-4 h-4" /> Upload PDF for Quiz
                      </div>
                   )}
                </label>
              </div>
           </section>

           <section>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Intensity</label>
              <div className="grid grid-cols-3 gap-3">
                 {['easy', 'medium', 'hard'].map(level => (
                   <button 
                     key={level}
                     onClick={() => setDifficulty(level)}
                     className={`py-3 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${difficulty === level ? 'border-brand-500 bg-brand-500/10 text-brand-500' : 'border-slate-700 text-slate-500'}`}
                   >
                     {level}
                   </button>
                 ))}
              </div>
           </section>

           <button onClick={generateQuiz} className="btn-primary w-full !py-5 text-base flex items-center justify-center gap-2">
             Begin Session <Play className="w-4 h-4 fill-current" />
           </button>
        </div>
      </div>
    </AppLayout>
  );

  if (phase === 'generating') return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col items-center justify-center h-[70vh] text-center">
         <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin mb-8 shadow-glow" />
         <h2 className="text-3xl font-black mb-2">Preparing the Ritual</h2>
         <p className="text-slate-500 font-medium">AI is crafting unique challenges for your mind.</p>
      </div>
    </AppLayout>
  );

  if (phase === 'quiz') {
    const q = questions[currentIdx];
    const opts = q.options as string[];
    
    return (
      <AppLayout>
        <div className={clsx("min-h-screen flex flex-col transition-all duration-700", focusMode ? "bg-slate-950 pt-10" : "pt-8")}>
          <div className="max-w-3xl mx-auto w-full px-6 flex flex-col items-center">
             
             {/* Quiz Header */}
             <div className="w-full mb-16 flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
                  Challenge {currentIdx + 1} / {questions.length}
                </div>
                <button 
                  onClick={() => setFocusMode(!focusMode)}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[10px] font-bold uppercase tracking-[0.2em]",
                    focusMode ? "border-brand-500/50 bg-brand-500/10 text-brand-400" : "border-slate-700 text-slate-400"
                  )}
                >
                  <Brain className="w-3.5 h-3.5" />
                  {focusMode ? "Focus Active" : "Focus Mode"}
                </button>
             </div>

             {/* Progress bar */}
             <div className="w-full mb-16">
               <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-500 shadow-[0_0_12px_rgba(255,107,26,0.4)]"
                    initial={{ width: `${(currentIdx / questions.length) * 100}%` }}
                    animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
               </div>
             </div>

             <AnimatePresence mode="wait">
               <motion.div 
                 key={currentIdx}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="w-full"
               >
                 <h2 className="text-3xl font-black leading-tight mb-12 text-center max-w-2xl mx-auto">
                   {q.question}
                 </h2>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                   {opts.map((opt, i) => {
                     const isSelected = selectedOpt === opt;
                     const isCorrectAnswer = opt === q.correct_answer;
                     
                     let bgClass = "bg-slate-900 border-slate-800 hover:border-slate-600";
                     if (isRevealed) {
                       if (isCorrectAnswer) bgClass = "bg-brand-500/20 border-brand-500 text-brand-400";
                       else if (isSelected) bgClass = "bg-red-500/20 border-red-500 text-red-400";
                       else bgClass = "bg-slate-900/50 border-slate-800 opacity-40";
                     } else if (isSelected) {
                       bgClass = "border-brand-500 bg-brand-500/5 text-brand-500 shadow-glow";
                     }

                     return (
                       <button 
                         key={i} 
                         onClick={() => !isRevealed && setSelectedOpt(opt)}
                         disabled={isRevealed}
                         className={clsx(
                           "p-6 rounded-2xl border-2 text-lg font-bold text-left transition-all duration-300",
                           bgClass
                         )}
                       >
                         <div className="flex items-center justify-between">
                            <span>{opt}</span>
                            {isRevealed && isCorrectAnswer && <CheckCircle2 className="w-6 h-6 text-brand-500" />}
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
                   "btn-primary w-full !py-5 text-base font-black tracking-widest transition-all",
                   (!selectedOpt || isRevealed) && "opacity-20 grayscale cursor-not-allowed"
                 )}
               >
                 VERIFY RECALL
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
        <div className="max-w-2xl mx-auto text-center pt-16 space-y-12 pb-20">
           <div className="relative inline-block">
              <div className="w-32 h-32 mx-auto bg-brand-500/10 rounded-full border-4 border-brand-500 flex items-center justify-center shadow-glow">
                <Zap className="w-16 h-16 text-brand-500 fill-current" />
              </div>
           </div>
           
           <div>
             <h1 className="text-5xl font-black mb-4 tracking-tight">Session Over</h1>
             <p className="text-xl font-medium text-slate-500">{accuracy}% Accuracy achieved.</p>
           </div>

           <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="card !p-6 border-brand-500/30 bg-brand-500/5">
                 <div className="text-4xl font-black text-brand-500 mb-1">+{quizResult.xp?.xpGained || 0}</div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">XP Manifested</div>
              </div>
              <div className="card !p-6 border-slate-700 bg-slate-800/20">
                 <div className="text-4xl font-black mb-1">{quizResult.correct}/{quizResult.total}</div>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recalled</div>
              </div>
           </div>

           <button onClick={() => { setPhase('setup'); setTopic(''); setSelectedDeckId(''); }} className="btn-primary !px-12 !py-5 text-base">
             CONTINUE THE JOURNEY →
           </button>
        </div>
      </AppLayout>
    );
  }
}
