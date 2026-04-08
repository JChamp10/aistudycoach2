'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, HelpCircle, Trophy, User, Users, Brain
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/',            icon: LayoutDashboard, label: 'Learn' },
  { href: '/flashcards',  icon: BookOpen,        label: 'Cards' },
  { href: '/homework',    icon: HelpCircle,      label: 'Help' },
  { href: '/leaderboard', icon: Trophy,          label: 'Rank' },
  { href: '/profile',     icon: User,            label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50"
      style={{
        background: 'rgba(var(--bg-card-rgb, 255,252,249), 0.65)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(var(--border-rgb, 232,221,208), 0.5)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-1 pb-safe relative">
        {navItems.map(item => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center w-full h-full gap-0.5 relative z-10"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 rounded-full bg-brand-500 shadow-[0_0_12px_var(--brand-glow)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                animate={active ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <item.icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ color: active ? 'var(--brand-400)' : 'var(--text-faint)' }}
                  strokeWidth={active ? 2.5 : 2}
                />
              </motion.div>
              <span
                className="text-[10px] font-medium tracking-tight transition-colors duration-200"
                style={{ color: active ? 'var(--brand-400)' : 'var(--text-faint)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
