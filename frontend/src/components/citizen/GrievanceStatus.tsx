import React from 'react';
import { Dispute } from '../../types';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GrievanceStatusProps {
  dispute: Dispute | null;
}

export const GrievanceStatus: React.FC<GrievanceStatusProps> = ({ dispute }) => {
  if (!dispute) return null;

  const res = dispute.final_resolution;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="font-semibold text-white">Dispute Status: {dispute.status}</span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
          ID: {dispute.dispute_id}
        </span>
      </div>

      {res && (
        <div className="space-y-3 pt-2 border-t border-slate-800 text-sm">
          <div>
            <span className="text-slate-400 block text-xs">Autonomous Verdict</span>
            <span className="text-emerald-400 font-medium">{res.verdict}</span>
          </div>

          <div>
            <span className="text-slate-400 block text-xs">Official Order</span>
            <p className="text-slate-200 text-xs leading-relaxed">{res.actionable_order}</p>
          </div>

          <div>
            <span className="text-slate-400 block text-xs">Regulatory Authority Basis</span>
            <span className="text-slate-300 font-mono text-xs">{res.regulatory_basis}</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-300">
            <strong>Compensation Rule:</strong> {res.compensation_entitlement}
          </div>
        </div>
      )}
    </div>
  );
};
