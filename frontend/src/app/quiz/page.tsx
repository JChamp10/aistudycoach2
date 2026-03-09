'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { quizApi, studyApi } from '@/lib/api';
import { Shuffle, CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getDifficultyColor } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  difficulty: string;
}

interface QuizResult {
  score: number;
  correct: number;
  total: number;
  results: { questionId: string; isCorrect: boolean; correctAnswer: string; explanation: string }[];
  xp: any;
}

export default function QuizPage() {
  const [step, setStep] = useState<'setup' | 'quiz' | 'review'>('setup');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    if (!topic.trim()) return toast.error('Enter a topic');
    setLoading(true);
    try {
      const res = await quizApi.generate({ topic, difficulty, count });
      setQuestions(res.data.questions);
      setStep('quiz');
      setCurrentIdx(0);
      setAnswers({});
      setSelected(null);
      setConfirmed(false);
    } catch {
      toast.error('Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  const confirmAnswer = () => {
    if (!selected) return;
    const q = questions[currentIdx];
    setAnswers(prev => ({ ...prev, [q.id]: selected }));
    setConfirmed(true);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) submitQuiz();
    else { setCurrentIdx(prev => prev + 1); setSelected(null); setConfirmed(false); }
  };

  const submitQuiz = async () => {
    const answersArr = Object.entries(answers).map(([questionId, userAnswer]) => ({ questionId, userAnswer }));
    try {
      const res = await quizApi.submit({ answers: answersArr });
      setResult(res.data);
      await studyApi.recordSession({ type: 'quiz', score: res.data.score, duration_minutes: Math.ceil(questions.length * 1.5) });
      setStep('review');
    } catch { toast.error('Failed to submit'); }
  };

  const q = questions[currentIdx];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Shuffle className="w-6 h-6 text-amber-400" />
            </div>
            Mixed Practice Quiz
          </h1>
          <p className="text-slate-400 mt-2">AI-generated questions to test your knowledge.</p>
        </div>

        {step === 'setup' && (
          <div className="card space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Topic</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Calculus, Chemistry..." className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-3 block">Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2.5 rounded-xl border font-medium text-sm capitalize transition-all ${difficulty === d ? getDifficultyColor(d) : 'border-surface-border text-slate-500 hover:border-slate-500'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Questions: {count}</label>
              <input type="range" min="3" max="20" value={count} onChange={e => setCount(+e.target.value)} className="w-full accent-brand-500" />
            </div>
            <button onClick={generateQuiz} disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Generating...' : `Generate ${count} questions →`}
            </button>
          </div>
        )}

        {step === 'quiz' && q && (
          <AnimatePresence mode="wait">
            <motion.div key={currentIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="xp-bar flex-1 h-2"><div className="xp-bar-fill" style={{ width: `${(currentIdx / questions.length) * 100}%` }} /></div>
                <span className="text-sm text-slate-400">{currentIdx + 1}/{questions.length}</span>
              </div>
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge border ${getDifficultyColor(q.difficulty)} capitalize`}>{q.difficulty}</span>
                </div>
                <h2 className="text-lg font-semibold mb-6">{q.question}</h2>
                <div className="space-y-3">
                  {(q.options || []).map((opt, i) => {
                    let style = 'border-surface-border hover:border-brand-500/50 hover:bg-brand-500/5';
                    if (confirmed) {
                      if (opt === q.correct_answer) style = 'border-green-500/50 bg-green-500/10 text-green-300';
                      else if (opt === selected) style = 'border-red-500/50 bg-red-500/10 text-red-300';
                      else style = 'border-surface-border opacity-50';
                    } else if (opt === selected) style = 'border-brand-500 bg-brand-500/10';
                    return (
                      <button key={i} onClick={() => !confirmed && setSelected(opt)} className={`w-full text-left p-4 rounded-xl border transition-all ${style}`} disabled={confirmed}>
                        <span className="font-mono text-sm text-slate-500 mr-3">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                        {confirmed && opt === q.correct_answer && <CheckCircle className="inline w-4 h-4 text-green-400 ml-2" />}
                        {confirmed && opt === selected && opt !== q.correct_answer && <XCircle className="inline w-4 h-4 text-red-400 ml-2" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-6">
                  {!confirmed ? (
                    <button onClick={confirmAnswer} disabled={!selected} className="btn-primary w-full disabled:opacity-50">Confirm Answer</button>
                  ) : (
                    <button onClick={nextQuestion} className="btn-primary w-full">{currentIdx + 1 >= questions.length ? 'Finish Quiz →' : 'Next Question →'}</button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {step === 'review' && result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card text-center border-amber-500/20">
              <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <div className="text-5xl font-extrabold mb-2" style={{ color: result.score >= 0.8 ? '#4ade80' : result.score >= 0.6 ? '#fbbf24' : '#f87171' }}>
                {Math.round(result.score * 100)}%
              </div>
              <p className="text-slate-400">{result.correct} / {result.total} correct</p>
              {result.xp && <div className="mt-3 badge bg-brand-500/20 text-brand-400 border-brand-500/30 mx-auto">+{result.xp.xpGained} XP earned</div>}
            </div>
            <div className="space-y-3">
              {result.results.map((r, i) => {
                const q = questions[i];
                return (
                  <div key={r.questionId} className={`card border ${r.isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <div className="flex items-start gap-3">
                      {r.isCorrect ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
                      <div>
                        <div className="font-medium text-sm">{q?.question}</div>
                        {!r.isCorrect && <div className="text-xs text-green-400 mt-1">✓ {r.correctAnswer}</div>}
                        {r.explanation && <div className="text-xs text-slate-500 mt-2">{r.explanation}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStep('setup')} className="btn-ghost w-full flex items-center gap-2 justify-center">
              <RotateCcw className="w-4 h-4" /> New Quiz
            </button>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
