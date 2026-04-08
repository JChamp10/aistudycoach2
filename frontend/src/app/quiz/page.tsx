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

  const { playSfx } = useSFX();

  useEffect(() => {
    flashcardApi.decks().then(res => setDecks(res.data.decks || []));
  }, []);

  const generateQuiz = async () => {
    if (!topic.trim() && !selectedDeckId) {
      return toast.error('Enter a topic or select a deck!');
    }
    setPhase('generating');
    try {
      const payload: any = { difficulty, count: 5 };
      if (selectedDeckId) payload.deck_id = selectedDeckId;
      else payload.topic = topic;
      
      const res = await quizApi.generate(payload);
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

  if (phase === 'setup') return (
    <AppLayout>
      <div className="max-w-md mx-auto space-y-6 pt-4">
        <div className="text-center">
           <div className="w-16 h-16 bg-duo-yellow rounded-2xl border-b-4 border-duo-yellowShadow flex items-center justify-center mx-auto mb-4">
             <Zap className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-extrabold mb-2 text-text-primary">Quick Quiz</h1>
           <p className="text-text-muted font-bold">Generate a 5-question AI quiz to test your memory.</p>
        </div>

        <div className="card space-y-6">
           <div>
              <label className="block text-sm font-bold mb-2">What do you want to practice?</label>
              <input 
                value={topic}
                onChange={e => { setTopic(e.target.value); setSelectedDeckId(''); }}
                placeholder="e.g. World War II, React Hooks"
                className="input mb-3"
              />
              {decks.length > 0 && (
                <>
                  <div className="text-center text-text-muted font-bold text-xs mb-3">OR SELECT DECK</div>
                  <select 
                    className="input" 
                    value={selectedDeckId} 
                    onChange={e => { setSelectedDeckId(e.target.value); setTopic(''); }}
                  >
                    <option value="">-- Choose a Deck --</option>
                    {decks.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                  </select>
                </>
              )}
           </div>

           <div>
              <label className="block text-sm font-bold mb-2">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                 {['easy', 'medium', 'hard'].map(level => (
                   <button 
                     key={level}
                     onClick={() => setDifficulty(level)}
                     className={`py-2 rounded-xl border-2 font-bold uppercase text-xs transition-colors ${difficulty === level ? 'bg-duo-blue/10 border-duo-blue text-duo-blue shadow-[0_4px_0_var(--brand-glow)]' : 'border-surface-border text-text-muted'}`}
                   >
                     {level}
                   </button>
                 ))}
              </div>
           </div>

           <button onClick={generateQuiz} className="btn-primary w-full py-4 text-lg">
             START QUIZ
           </button>
        </div>
      </div>
    </AppLayout>
  );

  if (phase === 'generating') return (
    <AppLayout>
      <div className="max-w-md mx-auto flex flex-col items-center justify-center h-[60vh]">
         <Loader2 className="w-16 h-16 text-brand-500 animate-spin mb-6" />
         <h2 className="text-2xl font-extrabold text-center">Loading your quiz...</h2>
      </div>
    </AppLayout>
  );

  if (phase === 'quiz') {
    const q = questions[currentIdx];
    const opts = q.options as string[];
    
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto space-y-6 pt-4">
           {/* Progress */}
           <div className="flex items-center gap-4">
              <div className="xp-bar flex-1">
                 <motion.div 
                   className="xp-bar-fill"
                   initial={{ width: `${(currentIdx / questions.length) * 100}%` }}
                   animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                 />
              </div>
           </div>

           <h2 className="text-2xl font-extrabold leading-tight text-text-primary px-2">
             {q.question}
           </h2>

           <div className="grid grid-cols-1 gap-3">
             {opts.map((opt, i) => {
               const isSelected = selectedOpt === opt;
               const isCorrectAnswer = opt === q.correct_answer;
               
               let classes = "card !p-4 border-2 border-b-4 font-bold text-lg text-left transition-all ";
               
               if (!isRevealed) {
                 classes += isSelected 
                   ? "bg-duo-blue/10 border-duo-blue text-duo-blue"
                   : "border-surface-border text-text-primary hover:bg-surface-muted";
               } else {
                 if (isCorrectAnswer) classes += "bg-brand-100 border-brand-500 text-brand-600";
                 else if (isSelected) classes += "bg-red-50 border-duo-red text-duo-red";
                 else classes += "bg-surface border-surface-border opacity-50";
               }

               return (
                 <button 
                   key={i} 
                   onClick={() => !isRevealed && setSelectedOpt(opt)}
                   disabled={isRevealed}
                   className={classes}
                 >
                   <div className="flex items-center justify-between">
                     <span>{opt}</span>
                     {isRevealed && isCorrectAnswer && <CheckCircle2 className="w-6 h-6 text-brand-500" />}
                     {isRevealed && isSelected && !isCorrectAnswer && <XCircle className="w-6 h-6 text-duo-red" />}
                   </div>
                 </button>
               );
             })}
           </div>

           <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur-sm border-t-2 border-surface-border md:static md:bg-transparent md:border-0 md:p-0">
             <button 
               onClick={submitAnswer} 
               disabled={!selectedOpt || isRevealed}
               className={`btn-primary w-full py-4 text-lg ${!selectedOpt ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               CHECK
             </button>
           </div>
        </div>
      </AppLayout>
    );
  }

  if (phase === 'result') {
    const accuracy = Math.round((quizResult.correct / quizResult.total) * 100);
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center pt-10 space-y-8 animate-bounce-pop">
           <div className="w-32 h-32 mx-auto bg-brand-100 rounded-full border-4 border-brand-500 flex items-center justify-center relative overflow-hidden">
             <Zap className="w-16 h-16 text-brand-500" />
           </div>
           
           <div>
             <h1 className="text-4xl font-extrabold text-brand-500 mb-2">Quiz Complete!</h1>
             <p className="text-xl font-bold text-text-muted">{accuracy}% Accuracy</p>
           </div>

           <div className="flex gap-4 justify-center py-6">
              <div className="card border-duo-blue bg-duo-blue/10 p-4 flex-1">
                 <div className="text-3xl font-extrabold text-duo-blue">+{quizResult.xp?.xpGained || 0}</div>
                 <div className="text-sm font-bold text-text-muted uppercase">XP Earned</div>
              </div>
              <div className="card border-brand-500 bg-brand-100 p-4 flex-1">
                 <div className="text-3xl font-extrabold text-brand-600">{quizResult.correct}/{quizResult.total}</div>
                 <div className="text-sm font-bold text-text-muted uppercase">Correct</div>
              </div>
           </div>

           <button onClick={() => { setPhase('setup'); setTopic(''); setSelectedDeckId(''); }} className="btn-primary w-full py-4 text-lg">
             CONTINUE
           </button>
        </div>
      </AppLayout>
    );
  }
}
