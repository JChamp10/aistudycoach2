'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { flashcardApi, homeworkApi, userApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { getLevelFromXP } from '@/lib/utils';
import Link from 'next/link';
import { BookOpen, HelpCircle, Zap, Flame, Trophy, ChevronRight, Clock, Target, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import Avatar from '@/components/ui/Avatar';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const level = user ? getLevelFromXP(user.xp || 0) : null;

  useEffect(() => {
    // Just a quick load delay to prevent jank
    setTimeout(() => {
      setLoading(false);
      // Streak milestone confetti
      if (user?.streak && user.streak > 0 && user.streak % 5 === 0) {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#dc7b1e', '#f4b940', '#ffcf7c', '#c65a1e']
          });
        });
      }
    }, 400);
  }, [user?.streak]);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 pt-4">
        {/* Top Stats Banner */}
        <div className="flex items-center justify-between card rounded-2xl p-4 border-b-4">
          <div className="flex items-center gap-3">
             <Avatar
               username={user?.username}
               avatarUrl={user?.avatar_url}
               className="w-12 h-12 rounded-full border-2 border-surface-border"
               fallbackClassName="bg-brand-500/15 text-brand-500"
             />
             <div>
               <div className="font-bold text-lg">{user?.username || 'Student'}</div>
               <div className="text-sm font-bold text-brand-500">Level {level?.level || 1}</div>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold text-orange-500">
               <Flame className="w-5 h-5 fill-current" />
               {user?.streak || 0}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-brand-500">
               <Zap className="w-5 h-5 fill-current" />
               {user?.xp || 0}
            </div>
          </div>
        </div>

        {/* Level Path */}
        <div className="text-center py-6">
           <h2 className="text-2xl font-bold mb-4">Daily Goal</h2>
           
           <div className="card max-w-md mx-auto p-6 border-b-4 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full border-[6px] border-brand-500 flex items-center justify-center shadow-lg relative">
                 <div className="absolute inset-2 rounded-full border-4 border-brand-200"></div>
                 <Trophy className="w-10 h-10 text-brand-500" />
              </div>
              <div className="w-full mt-2">
                 <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-text-muted">Earn XP</span>
                    <span className="text-brand-500">{(user?.xp || 0) % 50} / 50</span>
                 </div>
                 <div className="xp-bar bg-surface-border h-4">
                    <motion.div 
                      className="xp-bar-fill" 
                      initial={{ width: 0 }} 
                      animate={{ width: `${(((user?.xp || 0) % 50) / 50) * 100}%` }} 
                    />
                 </div>
              </div>
              <Link href="/quiz" className="btn-primary w-full flex items-center justify-center gap-2 mt-4 py-4 text-lg">
                <Play className="fill-white w-5 h-5" /> Start Learning
              </Link>
           </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/flashcards" className="card hover:bg-surface-muted transition-colors flex items-center gap-4 border-b-4 p-5">
             <div className="w-14 h-14 rounded-2xl bg-duo-yellow flex items-center justify-center border-b-4 border-duo-yellowShadow">
                <BookOpen className="text-white w-6 h-6" />
             </div>
             <div>
               <h3 className="font-bold text-lg">Flashcards</h3>
               <p className="text-sm font-bold text-text-muted">Review your decks</p>
             </div>
          </Link>

          <Link href="/homework" className="card hover:bg-surface-muted transition-colors flex items-center gap-4 border-b-4 p-5">
             <div className="w-14 h-14 rounded-2xl bg-duo-blue flex items-center justify-center border-b-4 border-duo-blueShadow">
                <HelpCircle className="text-white w-6 h-6" />
             </div>
             <div>
               <h3 className="font-bold text-lg">AI Helper</h3>
               <p className="text-sm font-bold text-text-muted">Get step-by-step help</p>
             </div>
          </Link>
        </div>

      </div>
    </AppLayout>
  );
}
