import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowLeft, Download, Coins, FileText } from 'lucide-react';
import { Dispute, LedgerRecord, AgentTrace } from '../../types';
import { LedgerDiffTable } from '../agentic-live/LedgerDiffTable';
import { TraceStream } from '../agentic-live/TraceStream';
import { ConfidenceMeter } from '../agentic-live/ConfidenceMeter';
import { EscalationCard } from '../ombudsman/EscalationCard';

interface CaseDetailProps {
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

export const CaseDetail: React.FC<CaseDetailProps> = ({
  dispute,
  ledgers,
  traces,
  isLoading,
  onBack,
  onDecision,
}) => {
  const isResolved = dispute.status === 'RESOLVED';
  const isHITL = dispute.requires_human_escalation || dispute.status === 'ESCALATED_HITL';
  const res = dispute.final_resolution;

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>Verifying Ledgers...</span>
        </span>
      );
    }
    if (isResolved) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          <span>Resolved &bull; Mandate Issued</span>
        </span>
      );
    }
    if (isHITL) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Ombudsman Review Required</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span>Ingested</span>
      </span>
    );
  };

  const handleDownload = () => {
    const certText = `
RESERVE BANK OF INDIA — FINANCIAL OMBUDSMAN SCHEME
STATUTORY DISPUTE RESOLUTION ORDER
Docket ID: ${dispute.dispute_id}
Claimant: ${dispute.citizen_name || 'Vaidik Lahoria'}
Amount: ₹${(dispute.claimed_amount || 25000).toLocaleString('en-IN')}
Status: ${dispute.status}
Directive: ${res?.actionable_order || 'Under active ledger reconciliation'}
Regulatory Basis: ${res?.regulatory_basis || 'RBI Circular DPSS.CO.PD.No.1164/2019-20'}
Compensation Entitlement: ${res?.compensation_entitlement || '₹100/day penal compensation beyond T+1'}
    `.trim();

    const blob = new Blob([certText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resolution_Order_${dispute.dispute_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6 py-4"
    >
      {/* Calm Navigation Bar */}
      <motion.div variants={sectionVariants} className="flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.03, x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Lodge Another Grievance</span>
        </motion.button>

        {isResolved && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Order</span>
          </motion.button>
        )}
      </motion.div>

      {/* Case Header Card */}
      <motion.div
        variants={sectionVariants}
        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white font-mono">
                Case #{dispute.dispute_id}
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Complainant: <strong className="text-slate-200">{dispute.citizen_name || 'Vaidik Lahoria'}</strong> &bull; Contact: {dispute.citizen_contact || '+91 98765 43210'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-mono">Claimed Amount</span>
            <span className="text-xl font-bold font-mono text-white">
              ₹{(dispute.claimed_amount || 25000).toLocaleString('en-IN')}.00
            </span>
          </div>
        </div>

        {/* Complaint Summary */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          &ldquo;{dispute.complaint_text}&rdquo;
        </p>

        {/* Statutory Resolution Directive Banner */}
        {isResolved && res && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2.5"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div className="font-semibold text-xs font-mono">
                Statutory Redressal Order Issued
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {res.actionable_order}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-500/20 text-[11px] text-emerald-300">
              <span className="flex items-center gap-1.5 font-mono">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>{res.compensation_entitlement}</span>
              </span>
              <span className="font-mono text-slate-400">
                {res.regulatory_basis}
              </span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Component 1: Confidence Meter (with smooth fill animation & tween) */}
      <motion.div variants={sectionVariants}>
        <ConfidenceMeter
          score={dispute.confidence_score || 0.95}
          amount={dispute.claimed_amount || 25000}
          isHITL={isHITL}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Component 2: Inter-Bank Ledger Reconciliation (with staggered rows & pulse) */}
      <motion.div variants={sectionVariants}>
        <LedgerDiffTable
          records={ledgers}
          conflictDetails={dispute.conflict_details}
          isConflict={dispute.conflict_detected}
          isLoading={isLoading}
        />
      </motion.div>

      {/* Component 3: TraceStream (animating entries one by one as they arrive) */}
      <motion.div variants={sectionVariants}>
        <TraceStream
          traces={traces}
          isStreaming={isLoading}
        />
      </motion.div>

      {/* Component 4: EscalationCard (if escalated to Ombudsman) */}
      {isHITL && (
        <motion.div
          variants={sectionVariants}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <EscalationCard
            disputeId={dispute.dispute_id}
            claimantName={dispute.citizen_name}
            claimedAmount={dispute.claimed_amount}
            reason={dispute.escalation_reason}
            onDecision={onDecision}
          />
        </motion.div>
      )}
    </motion.div>
  );
};
