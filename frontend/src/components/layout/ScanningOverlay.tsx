'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sparkles } from 'lucide-react';

interface ScanningOverlayProps {
  isVisible: boolean;
  onComplete: () => void;
  imageUrl?: string;
}

export function ScanningOverlay({ isVisible, onComplete, imageUrl }: ScanningOverlayProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
        >
          <div className="relative w-full max-w-lg aspect-[3/4] rounded-2xl overflow-hidden border-2 border-brand-500/30 shadow-2xl bg-slate-900">
            {/* Mock/Real Image */}
            {imageUrl ? (
              <img src={imageUrl} alt="Scanning" className="w-full h-full object-cover opacity-40" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-brand-400 opacity-20">
                <Flame className="w-20 h-20 animate-pulse" />
                <span className="font-mono text-xl tracking-widest uppercase">Initializing Scan</span>
              </div>
            )}

            {/* The Fire Line */}
            <motion.div
              initial={{ top: '-5%' }}
              animate={{ top: '105%' }}
              transition={{ duration: 4, ease: "linear", repeat: 0 }}
              onAnimationComplete={() => setTimeout(onComplete, 500)}
              className="absolute left-0 right-0 h-1 z-10"
              style={{
                background: 'linear-gradient(90deg, transparent, #ff6b1a, #ffb570, #ff6b1a, transparent)',
                boxShadow: '0 0 25px 4px #ff6b1a, 0 0 40px 8px #ffb570',
              }}
            >
              {/* Particle Sparks */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-12">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [-10, 10], 
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 0.8, 
                      repeat: Infinity, 
                      delay: i * 0.1 
                    }}
                    className="w-1 h-1 bg-brand-400 rounded-full blur-[1px]"
                  />
                ))}
              </div>
            </motion.div>

            {/* Scan Text */}
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center justify-center gap-2 text-white font-bold text-lg drop-shadow-lg"
              >
                <Sparkles className="w-5 h-5 text-brand-400" />
                <span>PHOENIX VISION SCANNING...</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
