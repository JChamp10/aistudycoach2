'use client';
import { useEffect, useState, useRef } from 'react';

export function TypewriterText({
  text,
  speed = 20,
  onComplete,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        // Add 2-4 chars at a time for natural feel
        const chunkSize = Math.random() > 0.7 ? 3 : 2;
        const nextIndex = Math.min(indexRef.current + chunkSize, text.length);
        setDisplayed(text.slice(0, nextIndex));
        indexRef.current = nextIndex;

        // Auto scroll parent
        if (containerRef.current) {
          const parent = containerRef.current.closest('[class*="overflow"]');
          if (parent) parent.scrollTop = parent.scrollHeight;
        }
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div ref={containerRef} className="whitespace-pre-wrap">
      {displayed}
      {!done && <span className="typewriter-cursor" />}
    </div>
  );
}

export function ThinkingPulse() {
  return (
    <div className="flex items-center gap-4 px-6 py-3 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-brand-500"
            style={{
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        AI Analysis in Progress
      </span>
    </div>
  );
}
