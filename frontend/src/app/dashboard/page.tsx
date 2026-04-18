'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, HelpCircle, Zap, Flame, Trophy, Play, Brain, ArrowRight, Moon, LayoutDashboard, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const level = user ? getLevelFromXP(user.xp || 0) : null;
  const xpIntoGoal = (user?.xp || 0) % 50;
  const goalPct = (xpIntoGoal / 50) * 100;

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-10 pt-10 pb-24">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200/60 dark:border-slate-800 pb-10" style={{ borderColor: 'var(--border-primary)' }}>
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Avatar
                username={user?.username}
                avatarUrl={user?.avatar_url}
                className="w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                fallbackClassName="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase">
                  {user?.username || 'Guest'}
                </h1>
                <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                  Performance Dashboard
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">Active Streak</div>
                <div className="text-2xl font-black text-brand-500 flex items-center justify-end gap-2">
                  <Flame className="w-5 h-5 fill-current" /> {user?.streak || 0}
                </div>
             </div>
             <div className="w-px h-10 bg-slate-200 dark:bg-slate-800" />
             <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 mb-1">Current Level</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {level?.level || 1}
                </div>
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_350px] gap-10">
          <section className="space-y-10">
            <div>
               <div className="flex items-center gap-2 mb-6">
                 <LayoutDashboard className="w-4 h-4 text-slate-400" />
                 <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Primary Objectives</h2>
               </div>

               <div className="card !p-10 relative overflow-hidden group border-brand-500/20 shadow-xl shadow-brand-500/5">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity grayscale">
                    <Brain className="w-40 h-40" />
                 </div>
                 <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-4 tracking-tight">Daily Learning Goal</h2>
                    <p className="text-slate-500 mb-10 max-w-lg text-lg leading-relaxed">
                      Optimize your recall through targeted review. Complete your daily session to maintain peak performance and progression.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <Link href="/flashcards" className="btn-primary !px-10 !py-4 text-sm flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Start Review
                      </Link>
                      <Link href="/quiz" className="btn-ghost !px-10 !py-4 text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Assessment
                      </Link>
                    </div>
                 </div>
               </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Link href="/homework" className="card group hover:scale-[1.02] transition-all">
                <HelpCircle className="w-6 h-6 text-slate-400 mb-6 group-hover:text-brand-500 transition-colors" />
                <h3 className="text-lg font-black uppercase tracking-tight">AI Assistant</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Technical guidance and problem solving.</p>
              </Link>
              <Link href="/leaderboard" className="card group hover:scale-[1.02] transition-all">
                <Trophy className="w-6 h-6 text-slate-400 mb-6 group-hover:text-amber-500 transition-colors" />
                <h3 className="text-lg font-black uppercase tracking-tight">Global Rankings</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Competitive status among elite members.</p>
              </Link>
            </div>
          </section>

          <aside className="space-y-10">
            <div>
               <div className="flex items-center gap-2 mb-6">
                 <Clock className="w-4 h-4 text-slate-400" />
                 <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400">Metrics</h2>
               </div>
               
               <div className="card !bg-white/40 dark:!bg-slate-900/40 backdrop-blur-md border-slate-200/50 dark:border-slate-800">
                 <div className="flex items-center justify-between mb-8">
                   <div className="text-sm font-black uppercase tracking-widest text-slate-400">Progression</div>
                   <div className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700">
                     {xpIntoGoal} / 50 XP
                   </div>
                 </div>
                 
                 <div className="xp-bar mb-6 shadow-inner">
                   <motion.div 
                     className="xp-bar-fill shadow-[0_0_12px_rgba(220,123,30,0.2)]" 
                     initial={{ width: 0 }} 
                     animate={{ width: `${goalPct}%` }}
                     transition={{ duration: 1.2, ease: "circOut" }}
                   />
                 </div>
                 
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4">
                   50 XP required for next milestone
                 </p>
               </div>
            </div>

            <div className="card !bg-slate-900 border-none relative overflow-hidden group shadow-lg">
               <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-emerald-500/10 group-hover:opacity-100 opacity-60 transition-opacity" />
               <div className="relative z-10">
                  <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Moon className="w-4 h-4 text-brand-400" /> Interface Status
                  </h3>
                  <p className="text-slate-400 text-xs mb-8 font-medium leading-relaxed">Adjust system luminosity for optimal cognitive performance during deep work cycles.</p>
                  <button onClick={() => useAuthStore.getState().toggleDarkMode()} className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-sm">
                    Toggle Vision Mode
                  </button>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
