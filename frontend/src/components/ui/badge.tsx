import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'muted';
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className, variant = 'cyan', dot = false, pulse = false, children, ...props
}) => {
  const variants = {
    cyan: 'status-pill-cyan',
    violet: 'bg-violet-500/10 text-violet-300 border border-violet-500/25',
    emerald: 'status-pill-emerald',
    amber: 'status-pill-amber',
    rose: 'status-pill-rose',
    muted: 'bg-surface-700/50 text-[--color-text-secondary] border border-surface-600',
  };
  return (
    <span className={cn('status-pill', variants[variant], className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            variant === 'cyan' ? 'bg-cyan-400' : '',
            variant === 'emerald' ? 'bg-emerald-400' : '',
            variant === 'amber' ? 'bg-amber-400' : '',
            variant === 'rose' ? 'bg-rose-400' : '',
            variant === 'violet' ? 'bg-violet-400' : '',
            variant === 'muted' ? 'bg-[--color-text-muted]' : '',
            pulse ? 'animate-pulse' : ''
          )}
        />
      )}
      {children}
    </span>
  );
};
