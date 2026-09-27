import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit3, ShieldAlert, CheckCircle2, AlertOctagon, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EscalationCardProps {
  disputeId?: string;
  claimantName?: string;
  claimedAmount?: number;
  reason?: string;
  onDecision?: (decision: 'APPROVE' | 'MODIFY' | 'REJECT', notes: string) => void;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({
  disputeId = 'GRV-2026-8841',
  claimantName = 'Dr. Priya Raman',
  claimedAmount = 80000,
  reason = 'Amount exceeds statutory ₹50,000 autonomous limit. Telemetry flagged IP origin mismatch with resident jurisdiction.',
  onDecision,
}) => {
  const [decisionTaken, setDecisionTaken] = useState<'APPROVE' | 'MODIFY' | 'REJECT' | null>(null);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [customNote, setCustomNote] = useState(
    'Directing formal nodal inspection with provisional 50% freeze under RBI Ombudsman oversight.'
  );

  const handleAction = (decision: 'APPROVE' | 'MODIFY' | 'REJECT', notes?: string) => {
    setDecisionTaken(decision);

    if (decision === 'APPROVE') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#10b981', '#38bdf8', '#f59e0b'],
      });
    }

    const finalNote =
      notes ||
      (decision === 'APPROVE'
        ? 'Directing immediate Core Banking credit reversal under RBI Ombudsman oversight.'
        : decision === 'MODIFY'
        ? customNote
        : 'Escalated to State Cyber Crime Directorate for fraud forensics.');

    onDecision?.(decision, finalNote);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.008 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertOctagon className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
              Ombudsman Action Required
            </h4>
            <span className="text-[11px] text-slate-400 font-sans">
              Autonomous execution paused at regulatory safety gate
            </span>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
          {disputeId}
        </span>
      </div>

      {/* Case Overview */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">
            Claimant: <strong className="text-slate-200">{claimantName}</strong>
          </span>
          <span className="font-mono font-bold text-amber-400 text-sm">
            ₹{claimedAmount.toLocaleString('en-IN')}.00
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed font-sans border-t border-slate-800/60 pt-2">
          {reason}
        </p>
      </div>

      {/* Tactile Decision Buttons with Satisfying Confirm Animation */}
      <AnimatePresence mode="wait">
        {decisionTaken ? (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.94, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="font-semibold block font-mono">
                Order Confirmed:{' '}
                {decisionTaken === 'APPROVE'
                  ? 'Immediate Reversal Ratified'
                  : decisionTaken === 'MODIFY'
                  ? 'Terms Amended'
                  : 'Referred to Cyber Cell'}
              </span>
              <span className="text-[11px] text-emerald-200/80">
                Official directive stamped and transmitted to Core Banking System.
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1"
          >
            {/* Approve Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction('APPROVE')}
              className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Approve Reversal</span>
            </motion.button>

            {/* Modify Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModifyModal(true)}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
              <span>Modify Terms</span>
            </motion.button>

            {/* Escalate Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction('REJECT')}
              className="py-3 px-4 rounded-xl bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Escalate Cyber Cell</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modify Terms Modal with Scale + Fade Animation */}
      <AnimatePresence>
        {showModifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white font-mono">
                    Modify Ombudsman Directive
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowModifyModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium">
                  Custom Directive Instructions for Core Banking System:
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setShowModifyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-slate-800"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setShowModifyModal(false);
                    handleAction('MODIFY', customNote);
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  Stipulate &amp; Ratify
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
