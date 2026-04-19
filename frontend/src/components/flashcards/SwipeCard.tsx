import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { RotateCcw, Check, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useSFX } from '@/lib/useSFX';
import { Card } from './types';

interface SwipeCardProps {
  card: Card;
  onSwipe?: (dir: 'left' | 'right') => void;
  isTop: boolean;
}

export function SwipeCard({ card, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const opacity = useTransform(x, [-300, -150, 0, 150, 300], [0, 1, 1, 1, 0]);
  const scale = useTransform(x, [-200, 0, 200], [0.95, 1.02, 0.95]);
  const hardOpacity = useTransform(x, [-120, -30, 0], [1, 0, 0]);
  const easyOpacity = useTransform(x, [0, 30, 120], [0, 0, 1]);
  const controls = useAnimation();
  const [flipped, setFlipped] = useState(false);
  const { playSfx } = useSFX();

  const handleDragEnd = async (_: any, info: any) => {
    const swipeThreshold = 80;
    const velocityThreshold = 300;
    const shouldSwipeLeft = info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold;
    const shouldSwipeRight = info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold;

    if (shouldSwipeLeft) {
      playSfx('pop');
      await controls.start({ x: -600, opacity: 0, transition: { duration: 0.25 } });
      onSwipe?.('left');
    } else if (shouldSwipeRight) {
      playSfx('success');
      await controls.start({ x: 600, opacity: 0, transition: { duration: 0.25 } });
      onSwipe?.('right');
    } else {
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 400, damping: 18, mass: 0.8 } });
    }
  };

  const triggerSwipe = async (dir: 'left' | 'right') => {
    playSfx(dir === 'right' ? 'success' : 'pop');
    await controls.start({ x: dir === 'left' ? -600 : 600, opacity: 0, transition: { duration: 0.25 } });
    onSwipe?.(dir);
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, scale, position: 'absolute', width: '100%' }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      animate={controls}
      className={isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}
      whileTap={isTop ? { cursor: 'grabbing' } : undefined}
    >
      {isTop && (
        <>
          <motion.div
            className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-widest rotate-[-12deg]"
            style={{ borderColor: 'var(--color-danger, #ef4444)', color: 'var(--color-danger, #ef4444)', opacity: hardOpacity as any }}
          >
            Practice More
          </motion.div>
          <motion.div
            className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 font-black text-xs uppercase tracking-widest rotate-[12deg]"
            style={{ borderColor: 'var(--color-success, #22c55e)', color: 'var(--color-success, #22c55e)', opacity: easyOpacity as any }}
          >
            Got It
          </motion.div>
        </>
      )}
      
      <div className="flashcard-container select-none" style={{ height: '360px' }}
        onClick={() => { if (isTop) { playSfx('flip'); setFlipped(f => !f); } }}>
        <div className={clsx("flashcard-inner w-full h-full", flipped && "flipped")}>
          <div className="flashcard-front card h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ borderColor: 'var(--border-brand)', background: 'var(--gradient-card)' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: 'var(--text-faint)' }}>Question</div>
            <p className="text-xl font-black px-8 leading-relaxed text-slate-900 dark:text-white" style={{ color: 'var(--text-primary)' }}>{card.question}</p>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Tap to reveal</div>
          </div>
          <div className="flashcard-back card h-full flex flex-col items-center justify-center text-center gap-4"
            style={{ borderColor: 'var(--color-success-alpha, rgba(34,197,94,0.3))', background: 'var(--gradient-card)' }}>
            <div className="text-[10px] uppercase tracking-[0.3em] font-black" style={{ color: 'var(--color-success, #22c55e)' }}>Answer</div>
            <p className="text-xl font-black px-8 leading-relaxed" style={{ color: 'var(--color-success, #22c55e)' }}>{card.answer}</p>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Rate your recall</div>
          </div>
        </div>
      </div>
      
      {isTop && (
        <div className="flex justify-center gap-4 mt-8 px-4">
          <button onClick={() => triggerSwipe('left')}
            data-swipe-left
            className="px-6 py-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg flex-1"
            style={{
              borderColor: 'var(--color-danger-alpha, rgba(239,68,68,0.2))',
              background: 'var(--color-danger-alpha-light, rgba(239,68,68,0.05))',
              color: 'var(--color-danger, #ef4444)'
            }}>
            <X className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Need Practice</span>
          </button>
          
          <button onClick={() => { playSfx('flip'); setFlipped(f => !f); }}
            data-flip-btn
            className="w-14 h-14 shrink-0 rounded-2xl border flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-primary)', color: 'var(--text-faint)' }}>
            <RotateCcw className="w-5 h-5" />
          </button>

          <button onClick={() => triggerSwipe('right')}
            data-swipe-right
            className="px-6 py-4 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg flex-1"
            style={{
              borderColor: 'var(--color-success-alpha, rgba(34,197,94,0.2))',
              background: 'var(--color-success-alpha-light, rgba(34,197,94,0.05))',
              color: 'var(--color-success, #22c55e)'
            }}>
            <Check className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">Got It</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
