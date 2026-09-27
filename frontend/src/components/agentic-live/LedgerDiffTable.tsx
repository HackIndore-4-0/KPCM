import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Building2, Cpu, Store } from 'lucide-react';
import { LedgerRecord } from '../../types';

interface LedgerDiffTableProps {
  records?: LedgerRecord[];
  conflictDetails?: string;
  isConflict?: boolean;
  isLoading?: boolean;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export const LedgerDiffTable: React.FC<LedgerDiffTableProps> = ({
  records = [],
  conflictDetails,
  isConflict = true,
  isLoading = false,
}) => {
  // Compute net discrepancy
  const debited = records
    .filter((r) => r.source === 'BANK_CBS' && r.status === 'SUCCESS')
    .reduce((acc, r) => acc + r.amount, 0);

  const credited = records
    .filter((r) => r.source === 'MERCHANT_PG' && (r.status === 'SUCCESS' || r.status === 'SETTLED'))
    .reduce((acc, r) => acc + r.amount, 0);

  const discrepancy = Math.abs(debited - credited);

  const getSystemIcon = (source: string) => {
    switch (source) {
      case 'BANK_CBS':
        return <Building2 className="w-4 h-4 text-slate-300" />;
      case 'NPCI_SWITCH':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'MERCHANT_PG':
        return <Store className="w-4 h-4 text-rose-400" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusVisuals = (status: string) => {
    if (status === 'SUCCESS' || status === 'SETTLED') {
      return {
        label: 'Debited (Success)',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        isMismatch: false,
      };
    }
    if (status.includes('TIMEOUT') || status === 'PENDING') {
      return {
        label: 'Timeout (U69 Error)',
        badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        dotClass: 'bg-amber-400 animate-pulse',
        isMismatch: true,
      };
    }
    return {
      label: 'Not Credited (Unpaid)',
      badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      dotClass: 'bg-rose-500',
      isMismatch: true,
    };
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-2">
            Inter-Bank Ledger Verification
            {isConflict && !isLoading && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium">
                Mismatch Found
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cross-checks your bank, the national payment switch, and the merchant
          </p>
        </div>

        {isConflict && !isLoading && discrepancy > 0 && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-mono">Discrepancy</span>
            <span className="text-xs font-bold text-rose-400 font-mono">
              ₹{discrepancy.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* Honest Skeleton Load State */}
      {isLoading ? (
        <div className="space-y-3 py-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800" />
                <div className="space-y-1.5">
                  <div className="h-3 w-32 bg-slate-800 rounded" />
                  <div className="h-2 w-20 bg-slate-800/60 rounded" />
                </div>
              </div>
              <div className="h-6 w-24 bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-2.5"
        >
          {records.map((record, idx) => {
            const visual = getStatusVisuals(record.status);
            const isRowHighlighted = visual.isMismatch && isConflict;

            return (
              <motion.div
                key={idx}
                variants={rowVariants}
                whileHover={{ scale: 1.012, backgroundColor: 'rgba(2, 6, 23, 0.85)' }}
                whileTap={{ scale: 0.99 }}
                animate={{
                  borderColor: isRowHighlighted
                    ? ['rgba(244,63,94,0.3)', 'rgba(244,63,94,0.65)', 'rgba(244,63,94,0.3)']
                    : 'rgba(51,65,85,0.4)',
                }}
                transition={{
                  duration: isRowHighlighted ? 2.5 : 0.2,
                  repeat: isRowHighlighted ? Infinity : 0,
                  ease: 'easeInOut',
                }}
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 cursor-pointer transition-colors ${
                  isRowHighlighted ? 'bg-rose-950/10' : ''
                }`}
              >
                {/* Institution & Role */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    {getSystemIcon(record.source)}
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-100">
                      {record.institution_name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Ref: {record.txn_id}
                    </div>
                  </div>
                </div>

                {/* Status Indicator Pill */}
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border font-mono ${visual.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${visual.dotClass}`} />
                    <span>{visual.label}</span>
                  </span>

                  <span className="font-bold text-xs font-mono text-slate-100 min-w-[70px] text-right">
                    ₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Root Cause Summary */}
      {conflictDetails && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed font-sans"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-300 font-medium block mb-0.5 font-mono text-[11px] uppercase">
              Audit Finding:
            </strong>
            {conflictDetails}
          </div>
        </motion.div>
      )}
    </div>
  );
};
