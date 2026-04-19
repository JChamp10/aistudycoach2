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
        <header
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-10"
          style={{
            borderColor: 'var(--border-primary)',
          }}
        >
          <div>
            <div className="flex items-center gap-4 mb-3">
              <Avatar
                username={user?.username}
                avatarUrl={user?.avatar_url}
                className="w-14 h-14 rounded-2xl border"
                fallbackClassName="text-text-muted"
                style={{
                  borderColor: 'var(--border-primary)',
                  backgroundColor: 'var(--surface-muted)',
                }}
              />
              <div>
                <h1 className="text-3xl font-black tracking-tight uppercase text-text-primary">
                  {user?.username || 'Guest'}
                </h1>
                <p className="text-sm font-semibold uppercase tracking-widest text-text-muted">
                  Performance Dashboard
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8">
             <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted mb-1">Active Streak</div>
                <div className="text-2xl font-black text-brand-500 flex items-center justify-end gap-2">
                  <Flame className="w-5 h-5 fill-current" /> {user?.streak || 0}
                </div>
             </div>
             <div
               className="w-px h-10"
               style={{ backgroundColor: 'var(--border-primary)' }}
             />
             <div className="text-right">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted mb-1">Current Level</div>
                <div className="text-2xl font-black text-text-primary">
                  {level?.level || 1}
                </div>
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_350px] gap-10">
          <section className="space-y-10">
            <div>
               <div className="flex items-center gap-2 mb-6">
                 <LayoutDashboard className="w-4 h-4 text-text-muted" />
                 <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-text-muted">Primary Objectives</h2>
               </div>

               <div
                 className="card !p-10 relative overflow-hidden group border-brand-500/20 shadow-lg"
                 style={{
                   borderColor: 'var(--border-accent)',
                 }}
               >
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity grayscale">
                    <Brain className="w-40 h-40" />
                 </div>
                 <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-4 tracking-tight text-text-primary">Daily Learning Goal</h2>
                    <p className="text-text-muted mb-10 max-w-lg text-lg leading-relaxed">
                      Optimize your recall through targeted review. Complete your daily session to maintain peak performance and progression.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                      <Link href="/flashcards" className="btn-primary inline-flex !px-10 !py-4 text-sm">
                        <BookOpen className="w-4 h-4" /> Start Review
                      </Link>
                      <Link href="/quiz" className="btn-secondary inline-flex !px-10 !py-4 text-sm">
                        <Zap className="w-4 h-4" /> Assessment
                      </Link>
                    </div>
                 </div>
               </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Link href="/homework" className="card group hover:shadow-lg transition-all">
                <HelpCircle className="w-6 h-6 text-text-muted mb-6 group-hover:text-brand-500 transition-colors" />
                <h3 className="text-lg font-black uppercase tracking-tight text-text-primary">AI Assistant</h3>
                <p className="text-sm text-text-muted mt-2 font-medium">Technical guidance and problem solving.</p>
              </Link>
              <Link href="/leaderboard" className="card group hover:shadow-lg transition-all">
                <Trophy className="w-6 h-6 text-text-muted mb-6 group-hover:text-accent-amber transition-colors" />
                <h3 className="text-lg font-black uppercase tracking-tight text-text-primary">Global Rankings</h3>
                <p className="text-sm text-text-muted mt-2 font-medium">Competitive status among elite members.</p>
              </Link>
            </div>
          </section>

          <aside className="space-y-10">
            <div>
               <div className="flex items-center gap-2 mb-6">
                 <Clock className="w-4 h-4 text-text-muted" />
                 <h2 className="text-xs uppercase tracking-[0.3em] font-bold text-text-muted">Metrics</h2>
               </div>
               
               <div
                 className="card backdrop-blur-md"
                 style={{
                   backgroundColor: 'rgba(244, 247, 236, 0.4)',
                   borderColor: 'var(--border-muted)',
                 }}
               >
                 <div className="flex items-center justify-between mb-8">
                   <div className="text-sm font-black uppercase tracking-widest text-text-muted">Progression</div>
                   <div
                     className="text-[10px] font-black px-3 py-1 rounded-lg border"
                     style={{
                       backgroundColor: 'var(--surface-muted)',
                       borderColor: 'var(--border-primary)',
                       color: 'var(--text-muted)',
                     }}
                   >
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
                 
                 <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest text-center mt-4">
                   50 XP required for next milestone
                 </p>
               </div>
            </div>

            <div
              className="card relative overflow-hidden group border-none"
              style={{
                backgroundColor: 'var(--surface-elevated)',
              }}
            >
               <div
                 className="absolute inset-0 opacity-60 group-hover:opacity-100 transition-opacity"
                 style={{
                   background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-700) 100%)',
                 }}
               />
               <div className="relative z-10">
                  <h3 className="text-text-primary text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                    <Moon className="w-4 h-4 text-accent-amber" /> Interface Status
                  </h3>
                  <p className="text-text-muted text-xs mb-8 font-medium leading-relaxed">Adjust system luminosity for optimal cognitive performance during deep work cycles.</p>
                  <button
                    onClick={() => useAuthStore.getState().toggleDarkMode()}
                    className="w-full py-2.5 btn-secondary text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
                  >
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
