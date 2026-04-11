'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, HelpCircle, Trophy, User, LogOut, Zap, Calculator, Users, Moon, Sun, Brain, Shield
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { userApi } from '@/lib/api';
import { getLevelFromXP } from '@/lib/utils';
import { clsx } from 'clsx';

const navItems = [
  { href: '/',            icon: LayoutDashboard, label: 'Learn' },
  { href: '/flashcards',  icon: BookOpen,        label: 'Flashcards' },
  { href: '/homework',    icon: HelpCircle,      label: 'AI Helper' },
  { href: '/quiz',        icon: Zap,             label: 'Practice' },
  { href: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
  { href: '/profile',     icon: User,            label: 'Profile' },
];

// ─── Phoenix SVG (levels up based on XP) ─────────────────────────────────────
function Phoenix({ level }: { level: number }) {
  const stage = level <= 3 ? 'egg' : level <= 8 ? 'chick' : level <= 15 ? 'bird' : 'phoenix';

  if (stage === 'egg') return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="30" cy="34" rx="16" ry="20" fill="#ffb570" />
      <ellipse cx="30" cy="34" rx="16" ry="20" fill="url(#eggGrad)" />
      <ellipse cx="23" cy="28" rx="4" ry="6" fill="#ff8c3a" opacity="0.4" />
      <ellipse cx="25" cy="22" rx="2" ry="1.5" fill="white" opacity="0.6" />
      <defs>
        <radialGradient id="eggGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffe0a0" />
          <stop offset="100%" stopColor="#ff8c3a" />
        </radialGradient>
      </defs>
    </svg>
  );

  if (stage === 'chick') return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Body */}
      <ellipse cx="30" cy="38" rx="14" ry="12" fill="#ffb570" />
      {/* Head */}
      <circle cx="30" cy="22" r="11" fill="#ffb570" />
      {/* Eyes */}
      <circle cx="25" cy="20" r="3" fill="white" />
      <circle cx="35" cy="20" r="3" fill="white" />
      <circle cx="25.8" cy="20.5" r="1.5" fill="#2d1f0e" />
      <circle cx="35.8" cy="20.5" r="1.5" fill="#2d1f0e" />
      <circle cx="26.3" cy="19.8" r="0.5" fill="white" />
      <circle cx="36.3" cy="19.8" r="0.5" fill="white" />
      {/* Beak */}
      <path d="M28 25 L32 25 L30 28 Z" fill="#ff6b1a" />
      {/* Tiny wings */}
      <ellipse cx="16" cy="36" rx="5" ry="8" fill="#ff8c3a" transform="rotate(-20 16 36)" />
      <ellipse cx="44" cy="36" rx="5" ry="8" fill="#ff8c3a" transform="rotate(20 44 36)" />
      {/* Feet */}
      <path d="M24 50 L22 54 M24 50 L26 54 M24 50 L24 54" stroke="#ff6b1a" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 50 L34 54 M36 50 L38 54 M36 50 L36 54" stroke="#ff6b1a" strokeWidth="2" strokeLinecap="round" />
      {/* Tuft */}
      <path d="M28 11 Q30 6 32 11" stroke="#ff6b1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M25 13 Q27 8 29 13" stroke="#ffb570" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );

  if (stage === 'bird') return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Tail feathers */}
      <path d="M30 45 Q20 55 14 58 Q18 50 22 46" fill="#e85500" />
      <path d="M30 45 Q30 58 28 62 Q30 54 32 46" fill="#ff6b1a" />
      <path d="M30 45 Q40 55 46 58 Q42 50 38 46" fill="#e85500" />
      {/* Body */}
      <ellipse cx="30" cy="36" rx="13" ry="11" fill="#ff8c3a" />
      <ellipse cx="30" cy="36" rx="13" ry="11" fill="url(#bodyGrad)" />
      {/* Wings */}
      <path d="M17 32 Q8 24 10 14 Q16 22 20 30" fill="#e85500" />
      <path d="M43 32 Q52 24 50 14 Q44 22 40 30" fill="#e85500" />
      <path d="M17 32 Q10 28 12 20 Q16 26 20 30" fill="#ff6b1a" />
      <path d="M43 32 Q50 28 48 20 Q44 26 40 30" fill="#ff6b1a" />
      {/* Head */}
      <circle cx="30" cy="22" r="10" fill="#ffb570" />
      <circle cx="30" cy="22" r="10" fill="url(#headGrad)" />
      {/* Crest */}
      <path d="M26 12 Q28 4 30 8 Q32 4 34 12" fill="#ff6b1a" />
      <path d="M28 13 Q30 7 32 13" fill="#ffb570" />
      {/* Eyes */}
      <circle cx="25" cy="21" r="3.5" fill="white" />
      <circle cx="35" cy="21" r="3.5" fill="white" />
      <circle cx="25.8" cy="21.5" r="2" fill="#2d1f0e" />
      <circle cx="35.8" cy="21.5" r="2" fill="#2d1f0e" />
      <circle cx="26.3" cy="20.8" r="0.7" fill="white" />
      <circle cx="36.3" cy="20.8" r="0.7" fill="white" />
      {/* Beak */}
      <path d="M27 26 L33 26 L30 30 Z" fill="#e85500" />
      <defs>
        <radialGradient id="bodyGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffb570" />
          <stop offset="100%" stopColor="#ff6b1a" />
        </radialGradient>
        <radialGradient id="headGrad" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffe0a0" />
          <stop offset="100%" stopColor="#ffb570" />
        </radialGradient>
      </defs>
    </svg>
  );

  // Full phoenix
  return (
    <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Flame aura */}
      <ellipse cx="30" cy="42" rx="20" ry="8" fill="#ff6b1a" opacity="0.15" />
      {/* Tail flames */}
      <path d="M30 46 Q16 58 8 62 Q14 52 20 46" fill="#ff6b1a" opacity="0.8" />
      <path d="M30 46 Q28 62 26 66 Q30 56 34 46" fill="#ffb570" />
      <path d="M30 46 Q44 58 52 62 Q46 52 40 46" fill="#ff6b1a" opacity="0.8" />
      <path d="M30 46 Q18 54 12 56 Q18 48 24 46" fill="#e85500" opacity="0.6" />
      <path d="M30 46 Q42 54 48 56 Q42 48 36 46" fill="#e85500" opacity="0.6" />
      {/* Body */}
      <ellipse cx="30" cy="35" rx="12" ry="12" fill="url(#phoenixBody)" />
      {/* Wing left */}
      <path d="M18 30 Q4 18 6 6 Q12 18 20 28" fill="#e85500" />
      <path d="M18 30 Q6 22 8 12 Q14 22 20 28" fill="#ff6b1a" />
      <path d="M18 30 Q8 26 10 18 Q14 24 20 28" fill="#ffb570" opacity="0.7" />
      {/* Wing right */}
      <path d="M42 30 Q56 18 54 6 Q48 18 40 28" fill="#e85500" />
      <path d="M42 30 Q54 22 52 12 Q46 22 40 28" fill="#ff6b1a" />
      <path d="M42 30 Q52 26 50 18 Q46 24 40 28" fill="#ffb570" opacity="0.7" />
      {/* Head */}
      <circle cx="30" cy="20" r="11" fill="url(#phoenixHead)" />
      {/* Crown flames */}
      <path d="M24 9 Q22 2 26 6 Q28 0 30 5 Q32 0 34 6 Q38 2 36 9" fill="#ff6b1a" />
      <path d="M26 10 Q25 4 28 7 Q30 3 32 7 Q35 4 34 10" fill="#ffb570" />
      {/* Eyes — glowing */}
      <circle cx="25" cy="19" r="4" fill="white" />
      <circle cx="35" cy="19" r="4" fill="white" />
      <circle cx="25.5" cy="19.5" r="2.5" fill="#ff6b1a" />
      <circle cx="35.5" cy="19.5" r="2.5" fill="#ff6b1a" />
      <circle cx="25.5" cy="19.5" r="1.2" fill="#2d1f0e" />
      <circle cx="35.5" cy="19.5" r="1.2" fill="#2d1f0e" />
      <circle cx="26" cy="18.8" r="0.5" fill="white" />
      <circle cx="36" cy="18.8" r="0.5" fill="white" />
      {/* Beak */}
      <path d="M27 25 L33 25 L30 29 Z" fill="#e85500" />
      {/* Chest marking */}
      <ellipse cx="30" cy="36" rx="6" ry="7" fill="#ffb570" opacity="0.5" />
      {/* Sparkles */}
      <circle cx="10" cy="15" r="1.5" fill="#ffb570" opacity="0.8" />
      <circle cx="50" cy="12" r="1" fill="#ff6b1a" opacity="0.8" />
      <circle cx="8" cy="30" r="1" fill="#ffb570" opacity="0.6" />
      <circle cx="52" cy="28" r="1.5" fill="#ff6b1a" opacity="0.6" />
      <defs>
        <radialGradient id="phoenixBody" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#ffb570" />
          <stop offset="100%" stopColor="#e85500" />
        </radialGradient>
        <radialGradient id="phoenixHead" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#ffe0a0" />
          <stop offset="100%" stopColor="#ffb570" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function PhoenixCompanion({ level, xp }: { level: number; xp: number }) {
  const stage = level <= 3 ? 'egg' : level <= 8 ? 'chick' : level <= 15 ? 'bird' : 'phoenix';
  const messages: Record<string, string[]> = {
    egg: ['Keep studying!', 'I\'m almost hatched!', 'You can do it!'],
    chick: ['Great job!', 'Keep it up!', 'Learning is fun!'],
    bird: ['You\'re on fire!', 'Amazing streak!', 'Keep soaring!'],
    phoenix: ['Legendary!', 'Unstoppable!', 'Pure brilliance!'],
  };
  const msg = messages[stage][Math.floor(Date.now() / 10000) % messages[stage].length];

  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 animate-float flex-shrink-0">
        <Phoenix level={level} />
      </div>
      <div className="text-xs italic" style={{ color: 'var(--text-muted)' }}>{msg}</div>
    </div>
  );
}

// ─── AI Usage Widget ──────────────────────────────────────────────────────────
function AiUsageWidget({ user }: { user: any }) {
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    userApi.usage().then(r => setUsage(r.data)).catch(() => {});
  }, []);

  const isUnlimited = usage?.unlimited || user?.plan === 'legend' || user?.plan === 'pro';
  const used = usage?.ai_calls_today ?? (user?.ai_calls_today || 0);
  const limit = usage?.ai_limit ?? 10;
  const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);

  if (isUnlimited) {
    return (
      <div className="relative rounded-xl p-3 shadow-md overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-surface))' }}>
        <div className="absolute inset-0 z-0 p-[2px] rounded-xl overflow-hidden">
          <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0%, #fbbf24 25%, #f59e0b 50%, #fbbf24 75%, transparent 100%)' }} />
          <div className="absolute inset-[2px] rounded-[10px]" style={{ background: 'var(--bg-card)' }} />
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-400">∞ Unlimited AI</div>
            <div className="text-[10px] text-ink-faint">Legend Mode Active</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl p-3 shadow-md overflow-hidden group" style={{ background: 'linear-gradient(to bottom right, var(--bg-card), var(--bg-surface))' }}>
      <div className="absolute inset-0 z-0 p-[2px] rounded-xl overflow-hidden">
        <div className="absolute inset-[-100%] animate-[spin_4s_linear_infinite]" style={{ background: 'conic-gradient(from 0deg, transparent 0%, #fbbf24 25%, #f59e0b 50%, #fbbf24 75%, transparent 100%)' }} />
        <div className="absolute inset-[2px] rounded-[10px]" style={{ background: 'var(--bg-card)' }} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs font-bold flex items-center gap-1" style={{ color: '#d97706' }}>
            <Zap className="w-3.5 h-3.5" /> AI Energy
          </div>
          <div className="text-xs font-medium" style={{ color: remaining <= 2 ? '#ef4444' : '#b45309' }}>
            {remaining} / {limit} left
          </div>
        </div>
        <div className="h-1.5 w-full rounded-full overflow-hidden mb-2" style={{ background: 'rgba(245, 158, 11, 0.2)' }}>
          <div className="h-full rounded-full transition-all" style={{ background: pct >= 80 ? '#ef4444' : '#f59e0b', width: `${pct}%`, boxShadow: `0 0 8px ${pct >= 80 ? '#ef4444' : '#f59e0b'}` }} />
        </div>
        <button
          onClick={() => useAuthStore.getState().setShowUpgradeModal(true)}
          className="w-full py-1.5 text-white text-[11px] font-bold rounded-lg shadow-sm hover:-translate-y-0.5 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}
        >
          Become a Legend
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp || 0) : null;

  return (
    <aside className="hidden md:flex w-64 h-screen fixed left-0 top-0 flex-col z-40"
      style={{ background: 'var(--gradient-sidebar)', borderRight: '1.5px solid var(--border-primary)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>

      {/* Logo + Phoenix */}
      <div className="h-16 px-5 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1.5px solid var(--border-primary)' }}>
        <div className="w-9 h-9 flex-shrink-0 animate-float">
          <Phoenix level={level?.level || 1} />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>StudyCoach</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {level ? `Lvl ${level.level} · ${level.level <= 3 ? '🥚 Hatching' : level.level <= 8 ? '🐣 Growing' : level.level <= 15 ? '🐦 Soaring' : '🔥 Phoenix'}` : 'Welcome!'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto mt-4">
        {navItems.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-bold uppercase tracking-wider transition-all border-2',
                active
                  ? 'border-brand-400 bg-brand-50 text-brand-500'
                  : 'border-transparent text-text-muted hover:bg-surface-muted'
              )}
            >
              <item.icon className={clsx('w-6 h-6 flex-shrink-0', active ? 'text-brand-500' : 'text-text-muted')} />
              {item.label}
            </Link>
          );
        })}
        {/* Secret admin link for owner */}
        {user?.username === 'jchamp101' && (
          <Link href="/admin"
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-bold uppercase tracking-wider transition-all border-2',
              pathname === '/admin'
                ? 'border-red-400 bg-red-50 text-red-500'
                : 'border-transparent text-red-400/60 hover:bg-red-50/50'
            )}
          >
            <Shield className={clsx('w-6 h-6 flex-shrink-0', pathname === '/admin' ? 'text-red-500' : 'text-red-400/60')} />
            Debug
          </Link>
        )}
      </nav>

      {/* XP + user */}
      {user && (
        <div className="p-4 flex-shrink-0 space-y-3" style={{ borderTop: '1.5px solid var(--border-primary)' }}>
          {/* Dark Mode Toggle */}
          <button
            onClick={() => useAuthStore.getState().toggleDarkMode()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border border-transparent hover:border-purple-500/30"
            style={{ background: 'var(--bg-muted)' }}
          >
            {useAuthStore.getState().darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-400" />
            )}
            <span style={{ color: 'var(--text-muted)' }}>
              {useAuthStore.getState().darkMode ? 'Light Mode' : 'Night Study'}
            </span>
          </button>
          <AiUsageWidget user={user} />

          {level && (
            <div>
              <div className="flex justify-between text-xs text-ink-muted mb-1.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-brand-500" /> Level {level.level}
                </span>
                <span>{user.xp || 0} XP</span>
              </div>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: `${Math.min(level.progress * 100, 100)}%` }} />
              </div>
              <div className="text-xs text-ink-faint mt-1 text-right">
                {level.nextLevelXP - (user.xp || 0)} XP to level {level.level + 1}
              </div>
            </div>
          )}

          {level && (
            <PhoenixCompanion level={level.level} xp={user.xp || 0} />
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 text-brand-600"
              style={{ background: 'linear-gradient(135deg, rgba(255,107,26,0.15), rgba(255,181,112,0.15))', border: '1.5px solid rgba(255,107,26,0.3)' }}>
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user.username}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user.region || 'Global'}</div>
            </div>
            <button onClick={logout}
              className="text-ink-faint hover:text-red-500 transition-colors p-1 rounded-lg"
              title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
