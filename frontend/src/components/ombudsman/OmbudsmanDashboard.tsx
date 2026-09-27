import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Dispute, LedgerRecord, AgentTrace } from '../../types';
import { EscalationCard } from './EscalationCard';
import { LedgerDiffTable } from '../agentic-live/LedgerDiffTable';
import { TraceStream } from '../agentic-live/TraceStream';

interface OmbudsmanDashboardProps {
  dispute: Dispute;
  ledgers: LedgerRecord[];
  traces: AgentTrace[];
  isLoading: boolean;
  onBack: () => void;
  onDecision: (decision: 'APPROVE' | 'MODIFY' | 'REJECT', notes: string) => void;
}

const pageContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const OmbudsmanDashboard: React.FC<OmbudsmanDashboardProps> = ({
  dispute,
  ledgers,
  traces,
  isLoading,
  onBack,
  onDecision,
}) => {
  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6 py-4"
    >
      {/* Top Bar with Micro-interactions */}
      <motion.div variants={sectionVariants} className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.03, x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Citizen Portal</span>
        </motion.button>

        <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
          Officer ID: #882-MUMBAI-CENTRAL
        </span>
      </motion.div>

      {/* Screen Header */}
      <motion.div variants={sectionVariants} className="border-b border-slate-800 pb-3">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Ombudsman Adjudication Cockpit</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review halted financial disputes exceeding the autonomous threshold (&gt;₹50,000) or requiring manual validation
        </p>
      </motion.div>

      {/* Primary Action Card: EscalationCard */}
      <motion.div variants={sectionVariants}>
        <EscalationCard
          disputeId={dispute.dispute_id}
          claimantName={dispute.citizen_name}
          claimedAmount={dispute.claimed_amount}
          reason={dispute.escalation_reason}
          onDecision={onDecision}
        />
      </motion.div>

      {/* Inter-Bank Ledger Verification */}
      <motion.div variants={sectionVariants}>
        <LedgerDiffTable
          records={ledgers}
          conflictDetails={dispute.conflict_details}
          isConflict={dispute.conflict_detected}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Full Audit Stream */}
      <motion.div variants={sectionVariants}>
        <TraceStream
          traces={traces}
          isStreaming={isLoading}
        />
      </motion.div>
    </motion.div>
  );
};
