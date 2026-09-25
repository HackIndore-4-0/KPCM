import React from 'react';
import { Check, X, Edit3 } from 'lucide-react';

export const DecisionOverride: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <span className="font-semibold text-sm text-white block">One-Click Ombudsman Verdict</span>
      <div className="grid grid-cols-3 gap-2">
        <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-xs font-medium transition-colors">
          <Check className="w-3.5 h-3.5" />
          Approve Order
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs font-medium transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
          Modify Terms
        </button>
        <button className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-600/20 border border-rose-500/30 text-rose-400 hover:bg-rose-600/30 text-xs font-medium transition-colors">
          <X className="w-3.5 h-3.5" />
          Reject / Audit
        </button>
      </div>
    </div>
  );
};
