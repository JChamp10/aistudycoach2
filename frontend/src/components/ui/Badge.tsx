'use client';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'brand' | 'accent' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
}: BadgeProps) {
  const baseClasses = 'badge inline-flex items-center gap-1 font-black uppercase tracking-widest';
  
  const sizeClasses = {
    sm: 'text-[8px] px-2 py-0.5',
    md: 'text-[9px] px-2.5 py-1',
  };

  const variantClasses = {
    default: 'badge',
    brand: 'badge-brand',
    accent: 'badge-accent',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
  };

  return (
    <span className={clsx(baseClasses, sizeClasses[size], variantClasses[variant], className)}>
      {icon}
      {children}
    </span>
  );
}
