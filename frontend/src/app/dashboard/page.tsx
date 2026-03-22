'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, HelpCircle, Zap, Flame, Trophy, ChevronRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dueCards, setDueCards] = useState(0);
  const [recentHomework, setRecentHomework] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const level = user ? getLevelFromXP(user.xp || 0) : null;

  useEffect(() => {
    Promise.all([
      flashcardApi.dueCards().catch(() => ({ data: { count: 0 } })),
      homeworkApi.history().catch(() => ({ data: { history: [] } })),
      userApi.achievements().catch(() => ({ data: { achievements: [] } })),
    ]).then(([cards, hw, ach]) => {
      setDueCards(cards.data.count || 0);
      setRecentHomework(hw.data.history?.slice(0, 3) || []);
      setAchievements(ach.data.achievements?.filter((a: any) => a.earned).slice(0, 4) || []);
    }).finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: 'Flashcards',
      href: '/flashcards',
      icon: BookOpen,
      color: 'brand',
      value: dueCards > 0 ? `${dueCards} due` : 'All caught up!',
      sub: dueCards > 0 ? 'cards need review' : 'no cards due today',
      cta: dueCards > 0 ? 'Study now' : 'Add cards',
      urgent: dueCards > 0,
    },
    {
      title: 'Homework',
      href: '/homework',
      icon: HelpCircle,
      color: 'blue',
      value: recentHomework.length > 0 ? `${recentHomework.length} recent` : 'Ask away',
      sub: 'AI-powered help',
      cta: 'Ask a question',
      urgent: false,
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-extrabold">
            Hey {user?.username} 👋
          </h1>
          <p className="text-slate-400 mt-1">Here's your study overview.</p>
        </div>

        {/* XP Card */}
        {level && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="card border-brand-500/20 bg-gradient-to-br from-brand-500/5 to-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold">Level {level.level}</div>
                  <div className="text-sm text-slate-400">{user?.xp || 0} XP total</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                <Flame className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="font-extrabold text-amber-400">{user?.streak || 0}</div>
                  <div className="text-xs text-slate-500">day streak</div>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress to Level {level.level + 1}</span>
                <span>{level.nextLevelXP - (user?.xp || 0)} XP to go</span>
              </div>
              <div className="h-3 bg-surface-border rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(level.progress * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500"
                />
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>{level.currentLevelXP} XP</span>
                <span>{level.nextLevelXP} XP</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link href={c.href}
                className={`card flex items-center gap-4 hover:border-${c.color}-500/40 transition-all group cursor-pointer block`}>
                <div className={`w-12 h-12 rounded-2xl bg-${c.color}-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-${c.color}-500/20 transition-colors`}>
                  <c.icon className={`w-6 h-6 text-${c.color}-400`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold">{c.title}</div>
                  <div className={`text-sm font-semibold ${c.urgent ? 'text-amber-400' : 'text-slate-400'}`}>{c.value}</div>
                  <div className="text-xs text-slate-500">{c.sub}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {c.urgent && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent homework */}
        {recentHomework.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" /> Recent Questions
              </h2>
              <Link href="/homework" className="text-sm text-brand-400 hover:underline">See all</Link>
            </div>
            <div className="space-y-2">
              {recentHomework.map((hw: any) => (
                <Link key={hw.id} href="/homework"
                  className="card !py-3 !px-4 flex items-start gap-3 hover:border-brand-500/30 transition-all group">
                  <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate group-hover:text-white transition-colors">
                      {hw.question}
                    </div>
                    {hw.subject && (
                      <div className="text-xs text-slate-500 mt-0.5">{hw.subject}</div>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Recent Achievements
              </h2>
              <Link href="/profile" className="text-sm text-brand-400 hover:underline">See all</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="card !py-3 !px-4 flex items-center gap-3 border-amber-500/10">
                  <div className="text-2xl">{a.icon || '🏆'}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{a.name}</div>
                    <div className="text-xs text-slate-500 truncate">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && recentHomework.length === 0 && dueCards === 0 && (
          <div className="text-center py-12 card border-dashed">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-xl font-bold mb-2">Ready to start learning?</h2>
            <p className="text-slate-500 mb-6 text-sm">Create some flashcards or ask your first homework question!</p>
            <div className="flex gap-3 justify-center">
              <Link href="/flashcards" className="btn-primary flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Flashcards
              </Link>
              <Link href="/homework" className="btn-ghost flex items-center gap-2">
                <HelpCircle className="w-4 h-4" /> Homework
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
