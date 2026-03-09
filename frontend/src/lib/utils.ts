import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function getLevelFromXP(xp: number) {
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXP = (level - 1) * 500;
  const nextLevelXP = level * 500;
  const progress = (xp - currentLevelXP) / 500;
  return { level, currentLevelXP, nextLevelXP, progress };
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatRelativeTime(date: string | Date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return formatDate(date);
}

export function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy':   return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'hard':   return 'text-red-400 bg-red-500/10 border-red-500/20';
    default:       return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  }
}

export function getScoreColor(score: number) {
  if (score >= 0.9) return 'text-green-400';
  if (score >= 0.7) return 'text-amber-400';
  return 'text-red-400';
}
