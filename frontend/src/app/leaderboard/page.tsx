'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { leaderboardApi } from '@/lib/api';
import { Trophy, Zap, Flame } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'global' | 'weekly'>('global');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fn = tab === 'global' ? leaderboardApi.global : leaderboardApi.weekly;
    fn().then(r => setData(r.data.leaderboard)).finally(() => setLoading(false));
  }, [tab]);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            Leaderboard
          </h1>
          <p className="text-slate-400 mt-2">Top students by XP earned.</p>
        </div>

        <div className="flex gap-2 p-1 bg-surface-muted rounded-xl">
          {(['global', 'weekly'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t === 'global' ? '🌍 All Time' : '📅 This Week'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(10)].map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-2">
            {data.map((entry: any, i) => {
              const isMe = entry.id === user?.id;
              return (
                <div key={entry.id} className={`card !p-4 flex items-center gap-4 transition-colors ${isMe ? 'border-brand-500/40 bg-brand-500/5' : ''}`}>
                  <div className="w-10 text-center">
                    {i < 3 ? <span className="text-2xl">{medals[i]}</span> : <span className="text-lg font-bold text-slate-500">#{entry.rank || i + 1}</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold flex-shrink-0">
                    {entry.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2">
                      {entry.username}
                      {isMe && <span className="badge bg-brand-500/20 text-brand-400 border-brand-500/30 text-xs">You</span>}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400" /> {entry.streak || 0} day streak
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 font-bold text-brand-400">
                      <Zap className="w-4 h-4" />
                      {(tab === 'weekly' ? entry.weekly_xp : entry.xp)?.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">XP</div>
                  </div>
                </div>
              );
            })}
            {data.length === 0 && <div className="text-center py-12 text-slate-500">No data yet. Start studying to appear on the leaderboard!</div>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
