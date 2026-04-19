'use client';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  elevated?: boolean;
}

export function Card({ children, className, hover = true, elevated = false }: CardProps) {
  return (
    <div
      className={clsx(
        'card',
        hover && 'hover:shadow-md',
        elevated && 'shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export function CardHeader({ title, subtitle, action, children }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4 pb-4 border-b border-border-muted">
      <div className="flex-1">
        {title && <h3 className="text-lg font-black uppercase tracking-tight text-text-primary">{title}</h3>}
        {subtitle && <p className="text-xs font-bold uppercase tracking-widest text-text-muted mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('flex items-center gap-3 mt-6 pt-4 border-t border-border-muted', className)}>
      {children}
    </div>
  );
}
