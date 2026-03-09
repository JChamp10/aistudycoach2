'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuthStore } from '@/lib/store';
import { flashcardApi, studyApi, plannerApi } from '@/lib/api';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { Brain, BookOpen, Shuffle, Zap, Flame, Calendar, ChevronRight, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dueCards, setDueCards] = useState(0);
  const [todayPlans, setTodayPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    flashcardApi.dueCards().then(r => setDueCards(r.data.count)).catch(() => {});
    plannerApi.list({ from: new Date().toISOString().split('T')[0] }).then(r => setTodayPlans(r.data.plans?.slice(0, 3) || [])).catch(() => {});
    studyApi.sessions().then(r => setSessions(r.data.sessions?.slice(0, 5) || [])).catch(() => {});
  }, []);

  const level = user ? getLevelFromXP(user.xp) : null;

  const quickActions = [
    { href: '/flashcards', icon: BookOpen, label: 'Study Flashcards', color: 'bg-brand-500/10 hover:bg-brand-500/20 border-brand-500/20', iconColor: 'text-brand-400', badge: dueCards > 0 ? `${dueCards} due` : undefined },
    { href: '/recall',     icon: Brain,    label: 'Free Recall',      color: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20', iconColor: 'text-purple-400' },
    { href: '/quiz',       icon: Shuffle,  label: 'Practice Quiz',    color: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20',   iconColor: 'text-amber-400' },
    { href: '/homework',   icon: Zap,      label: 'Homework Help',    color: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/20',   iconColor: 'text-green-400' },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold">Good {getGreeting()}, {user?.username} 👋</h1>
          <p className="text-slate-400 mt-1">Here's your study overview for today.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total XP',     value: user?.xp?.toLocaleString() || '0', icon: Zap,       color: 'text-brand-400',  bg: 'bg-brand-500/10',  sub: level ? `Level ${level.level}` : '' },
            { label: 'Study Streak', value: `${user?.streak || 0} 🔥`,         icon: Flame,     color: 'text-amber-400',  bg: 'bg-amber-500/10',  sub: 'days in a row' },
            { label: 'Cards Due',    value: dueCards,                           icon: BookOpen,  color: 'text-purple-400', bg: 'bg-purple-500/10', sub: 'for review today' },
            { label: 'Sessions',     value: sessions.length,                    icon: TrendingUp,color: 'text-green-400',  bg: 'bg-green-500/10',  sub: 'recent sessions' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
              {stat.sub && <div className="text-xs text-slate-600">{stat.sub}</div>}
            </motion.div>
          ))}
        </div>

        {level && (
          <div className="card">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-sm">Level {level.level} → Level {level.level + 1}</span>
              <span className="text-xs text-slate-500">{user?.xp} / {level.nextLevelXP} XP</span>
            </div>
            <div className="xp-bar h-3">
              <div className="xp-bar-fill" style={{ width: `${level.progress * 100}%` }} />
            </div>
            <div className="text-xs text-slate-500 mt-2">{Math.round(level.progress * 100)}% to next level</div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold mb-4">Quick Study</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className={`card border ${action.color} transition-all hover:scale-[1.02] group relative`}>
                {action.badge && (
                  <div className="absolute top-3 right-3 badge bg-brand-500/20 text-brand-400 border border-brand-500/30">{action.badge}</div>
                )}
                <action.icon className={`w-8 h-8 ${action.iconColor} mb-3`} />
                <div className="font-semibold text-sm">{action.label}</div>
                <ChevronRight className="w-4 h-4 text-slate-600 mt-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold flex items-center gap-2"><Calendar className="w-4 h-4 text-brand-400" /> Today's Plan</h2>
              <Link href="/planner" className="text-xs text-brand-400 hover:underline">View all</Link>
            </div>
            {todayPlans.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No tasks scheduled. <Link href="/planner" className="text-brand-400 hover:underline">Create a study plan →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPlans.map((plan) => (
                  <div key={plan.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-muted">
                    <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.is_completed ? 'text-green-400' : 'text-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{plan.task_description}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {plan.duration_minutes} min · {plan.subject}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-400" /> Recent Sessions</h2>
              <Link href="/progress" className="text-xs text-brand-400 hover:underline">View all</Link>
            </div>
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No sessions yet. Start studying!</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
                    <div>
                      <div className="text-sm font-medium capitalize">{s.type.replace('_', ' ')}</div>
                      <div className="text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      {s.score !== null && (
                        <div className={`text-sm font-bold ${s.score >= 0.8 ? 'text-green-400' : s.score >= 0.6 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(s.score * 100)}%
                        </div>
                      )}
                      <div className="text-xs text-brand-400">+{s.xp_earned} XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
