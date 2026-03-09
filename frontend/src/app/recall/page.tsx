'use client';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { studyApi } from '@/lib/api';
import { Brain, Send, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Feedback {
  score: number;
  feedback: string;
  correct: string[];
  missed: string[];
  encouragement: string;
}

const SAMPLE_TOPICS = [
  { topic: 'Photosynthesis', summary: 'Photosynthesis is the process plants use to convert light energy into chemical energy stored in glucose. It occurs in chloroplasts, using CO2, water, and sunlight to produce glucose and oxygen through the light-dependent and light-independent reactions.' },
  { topic: "Newton's Laws of Motion", summary: '1st Law: Objects at rest stay at rest (inertia). 2nd Law: F=ma (force equals mass times acceleration). 3rd Law: For every action there is an equal and opposite reaction.' },
];

export default function RecallPage() {
  const [step, setStep] = useState<'setup' | 'study' | 'recall' | 'result'>('setup');
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');
  const [userResponse, setUserResponse] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [studyTimer, setStudyTimer] = useState<NodeJS.Timeout | null>(null);

  const startStudying = () => {
    if (!topic.trim() || !summary.trim()) return toast.error('Fill in topic and summary');
    setStep('study');
    let time = 0;
    const t = setInterval(() => setStudyTime(++time), 1000);
    setStudyTimer(t);
  };

  const startRecall = () => {
    if (studyTimer) clearInterval(studyTimer);
    setStep('recall');
  };

  const submitRecall = async () => {
    if (userResponse.trim().length < 20) return toast.error('Write more! Free recall works best when you write everything you remember.');
    setLoading(true);
    try {
      const res = await studyApi.submitRecall({ topic, topicSummary: summary, userResponse });
      setFeedback(res.data.feedback);
      setStep('result');
    } catch {
      toast.error('Failed to analyze response');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('setup');
    setTopic('');
    setSummary('');
    setUserResponse('');
    setFeedback(null);
    setStudyTime(0);
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            Free Recall
          </h1>
          <p className="text-slate-400 mt-2">Read the material, then write everything you remember.</p>
        </div>

        {step === 'setup' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Topic</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Photosynthesis..." className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Topic Summary / Notes</label>
                <textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Paste your notes or material here..." className="input min-h-[160px] resize-none" />
              </div>
              <button onClick={startStudying} className="btn-primary w-full">Start studying →</button>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-widest">Or try a sample topic</p>
              <div className="grid gap-2">
                {SAMPLE_TOPICS.map(t => (
                  <button key={t.topic} onClick={() => { setTopic(t.topic); setSummary(t.summary); }} className="card !p-4 text-left hover:border-purple-500/40 transition-colors">
                    <div className="font-semibold text-sm">{t.topic}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate">{t.summary.slice(0, 80)}...</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'study' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card border-purple-500/20 bg-purple-500/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">{topic}</h2>
                <div className="text-sm text-purple-400 font-mono">{Math.floor(studyTime / 60)}:{(studyTime % 60).toString().padStart(2, '0')}</div>
              </div>
              <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">{summary}</div>
            </div>
            <div className="card border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-slate-300">Read carefully. You'll close this and write everything you remember.</p>
            </div>
            <button onClick={startRecall} className="btn-primary w-full">I'm ready – start recall →</button>
          </motion.div>
        )}

        {step === 'recall' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card border-dashed border-purple-500/30">
              <h2 className="font-bold mb-1">Write everything you remember about: <span className="text-purple-400">{topic}</span></h2>
              <p className="text-sm text-slate-500 mb-4">Don't look back at the notes. Just write freely.</p>
              <textarea value={userResponse} onChange={e => setUserResponse(e.target.value)} placeholder="Start writing here..." className="input min-h-[240px] resize-none" autoFocus />
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-slate-500">{userResponse.split(' ').filter(Boolean).length} words</span>
                <button onClick={submitRecall} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                  {loading ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Analyzing...</> : <><Send className="w-4 h-4" /> Get AI Feedback</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'result' && feedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="card text-center border-purple-500/20">
              <div className="text-5xl font-extrabold mb-2" style={{ color: feedback.score >= 0.8 ? '#4ade80' : feedback.score >= 0.6 ? '#fbbf24' : '#f87171' }}>
                {Math.round(feedback.score * 100)}%
              </div>
              <p className="text-slate-400 text-sm">{feedback.feedback}</p>
              <div className="mt-4 text-2xl">{feedback.encouragement}</div>
            </div>
            {feedback.correct.length > 0 && (
              <div className="card border-green-500/20 bg-green-500/5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-green-400"><CheckCircle className="w-5 h-5" /> What you remembered well</h3>
                <ul className="space-y-2">{feedback.correct.map((c, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> {c}</li>)}</ul>
              </div>
            )}
            {feedback.missed.length > 0 && (
              <div className="card border-amber-500/20 bg-amber-500/5">
                <h3 className="font-bold mb-3 flex items-center gap-2 text-amber-400"><XCircle className="w-5 h-5" /> Areas to review</h3>
                <ul className="space-y-2">{feedback.missed.map((m, i) => <li key={i} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-amber-400 mt-0.5">→</span> {m}</li>)}</ul>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setStep('study'); setUserResponse(''); setFeedback(null); }} className="btn-ghost flex-1">Study again</button>
              <button onClick={reset} className="btn-primary flex-1">New topic</button>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
