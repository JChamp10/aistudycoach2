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
                <XAxis da
