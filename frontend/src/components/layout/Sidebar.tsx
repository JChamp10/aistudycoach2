'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, HelpCircle, Trophy, User, LogOut, Zap, Calculator, Users, Brain, Shield, ChevronRight, Leaf, Sparkles, Settings, Calendar
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import { clsx } from 'clsx';
import Avatar from '@/components/ui/Avatar';

const navItems = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Learn' },
  { href: '/flashcards',  icon: BookOpen,        label: 'Flashcards' },
  { href: '/homework',    icon: HelpCircle,      label: 'AI Helper' },
  { href: '/quiz',        icon: Zap,             label: 'Practice' },
  { href: '/leaderboard', icon: Trophy,          label: 'Leaderboard' },
  { href: '/calendar',    icon: Calendar,        label: 'Calendar' },
  { href: '/profile',     icon: User,            label: 'Profile' },
  { href: '/settings',    icon: Settings,        label: 'Settings' },
];

// ─── AI Usage Widget ──────────────────────────────────────────────────────────
function AiUsageWidget({ user }: { user: any }) {
  const { aiUsage } = useAuthStore();
  
  const isLegend = user?.plan === 'legend';
  const isPro = user?.plan === 'pro';
  const used = aiUsage.used;
  const limit = aiUsage.limit;
  const remaining = isLegend ? Infinity : Math.max(0, limit - used);
  
  const pct = isLegend ? 100 : Math.min((remaining / limit) * 100, 100);

  if (isLegend) {
    return (
      <div className="relative rounded-xl p-4 bg-slate-900 border border-amber-500/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Premium Account</div>
            <div className="text-xs font-bold text-white uppercase tracking-tight">Unlimited Operations</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl p-4 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm group">
      <div className="flex justify-between items-center mb-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">
          AI Capacity
        </div>
        <div className="text-[10px] font-black text-slate-400">
          {remaining} Credits Left
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
        <div 
          className="h-full rounded-full transition-all duration-700" 
          style={{ background: pct <= 20 ? '#ef4444' : 'var(--brand-500)', width: `${pct}%` }} 
        />
      </div>
      <Link
        href="/upgrade"
        className="flex items-center justify-center gap-2 w-full py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all border border-transparent"
      >
        Upgrade Access <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, darkMode, toggleDarkMode } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp || 0) : null;

  return (
    <aside className="hidden md:flex w-72 h-screen fixed left-0 top-0 flex-col z-40 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-900 transition-colors">

      {/* Corporate Branding Head */}
      <div className="h-24 px-8 flex items-center gap-4 border-b border-slate-100 dark:border-slate-900 flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-slate-900 dark:bg-white flex items-center justify-center transition-colors shadow-sm" style={{ backgroundColor: 'var(--brand-900)' }}>
          <Leaf className="w-5 h-5 text-white dark:text-slate-950" style={{ color: 'var(--brand-50)' }} />
        </div>
        <div>
          <div className="font-extrabold text-lg tracking-tight uppercase text-slate-900 dark:text-white leading-none mb-1">Study Cafe</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">System Active</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        <div className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 opacity-60">General</div>
        {navItems.map(item => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-4 px-4 py-3 rounded-lg text-[12px] font-bold uppercase tracking-tight transition-all group',
                active
                  ? 'bg-brand-500/10 text-brand-700 dark:text-brand-500 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <item.icon className={clsx('w-4.5 h-4.5 transition-colors', active ? 'text-brand-700 dark:text-brand-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
              {item.label}
              {active && <div className="ml-auto w-1 h-1 rounded-full bg-brand-500 shadow-[0_0_8px_var(--brand-glow)]" />}
            </Link>
          );
        })}
        {user?.username === 'jchamp101' && (
          <Link href="/admin"
            className={clsx(
              'flex items-center gap-4 px-4 py-3 rounded-lg text-[12px] font-bold uppercase tracking-tight transition-all group',
              pathname === '/admin'
                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 shadow-sm'
                : 'text-slate-500 hover:bg-red-50/50 dark:hover:bg-red-950/10 hover:text-red-700'
            )}
          >
            <Shield className={clsx('w-4.5 h-4.5', pathname === '/admin' ? 'text-red-600' : 'text-slate-400')} />
            Debug Panel
          </Link>
        )}
      </nav>

      {/* User Area */}
      {user && (
        <div className="p-6 border-t border-slate-100 dark:border-slate-900 space-y-6">
          <AiUsageWidget user={user} />



          <div className="flex items-center gap-4">
            <Avatar
              username={user.username}
              avatarUrl={user.avatar_url}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800"
              fallbackClassName="bg-slate-100 dark:bg-slate-800 text-slate-500"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-slate-200 truncate">{user.username}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">Lvl {level?.level || 1} • {user.region || 'Global'}</div>
            </div>
            <button onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-slate-100 dark:border-slate-800"
              title="Terminate Session">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
