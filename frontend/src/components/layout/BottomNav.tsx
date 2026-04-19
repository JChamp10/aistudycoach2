'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, HelpCircle, Trophy, User, Users, Brain, Search, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/flashcards',  icon: BookOpen,        label: 'Repository' },
  { href: '/homework',    icon: Sparkles,        label: 'Assistant' },
  { href: '/leaderboard', icon: Trophy,          label: 'Ranking' },
  { href: '/profile',     icon: User,            label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 w-full z-50 backdrop-blur-xl border-t"
      style={{
        backgroundColor: 'rgba(244, 247, 236, 0.8)',
        borderColor: 'var(--border-primary)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div className="flex items-center justify-around h-16 pb-safe relative">
        {navItems.map(item => {
          const active = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href === '/profile' ? `/profile/${user.username}` : item.href}
              className="flex flex-col items-center justify-center w-full h-full gap-1 relative z-10"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 w-8 h-1 rounded-full"
                  style={{ backgroundColor: 'var(--brand-500)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                animate={active ? { scale: 1.1, y: -1 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <item.icon
                  className={clsx(
                    "w-5 h-5 transition-colors duration-300"
                  )}
                  style={active ? { color: 'var(--brand-500)' } : { color: 'var(--text-faint)' }}
                  strokeWidth={active ? 2.5 : 2}
                />
              </motion.div>
              <span
                className={clsx(
                  "text-[9px] font-bold uppercase tracking-widest transition-colors duration-300"
                )}
                style={active ? { color: 'var(--text-primary)' } : { color: 'var(--text-faint)' }}
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
