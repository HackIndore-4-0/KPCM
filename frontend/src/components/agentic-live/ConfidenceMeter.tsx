import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface ConfidenceMeterProps {
  score?: number;
  amount?: number;
  isHITL?: boolean;
  isLoading?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  score = 0.95,
  amount = 25000,
  isHITL = false,
  isLoading = false,
}) => {
  const percentage = Math.round(score * 100);
  const isHighValue = amount > 50000;
  const isSafe = percentage >= 80 && !isHighValue && !isHITL;

  if (isLoading) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-44 bg-slate-800 rounded animate-pulse" />
          <div className="h-6 w-12 bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full w-2/3 bg-slate-800 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3.5 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors ${
              isSafe
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            {isSafe ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </motion.div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Resolution Confidence
            </h4>
            <span className="text-[11px] text-slate-400 block font-sans">
              {isSafe
                ? 'Cross-ledger consensus verified. Eligible for autonomous reversal.'
                : 'Safety limit or ambiguity threshold tripped. Handed over to case officer.'}
            </span>
          </div>
        </div>

        {/* Big percentage score with animated tween and spring bump */}
        <div className="flex items-baseline gap-1 font-mono">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={percentage}
              initial={{ opacity: 0, y: -8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className={`text-2xl font-bold tracking-tight ${
                isSafe ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {percentage}%
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Smooth Fill Progress Bar with Tween Animation whenever score changes */}
      <div className="space-y-1">
        <div className="relative h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <motion.div
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'tween', duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className={`h-full rounded-full transition-colors ${
              isSafe ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
            }`}
          />
          {/* 80% Threshold Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-slate-600 z-10"
            style={{ left: '80%' }}
            title="80% Human Review Gate"
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>0%</span>
          <span className="text-slate-400 font-sans">80% Autonomous Minimum</span>
          <span>100%</span>
        </div>
      </div>
    </motion.div>
  );
};
