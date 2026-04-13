'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Trophy, Zap, Flame, MapPin, Crown } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/layout/StaggerContainer';
import { getLevelFromXP } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Podium ───────────────────────────────────────────────────────────────────
function Podium({ entries, tab }: { entries: any[]; tab: string }) {
  if (entries.length < 3) return null;
  const user = useAuthStore.getState().user;

  const metalStyles = [
    { bg: 'bg-duo-yellow', border: 'border-duo-yellowShadow', glow: 'shadow-[0_0_20px_var(--duo-yellow)]', label: '1' },
    { bg: 'bg-slate-300', border: 'border-slate-400', glow: 'shadow-[0_0_20px_rgba(203,213,225,0.4)]', label: '2' },
    { bg: 'bg-amber-600', border: 'border-amber-700', glow: 'shadow-[0_0_20px_rgba(217,119,6,0.4)]', label: '3' },
  ];

  // Reorder: [2nd, 1st, 3rd]
  const podiumOrder = [1, 0, 2];
  const heights = [140, 180, 110];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 pt-4">
      {podiumOrder.map((rankIdx, visualIdx) => {
        const entry = entries[rankIdx];
        if (!entry) return null;
        const metal = metalStyles[rankIdx];
        const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
        const isMe = entry.id === user?.id;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: visualIdx * 0.15, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center relative"
            style={{ minWidth: rankIdx === 0 ? 130 : 110 }}
          >
            {/* Avatar block */}
            <div className={`w-16 h-16 rounded-full mb-3 border-b-4 text-white relative overflow-hidden ${metal.bg} ${metal.border} ${metal.glow}`}>
              <Avatar
                username={entry.username}
                avatarUrl={entry.avatar_url}
                className="w-full h-full"
                fallbackClassName="text-white"
                textClassName="text-2xl"
              />
              {entry.plan === 'legend' && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full p-1 shadow-lg border-2 border-white">
                  <Crown className="w-4 h-4 text-amber-900" />
                </div>
              )}
            </div>

            {/* Name */}
            <Link href={`/profile/${entry.username}`} className={`text-sm font-extrabold text-center truncate max-w-[100px] hover:text-brand-500 transition-colors cursor-pointer ${isMe ? 'text-brand-500' : 'text-text-primary'}`}>
              {entry.username}
            </Link>

            {/* XP */}
            <div className="flex items-center gap-1 mt-1 mb-2">
              <Zap className="w-4 h-4 text-duo-blue" />
              <span className="text-xs font-bold text-duo-blue">
                {Number(xp || 0).toLocaleString()}
              </span>
            </div>

            {/* Podium block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[visualIdx] }}
              transition={{ delay: 0.3 + visualIdx * 0.1, duration: 0.6, ease: 'easeOut' }}
              className={`w-full rounded-t-2xl border-x-2 border-t-2 ${metal.bg} ${metal.border} flex items-start justify-center pt-4`}
              style={{ minHeight: 0 }}
            >
              <span className="font-extrabold text-3xl text-white opacity-80">{metal.label}</span>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, token } = useAuthStore();
  const [tab, setTab] = useState<'global' | 'weekly'>('global');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/leaderboard/${tab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setData(d.leaderboard || []);
        if (d.leaderboard && d.leaderboard.length > 0) {
          import('canvas-confetti').then((confetti) => {
            confetti.default({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.8 },
              colors: ['#eab308', '#facc15', '#fbbf24']
            });
          });
        }
      })
      .finally(() => setLoading(false));
  }, [tab, token]);

  const tabs = [
    { key: 'global', label: 'All Time' },
    { key: 'weekly', label: 'This Week' },
  ];

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 pt-4">
        <div className="text-center animate-bounce-pop">
           <div className="w-16 h-16 bg-duo-yellow rounded-2xl border-b-4 border-duo-yellowShadow flex items-center justify-center mx-auto mb-4">
             <Trophy className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl font-extrabold mb-2 text-text-primary">Leaderboard</h1>
           <p className="text-text-muted font-bold">Top students by XP earned.</p>
        </div>

        <div className="flex gap-2 p-1 bg-surface-muted rounded-2xl mx-auto max-w-sm">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm uppercase ${
                tab === t.key 
                ? 'bg-duo-blue text-white shadow-[0_4px_0_var(--duo-blueShadow)] transform -translate-y-1' 
                : 'text-text-muted hover:bg-surface-elevated'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20 w-full rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Podium for top 3 */}
            <Podium entries={data.slice(0, 3)} tab={tab} />

            {/* Remaining entries */}
            <StaggerContainer className="space-y-4">
              {data.slice(3).map((entry: any, i: number) => {
                const isMe = entry.id === user?.id;
                const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
                return (
                  <StaggerItem key={entry.id}>
                    <div className={`card !p-4 flex items-center gap-4 ${isMe ? 'border-brand-400 bg-brand-500/10' : ''}`}>
                      <div className="w-10 text-center flex-shrink-0">
                        <span className="text-xl font-extrabold text-text-muted">#{entry.rank || i + 4}</span>
                      </div>
                      <Avatar
                        username={entry.username}
                        avatarUrl={entry.avatar_url}
                        className="w-12 h-12 rounded-full border-b-4 border-t-2 border-x-2 border-brand-500 bg-brand-500/10 flex-shrink-0"
                        fallbackClassName="bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        textClassName="text-xl"
                      />
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${entry.username}`} className="font-extrabold text-[15px] flex items-center gap-2 flex-wrap text-text-primary hover:text-brand-500 transition-colors cursor-pointer">
                          {entry.username}
                          {entry.plan === 'legend' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-amber-900 font-black uppercase tracking-tighter shadow-sm flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5" /> LEGEND
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
                              You
                            </span>
                          )}
                        </Link>
                        <div className="text-[11px] font-bold flex items-center gap-3 mt-1 text-text-muted uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-duo-yellow">
                            <Flame className="w-3 h-3 fill-duo-yellow" />
                            {entry.streak || 0} Streak
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1 font-extrabold text-[16px] text-duo-blue">
                          {Number(xp || 0).toLocaleString()} XP
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            {data.length === 0 && (
              <div className="text-center py-12 font-bold text-text-muted">
                No data yet. Start studying to appear here!
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
