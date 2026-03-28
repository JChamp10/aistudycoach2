'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, HelpCircle, Zap, Flame, Trophy, ChevronRight, Clock, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';
import { StaggerContainer, StaggerItem } from '@/components/layout/StaggerContainer';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Radial Progress Ring ─────────────────────────────────────────────────────
function RadialRing({ value, max, size = 80, strokeWidth = 6, color, label, icon }: {
  value: number; max: number; size?: number; strokeWidth?: number;
  color: string; label: string; icon: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / max, 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="var(--border-primary)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - percent) }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {value}/{max}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Phoenix SVG (inline for dashboard) ──────────────────────────────────────
function DashboardPhoenix({ level }: { level: number }) {
  const stage = level <= 3 ? 'egg' : level <= 8 ? 'chick' : level <= 15 ? 'bird' : 'phoenix';

  if (stage === 'egg') return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-xl">
      <ellipse cx="60" cy="68" rx="32" ry="40" fill="url(#de)" />
      <ellipse cx="46" cy="56" rx="8" ry="12" fill="#ff8c3a" opacity="0.3" />
      <ellipse cx="50" cy="44" rx="4" ry="3" fill="white" opacity="0.5" />
      <text x="60" y="115" textAnchor="middle" fontSize="12" fill="var(--text-faint)">Hatching soon...</text>
      <defs>
        <radialGradient id="de" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffe0a0" />
          <stop offset="100%" stopColor="#ff8c3a" />
        </radialGradient>
      </defs>
    </svg>
  );

  if (stage === 'chick') return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-xl">
      <ellipse cx="60" cy="76" rx="28" ry="24" fill="#ffb570" />
      <circle cx="60" cy="44" r="22" fill="#ffb570" />
      <circle cx="50" cy="40" r="6" fill="white" />
      <circle cx="70" cy="40" r="6" fill="white" />
      <circle cx="51.5" cy="41" r="3" fill="#2d1f0e" />
      <circle cx="71.5" cy="41" r="3" fill="#2d1f0e" />
      <path d="M56 50 L64 50 L60 56 Z" fill="#ff6b1a" />
      <ellipse cx="32" cy="72" rx="10" ry="16" fill="#ff8c3a" transform="rotate(-20 32 72)" />
      <ellipse cx="88" cy="72" rx="10" ry="16" fill="#ff8c3a" transform="rotate(20 88 72)" />
      <path d="M56 22 Q60 12 64 22" stroke="#ff6b1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="var(--text-faint)">Just hatched! 🐣</text>
    </svg>
  );

  if (stage === 'bird') return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-xl">
      <path d="M60 90 Q40 110 28 116 Q36 100 44 92" fill="#e85500" />
      <path d="M60 90 Q60 116 56 124 Q60 108 64 92" fill="#ff6b1a" />
      <path d="M60 90 Q80 110 92 116 Q84 100 76 92" fill="#e85500" />
      <ellipse cx="60" cy="72" rx="26" ry="22" fill="#ff8c3a" />
      <path d="M34 64 Q16 48 20 28 Q32 44 40 60" fill="#e85500" />
      <path d="M86 64 Q104 48 100 28 Q88 44 80 60" fill="#e85500" />
      <circle cx="60" cy="44" r="20" fill="#ffb570" />
      <path d="M52 24 Q56 8 60 16 Q64 8 68 24" fill="#ff6b1a" />
      <circle cx="50" cy="42" r="7" fill="white" />
      <circle cx="70" cy="42" r="7" fill="white" />
      <circle cx="51.5" cy="43" r="4" fill="#2d1f0e" />
      <circle cx="71.5" cy="43" r="4" fill="#2d1f0e" />
      <path d="M54 52 L66 52 L60 60 Z" fill="#e85500" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="var(--text-faint)">Learning to soar! 🦅</text>
    </svg>
  );

  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-2xl">
      <ellipse cx="60" cy="84" rx="40" ry="16" fill="#ff6b1a" opacity="0.2" />
      <path d="M60 92 Q32 116 16 124 Q28 104 40 92" fill="#ff6b1a" opacity="0.85" />
      <path d="M60 92 Q56 124 52 132 Q60 112 68 92" fill="#ffb570" />
      <path d="M60 92 Q88 116 104 124 Q92 104 80 92" fill="#ff6b1a" opacity="0.85" />
      <ellipse cx="60" cy="70" rx="24" ry="24" fill="url(#dpb)" />
      <path d="M36 60 Q8 36 12 12 Q24 36 40 56" fill="#e85500" />
      <path d="M84 60 Q112 36 108 12 Q96 36 80 56" fill="#e85500" />
      <circle cx="60" cy="40" r="22" fill="url(#dph)" />
      <path d="M48 18 Q44 4 52 12 Q56 0 60 10 Q64 0 68 12 Q76 4 72 18" fill="#ff6b1a" />
      <circle cx="50" cy="38" r="8" fill="white" />
      <circle cx="70" cy="38" r="8" fill="white" />
      <circle cx="51" cy="39" r="5" fill="#ff6b1a" />
      <circle cx="71" cy="39" r="5" fill="#ff6b1a" />
      <circle cx="51" cy="39" r="2.5" fill="#2d1f0e" />
      <circle cx="71" cy="39" r="2.5" fill="#2d1f0e" />
      <path d="M54 50 L66 50 L60 58 Z" fill="#e85500" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="var(--text-faint)">Legendary Phoenix! 🔥</text>
      <defs>
        <radialGradient id="dpb" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffb570" />
          <stop offset="100%" stopColor="#e85500" />
        </radialGradient>
        <radialGradient id="dph" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffe0a0" />
          <stop offset="100%" stopColor="#ffb570" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Generate mock weekly data ────────────────────────────────────────────────
function generateWeeklyData(streak: number, xp: number) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay(); // 0 = Sun, 1 = Mon ...
  return days.map((day, i) => {
    const isActive = i < streak || (i < today && streak > 0);
    return {
      day,
      xp: isActive ? Math.floor(20 + Math.random() * (xp / 7)) : Math.floor(Math.random() * 10),
      study: isActive ? Math.floor(10 + Math.random() * 40) : 0,
    };
  });
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dueCards, setDueCards] = useState(0);
  const [recentHomework, setRecentHomework] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const level = user ? getLevelFromXP(user.xp || 0) : null;
  const stage = level ? (level.level <= 3 ? 'Hatchling' : level.level <= 8 ? 'Fledgling' : level.level <= 15 ? 'Soaring' : 'Phoenix') : '';

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

  const weeklyData = generateWeeklyData(user?.streak || 0, user?.xp || 0);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Phoenix hero welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'var(--gradient-card)',
            border: '1.5px solid var(--border-primary)',
            boxShadow: '0 8px 32px var(--surface-shadow)',
          }}>
          <div className="flex items-center gap-6 p-8">
            <div className="w-32 h-32 flex-shrink-0 animate-float">
              {level && <DashboardPhoenix level={level.level} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--brand-400)' }}>
                {stage} · Level {level?.level || 1}
              </div>
              <h1 className="text-3xl font-extrabold mb-1" style={{ color: 'var(--text-primary)' }}>
                Hey {user?.username}! 👋
              </h1>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                {dueCards > 0
                  ? `You have ${dueCards} flashcards due for review today!`
                  : 'All caught up! Keep the streak alive.'}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4" style={{ color: 'var(--brand-500)' }} />
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{user?.streak || 0}</span>
                  <span className="text-sm" style={{ color: 'var(--text-light)' }}>day streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4" style={{ color: 'var(--brand-500)' }} />
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{user?.xp || 0}</span>
                  <span className="text-sm" style={{ color: 'var(--text-light)' }}>XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP bar */}
          {level && (
            <div className="px-8 pb-6">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-light)' }}>
                <span>Progress to Level {level.level + 1}</span>
                <span>{level.nextLevelXP - (user?.xp || 0)} XP to go</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-primary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(level.progress * 100, 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, var(--brand-400), var(--brand-200))` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                <span>{level.currentLevelXP} XP</span>
                <span>{level.nextLevelXP} XP</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Data Visualizations ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radial Rings */}
            <div className="card flex items-center justify-around py-6">
              <RadialRing
                value={user?.streak || 0} max={7}
                color="#ff6b1a" label="Weekly Streak" icon="🔥"
              />
              <RadialRing
                value={Math.min(level?.progress ? Math.round(level.progress * 100) : 0, 100)} max={100}
                color="var(--brand-400)" label="XP Progress" icon="⚡"
              />
              <RadialRing
                value={user?.ai_calls_today || 0} max={user?.plan === 'pro' ? 999 : 5}
                color="#8b5cf6" label="AI Uses" icon="🧠"
              />
            </div>

            {/* Area Chart */}
            <div className="card py-4">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-faint)' }}>
                Weekly Activity
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand-400)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--brand-400)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="var(--brand-400)"
                    strokeWidth={2}
                    fill="url(#xpGrad)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Quick action cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: '/flashcards',
              icon: BookOpen,
              title: 'Flashcards',
              value: dueCards > 0 ? `${dueCards} due today` : 'All caught up!',
              sub: dueCards > 0 ? 'cards need review' : 'no cards due',
              urgent: dueCards > 0,
            },
            {
              href: '/homework',
              icon: HelpCircle,
              title: 'Homework',
              value: recentHomework.length > 0 ? `${recentHomework.length} recent` : 'Ask anything',
              sub: 'AI-powered help',
              urgent: false,
            },
            {
              href: '/math',
              icon: Calculator,
              title: 'Math Helper',
              value: 'Graph & Calculate',
              sub: 'Scientific tools',
              urgent: false,
            },
          ].map((c) => (
            <StaggerItem key={c.href}>
              <Link href={c.href}
                className="block rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--gradient-card)',
                  border: '1.5px solid var(--border-primary)',
                  boxShadow: '0 2px 12px var(--surface-shadow)',
                }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(var(--brand-400-rgb, 255,107,26), 0.12)' }}>
                    <c.icon className="w-5 h-5" style={{ color: 'var(--brand-400)' }} />
                  </div>
                  {c.urgent && <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--brand-500)' }} />}
                </div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{c.title}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--brand-400)' }}>{c.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{c.sub}</div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Recent homework */}
        {recentHomework.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Clock className="w-5 h-5" style={{ color: 'var(--text-light)' }} /> Recent Questions
              </h2>
              <Link href="/homework" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-400)' }}>
                See all
              </Link>
            </div>
            <StaggerContainer className="space-y-2">
              {recentHomework.map((hw: any) => (
                <StaggerItem key={hw.id}>
                  <Link href="/homework"
                    className="flex items-start gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                    style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-primary)', boxShadow: '0 2px 8px var(--surface-shadow)' }}>
                    <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-400)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {hw.question?.replace('[PDF] ', '') || 'Question'}
                      </div>
                      {hw.subject && <div className="text-xs mt-0.5" style={{ color: 'var(--text-light)' }}>{hw.subject}</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Trophy className="w-5 h-5" style={{ color: 'var(--brand-500)' }} /> Recent Achievements
              </h2>
              <Link href="/profile" className="text-sm font-medium hover:underline" style={{ color: 'var(--brand-400)' }}>
                See all
              </Link>
            </div>
            <StaggerContainer className="grid grid-cols-2 gap-3">
              {achievements.map((a: any) => (
                <StaggerItem key={a.id}>
                  <div className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: 'var(--brand-50)', border: '1.5px solid var(--border-brand)' }}>
                    <div className="text-2xl">{a.icon || '🏆'}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.name}</div>
                      <div className="text-xs truncate" style={{ color: 'var(--text-light)' }}>{a.description}</div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        )}

        {/* Empty state */}
        {!loading && recentHomework.length === 0 && dueCards === 0 && (
          <div className="text-center py-12 rounded-3xl"
            style={{ background: 'var(--gradient-card)', border: '1.5px dashed var(--border-primary)' }}>
            <div className="w-24 h-24 mx-auto mb-4 animate-float">
              {level && <DashboardPhoenix level={level.level} />}
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Ready to start learning?</h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-light)' }}>Create some flashcards or ask your first homework question!</p>
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
