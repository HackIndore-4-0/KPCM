import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'none';
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = 'none', glass = true, children, ...props }, ref) => {
    const glowMap = {
      none: '',
      cyan: 'border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-glow-cyan',
      violet: 'border-violet-500/20 hover:border-violet-500/40 hover:shadow-glow-violet',
      emerald: 'border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-glow-emerald',
      amber: 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-glow-amber',
      rose: 'border-rose-500/20 hover:border-rose-500/40 hover:shadow-glow-rose',
    };
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border transition-all duration-200',
          glass ? 'neon-card' : 'bg-surface-800 border-surface-700',
          glowMap[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 pb-0', className)} {...props} />
);
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props} />
);
export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 pt-0', className)} {...props} />
);
