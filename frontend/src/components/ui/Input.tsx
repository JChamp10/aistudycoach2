'use client';
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export default function Input({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className,
  ...props
}: InputProps) {
  return (
    <div className={clsx(fullWidth && 'w-full')}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={clsx(
            'input',
            icon && iconPosition === 'left' && 'pl-10',
            icon && iconPosition === 'right' && 'pr-10',
            error && 'border-accent-danger focus:border-accent-danger',
            className
          )}
        />
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-accent-danger font-bold mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-text-faint font-bold mt-1">{helperText}</p>
      )}
    </div>
  );
}
