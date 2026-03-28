'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { Zap, X, CheckCircle2 } from 'lucide-react';
import { useSFX } from '@/lib/useSFX';
import { useEffect, useRef, useState } from 'react';

export function UpgradeModal() {
  const { showUpgradeModal, setShowUpgradeModal, user } = useAuthStore();
  const { playSfx } = useSFX();
  const cardRef = useRef<HTMLDivElement>(null);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  useEffect(() => {
    if (showUpgradeModal) {
      playSfx('error');
    }
  }, [showUpgradeModal]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const rotateX = ((y - 50) / 50) * -8;
    const rotateY = ((x - 50) / 50) * 8;
    setGlare({ x, y, opacity: 0.15 });
    setTilt({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setGlare({ x: 50, y: 50, opacity: 0 });
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  if (!showUpgradeModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: 'var(--overlay-bg)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowUpgradeModal(false)}
        />
        <motion.div
          ref={cardRef}
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-brand)',
            transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
        >
          {/* Holographic glare overlay */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(168,85,247,${glare.opacity}), rgba(255,107,26,${glare.opacity * 0.5}), transparent 70%)`,
              mixBlendMode: 'overlay',
              transition: 'background 0.1s ease',
            }}
          />

          {/* Prismatic shimmer border */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(255,107,26,0.1), rgba(59,130,246,0.1), rgba(168,85,247,0.1))',
              backgroundSize: '200% 200%',
              animation: 'holoShimmer 4s ease-in-out infinite',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Decorative Background */}
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--brand-400)', opacity: 0.12 }} />

          <button 
            onClick={() => setShowUpgradeModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(var(--brand-400-rgb, 255,107,26), 0.1)', border: '1.5px solid var(--border-brand)' }}>
            <Zap className="w-7 h-7" style={{ color: 'var(--brand-400)' }} />
          </div>

          <h2 className="text-2xl font-extrabold mb-2" style={{ color: 'var(--text-primary)' }}>
            You&apos;ve hit your daily AI limit!
          </h2>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-light)' }}>
            Awesome studying! You&apos;ve used all 5 of your free daily AI generation credits. Upgrade to{' '}
            <strong style={{ color: 'var(--brand-400)' }}>Pro</strong> to keep studying without limits.
          </p>

          <div className="space-y-3 mb-8">
            {['Unlimited AI Flashcards', 'Unlimited AI Homework Helper', 'Priority AI Model Access'].map(feature => (
              <div key={feature} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: 'var(--brand-400)' }} />
                <span style={{ color: 'var(--text-muted)' }}>{feature}</span>
              </div>
            ))}
          </div>

          <button 
            className="btn-primary btn-phoenix w-full py-3.5 font-bold text-sm"
            onClick={() => alert('Stripe checkout coming in Step 2!')}
          >
            Upgrade to Pro · $4.99/mo
          </button>

          <button 
            onClick={() => setShowUpgradeModal(false)}
            className="w-full mt-3 py-3 text-sm font-medium transition-colors"
            style={{ color: 'var(--text-faint)' }}
          >
            Maybe later
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
