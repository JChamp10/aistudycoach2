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
import { clsx } from 'clsx';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Podium ───────────────────────────────────────────────────────────────────
function Podium({ entries, tab }: { entries: any[]; tab: string }) {
  if (entries.length < 3) return null;
  const user = useAuthStore.getState().user;

  const metalStyles = [
    { 
      bg: 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600', 
      border: 'border-amber-400', 
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]', 
      label: '1',
      ring: 'ring-4 ring-amber-400/30'
    },
    { 
      bg: 'bg-gradient-to-br from-slate-200 via-slate-400 to-slate-500', 
      border: 'border-slate-300', 
      glow: 'shadow-[0_0_30px_rgba(148,163,184,0.3)]', 
      label: '2',
      ring: 'ring-4 ring-slate-400/30'
    },
    { 
      bg: 'bg-gradient-to-br from-orange-400 via-orange-600 to-orange-700', 
      border: 'border-orange-500', 
      glow: 'shadow-[0_0_30px_rgba(234,88,12,0.3)]', 
      label: '3',
      ring: 'ring-4 ring-orange-500/30'
    },
  ];

  const podiumOrder = [1, 0, 2];
  const heights = [160, 210, 130];

  return (
    <div className="flex items-end justify-center gap-4 mb-12 pt-8">
      {podiumOrder.map((rankIdx, visualIdx) => {
        const entry = entries[rankIdx];
        if (!entry) return null;
        const metal = metalStyles[rankIdx];
        const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
        const isMe = entry.id === user?.id;
        const isLegend = entry.plan === 'legend';

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: visualIdx * 0.15, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center relative"
            style={{ minWidth: rankIdx === 0 ? 140 : 120 }}
          >
            {/* Avatar block */}
            <div className={`relative mb-4 ${isLegend ? 'hover:scale-110 transition-transform duration-500' : ''}`}>
               <div className={`w-20 h-20 rounded-full border-2 overflow-hidden bg-slate-800 ${metal.border} ${metal.ring} ${isLegend ? 'holo-card' : ''}`}>
                <Avatar
                  username={entry.username}
                  avatarUrl={entry.avatar_url}
                  className="w-full h-full"
                  fallbackClassName="text-white"
                  textClassName="text-2xl"
                />
              </div>
              {isLegend && (
                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-brand-300 to-brand-500 rounded-full p-1.5 shadow-lg border-2 border-slate-900">
                  <Crown className="w-4 h-4 text-white fill-current" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col items-center gap-1 mb-4">
               <Link href={`/profile/${entry.username}`} className={clsx(
                 "text-xs font-black uppercase tracking-[0.2em] text-center truncate max-w-[110px] transition-colors",
                 isMe ? 'text-brand-500' : 'text-slate-400',
                 isLegend && 'text-brand-400'
               )}>
                 {entry.username}
               </Link>
               <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <Zap className="w-3 h-3 text-brand-500 fill-current" /> {Number(xp || 0).toLocaleString()}
               </div>
            </div>

            {/* Podium block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[visualIdx] }}
              transition={{ delay: 0.3 + visualIdx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full rounded-2xl border-2 flex items-start justify-center pt-5 ${metal.bg} ${metal.border} ${metal.glow} relative overflow-hidden`}
              style={{ minHeight: 0 }}
            >
              <div className="absolute inset-0 bg-white/10 mix-blend-overlay opacity-30" />
              <span className="font-black text-4xl text-white/50 relative z-10">{metal.label}</span>
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
              particleCount: 150,
              spread: 100,
              origin: { y: 0.7 },
              colors: ['#f59e0b', '#fbbf24', '#fcd34d']
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
      <div className="max-w-3xl mx-auto space-y-12 pt-8 pb-24">
        <header className="text-center">
           <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-brand-500 mb-6">
              <Trophy className="w-3.5 h-3.5 fill-current" /> Hall of Mastery
           </div>
           <h1 className="text-5xl font-black mb-2 tracking-tight">The Top 1%</h1>
           <p className="text-slate-500 font-medium">Behold the students who achieved breakthroughs this week.</p>
        </header>

        <div className="flex gap-2 p-1.5 bg-slate-800/50 backdrop-blur rounded-2xl mx-auto max-w-sm border border-slate-700">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex-1 py-3 rounded-xl font-black transition-all text-[11px] uppercase tracking-widest ${
                tab === t.key 
                ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(220,123,30,0.4)]' 
                : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          <>
            <Podium entries={data.slice(0, 3)} tab={tab} />

            <StaggerContainer className="space-y-4 max-w-2xl mx-auto">
              {data.slice(3).map((entry: any, i: number) => {
                const isMe = entry.id === user?.id;
                const isLegend = entry.plan === 'legend';
                const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
                
                return (
                  <StaggerItem key={entry.id}>
                    <div className={clsx(
                      "card !p-5 flex items-center gap-6 transition-all",
                      isMe ? 'border-brand-500 bg-brand-500/5 shadow-glow' : 'hover:border-slate-600',
                      isLegend && 'border-brand-500/30'
                    )}>
                      <div className="w-12 text-center flex-shrink-0">
                        <span className="text-[14px] font-black text-slate-500 uppercase tracking-tighter italic">#{entry.rank || i + 4}</span>
                      </div>
                      
                      <div className="relative">
                        <Avatar
                          username={entry.username}
                          avatarUrl={entry.avatar_url}
                          className={clsx(
                            "w-12 h-12 rounded-full border-2",
                            isLegend ? 'border-brand-400 p-0.5' : 'border-slate-700'
                          )}
                        />
                        {isLegend && <div className="absolute -top-1 -right-1 bg-brand-500 rounded-full p-0.5"><Crown className="w-2.5 h-2.5 text-white" /></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${entry.username}`} className="font-black text-[15px] flex items-center gap-3 text-slate-200 hover:text-brand-400 transition-colors uppercase tracking-[0.05em]">
                          {entry.username}
                          {isMe && <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-black border border-brand-500/30">YOU</span>}
                        </Link>
                        <div className="flex items-center gap-4 mt-1.5">
                           <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Flame className="w-3 h-3 text-orange-400 fill-current" /> {entry.streak || 0} DAY STREAK
                           </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-brand-500 tabular-nums">
                          {Number(xp || 0).toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Mastery XP</div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            {data.length === 0 && (
              <div className="text-center py-20 font-black text-slate-600 uppercase tracking-widest text-sm">
                The stage is empty. Be the first to claim it.
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
