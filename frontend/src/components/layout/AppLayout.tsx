'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Status Indicator ────────────────────────────────────────────────────────────
function StatusIndicator({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      initial={{ x, y, opacity: 1, scale: 0.8 }}
      animate={{ x, y: y - 40, opacity: 0, scale: 1.1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="absolute pointer-events-none font-black text-[10px] uppercase tracking-widest text-brand-500"
    >
      +5 XP
    </motion.div>
  );
}

// ─── App Layout ───────────────────────────────────────────────────────────────
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, fetchMe, user } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().initTheme();
    // Immediately mark as authenticated if we have a token
    // to prevent flash-redirect before fetchMe resolves
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      useAuthStore.setState({ isAuthenticated: true });
    }
    fetchMe().then(() => {
      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated) router.push('/login');
    });
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('legend-mode', user?.plan === 'legend');
    return () => {
      document.body.classList.remove('legend-mode');
    };
  }, [user?.plan]);

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div
      className="flex min-h-screen pb-16 md:pb-0 bg-white dark:bg-slate-950"
      style={{
        backgroundColor: 'var(--bg-primary)',
        transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Sidebar />
      <main className="flex-1 md:ml-72 p-6 md:p-10 relative z-10 w-full overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={typeof window !== 'undefined' ? window.location.pathname : 'main'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}
