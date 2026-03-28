'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { userApi } from '@/lib/api';
import { Activity, Clock, Flame, Zap, Trophy, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export default function ProgressPage() {
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.stats().catch(() => ({ data: {} })),
      userApi.profile().catch(() => ({ data: {} }))
    ]).then(([sRes, pRes]) => {
      setStats(sRes.data || {});
      setProfile(pRes.data || {});
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-48" />)}
      </div>
    </AppLayout>
  );

  const { sessionStats = [], heatmap = [], subjects = [] } = stats || {};

  // Fill empty days for the last 14 days for a clean chart
  const chartData = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = heatmap.find((h: any) => h.date.startsWith(dateStr));
    chartData.push({
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      minutes: found ? parseInt(found.minutes) : 0,
      sessions: found ? parseInt(found.sessions) : 0
    });
  }

  const highestMastery = subjects.length > 0 ? subjects[0].name : 'N/A';

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-ink">My Progress</h1>
            <p className="text-ink-muted mt-1 text-sm tracking-wide">
              Track your study habits, identify your strengths, and level up!
            </p>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
             className="card p-5 border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-transparent">
            <div className="flex items-center gap-2 text-brand-500 mb-2">
              <Zap className="w-5 h-5" /> <span className="font-semibold text-sm">Total XP</span>
            </div>
            <div className="text-3xl font-extrabold text-ink">{profile?.xp || 0}</div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
             className="card p-5 border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Flame className="w-5 h-5" /> <span className="font-semibold text-sm">Streak</span>
            </div>
            <div className="text-3xl font-extrabold text-ink">{profile?.streak || 0} <span className="text-lg font-medium text-ink-muted">days</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
             className="card p-5 border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-transparent">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Clock className="w-5 h-5" /> <span className="font-semibold text-sm">Time</span>
            </div>
            <div className="text-3xl font-extrabold text-ink">{profile?.total_study_minutes || 0} <span className="text-lg font-medium text-ink-muted">min</span></div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
             className="card p-5 border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-transparent">
            <div className="flex items-center gap-2 text-purple-500 mb-2">
              <Trophy className="w-5 h-5" /> <span className="font-semibold text-sm">Top Subject</span>
            </div>
            <div className="text-xl font-extrabold text-ink truncate mt-1">{highestMastery}</div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Study Activity Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-6 flex flex-col">
            <h3 className="font-bold text-lg text-ink mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-500" />
              Study Activity (Last 14 Days)
            </h3>
            <p className="text-xs text-ink-muted mb-6">Minutes spent studying per day</p>
            
            <div className="flex-1 w-full min-h-[220px] -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b1a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ff6b1a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b8075' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#8b8075' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#ff6b1a', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#ff6b1a" strokeWidth={3} fillOpacity={1} fill="url(#colorMin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Mastery */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-6">
            <h3 className="font-bold text-lg text-ink mb-1 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              Subject Mastery
            </h3>
            <p className="text-xs text-ink-muted mb-6">Your strength across different topics</p>

            {subjects.length === 0 ? (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-3">
                  <Brain className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-ink-muted text-sm">No subjects recorded yet.<br/>Start doing flashcards or quizzes!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subjects.map((sub: any, i: number) => (
                  <div key={sub.name}>
                    <div className="flex justify-between text-sm mb-1.5 font-medium">
                      <span className="text-ink">{sub.name}</span>
                      <span className="text-ink-light">{Math.round(sub.mastery_score)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-surface-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, sub.mastery_score))}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: sub.color || '#a855f7' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

        </div>
      </div>
    </AppLayout>
  );
}
