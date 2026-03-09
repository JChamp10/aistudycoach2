'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { homeworkApi } from '@/lib/api';
import { Zap, Send, ChevronDown, Lightbulb, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Explanation {
  explanation: string;
  steps: string[];
  hint: string;
}

export default function HomeworkPage() {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Explanation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [revealedSteps, setRevealedSteps] = useState(0);

  const handleAsk = async () => {
    if (!question.trim()) return toast.error('Please enter a question');
    setLoading(true);
    setResult(null);
    setShowHint(false);
    setRevealedSteps(0);
    try {
      const res = await homeworkApi.ask({ question, context });
      setResult(res.data.explanation);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to get explanation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            Homework Helper
          </h1>
          <p className="text-slate-400 mt-2">Ask any question. Get step-by-step explanations that help you understand.</p>
        </div>

        <div className="card space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Your Question</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. How do I solve a quadratic equation?" className="input min-h-[120px] resize-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">Additional Context <span className="text-slate-500 font-normal">(optional)</span></label>
            <textarea value={context} onChange={e => setContext(e.target.value)} placeholder="Grade level, what you've already tried..." className="input min-h-[80px] resize-none" />
          </div>
          <div className="flex justify-end">
            <button onClick={handleAsk} disabled={loading || !question.trim()} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Thinking...</> : <><Send className="w-4 h-4" /> Get Explanation</>}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="card border-brand-500/20 bg-brand-500/5">
                <div className="flex items-center gap-2 text-brand-400 font-semibold mb-3">
                  <BookOpen className="w-5 h-5" /> Overview
                </div>
                <p className="text-slate-200 leading-relaxed">{result.explanation}</p>
              </div>

              {result.hint && (
                <div className="card border-amber-500/20">
                  <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-2 text-amber-400 font-semibold w-full text-left">
                    <Lightbulb className="w-5 h-5" /> Hint (try to solve it first!)
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showHint ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showHint && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-slate-300 mt-3 overflow-hidden">
                        {result.hint}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div className="card">
                <h3 className="font-bold mb-4">Step-by-Step Solution</h3>
                <div className="space-y-3">
                  {result.steps.map((step, i) => (
                    <div key={i}>
                      {i < revealedSteps ? (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-4 p-4 rounded-xl bg-surface-muted">
                          <div className="w-7 h-7 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{i + 1}</div>
                          <p className="text-slate-200 leading-relaxed">{step}</p>
                        </motion.div>
                      ) : (
                        <button onClick={() => setRevealedSteps(i + 1)} className="w-full flex gap-4 p-4 rounded-xl bg-surface-muted/50 border border-dashed border-surface-border hover:border-brand-500/40 transition-colors text-left group">
                          <div className="w-7 h-7 rounded-full bg-surface-border text-slate-500 text-sm font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">{i + 1}</div>
                          <span className="text-slate-500 text-sm">Click to reveal step {i + 1}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {revealedSteps < result.steps.length && (
                  <button onClick={() => setRevealedSteps(result.steps.length)} className="mt-4 text-sm text-brand-400 hover:underline">Show all steps</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
