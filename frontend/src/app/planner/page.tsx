'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { plannerApi } from '@/lib/api';
import { Calendar, Plus, Trash2, CheckCircle, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlannerPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [subjects, setSubjects] = useState([{ subject: '', examDate: '' }]);
  const [dailyHours, setDailyHours] = useState(2);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const res = await plannerApi.list();
      setPlans(res.data.plans || []);
    } catch {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    const valid = subjects.filter(s => s.subject && s.examDate);
    if (!valid.length) return toast.error('Add at least one subject with exam date');
    setGenerating(true);
    try {
      await plannerApi.generate({ subjects: valid, dailyHours });
      toast.success('Study plan generated! 📅');
      setShowGenerator(false);
      loadPlans();
    } catch {
      toast.error('Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  };

  const toggleComplete = async (plan: any) => {
    try {
      await plannerApi.update(plan.id, { is_completed: !plan.is_completed });
      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_completed: !p.is_completed } : p));
    } catch { toast.error('Failed to update'); }
  };

  const deletePlan = async (id: string) => {
    try {
      await plannerApi.delete(id);
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch { toast.error('Failed to delete'); }
  };

  const grouped = plans.reduce((acc: any, plan) => {
    const d = plan.scheduled_date?.split('T')[0] || plan.scheduled_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(plan);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
              Study Planner
            </h1>
            <p className="text-slate-400 mt-2">AI-generated schedules from your exams and assignments.</p>
          </div>
          <button onClick={() => setShowGenerator(!showGenerator)} className="btn-primary flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
        </div>

        <AnimatePresence>
          {showGenerator && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="card border-brand-500/20 bg-brand-500/5 space-y-4">
                <h2 className="font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-400" /> Generate Study Plan</h2>
                <div className="space-y-3">
                  {subjects.map((s, i) => (
                    <div key={i} className="flex gap-3">
                      <input value={s.subject} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, subject: e.target.value } : x))} placeholder="Subject (e.g. Chemistry)" className="input flex-1" />
                      <input type="date" value={s.examDate} onChange={e => setSubjects(prev => prev.map((x, j) => j === i ? { ...x, examDate: e.target.value } : x))} className="input w-40" />
                      {subjects.length > 1 && (
                        <button onClick={() => setSubjects(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 px-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setSubjects(prev => [...prev, { subject: '', examDate: '' }])} className="text-sm text-brand-400 hover:underline flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add subject
                  </button>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Available hours per day: {dailyHours}h</label>
                  <input type="range" min="0.5" max="8" step="0.5" value={dailyHours} onChange={e => setDailyHours(+e.target.value)} className="w-full accent-brand-500" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowGenerator(false)} className="btn-ghost">Cancel</button>
                  <button onClick={generatePlan} disabled={generating} className="btn-primary flex items-center gap-2 disabled:opacity-50">
                    {generating ? 'Generating...' : <><Sparkles className="w-4 h-4" /> Generate Plan</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No study tasks yet. Generate a plan to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).sort().map(([date, dayPlans]: any) => (
              <div key={date}>
                <div className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div className="space-y-2">
                  {dayPlans.map((plan: any) => (
                    <motion.div key={plan.id} layout className={`card !p-4 flex items-center gap-4 transition-all ${plan.is_completed ? 'opacity-60' : ''}`}>
                      <button onClick={() => toggleComplete(plan)} className="flex-shrink-0">
                        <CheckCircle className={`w-5 h-5 ${plan.is_completed ? 'text-green-400' : 'text-slate-600 hover:text-slate-400'} transition-colors`} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${plan.is_completed ? 'line-through text-slate-500' : ''}`}>{plan.task_description}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          <span className="font-semibold text-brand-400">{plan.subject}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {plan.duration_minutes} min</span>
                        </div>
                      </div>
                      <button onClick={() => deletePlan(plan.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
