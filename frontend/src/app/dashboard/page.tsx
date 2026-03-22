'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, HelpCircle, Zap, Flame, Trophy, ChevronRight, Clock, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Phoenix SVG (inline for dashboard) ──────────────────────────────────────
function DashboardPhoenix({ level }: { level: number }) {
  const stage = level <= 3 ? 'egg' : level <= 8 ? 'chick' : level <= 15 ? 'bird' : 'phoenix';

  if (stage === 'egg') return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-xl">
      <ellipse cx="60" cy="68" rx="32" ry="40" fill="url(#de)" />
      <ellipse cx="46" cy="56" rx="8" ry="12" fill="#ff8c3a" opacity="0.3" />
      <ellipse cx="50" cy="44" rx="4" ry="3" fill="white" opacity="0.5" />
      <text x="60" y="115" textAnchor="middle" fontSize="12" fill="#b8a090">Hatching soon...</text>
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
      <circle cx="52.5" cy="39.5" r="1" fill="white" />
      <circle cx="72.5" cy="39.5" r="1" fill="white" />
      <path d="M56 50 L64 50 L60 56 Z" fill="#ff6b1a" />
      <ellipse cx="32" cy="72" rx="10" ry="16" fill="#ff8c3a" transform="rotate(-20 32 72)" />
      <ellipse cx="88" cy="72" rx="10" ry="16" fill="#ff8c3a" transform="rotate(20 88 72)" />
      <path d="M56 22 Q60 12 64 22" stroke="#ff6b1a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 26 Q54 16 58 26" stroke="#ffb570" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="#b8a090">Just hatched! 🐣</text>
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
      <path d="M34 64 Q20 56 24 40 Q32 52 40 60" fill="#ff6b1a" />
      <path d="M86 64 Q100 56 96 40 Q88 52 80 60" fill="#ff6b1a" />
      <circle cx="60" cy="44" r="20" fill="#ffb570" />
      <path d="M52 24 Q56 8 60 16 Q64 8 68 24" fill="#ff6b1a" />
      <path d="M56 26 Q60 14 64 26" fill="#ffb570" />
      <circle cx="50" cy="42" r="7" fill="white" />
      <circle cx="70" cy="42" r="7" fill="white" />
      <circle cx="51.5" cy="43" r="4" fill="#2d1f0e" />
      <circle cx="71.5" cy="43" r="4" fill="#2d1f0e" />
      <circle cx="52.5" cy="41.5" r="1.5" fill="white" />
      <circle cx="72.5" cy="41.5" r="1.5" fill="white" />
      <path d="M54 52 L66 52 L60 60 Z" fill="#e85500" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="#b8a090">Learning to soar! 🦅</text>
    </svg>
  );

  return (
    <svg viewBox="0 0 120 120" fill="none" className="w-full h-full drop-shadow-2xl">
      <ellipse cx="60" cy="84" rx="40" ry="16" fill="#ff6b1a" opacity="0.2" />
      <path d="M60 92 Q32 116 16 124 Q28 104 40 92" fill="#ff6b1a" opacity="0.85" />
      <path d="M60 92 Q56 124 52 132 Q60 112 68 92" fill="#ffb570" />
      <path d="M60 92 Q88 116 104 124 Q92 104 80 92" fill="#ff6b1a" opacity="0.85" />
      <path d="M60 92 Q36 108 24 112 Q36 96 48 92" fill="#e85500" opacity="0.6" />
      <path d="M60 92 Q84 108 96 112 Q84 96 72 92" fill="#e85500" opacity="0.6" />
      <ellipse cx="60" cy="70" rx="24" ry="24" fill="url(#dpb)" />
      <path d="M36 60 Q8 36 12 12 Q24 36 40 56" fill="#e85500" />
      <path d="M84 60 Q112 36 108 12 Q96 36 80 56" fill="#e85500" />
      <path d="M36 60 Q16 52 20 36 Q28 48 40 56" fill="#ff6b1a" />
      <path d="M84 60 Q104 52 100 36 Q92 48 80 56" fill="#ff6b1a" />
      <path d="M36 60 Q22 56 26 44 Q32 52 40 56" fill="#ffb570" opacity="0.6" />
      <path d="M84 60 Q98 56 94 44 Q88 52 80 56" fill="#ffb570" opacity="0.6" />
      <circle cx="60" cy="40" r="22" fill="url(#dph)" />
      <path d="M48 18 Q44 4 52 12 Q56 0 60 10 Q64 0 68 12 Q76 4 72 18" fill="#ff6b1a" />
      <path d="M52 20 Q50 8 56 14 Q60 6 64 14 Q70 8 68 20" fill="#ffb570" />
      <circle cx="50" cy="38" r="8" fill="white" />
      <circle cx="70" cy="38" r="8" fill="white" />
      <circle cx="51" cy="39" r="5" fill="#ff6b1a" />
      <circle cx="71" cy="39" r="5" fill="#ff6b1a" />
      <circle cx="51" cy="39" r="2.5" fill="#2d1f0e" />
      <circle cx="71" cy="39" r="2.5" fill="#2d1f0e" />
      <circle cx="52" cy="37.5" r="1" fill="white" />
      <circle cx="72" cy="37.5" r="1" fill="white" />
      <path d="M54 50 L66 50 L60 58 Z" fill="#e85500" />
      <ellipse cx="60" cy="72" rx="12" ry="14" fill="#ffb570" opacity="0.4" />
      <circle cx="20" cy="30" r="3" fill="#ffb570" opacity="0.8" />
      <circle cx="100" cy="24" r="2" fill="#ff6b1a" opacity="0.8" />
      <circle cx="16" cy="60" r="2" fill="#ffb570" opacity="0.6" />
      <circle cx="104" cy="56" r="3" fill="#ff6b1a" opacity="0.6" />
      <circle cx="30" cy="16" r="1.5" fill="#ffe0a0" opacity="0.9" />
      <circle cx="90" cy="18" r="2" fill="#ffe0a0" opacity="0.9" />
      <text x="60" y="115" textAnchor="middle" fontSize="11" fill="#b8a090">Legendary Phoenix! 🔥</text>
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

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Phoenix hero welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, #fff8f0, #ffecd6)',
            border: '1.5px solid #ffd4a8',
            boxShadow: '0 8px 32px rgba(255,107,26,0.12)',
          }}>
          <div className="flex items-center gap-6 p-8">
            <div className="w-32 h-32 flex-shrink-0 animate-float">
              {level && <DashboardPhoenix level={level.level} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: '#ff6b1a' }}>
                {stage} · Level {level?.level || 1}
              </div>
              <h1 className="text-3xl font-extrabold text-ink mb-1">
                Hey {user?.username}! 👋
              </h1>
              <p className="text-ink-light text-sm mb-4">
                {dueCards > 0
                  ? `You have ${dueCards} flashcards due for review today!`
                  : 'All caught up! Keep the streak alive.'}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-brand-500" />
                  <span className="font-bold text-ink">{user?.streak || 0}</span>
                  <span className="text-sm text-ink-muted">day streak</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <span className="font-bold text-ink">{user?.xp || 0}</span>
                  <span className="text-sm text-ink-muted">XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* XP bar */}
          {level && (
            <div className="px-8 pb-6">
              <div className="flex justify-between text-xs text-ink-muted mb-2">
                <span>Progress to Level {level.level + 1}</span>
                <span>{level.nextLevelXP - (user?.xp || 0)} XP to go</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden" style={{ background: '#ffd4a8' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(level.progress * 100, 100)}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #ff6b1a, #ffb570)' }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: '#e0c4a0' }}>
                <span>{level.currentLevelXP} XP</span>
                <span>{level.nextLevelXP} XP</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              href: '/flashcards',
              icon: BookOpen,
              title: 'Flashcards',
              value: dueCards > 0 ? `${dueCards} due today` : 'All caught up!',
              sub: dueCards > 0 ? 'cards need review' : 'no cards due',
              urgent: dueCards > 0,
              color: '#ff6b1a',
              bg: 'linear-gradient(135deg, #fff8f0, #ffecd6)',
              border: '#ffd4a8',
            },
            {
              href: '/homework',
              icon: HelpCircle,
              title: 'Homework',
              value: recentHomework.length > 0 ? `${recentHomework.length} recent` : 'Ask anything',
              sub: 'AI-powered help',
              urgent: false,
              color: '#e85500',
              bg: 'linear-gradient(135deg, #fff5ee, #ffe8d4)',
              border: '#ffc9a0',
            },
            {
              href: '/math',
              icon: Calculator,
              title: 'Math Helper',
              value: 'Graph & Calculate',
              sub: 'Scientific tools',
              urgent: false,
              color: '#c44400',
              bg: 'linear-gradient(135deg, #fff3ec, #ffe0c8)',
              border: '#ffb880',
            },
          ].map((c, i) => (
            <motion.div key={c.href} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}>
              <Link href={c.href}
                className="block rounded-2xl p-5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: c.bg, border: `1.5px solid ${c.border}`, boxShadow: '0 2px 12px rgba(139,90,60,0.08)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${c.color}20` }}>
                    <c.icon className="w-5 h-5" style={{ color: c.color }} />
                  </div>
                  {c.urgent && <div className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />}
                </div>
                <div className="font-bold text-ink">{c.title}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: c.color }}>{c.value}</div>
                <div className="text-xs text-ink-muted mt-0.5">{c.sub}</div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent homework */}
        {recentHomework.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2 text-ink">
                <Clock className="w-5 h-5 text-ink-muted" /> Recent Questions
              </h2>
              <Link href="/homework" className="text-sm font-medium hover:underline" style={{ color: '#ff6b1a' }}>
                See all
              </Link>
            </div>
            <div className="space-y-2">
              {recentHomework.map((hw: any) => (
                <Link key={hw.id} href="/homework"
                  className="flex items-start gap-3 p-4 rounded-2xl transition-all hover:scale-[1.01]"
                  style={{ background: '#fffcf9', border: '1.5px solid #e8ddd0', boxShadow: '0 2px 8px rgba(139,90,60,0.06)' }}>
                  <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#ff6b1a' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-ink">
                      {hw.question?.replace('[PDF] ', '') || 'Question'}
                    </div>
                    {hw.subject && <div className="text-xs text-ink-muted mt-0.5">{hw.subject}</div>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-faint flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg flex items-center gap-2 text-ink">
                <Trophy className="w-5 h-5 text-brand-500" /> Recent Achievements
              </h2>
              <Link href="/profile" className="text-sm font-medium hover:underline" style={{ color: '#ff6b1a' }}>
                See all
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((a: any) => (
                <div key={a.id} className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ background: '#fff8f0', border: '1.5px solid #ffd4a8' }}>
                  <div className="text-2xl">{a.icon || '🏆'}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate text-ink">{a.name}</div>
                    <div className="text-xs text-ink-muted truncate">{a.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && recentHomework.length === 0 && dueCards === 0 && (
          <div className="text-center py-12 rounded-3xl"
            style={{ background: 'linear-gradient(135deg, #fff8f0, #ffecd6)', border: '1.5px dashed #ffd4a8' }}>
            <div className="w-24 h-24 mx-auto mb-4 animate-float">
              {level && <DashboardPhoenix level={level.level} />}
            </div>
            <h2 className="text-xl font-bold mb-2 text-ink">Ready to start learning?</h2>
            <p className="text-ink-muted mb-6 text-sm">Create some flashcards or ask your first homework question!</p>
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
