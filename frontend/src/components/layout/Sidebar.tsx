'use client';
import { usePathname, useRouter } = from 'next/navigation';
import {
  LayoutDashboard, HelpCircle, BookOpen, Brain, Shuffle,
  Calendar, BarChart2, Trophy, Gamepad2, User, LogOut, Zap
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/homework',    icon: HelpCircle,       label: 'Homework' },
  { href: '/flashcards',  icon: BookOpen,         label: 'Flashcards' },
  { href: '/recall',      icon: Brain,            label: 'Free Recall' },
  { href: '/quiz',        icon: Shuffle,          label: 'Quiz' },
  { href: '/planner',     icon: Calendar,         label: 'Planner' },
  { href: '/progress',    icon: BarChart2,        label: 'Progress' },
  { href: '/leaderboard', icon: Trophy,           label: 'Leaderboard' },
  { href: '/kahoot',      icon: Gamepad2,         label: 'Kahoot' },
  { href: '/profile',     icon: User,             label: 'Profile' },
];

const TOTAL = navItems.length;

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp) : null;

  const activeIdx = navItems.findIndex(n => pathname.startsWith(n.href));
  const [centerIdx, setCenterIdx] = useState(activeIdx >= 0 ? activeIdx : 0);
  const [rotation, setRotation] = useState(0); // total degrees rotated
  const [isDragging, setIsDragging] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0);
  const clickProtect = useRef(false);

  const getAngle = (e: MouseEvent | TouchEvent, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    clickProtect.current = false;
    accumulatedRef.current = 0;
    const rect = wheelRef.current!.getBoundingClientRect();
    const native = 'touches' in e ? e.nativeEvent : e.nativeEvent;
    lastAngleRef.current = getAngle(native as any, rect);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || lastAngleRef.current === null || !wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const angle = getAngle(e, rect);
      let delta = angle - lastAngleRef.current;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      lastAngleRef.current = angle;
      accumulatedRef.current += delta;
      if (Math.abs(accumulatedRef.current) > 5) clickProtect.current = true;
      setRotation(r => r + delta);

      // Every 36deg = 1 item (360 / 10 items)
      const degsPerItem = 360 / TOTAL;
      const steps = Math.round(accumulatedRef.current / degsPerItem);
      if (steps !== 0) {
        setCenterIdx(prev => {
          let next = (prev + steps) % TOTAL;
          if (next < 0) next += TOTAL;
          return next;
        });
        accumulatedRef.current -= steps * degsPerItem;
      }
    };

    const onUp = () => {
      setIsDragging(false);
      lastAngleRef.current = null;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  const RADIUS = 88;
  const ITEM_SIZE = 44;

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 border-r border-surface-border flex flex-col z-40"
      style={{ background: 'linear-gradient(180deg, #0d0f18 0%, #131520 50%, #0d0f18 100%)' }}>

      {/* Logo */}
      <div className="h-16 px-6 flex items-center gap-2 border-b border-surface-border flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">StudyCoach</span>
      </div>

      {/* Rotary wheel */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative select-none">

        {/* Outer ring decoration */}
        <div className="absolute rounded-full border border-surface-border/40 pointer-events-none"
          style={{ width: RADIUS * 2 + ITEM_SIZE + 24, height: RADIUS * 2 + ITEM_SIZE + 24 }} />
        <div className="absolute rounded-full border border-brand-500/10 pointer-events-none"
          style={{ width: RADIUS * 2 + ITEM_SIZE - 8, height: RADIUS * 2 + ITEM_SIZE - 8 }} />

        {/* Center hub */}
        <div
          ref={wheelRef}
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: RADIUS * 2 + ITEM_SIZE + 8,
            height: RADIUS * 2 + ITEM_SIZE + 8,
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={onPointerDown}
          onTouchStart={onPointerDown}
        >
          {/* Center circle */}
          <div className="absolute w-16 h-16 rounded-full border border-brand-500/30 bg-brand-500/5 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-brand-500" />
          </div>

          {/* Tick marks */}
          {navItems.map((_, i) => {
            const angleDeg = (i / TOTAL) * 360 + rotation;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = Math.cos(angleRad) * (RADIUS + ITEM_SIZE / 2 + 10);
            const y = Math.sin(angleRad) * (RADIUS + ITEM_SIZE / 2 + 10);
            return (
              <div key={`tick-${i}`} className="absolute w-0.5 h-2 bg-surface-border/50 rounded-full pointer-events-none"
                style={{ transform: `translate(${x}px, ${y}px) rotate(${angleDeg + 90}deg)` }} />
            );
          })}

          {/* Nav items on the wheel */}
          {navItems.map((item, i) => {
            const angleDeg = (i / TOTAL) * 360 + rotation;
            const angleRad = (angleDeg * Math.PI) / 180;
            const x = Math.cos(angleRad) * RADIUS;
            const y = Math.sin(angleRad) * RADIUS;
            const isCenter = i === centerIdx;
            const distFromCenter = Math.min(
              Math.abs(i - centerIdx),
              TOTAL - Math.abs(i - centerIdx)
            );
            const opacity = Math.max(0.25, 1 - distFromCenter * 0.2);

            return (
              <div
                key={item.href}
                onClick={() => {
                  if (clickProtect.current) return;
                  if (isCenter) router.push(item.href);
                  else {
                    // Spin to this item
                    const forward = (i - centerIdx + TOTAL) % TOTAL;
                    const backward = (centerIdx - i + TOTAL) % TOTAL;
                    const steps = forward <= backward ? forward : -backward;
                    setRotation(r => r - steps * (360 / TOTAL));
                    setCenterIdx(i);
                  }
                }}
                style={{
                  position: 'absolute',
                  width: ITEM_SIZE,
                  height: ITEM_SIZE,
                  transform: `translate(${x}px, ${y}px)`,
                  opacity,
                  transition: isDragging ? 'none' : 'opacity 0.2s',
                  zIndex: isCenter ? 10 : 1,
                  cursor: 'pointer',
                }}
              >
                <div className={`w-full h-full rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
                  isCenter
                    ? 'bg-brand-500 shadow-lg shadow-brand-500/50 scale-110'
                    : pathname.startsWith(item.href)
                    ? 'bg-brand-500/20 border border-brand-500/40'
                    : 'bg-surface-muted border border-surface-border/50 hover:bg-surface-card'
                }`}>
                  <item.icon className={`w-4 h-4 ${isCenter ? 'text-white' : 'text-slate-400'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active item label */}
        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
          <div className="text-xs font-semibold text-brand-400 tracking-widest uppercase">
            {navItems[centerIdx].label}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">click to navigate</div>
        </div>

        {/* Pointer indicator at top */}
        <div className="absolute pointer-events-none"
          style={{ top: `calc(50% - ${RADIUS + ITEM_SIZE / 2 + 16}px)`, left: '50%', transform: 'translateX(-50%)' }}>
          <div className="w-0 h-0" style={{
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '8px solid rgba(85,88,255,0.6)',
          }} />
        </div>
      </div>

      {/* User info */}
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
            <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
