'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { userApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart2, Calendar, Target } from 'lucide-react';

export default function ProgressPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.stats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" /></div></AppLayout>;

  const heatmapData = stats?.heatmap || [];
  const sessionData = stats?.sessionStats || [];
  const subjects = stats?.subjects || [];

  const heatmapMap: Record<string, number> = {};
  heatmapData.forEach((d: any) => { heatmapMap[d.date] = parseInt(d.sessions); });
  const last90: { date: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    last90.push({ date: d, count: heatmapMap[d] || 0 });
  }

  const chartData = sessionData.map((s: any) => ({
    type: s.type.replace('_', ' '),
    sessions: parseInt(s.count),
    accuracy: s.avg_score ? Math.round(s.avg_score * 100) : 0,
  }));

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-brand-400" />
            </div>
            Progress Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Track your learning over time.</p>
        </div>

        {chartData.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-6">Sessions by Type</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#181d2a', border: '1px solid #252b3b', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="sessions" fill="#5558ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {chartData.some((d: any) => d.accuracy > 0) && (
          <div className="card">
            <h2 className="font-bold mb-6">Average Accuracy</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" />
                <XAxis dataKey="type" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#181d2a', border: '1px solid #252b3b', borderRadius: 8, color: '#fff' }} formatter={(v: any) => [`${v}%`, 'Accuracy']} />
                <Line type="monotone" dataKey="accuracy" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {subjects.length > 0 && (
          <div className="card">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-brand-400" /> Subject Mastery</h2>
            <div className="space-y-4">
              {subjects.map((s: any) => (
                <div key={s.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-slate-400">{Math.round(s.mastery_score * 100)}%</span>
                  </div>
                  <div className="xp-bar h-2.5">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.mastery_score * 100}%`, backgroundColor: s.color || '#5558ff' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-brand-400" /> Study Heatmap (Last 90 Days)</h2>
          <div className="flex flex-wrap gap-1">
            {last90.map(({ date, count }) => (
              <div key={date} title={`${date}: ${count} session${count !== 1 ? 's' : ''}`} className="w-3 h-3 rounded-sm transition-colors"
                style={{ backgroundColor: count === 0 ? '#1e2438' : count === 1 ? '#3730a3' : count === 2 ? '#4338ca' : '#5558ff' }} />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
            <span>Less</span>
            {['#1e2438', '#3730a3', '#4338ca', '#5558ff'].map(c => <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />)}
            <span>More</span>
          </div>
        </div>

        {stats && subjects.length === 0 && chartData.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <BarChart2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No data yet. Start studying to see your progress here!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
