import React from 'react';
import { Dispute } from '../../types';
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock, Coins, FileCheck, ArrowUpRight } from 'lucide-react';

interface GrievanceStatusProps {
  dispute: Dispute | null;
}

export const GrievanceStatus: React.FC<GrievanceStatusProps> = ({ dispute }) => {
  if (!dispute) return null;

  const res = dispute.final_resolution;
  const isResolved = dispute.status === 'RESOLVED';
  const isHITL = dispute.status === 'ESCALATED_HITL';

  return (
    <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2">
          {isResolved ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          ) : isHITL ? (
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="font-semibold text-white text-sm block">
              Grievance Status: {dispute.status}
            </span>
            <span className="text-[11px] text-slate-400">
              Citizen: {dispute.citizen_name || 'Vaidik Lahoria'} &bull; Domain: {dispute.domain || 'DIGITAL_PAYMENTS_UPI'}
            </span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-950 text-cyan-400 border border-slate-800 font-mono">
          Ref: {dispute.dispute_id}
        </span>
      </div>

      {/* HITL Notice when Halted */}
      {isHITL && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Escalated to RBI Ombudsman Human Gate</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            {dispute.escalation_reason ||
              'High financial value (>₹50,000) or low confidence score triggered deterministic safety halt. Awaiting Ombudsman officer sign-off in Cockpit.'}
          </p>
        </div>
      )}

      {/* Autonomous Verdict Card */}
      {res && (
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">
              Binding Autonomous Verdict
            </span>
            <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {res.verdict}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">
              Actionable Redressal Order
            </span>
            <p className="text-slate-200 text-xs leading-relaxed font-sans">
              {res.actionable_order}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2 text-emerald-300">
            <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-[11px]">RBI Statutory Compensation Rule:</span>
              <span className="text-[11px] text-emerald-200/90 leading-relaxed">
                {res.compensation_entitlement}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="block text-slate-500">Legal Foundation:</span>
              <span className="text-slate-300 truncate block">{res.regulatory_basis}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="block text-slate-500">Settlement Timeline:</span>
              <span className="text-cyan-300 block">{res.settlement_timeline || 'T+1 Auto-Reversal'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
