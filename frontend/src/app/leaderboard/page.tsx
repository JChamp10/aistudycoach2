'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Trophy, Zap, Flame, MapPin } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function LeaderboardPage() {
  const { user, token } = useAuthStore();
  const [tab, setTab] = useState<'global' | 'weekly' | 'regional'>('global');
  const [data, setData] = useState<any[]>([]);
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/leaderboard/${tab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setData(d.leaderboard || []);
        if (d.region) setRegion(d.region);
      })
      .finally(() => setLoading(false));
  }, [tab, token]);

  const medals = ['🥇', '🥈', '🥉'];

  const tabs = [
    { key: 'global', label: '🌍 All Time' },
    { key: 'weekly', label: '📅 This Week' },
    { key: 'regional', label: '📍 My Region' },
  ];

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

        {user?.region && (
          <div className="flex items-center gap-2 text-sm text-slate-400 bg-surface-muted px-4 py-2 rounded-xl border border-surface-border w-fit">
            <MapPin className="w-4 h-4 text-brand-400" />
            Your region: <span className="text-white font-medium ml-1">{user.region}</span>
          </div>
        )}

        <div className="flex gap-2 p-1 bg-surface-muted rounded-xl">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'regional' && region && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-brand-500/20 bg-brand-500/5">
            <MapPin className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-sm">Regional Rankings</div>
              <div className="text-xs text-slate-400">
                Showing top students in <span className="text-brand-400">{region}</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((entry: any, i: number) => {
              const isMe = entry.id === user?.id;
              const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-colors ${
                    isMe
                      ? 'border-brand-500/40 bg-brand-500/5'
                      : 'border-surface-border bg-surface-card'
                  }`}
                >
                  <div className="w-10 text-center flex-shrink-0">
                    {i < 3
                      ? <span className="text-2xl">{medals[i]}</span>
                      : <span className="text-lg font-bold text-slate-500">#{entry.rank || i + 1}</span>
                    }
                  </div>
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold flex-shrink-0">
                    {entry.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold flex items-center gap-2 flex-wrap">
                      {entry.username}
                      {isMe && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        {entry.streak || 0} day streak
                      </span>
                      {entry.region && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-400" />
                          {entry.region}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 font-bold text-brand-400">
                      <Zap className="w-4 h-4" />
                      {Number(xp || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">XP</div>
                  </div>
                </div>
              );
            })}
            {data.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                {tab === 'regional'
                  ? 'No one in your region yet. Be the first!'
                  : 'No data yet. Start studying to appear here!'}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
