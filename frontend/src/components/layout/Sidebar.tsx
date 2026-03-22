'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, HelpCircle, Trophy, User, LogOut, Zap, Brain
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/flashcards',  icon: BookOpen,         label: 'Flashcards' },
  { href: '/homework',    icon: HelpCircle,       label: 'Homework' },
  { href: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { href: '/profile',     icon: User,             label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp || 0) : null;

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-surface-card border-r border-surface-border flex flex-col z-40">

      {/* Logo */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-surface-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">StudyCoach</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-muted border border-transparent'
              )}
            >
              <item.icon className={clsx('w-5 h-5 flex-shrink-0', active ? 'text-brand-400' : 'text-slate-500')} />
              {item.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />}
            </Link>
          );
        })}
      </nav>

      {/* XP bar + user */}
      {user && (
        <div className="p-4 border-t border-surface-border flex-shrink-0 space-y-3">
          {level && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Level {level.level}
                </span>
                <span>{user.xp || 0} XP</span>
              </div>
              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(level.progress * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-600 mt-1 text-right">
                {level.nextLevelXP - (user.xp || 0)} XP to level {level.level + 1}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.username}</div>
              <div className="text-xs text-slate-500 truncate">{user.region || 'Global'}</div>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
