'use client';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-black uppercase tracking-wide transition-all duration-200 text-center cursor-pointer rounded-lg outline-none flex items-center justify-center gap-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[9px]',
    md: 'px-5 py-2.5 text-[10px]',
    lg: 'px-6 py-3.5 text-sm',
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    accent: 'btn-accent',
    danger: 'bg-accent-danger text-white border border-accent-danger hover:opacity-90 shadow-sm',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {loading && (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {icon && iconPosition === 'left' && !loading && <span>{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && !loading && <span>{icon}</span>}
    </button>
  );
}
