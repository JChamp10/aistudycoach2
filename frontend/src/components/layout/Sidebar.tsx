'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, HelpCircle, BookOpen, Brain, Shuffle,
  Calendar, BarChart2, Trophy, ShoppingBag, User, LogOut, Zap
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import { useState, useRef } from 'react';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/homework',    icon: HelpCircle,       label: 'Homework' },
  { href: '/flashcards',  icon: BookOpen,         label: 'Flashcards' },
  { href: '/recall',      icon: Brain,            label: 'Free Recall' },
  { href: '/quiz',        icon: Shuffle,          label: 'Quiz' },
  { href: '/planner',     icon: Calendar,         label: 'Planner' },
  { href: '/progress',    icon: BarChart2,        label: 'Progress' },
  { href: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { href: '/marketplace', icon: ShoppingBag,      label: 'Market' },
  { href: '/profile',     icon: User,             label: 'Profile' },
];

const ITEM_HEIGHT = 56;
const VISIBLE = 5;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp) : null;

  const activeIdx = navItems.findIndex(n => pathname.startsWith(n.href));
  const [centerIdx, setCenterIdx] = useState(activeIdx >= 0 ? activeIdx : 0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartIdx = useRef<number>(centerIdx);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartIdx.current = centerIdx;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartY.current === null) return;
    const delta = Math.round((dragStartY.current - e.clientY) / ITEM_HEIGHT);
    const next = Math.max(0, Math.min(navItems.length - 1, dragStartIdx.current + delta));
    setCenterIdx(next);
  };

  const onMouseUp = () => {
    setIsDragging(false);
    dragStartY.current = null;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    dragStartIdx.current = centerIdx;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    const delta = Math.round((dragStartY.current - e.touches[0].clientY) / ITEM_HEIGHT);
    const next = Math.max(0, Math.min(navItems.length - 1, dragStartIdx.current + delta));
    setCenterIdx(next);
  };

  const getItemStyle = (idx: number) => {
    const offset = idx - centerIdx;
    const absOffset = Math.abs(offset);
    if (absOffset > Math.floor(VISIBLE / 2) + 1) return null;

    const rotateX = offset * -18;
    const translateY = offset * (ITEM_HEIGHT * 0.75);
    const translateZ = -Math.abs(offset) * 40;
    const opacity = Math.max(0, 1 - absOffset * 0.3);
    const scale = Math.max(0.7, 1 - absOffset * 0.08);
    const isCenter = offset === 0;

    return { rotateX, translateY, translateZ, opacity, scale, isCenter };
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-surface-card border-r border-surface-border flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #0f1117 0%, #181d2a 50%, #0f1117 100%)' }}>

      {/* Logo */}
      <div className="h-16 px-6 flex items-center gap-2 border-b border-surface-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">StudyCoach</span>
      </div>

      {/* Rotary wheel */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative"
        style={{ perspective: '600px' }}>

        {/* Center highlight band */}
        <div className="absolute left-0 right-0 pointer-events-none z-10"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            height: `${ITEM_HEIGHT}px`,
            background: 'linear-gradient(90deg, rgba(85,88,255,0.08) 0%, rgba(85,88,255,0.15) 50%, rgba(85,88,255,0.08) 100%)',
            borderTop: '1px solid rgba(85,88,255,0.25)',
            borderBottom: '1px solid rgba(85,88,255,0.25)',
          }} />

        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{ background: 'linear-gradient(180deg, #0f1117 0%, transparent 100%)' }} />

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
          style={{ background: 'linear-gradient(0deg, #0f1117 0%, transparent 100%)' }} />

        {/* Wheel items */}
        <div className="relative w-full select-none"
          style={{ height: `${ITEM_HEIGHT * VISIBLE}px`, cursor: isDragging ? 'grabbing' : 'grab', transformStyle: 'preserve-3d' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={() => { dragStartY.current = null; }}>

          {navItems.map((item, idx) => {
            const style = getItemStyle(idx);
            if (!style) return null;
            const { rotateX, translateY, translateZ, opacity, scale, isCenter } = style;

            return (
              <div
                key={item.href}
                onClick={() => {
                  if (!isDragging) {
                    if (isCenter) router.push(item.href);
                    else setCenterIdx(idx);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: `${ITEM_HEIGHT}px`,
                  marginTop: `-${ITEM_HEIGHT / 2}px`,
                  transform: `translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) scale(${scale})`,
                  opacity,
                  transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transformStyle: 'preserve-3d',
                  cursor: isCenter ? 'pointer' : 'pointer',
                  zIndex: isCenter ? 5 : 1,
                }}
              >
                <div className={`flex items-center gap-3 px-5 h-full mx-2 rounded-xl transition-colors ${
                  isCenter
                    ? 'text-white'
                    : 'text-slate-500'
                }`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    isCenter
                      ? 'bg-brand-500 shadow-lg shadow-brand-500/40'
                      : 'bg-surface-muted'
                  }`}>
                    <item.icon className={`w-4 h-4 ${isCenter ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className={`font-semibold text-sm transition-all ${isCenter ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                  {isCenter && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
          <div className="text-xs text-slate-600 flex items-center gap-1">
            <span>↕</span> scroll to navigate
          </div>
        </div>
      </div>

      {/* User info + XP */}
      {user && (
        <div className="p-4 border-t border-surface-border flex-shrink-0">
          {level && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Level {level.level}
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
              <div className="text-xs text-slate-500 truncate">{user.region || 'Global'}</div>
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
