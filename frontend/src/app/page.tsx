'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, HelpCircle, Zap, Flame, Trophy, Play, Brain, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const level = user ? getLevelFromXP(user.xp || 0) : null;
  const xpIntoGoal = (user?.xp || 0) % 50;
  const goalPct = (xpIntoGoal / 50) * 100;

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      if (user?.streak && user.streak > 0 && user.streak % 5 === 0) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#dc7b1e', '#f4b940', '#ffcf7c', '#c65a1e'],
          });
        });
      }
    }, 400);
  }, [user?.streak]);

function ZenGarden({ level }: { level: number }) {
  const stones = level >= 5 ? 3 : level >= 2 ? 1 : 0;
  const showPlant = level >= 10;
  const showRelic = level >= 15;

  return (
    <div className="relative w-full h-48 mb-8 overflow-hidden rounded-3xl zen-garden border-2 border-slate-200/50 shadow-inner flex items-center justify-center">
      {/* Sand patterns (SVG) */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 20 Q50 10 100 20 T200 20 T300 20 T400 20" stroke="#64748b" fill="none" strokeWidth="0.5" />
        <path d="M0 40 Q50 30 100 40 T200 40 T300 40 T400 40" stroke="#64748b" fill="none" strokeWidth="0.5" />
        <path d="M0 60 Q50 50 100 60 T200 60 T300 60 T400 60" stroke="#64748b" fill="none" strokeWidth="0.5" />
        <path d="M0 80 Q50 70 100 80 T200 80 T300 80 T400 80" stroke="#64748b" fill="none" strokeWidth="0.5" />
      </svg>

      <div className="relative flex gap-8 items-end pb-4">
        {stones > 0 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-12 h-8 zen-stone" />}
        {stones > 1 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} className="w-16 h-10 zen-stone -mb-2" />}
        {stones > 2 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="w-10 h-6 zen-stone" />}
        
        {showPlant && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="absolute -right-12 bottom-4">
            <div className="w-1 h-12 bg-emerald-800 rounded-full" />
            <div className="w-8 h-8 bg-emerald-500 rounded-full -mt-10 -ml-3 blur-[2px] opacity-60" />
          </motion.div>
        )}

        {showRelic && (
          <motion.div 
            animate={{ opacity: [0.4, 0.8, 0.4] }} 
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -left-16 top-0 w-6 h-6 bg-amber-400 rounded-full blur-md" 
          />
        )}
      </div>

      <div className="absolute top-4 left-6">
        <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Zen Garden</div>
        <div className="text-xs text-slate-500 font-medium">Lvl {level} Sanctuary</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const level = user ? getLevelFromXP(user.xp || 0) : null;
  const xpIntoGoal = (user?.xp || 0) % 50;
  const goalPct = (xpIntoGoal / 50) * 100;

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      if (user?.streak && user.streak > 0 && user.streak % 5 === 0) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#dc7b1e', '#f4b940', '#ffcf7c', '#c65a1e'],
          });
        });
      }
    }, 400);
  }, [user?.streak]);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 pt-6 pb-20">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Avatar
                username={user?.username}
                avatarUrl={user?.avatar_url}
                className="w-12 h-12 rounded-xl border-2 border-white shadow-sm"
                fallbackClassName="bg-brand-500/15 text-brand-500"
              />
              <h1 className="text-4xl font-black tracking-tight">
                Hello, {user?.username || 'Seeker'}
              </h1>
            </div>
            <p className="text-lg text-slate-500 font-medium">Your sanctuary is ready for session.</p>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Current Streak</div>
                <div className="text-2xl font-black text-orange-500 flex items-center justify-end gap-1">
                  <Flame className="w-5 h-5" /> {user?.streak || 0}
                </div>
             </div>
          </div>
        </header>

        <ZenGarden level={level?.level || 1} />

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          <section className="space-y-6">
            <div className="text-xs uppercase tracking-[0.25em] font-bold text-slate-400">Dominant Task</div>
            <div className="card !p-8 relative overflow-hidden group hover:border-brand-400 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Brain className="w-32 h-32" />
              </div>
              <h2 className="text-3xl font-black mb-4">Today&apos;s Mission</h2>
              <p className="text-slate-500 mb-8 max-w-md">
                Focus on the cards that challenge you most. Review 50 XP worth of material to maintain your growth.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/flashcards" className="btn-primary !px-8 !py-4 text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5" /> Review Cards
                </Link>
                <Link href="/quiz" className="btn-ghost !px-8 !py-4 text-base flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Take Quiz
                </Link>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Link href="/homework" className="card group hover:bg-slate-50 transition-colors">
                <HelpCircle className="w-8 h-8 text-brand-500 mb-4" />
                <h3 className="text-xl font-bold">AI Helper</h3>
                <p className="text-sm text-slate-500 mt-1">Get step-by-step guidance on any topic.</p>
              </Link>
              <Link href="/leaderboard" className="card group hover:bg-slate-50 transition-colors">
                <Trophy className="w-8 h-8 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold">Leaderboard</h3>
                <p className="text-sm text-slate-500 mt-1">See how you rank against other seekers.</p>
              </Link>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="text-xs uppercase tracking-[0.25em] font-bold text-slate-400">Progression</div>
            <div className="card !bg-white/50 backdrop-blur-sm border-dashed">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold">Goal Progress</div>
                <div className="text-sm font-black bg-brand-100 text-brand-700 px-3 py-1 rounded-full">{xpIntoGoal}/50 XP</div>
              </div>
              
              <div className="xp-bar h-6 mb-4">
                <motion.div 
                  className="xp-bar-fill" 
                  initial={{ width: 0 }} 
                  animate={{ width: `${goalPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              
              <p className="text-xs text-slate-400 italic">
                Each session adds a stone to your sanctuary. 50 XP to place the next one.
              </p>
            </div>

            <div className="card bg-slate-900 border-none relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
               <div className="relative z-10">
                  <h3 className="text-white text-lg font-bold flex items-center gap-2 mb-2">
                    <Moon className="w-4 h-4" /> Night Study
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">The garden is peaceful at night. Perfect for deep concentration.</p>
                  <button onClick={() => useAuthStore.getState().toggleDarkMode()} className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                    Switch Mode
                  </button>
               </div>
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
