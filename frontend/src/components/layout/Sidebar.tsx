'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, BookOpen, HelpCircle, Trophy, User, LogOut, Zap, Calculator, Users, Brain, Shield, ChevronRight, Sparkles, Settings, Calendar
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Logo from './Logo';
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
      <div
        className="relative rounded-xl p-4 border shadow-lg"
        style={{
          backgroundColor: 'var(--surface-card)',
          borderColor: 'var(--accent-amber)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border"
            style={{
              backgroundColor: 'rgba(244, 185, 64, 0.1)',
              borderColor: 'var(--accent-amber)',
            }}
          >
            <Shield className="w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div>
            <div className="text-[10px] font-black text-accent-amber uppercase tracking-widest">Premium Account</div>
            <div className="text-xs font-bold text-text-primary uppercase tracking-tight">Unlimited Operations</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl p-4 border shadow-sm group"
      style={{
        backgroundColor: 'var(--surface-muted)',
        borderColor: 'var(--border-primary)',
      }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-brand-600">
          AI Capacity
        </div>
        <div className="text-[10px] font-black text-text-muted">
          {remaining} Credits Left
        </div>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden mb-4"
        style={{ backgroundColor: 'var(--border-primary)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ background: pct <= 20 ? 'var(--accent-danger)' : 'var(--brand-500)', width: `${pct}%` }}
        />
      </div>
      <Link
        href="/upgrade"
        className="btn-accent flex items-center justify-center gap-2 w-full py-2 text-[10px]"
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
    <aside
      className="hidden md:flex w-72 h-screen fixed left-0 top-0 flex-col z-40 border-r transition-colors"
      style={{
        backgroundColor: 'var(--surface-bg)',
        borderColor: 'var(--border-primary)',
      }}
    >

      {/* Header */}
      <div
        className="h-24 px-6 flex items-center gap-4 border-b flex-shrink-0"
        style={{
          borderColor: 'var(--border-primary)',
        }}
      >
        <Logo className="" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
        <div className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-text-muted opacity-60">General</div>
        {navItems.map(item => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={clsx(
                'flex items-center gap-4 px-4 py-3 rounded-lg text-[12px] font-bold uppercase tracking-tight transition-all group',
                active
                  ? 'text-brand-700'
                  : 'text-text-muted hover:text-text-primary'
              )}
              style={active ? { backgroundColor: 'var(--surface-muted)' } : {}}
            >
              <item.icon className={clsx('w-4.5 h-4.5 transition-colors', active ? 'text-brand-500' : 'text-text-muted group-hover:text-text-primary')} />
              {item.label}
              {active && (
                <div
                  className="ml-auto w-1 h-1 rounded-full shadow-[0_0_8px_var(--glow-brand)]"
                  style={{ backgroundColor: 'var(--brand-500)' }}
                />
              )}
            </Link>
          );
        })}
        {user?.username === 'jchamp101' && (
          <Link href="/admin"
            className={clsx(
              'flex items-center gap-4 px-4 py-3 rounded-lg text-[12px] font-bold uppercase tracking-tight transition-all group',
              pathname === '/admin'
                ? 'bg-accent-danger/10 text-accent-danger shadow-sm'
                : 'text-text-muted hover:text-accent-danger hover:bg-accent-danger/5'
            )}
          >
            <Shield className={clsx('w-4.5 h-4.5', pathname === '/admin' ? 'text-accent-danger' : 'text-text-muted')} />
            Debug Panel
          </Link>
        )}
      </nav>

      {/* User Area */}
      {user && (
        <div
          className="p-6 border-t space-y-6"
          style={{
            borderColor: 'var(--border-primary)',
          }}
        >
          <AiUsageWidget user={user} />



          <div className="flex items-center gap-4">
            <Avatar
              username={user.username}
              avatarUrl={user.avatar_url}
              className="w-10 h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-muted)]"
              fallbackClassName="text-text-muted"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black uppercase tracking-tight text-text-primary truncate">{user.username}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest truncate">Lvl {level?.level || 1} • {user.region || 'Global'}</div>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-all border"
              style={{
                backgroundColor: 'var(--surface-muted)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-danger)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-muted)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
