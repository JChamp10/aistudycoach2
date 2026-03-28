'use client';
import { useCallback, useEffect, useState } from 'react';

// Using Web Audio API for zero-dependency synthetic sound effects
export function useSFX() {
  const [enabled, setEnabled] = useState(true);

  // Allow users to disable sound if they prefer
  useEffect(() => {
    const pref = localStorage.getItem('sfx_enabled');
    if (pref === 'false') setEnabled(false);
  }, []);

  const toggleSfx = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem('sfx_enabled', String(next));
  };

  const playSfx = useCallback((type: 'success' | 'pop' | 'error' | 'flip' | 'send' | 'click' | 'phoenix') => {
    if (!enabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'click') {
        // Short percussive click
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start();
        osc.stop(ctx.currentTime + 0.03);
      } else if (type === 'phoenix') {
        // Majestic ascending arpeggio: C5 → E5 → G5 → C6
        osc.type = 'triangle';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, t);       // C5
        osc.frequency.setValueAtTime(659.25, t + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.24); // G5
        osc.frequency.setValueAtTime(1046.5, t + 0.36); // C6
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.setValueAtTime(0.1, t + 0.18);
        gain.gain.linearRampToValueAtTime(0, t + 0.55);
        osc.start();
        osc.stop(t + 0.55);
      }
    } catch {}
  }, [enabled]);

  return { playSfx, sfxEnabled: enabled, toggleSfx };
}
