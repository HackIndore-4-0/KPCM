import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'outline', size = 'md', loading, disabled, children, ...props }, ref) => {
    const base = 'btn-neon font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 disabled:opacity-35 disabled:cursor-not-allowed disabled:filter-none';
    const variants = {
      primary: 'btn-neon-primary text-surface-950',
      outline: 'btn-neon-outline text-[--color-text-primary]',
      ghost: 'btn-neon-ghost',
      danger: 'bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:border-rose-500/60 hover:shadow-glow-rose',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-xs',
      lg: 'px-7 py-3 text-sm',
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {children}
          </span>
        ) : children}
      </button>
    );
  }
);
Button.displayName = 'Button';
