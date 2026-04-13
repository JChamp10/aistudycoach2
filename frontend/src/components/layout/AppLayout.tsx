'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import Sidebar from './Sidebar';
import { getLevelFromXP } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSFX } from '@/lib/useSFX';

// ─── Fire Particle ────────────────────────────────────────────────────────────
function FireParticle({ x, y, color }: { x: number; y: number; color: string }) {
  const angle = Math.random() * Math.PI * 2;
  const distance = 20 + Math.random() * 40;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - 30; // bias upward

  return (
    <motion.div
      initial={{ x, y, opacity: 1, scale: 1 }}
      animate={{ x: x + dx, y: y + dy, opacity: 0, scale: 0 }}
      transition={{ duration: 0.5 + Math.random() * 0.3, ease: 'easeOut' }}
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 4 + Math.random() * 4,
        height: 4 + Math.random() * 4,
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  );
}

// ─── XP Text Float ────────────────────────────────────────────────────────────
function XPFloat({ x, y }: { x: number; y: number }) {
  return (
    <motion.div
      initial={{ x, y, opacity: 1, scale: 0.8 }}
      animate={{ x, y: y - 50, opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="absolute pointer-events-none font-bold text-sm"
      style={{ color: 'var(--brand-400)', textShadow: '0 0 10px var(--brand-glow)' }}
    >
      +5 XP ✨
    </motion.div>
  );
}

// ─── Interactive Floating Phoenix ─────────────────────────────────────────────
function FloatingPhoenix({ level }: { level: number }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [xpFloats, setXpFloats] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isJumping, setIsJumping] = useState(false);
  const lastClickRef = useRef(0);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const { playSfx } = useSFX();
  let nextId = useRef(0);

  const stage = level <= 3 ? 'egg' : level <= 8 ? 'chick' : level <= 15 ? 'bird' : 'phoenix';

  const tips: Record<string, string[]> = {
    egg: ['Study a little every day! 🌱', "I'm almost ready to hatch! 🥚", "You're doing great! ⭐"],
    chick: ['Keep your streak alive! 🔥', 'Flashcards help memory! 🧠', "You're growing fast! 🌟"],
    bird: ['Free recall boosts retention! 💡', 'Review hard cards again! 💪', "You're soaring! 🦅"],
    phoenix: ["You're legendary! 🔥", 'Share your decks with friends! 🌍', 'Unstoppable force! ⚡'],
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const stageTips = tips[stage];
      const tip = stageTips[Math.floor(Math.random() * stageTips.length)];
      setMessage(tip);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }, 20000);
    setTimeout(() => {
      setMessage(tips[stage][0]);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }, 3000);
    return () => clearInterval(timer);
  }, [stage]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging || !dragStart.current) return;
      setPos({
        x: dragStart.current.px + e.clientX - dragStart.current.mx,
        y: dragStart.current.py + e.clientY - dragStart.current.my,
      });
    };
    const onUp = () => { setDragging(false); dragStart.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging]);

  const handleClick = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < 400) return; // cooldown
    lastClickRef.current = now;

    playSfx('phoenix');

    // Fire particles
    const colors = ['#ff6b1a', '#ffb570', '#ff8c3a', '#e85500', '#ffe0a0'];
    const newParticles = Array.from({ length: 8 }, () => ({
      id: nextId.current++,
      x: 28 + Math.random() * 8 - 4,
      y: 28 + Math.random() * 8 - 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.includes(p))), 800);

    // XP float
    const xpFloat = { id: nextId.current++, x: 20, y: -10 };
    setXpFloats(prev => [...prev, xpFloat]);
    setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== xpFloat.id)), 900);

    // Jump
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 400);
  }, [playSfx]);

  const PhoenixSVG = () => {
    if (stage === 'egg') return (
      <svg viewBox="0 0 60 60" fill="none" className="w-full h-full">
        <ellipse cx="30" cy="34" rx="16" ry="20" fill="url(#egg)" />
        <ellipse cx="23" cy="28" rx="4" ry="6" fill="#ff8c3a" opacity="0.4" />
        <ellipse cx="25" cy="22" rx="2" ry="1.5" fill="white" opacity="0.6" />
        <defs>
          <radialGradient id="egg" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#ffe0a0" />
            <stop offset="100%" stopColor="#ff8c3a" />
          </radialGradient>
        </defs>
      </svg>
    );
    if (stage === 'chick') return (
      <svg viewBox="0 0 60 60" fill="none" className="w-full h-full">
        <ellipse cx="30" cy="38" rx="14" ry="12" fill="#ffb570" />
        <circle cx="30" cy="22" r="11" fill="#ffb570" />
        <circle cx="25" cy="20" r="3" fill="white" />
        <circle cx="35" cy="20" r="3" fill="white" />
        <circle cx="25.8" cy="20.5" r="1.5" fill="#2d1f0e" />
        <circle cx="35.8" cy="20.5" r="1.5" fill="#2d1f0e" />
        <path d="M28 25 L32 25 L30 28 Z" fill="#ff6b1a" />
        <ellipse cx="16" cy="36" rx="5" ry="8" fill="#ff8c3a" transform="rotate(-20 16 36)" />
        <ellipse cx="44" cy="36" rx="5" ry="8" fill="#ff8c3a" transform="rotate(20 44 36)" />
        <path d="M28 11 Q30 6 32 11" stroke="#ff6b1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
    if (stage === 'bird') return (
      <svg viewBox="0 0 60 60" fill="none" className="w-full h-full">
        <path d="M30 45 Q20 55 14 58 Q18 50 22 46" fill="#e85500" />
        <path d="M30 45 Q40 55 46 58 Q42 50 38 46" fill="#e85500" />
        <ellipse cx="30" cy="36" rx="13" ry="11" fill="#ff8c3a" />
        <path d="M17 32 Q8 24 10 14 Q16 22 20 30" fill="#e85500" />
        <path d="M43 32 Q52 24 50 14 Q44 22 40 30" fill="#e85500" />
        <circle cx="30" cy="22" r="10" fill="#ffb570" />
        <path d="M26 12 Q28 4 30 8 Q32 4 34 12" fill="#ff6b1a" />
        <circle cx="25" cy="21" r="3.5" fill="white" />
        <circle cx="35" cy="21" r="3.5" fill="white" />
        <circle cx="25.8" cy="21.5" r="2" fill="#2d1f0e" />
        <circle cx="35.8" cy="21.5" r="2" fill="#2d1f0e" />
        <path d="M27 26 L33 26 L30 30 Z" fill="#e85500" />
      </svg>
    );
    return (
      <svg viewBox="0 0 60 60" fill="none" className="w-full h-full">
        <ellipse cx="30" cy="42" rx="20" ry="8" fill="#ff6b1a" opacity="0.2" />
        <path d="M30 46 Q16 58 8 62 Q14 52 20 46" fill="#ff6b1a" opacity="0.8" />
        <path d="M30 46 Q28 62 26 66 Q30 56 34 46" fill="#ffb570" />
        <path d="M30 46 Q44 58 52 62 Q46 52 40 46" fill="#ff6b1a" opacity="0.8" />
        <ellipse cx="30" cy="35" rx="12" ry="12" fill="url(#pb)" />
        <path d="M18 30 Q4 18 6 6 Q12 18 20 28" fill="#e85500" />
        <path d="M42 30 Q56 18 54 6 Q48 18 40 28" fill="#e85500" />
        <path d="M18 30 Q8 26 10 18 Q14 24 20 28" fill="#ffb570" opacity="0.7" />
        <path d="M42 30 Q52 26 50 18 Q46 24 40 28" fill="#ffb570" opacity="0.7" />
        <circle cx="30" cy="20" r="11" fill="url(#ph)" />
        <path d="M24 9 Q22 2 26 6 Q28 0 30 5 Q32 0 34 6 Q38 2 36 9" fill="#ff6b1a" />
        <circle cx="25" cy="19" r="4" fill="white" />
        <circle cx="35" cy="19" r="4" fill="white" />
        <circle cx="25.5" cy="19.5" r="2.5" fill="#ff6b1a" />
        <circle cx="35.5" cy="19.5" r="2.5" fill="#ff6b1a" />
        <circle cx="25.5" cy="19.5" r="1.2" fill="#2d1f0e" />
        <circle cx="35.5" cy="19.5" r="1.2" fill="#2d1f0e" />
        <path d="M27 25 L33 25 L30 29 Z" fill="#e85500" />
        <circle cx="10" cy="15" r="1.5" fill="#ffb570" opacity="0.8" />
        <circle cx="50" cy="12" r="1" fill="#ff6b1a" opacity="0.8" />
        <defs>
          <radialGradient id="pb" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#ffb570" />
            <stop offset="100%" stopColor="#e85500" />
          </radialGradient>
          <radialGradient id="ph" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#ffe0a0" />
            <stop offset="100%" stopColor="#ffb570" />
          </radialGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div
      className="fixed z-50 select-none"
      style={{
        bottom: `${80 + pos.y * -1}px`,
        right: `${24 + pos.x * -1}px`,
        cursor: dragging ? 'grabbing' : 'pointer',
      }}
      onMouseDown={onMouseDown}
    >
      {/* Speech bubble */}
      {visible && (
        <div
          className="absolute bottom-16 right-0 text-xs font-semibold px-3 py-2 rounded-2xl rounded-br-sm whitespace-nowrap max-w-[200px] text-center"
          style={{
            background: 'var(--bg-secondary)',
            border: '1.5px solid var(--border-primary)',
            color: 'var(--text-muted)',
            boxShadow: '0 4px 16px var(--surface-shadow)',
          }}>
          {message}
          <div className="absolute bottom-[-8px] right-4 w-3 h-3 rotate-45"
            style={{ background: 'var(--bg-secondary)', borderRight: '1.5px solid var(--border-primary)', borderBottom: '1.5px solid var(--border-primary)' }} />
        </div>
      )}

      {/* Fire particles */}
      <AnimatePresence>
        {particles.map(p => (
          <FireParticle key={p.id} x={p.x} y={p.y} color={p.color} />
        ))}
      </AnimatePresence>

      {/* XP floats */}
      <AnimatePresence>
        {xpFloats.map(f => (
          <XPFloat key={f.id} x={f.x} y={f.y} />
        ))}
      </AnimatePresence>

      {/* Phoenix */}
      <motion.div
        className="w-14 h-14 drop-shadow-lg hover:scale-110 transition-transform"
        animate={isJumping ? { y: [0, -25, 0], rotate: [0, 10, -10, 0] } : { y: 0 }}
        transition={isJumping ? { duration: 0.4, type: 'spring', stiffness: 300 } : {}}
        onClick={handleClick}
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,26,0.3))' }}
      >
        <div className="animate-float w-full h-full">
          <PhoenixSVG />
        </div>
      </motion.div>
    </div>
  );
}

// ─── App Layout ───────────────────────────────────────────────────────────────
import BottomNav from './BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, fetchMe, user } = useAuthStore();
  const level = user ? getLevelFromXP(user.xp || 0) : null;

  useEffect(() => {
    useAuthStore.getState().initTheme();
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div
      className="flex min-h-screen pb-16 md:pb-0"
      style={{
        background:
          'radial-gradient(circle at top, rgba(255, 208, 143, 0.18), transparent 28%), var(--bg-primary)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 relative z-10 w-full overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
      {level && <FloatingPhoenix level={level.level} />}
    </div>
  );
}
