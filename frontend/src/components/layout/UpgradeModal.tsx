'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { Zap, X, CheckCircle2, Crown, TrendingUp, ShieldCheck, Award, FileText, Sparkles } from 'lucide-react';
import { useSFX } from '@/lib/useSFX';
import { useEffect, useRef, useState } from 'react';

const features = [
  { icon: Zap, title: 'Infinite AI Energy', desc: 'No daily limits on flashcards, quizzes & homework help.' },
  { icon: TrendingUp, title: '2x XP Boosts', desc: 'Crush the leaderboard with permanent 1.5x, and 2x XP weekends.' },
  { icon: ShieldCheck, title: 'Streak Shields', desc: '2 automatic freezes per month. Never lose your fire.' },
  { icon: Award, title: 'Legendary Aesthetics', desc: 'Golden animated profile frame & exclusive mythical avatars.' },
  { icon: Sparkles, title: 'Smart Concept Grading', desc: 'AI grades practice on meaning, not exact wording typos.' },
  { icon: FileText, title: '1-Click Cheat Sheets', desc: 'Condense an entire deck into a 1-page printable summary.' }
];

export function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal, user } = useAuthStore();
  const { playSfx } = useSFX();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnnual, setIsAnnual] = useState(true);

  useEffect(() => {
    if (showUpgradeModal) {
      playSfx('pop'); // Soft magical sound instead of error
    }
  }, [showUpgradeModal, playSfx]);

  if (!showUpgradeModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          onClick={() => setShowUpgradeModal(false)}
        />
        
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-[1000px] rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden border"
          style={{ background: 'var(--bg-card)', borderColor: 'rgba(245,158,11,0.3)', maxHeight: '90vh' }}
        >
          {/* Animated Glowing Gradient Overlay for the entire modal border */}
          <div className="absolute inset-0 rounded-[2rem] pointer-events-none" style={{ boxShadow: 'inset 0 0 0 1px rgba(245, 158, 11, 0.4)' }} />

          <button 
            onClick={() => setShowUpgradeModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full z-20 transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-md"
            style={{ color: 'var(--text-primary)' }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Hero Graphic & Sales Pitch */}
          <div className="relative w-full md:w-5/12 p-8 md:p-10 flex flex-col justify-center items-center text-center overflow-hidden shrink-0" 
               style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' }}>
            
            <div className="absolute inset-0 pointer-events-none opacity-40">
               {/* Starry background effect */}
               <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, #000 100%)' }} />
               <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" />
               <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-amber-200 rounded-full shadow-[0_0_12px_#fbbf24] animate-pulse delay-75" />
               <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white rounded-full shadow-[0_0_8px_white] animate-pulse delay-150" />
            </div>

            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none" />

            <div className="relative z-10 w-24 h-24 mb-6 relative flex items-center justify-center group">
              <div className="absolute inset-0 rounded-2xl bg-amber-400 rotate-3 group-hover:rotate-6 transition-transform opacity-30 blur-lg" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 shadow-xl" />
              <div className="absolute inset-[2px] rounded-2xl bg-indigo-950 flex flex-col items-center justify-center">
                 <Crown className="w-10 h-10 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse" />
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md z-10">
              Become a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600">Legend</span>
            </h2>
            <p className="text-indigo-100 text-[15px] leading-relaxed mb-6 z-10">
              Stop settling for basic studying. Unlock infinite AI superpowers and dominate your classes with gamified studying built for winners.
            </p>

            <div className="w-full h-px bg-white/20 my-2 z-10" />
            
            <div className="text-indigo-200 text-sm italic mt-4 z-10">
               "Legendary pass pays for itself with the first quiz you ace."
            </div>
          </div>

          {/* Right Side: Features & Pricing */}
          <div className="w-full md:w-7/12 p-6 md:p-10 flex flex-col bg-white dark:bg-[#0f1115] overflow-y-auto">
            
            {/* Toggle */}
            <div className="flex justify-center mb-8 shrink-0">
               <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl flex items-center shadow-inner relative">
                 <button 
                   onClick={() => setIsAnnual(false)}
                   className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${!isAnnual ? 'text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                   Monthly
                 </button>
                 <button 
                   onClick={() => setIsAnnual(true)}
                   className={`relative z-10 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center ${isAnnual ? 'text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                 >
                   Annually
                   <span className="ml-2 bg-amber-400 dark:bg-amber-500 text-amber-950 px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-wider font-extrabold animate-pulse">Save 40%</span>
                 </button>
                 
                 {/* Sliding Background Indicator */}
                 <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-1.5px)] rounded-xl transition-all duration-300 shadow-sm ${isAnnual ? 'left-1/2 bg-gray-900 dark:bg-gray-700' : 'left-1.5 bg-white dark:bg-gray-700'}`} />
               </div>
            </div>

            {/* Perks Listing */}
            <div className="grid sm:grid-cols-2 gap-y-6 gap-x-4 mb-8">
              {features.map((feat, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <feat.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-gray-900 dark:text-white mb-0.5">{feat.title}</h4>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <div className="flex items-end justify-center gap-2 mb-4">
                 <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                   ${isAnnual ? '4.16' : '6.99'}
                 </div>
                 <div className="text-gray-500 dark:text-gray-400 pb-1 font-medium">/ month</div>
              </div>
              {isAnnual && (
                <div className="text-center text-sm text-green-600 dark:text-green-400 font-bold mb-4">
                  Billed $49.99 yearly. You save $33.89!
                </div>
              )}
              
              <button 
                onClick={() => alert(`Stripe checkout for ${isAnnual ? 'Annual' : 'Monthly'} StudyCoach Legend coming soon!`)}
                className="w-full py-4 rounded-xl text-lg font-extrabold text-white shadow-xl hover:-translate-y-1 hover:shadow-amber-500/30 transition-all duration-300 relative overflow-hidden group"
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)' }}
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                Go Legendary Now
              </button>
              
              <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                Cancel anytime. 7-day free trial on annual plan.
              </p>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
