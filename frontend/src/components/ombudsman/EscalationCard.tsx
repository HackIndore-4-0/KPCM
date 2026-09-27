import React, { useState } from 'react';
import { Scale, AlertTriangle, ShieldCheck, CheckCircle2, Edit3, ArrowRight, UserCheck } from 'lucide-react';
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
  status: 'PENDING_REVIEW' | 'APPROVED_RECOMMENDATION' | 'MODIFIED_RESOLUTION' | 'ESCALATED_HUMAN_REVIEW';
}

interface EscalationCardProps {
  item: EscalationItem;
  onAction?: (action: 'APPROVE_RECOMMENDATION' | 'MODIFY_RESOLUTION' | 'ESCALATE_HUMAN_REVIEW', item: EscalationItem) => void;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({ item, onAction }) => {
  const [currentStatus, setCurrentStatus] = useState<string>(item.status);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (action: 'APPROVE_RECOMMENDATION' | 'MODIFY_RESOLUTION' | 'ESCALATE_HUMAN_REVIEW') => {
    setIsProcessing(true);
    setTimeout(() => {
      setCurrentStatus(action);
      setIsProcessing(false);
      onAction?.(action, item);
    }, 300);
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
            CIRCUIT BREAKER HALTED
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
            <span className="font-semibold text-gray-200">Human Review Trigger: </span>
            <span className="text-gray-400 font-sans">{item.reasonText}</span>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-gray-200">Agent Recommendation: </span>
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

      {/* Human Review Actions Bar */}
      <div className="pt-3 border-t border-panel-border flex flex-wrap items-center justify-between gap-3">
        {currentStatus === 'PENDING_REVIEW' ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Action 1: Approve Agent Recommendation */}
              <button
                disabled={isProcessing}
                onClick={() => handleAction('APPROVE_RECOMMENDATION')}
                className="px-3 py-1.5 rounded-lg bg-emerald/20 hover:bg-emerald/30 border border-emerald/50 text-emerald text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve Agent Recommendation</span>
              </button>

              {/* Action 2: Modify Resolution */}
              <button
                disabled={isProcessing}
                onClick={() => handleAction('MODIFY_RESOLUTION')}
                className="px-3 py-1.5 rounded-lg bg-amber/20 hover:bg-amber/30 border border-amber/50 text-amber text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modify Resolution</span>
              </button>
            </div>

            {/* Action 3: Escalate for Human Review */}
            <button
              disabled={isProcessing}
              onClick={() => handleAction('ESCALATE_HUMAN_REVIEW')}
              className="px-3 py-1.5 rounded-lg bg-panel hover:bg-panel-border border border-panel-border text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <UserCheck className="w-3.5 h-3.5 text-magenta" />
              <span>Escalate for Human Review</span>
              <ArrowRight className="w-3 h-3 text-magenta" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between p-2 rounded-lg bg-obsidian border border-panel-border text-xs font-mono">
            <span className="text-gray-400">Human Review Workflow State:</span>
            <span
              className={`font-semibold uppercase ${
                currentStatus === 'APPROVE_RECOMMENDATION'
                  ? 'text-emerald'
                  : currentStatus === 'MODIFY_RESOLUTION'
                  ? 'text-amber'
                  : 'text-magenta'
              }`}
            >
              {currentStatus.replace(/_/g, ' ')} (Demo Workflow State)
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EscalationCard;
