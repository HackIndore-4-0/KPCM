import React, { useState } from 'react';
import { Scale, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, ArrowRight, UserCheck, Clock, FileText } from 'lucide-react';
import { formatINR } from '../../lib/utils';

export interface EscalationItem {
  id: string;
  caseId: string;
  citizenName: string;
  amount: number;
  date: string;
  reason: 'HIGH_VALUE_THRESHOLD' | 'CIRCUIT_BREAKER_TRIP' | 'LOW_CONFIDENCE' | 'SUSPECTED_FRAUD';
  reasonText: string;
  agentRecommendation: string;
  confidence: number;
  tokenUsage: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'OVERRIDDEN' | 'ESCALATED_RBI';
}

interface EscalationCardProps {
  item: EscalationItem;
  onAction?: (action: 'APPROVE' | 'OVERRIDE' | 'ESCALATE', item: EscalationItem) => void;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({ item, onAction }) => {
  const [currentStatus, setCurrentStatus] = useState<string>(item.status);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action: 'APPROVE' | 'OVERRIDE' | 'ESCALATE') => {
    setIsProcessing(true);
    setTimeout(() => {
      if (action === 'APPROVE') setCurrentStatus('APPROVED');
      if (action === 'OVERRIDE') setCurrentStatus('OVERRIDDEN');
      if (action === 'ESCALATE') setCurrentStatus('ESCALATED_RBI');
      setIsProcessing(false);
      onAction?.(action, item);
    }, 400);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'HIGH_VALUE_THRESHOLD':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber/15 text-amber border border-amber/30">
            HIGH VALUE (&gt; ₹50,000)
          </span>
        );
      case 'CIRCUIT_BREAKER_TRIP':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-terracotta/20 text-terracotta border border-terracotta/40 font-bold">
            CIRCUIT BREAKER HALT
          </span>
        );
      case 'LOW_CONFIDENCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/15 text-blue-400 border border-blue-500/30">
            CONFIDENCE &lt; 75%
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-magenta/15 text-magenta border border-magenta/30">
            ANOMALY AUDIT
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-panel-border bg-panel p-5 space-y-4 hover:border-gray-700 transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-panel-border">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-magenta" />
          <span className="font-mono text-xs font-bold text-white">{item.caseId}</span>
          <span className="text-[10px] font-mono text-gray-500">&bull; {item.date}</span>
        </div>

        <div className="flex items-center gap-2">
          {getReasonBadge(item.reason)}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-panel-border text-white">
            {formatINR(item.amount)}
          </span>
        </div>
      </div>

      {/* Case Details */}
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-200">Escalation Trigger: </span>
            <span className="text-gray-400 font-sans">{item.reasonText}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-200">Agent Proposed Action: </span>
            <span className="text-cyan font-mono text-[11px]">{item.agentRecommendation}</span>
          </div>
        </div>

        {/* Telemetry info */}
        <div className="pt-2 flex items-center gap-4 text-[10px] font-mono text-gray-400 border-t border-panel-border/50">
          <span>Confidence: {Math.round(item.confidence * 100)}%</span>
          <span>&bull;</span>
          <span>Tokens: {item.tokenUsage}</span>
          <span>&bull;</span>
          <span>Claimant: {item.citizenName}</span>
        </div>
      </div>

      {/* Decision Actions Bar */}
      <div className="pt-3 border-t border-panel-border flex flex-wrap items-center justify-between gap-3">
        {currentStatus === 'PENDING_REVIEW' ? (
          <>
            <div className="flex items-center gap-2">
              <button
                disabled={isProcessing}
                onClick={() => handleAction('APPROVE')}
                className="px-3 py-1.5 rounded-lg bg-emerald/20 hover:bg-emerald/30 border border-emerald/50 text-emerald text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Authorize Payout</span>
              </button>

              <button
                disabled={isProcessing}
                onClick={() => handleAction('OVERRIDE')}
                className="px-3 py-1.5 rounded-lg bg-terracotta/20 hover:bg-terracotta/30 border border-terracotta/50 text-terracotta text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Dismiss Claim</span>
              </button>
            </div>

            <button
              disabled={isProcessing}
              onClick={() => handleAction('ESCALATE')}
              className="px-3 py-1.5 rounded-lg bg-panel hover:bg-panel-border border border-panel-border text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span>Forward to RBI CMS</span>
              <ArrowRight className="w-3 h-3 text-magenta" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between p-2 rounded-lg bg-obsidian border border-panel-border text-xs font-mono">
            <span className="text-gray-400">Ombudsman Determination:</span>
            <span
              className={`font-semibold uppercase ${
                currentStatus === 'APPROVED'
                  ? 'text-emerald'
                  : currentStatus === 'OVERRIDDEN'
                  ? 'text-terracotta'
                  : 'text-magenta'
              }`}
            >
              {currentStatus} (Recorded to Supabase Audit Ledger)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscalationCard;
