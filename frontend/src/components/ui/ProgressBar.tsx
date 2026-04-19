'use client';
import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showLabel = true,
  size = 'md',
  variant = 'primary',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3',
  };

  const barColorClasses = {
    primary: 'bg-brand-500',
    success: 'bg-accent-success',
    warning: 'bg-accent-warning',
    danger: 'bg-accent-danger',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          {label && <p className="text-xs font-bold uppercase tracking-widest text-text-muted">{label}</p>}
          <p className="text-xs font-bold text-text-muted">{Math.round(percentage)}%</p>
        </div>
      )}
      <div className={clsx('progress-bar w-full rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={clsx(
            'progress-bar-fill',
            barColorClasses[variant],
            animated && 'transition-all duration-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
