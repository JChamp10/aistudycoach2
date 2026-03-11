'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard, HelpCircle, BookOpen, Brain, Shuffle,
  Calendar, BarChart2, Trophy, ShoppingBag, User, LogOut, Zap
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import { useRef } from 'react';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/homework',    icon: HelpCircle,       label: 'Homework' },
  { href: '/flashcards',  icon: BookOpen,         label: 'Flashcards' },
  { href: '/recall',      icon: Brain,            label: 'Free Recall' },
  { href: '/quiz',        icon: Shuffle,          label: 'Quiz Mode' },
  { href: '/planner',     icon: Calendar,         label: 'Planner' },
  { href: '/progress',    icon: BarChart2,        label: 'Progress' },
  { href: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { href: '/marketplace', icon: ShoppingBag,      label: 'Marketplace' },
  { href: '/profile',     icon: User,             label: 'Profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp) : null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; scrollLeft: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    dragStart.current = { x: e.pageX, scrollLeft: scrollRef.current.scrollLeft };
    scrollRef.current.style.cursor = 'grabbing';
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current || !scrollRef.current) return;
    const dx = e.pageX - dragStart.current.x;
    scrollRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const onMouseUp = () => {
    dragStart.current = null;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-surface-card border-r border-surface-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center gap-2 border-b border-surface-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">StudyCoach</span>
      </div>

      {/* Horizontal scroll nav carousel */}
      <div className="px-3 py-4 border-b border-surface-border flex-shrink-0">
        <p className="text-xs text-slate-600 uppercase tracking-widest mb-3 px-1">Navigation</p>
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 select-none"
          style={{ scrollbarWidth: 'none', cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                draggable={false}
                className={clsx(
                  'flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl flex-shrink-0 transition-all text-center min-w-[60px]',
                  active
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-slate-500 hover:text-white hover:bg-surface-muted border border-transparent'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Full vertical nav below for easy access */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-surface-muted'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + XP */}
      {user && (
        <div className="p-4 border-t border-surface-border flex-shrink-0">
          {level && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Level {level.level}
                </span>
                <span>{user.xp} XP</span>
              </div>
              <div className="xp-bar">
                <div className="xp-bar-fill" style={{ width: `${level.progress * 100}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user.username}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Log out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
