'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/layout/AppLayout';
import { Trophy, Zap, Flame, MapPin, Crown, ChevronRight, BarChart3 } from 'lucide-react';
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
      bg: 'bg-gradient-to-br from-[#4F6636] via-[#658245] to-[#7A9D54]', 
      border: 'border-white/20', 
      glow: 'shadow-[0_0_40px_rgba(122,157,84,0.15)]', 
      label: '1',
      ring: 'ring-4 ring-[#7A9D54]/20'
    },
    { 
      bg: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900', 
      border: 'border-slate-300 dark:border-slate-700', 
      glow: 'shadow-[0_0_30px_rgba(148,163,184,0.1)]', 
      label: '2',
      ring: 'ring-4 ring-slate-400/20'
    },
    { 
      bg: 'bg-gradient-to-br from-[#8C7B60] via-[#A6967D] to-[#BFB29E] dark:from-slate-800 dark:via-slate-800 dark:to-slate-900', 
      border: 'border-[#A6967D]/40', 
      glow: 'shadow-[0_0_30px_rgba(140,123,96,0.1)]', 
      label: '3',
      ring: 'ring-4 ring-[#8C7B60]/20'
    },
  ];

  const podiumOrder = [1, 0, 2];
  const heights = [160, 210, 130];

  return (
    <div className="flex items-end justify-center gap-6 mb-16 pt-10">
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: visualIdx * 0.1, type: 'spring', stiffness: 100 }}
            className="flex flex-col items-center relative"
            style={{ minWidth: rankIdx === 0 ? 160 : 130 }}
          >
            {/* Avatar block */}
            <div className="relative mb-6">
               <div className={clsx(
                 "w-20 h-20 rounded-2xl border-2 overflow-hidden bg-slate-100 dark:bg-slate-800 transition-all duration-500",
                 metal.border,
                 metal.ring,
                 isLegend && "shadow-2xl"
               )}>
                <Avatar
                  username={entry.username}
                  avatarUrl={entry.avatar_url}
                  className="w-full h-full"
                  fallbackClassName="bg-slate-50 dark:bg-slate-950"
                  textClassName="text-2xl font-black"
                />
              </div>
              {isLegend && (
                <div className="absolute -top-2 -right-2 bg-slate-950 rounded-lg p-1.5 shadow-xl border border-brand-500/50">
                  <Crown className="w-4 h-4 text-brand-500 fill-current" />
                </div>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col items-center gap-2 mb-6">
               <Link href={`/profile/${entry.username}`} className={clsx(
                 "text-[10px] font-bold uppercase tracking-[0.25em] text-center truncate max-w-[120px] transition-colors",
                 isMe ? 'text-brand-500' : 'text-slate-400'
               )} style={!isMe ? { color: 'var(--text-muted)' } : {}}>
                 {entry.username}
               </Link>
               <div className="flex items-center gap-2 text-[11px] font-bold" style={{ color: 'var(--text-muted)' }}>
                  <BarChart3 className="w-3.5 h-3.5 text-brand-500" /> {Number(xp || 0).toLocaleString()}
               </div>
            </div>

            {/* Podium block */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: heights[visualIdx] }}
              transition={{ delay: 0.2 + visualIdx * 0.1, duration: 1.2, ease: "circOut" }}
              className={clsx(
                "w-full rounded-xl border-2 flex items-start justify-center pt-6 relative overflow-hidden",
                metal.bg,
                metal.border,
                metal.glow
              )}
              style={{ minHeight: 0 }}
            >
              <div className="absolute inset-0 bg-white/5 opacity-40 pointer-events-none" />
              <span className="font-black text-5xl text-slate-500/20 relative z-10 leading-none">{metal.label}</span>
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
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#7A9D54', '#ACBBA1', '#ffffff']
            });
          });
        }
      })
      .finally(() => setLoading(false));
  }, [tab, token]);

  const tabs = [
    { key: 'global', label: 'Global Ranking' },
    { key: 'weekly', label: 'Active Cycle' },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-12 pt-10 pb-24">
        <header className="text-center">
           <div className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.25em] mb-8 shadow-sm"
             style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}>
              <Trophy className="w-3.5 h-3.5" /> Performance Analytics
           </div>
           <h1 className="text-4xl font-extrabold mb-3 tracking-tighter uppercase">Member Leaderboard</h1>
           <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Global competency rankings based on verified learning cycles.</p>
        </header>

        <div className="flex gap-2 p-1.5 backdrop-blur rounded-xl mx-auto max-w-sm border transition-colors shadow-sm" style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={clsx(
                "flex-1 py-3 rounded-lg font-bold transition-all text-[11px] uppercase tracking-widest",
                tab === t.key 
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl" 
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              )}
              style={tab !== t.key ? { color: 'var(--text-muted)' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4 pt-10">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          <>
            <Podium entries={data.slice(0, 3)} tab={tab} />

            <StaggerContainer className="space-y-4 max-w-3xl mx-auto pt-10">
              {data.slice(3).map((entry: any, i: number) => {
                const isMe = entry.id === user?.id;
                const isLegend = entry.plan === 'legend';
                const xp = tab === 'weekly' ? entry.weekly_xp : entry.xp;
                
                return (
                  <StaggerItem key={entry.id}>
                    <div className={clsx(
                      "card !p-6 flex items-center gap-8 transition-all group",
                      isMe ? 'border-brand-500/60 bg-brand-500/5 shadow-xl shadow-brand-500/5' : 'hover:border-slate-300 dark:hover:border-slate-700'
                    )}>
                      <div className="w-12 text-center flex-shrink-0">
                        <span className="text-[14px] font-black text-slate-400 uppercase tracking-tighter tabular-nums opacity-60">#{entry.rank || i + 4}</span>
                      </div>
                      
                      <div className="relative">
                        <div className={clsx(
                          "w-14 h-14 rounded-2xl border-2 overflow-hidden",
                          isLegend ? "border-brand-500/40 p-0.5" : "border-slate-100 dark:border-slate-800"
                        )} style={!isLegend ? { borderColor: 'var(--border-primary)' } : {}}>
                           <Avatar
                             username={entry.username}
                             avatarUrl={entry.avatar_url}
                             className="w-full h-full"
                             fallbackClassName="bg-slate-50 dark:bg-slate-950"
                             textClassName="text-xl font-black"
                           />
                        </div>
                        {isLegend && <div className="absolute -top-1.5 -right-1.5 bg-slate-950 rounded-lg p-1 border border-brand-500/30"><Crown className="w-3 h-3 text-brand-500" /></div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${entry.username}`} className="font-black text-base flex items-center gap-3 text-slate-900 dark:text-slate-100 hover:text-brand-500 transition-colors uppercase tracking-tight">
                          {entry.username}
                          {isMe && <span className="text-[8px] px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black tracking-widest">CURRENT USER</span>}
                        </Link>
                        <div className="flex items-center gap-6 mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">
                           <div className="flex items-center gap-2">
                              <Flame className="w-3 h-3 text-orange-500" /> {(entry.streak || 0)} Day Consistency
                           </div>
                           <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-slate-300" /> {entry.region || 'Global'}
                           </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-brand-500 tabular-nums tracking-tighter">
                          {Number(xp || 0).toLocaleString()}
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Verified XP</div>
                      </div>
                      
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            {data.length === 0 && (
              <div className="text-center py-24">
                 <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 border border-slate-100 dark:border-slate-800">
                    <Trophy className="w-10 h-10" />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-tight text-slate-400">Database Entry Required</h2>
                 <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-2">No performance records detected for this cycle.</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
