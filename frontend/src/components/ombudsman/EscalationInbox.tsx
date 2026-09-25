import React from 'react';
import { UserCheck, AlertOctagon } from 'lucide-react';

export const EscalationInbox: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-amber-400" />
          <span className="font-semibold text-sm text-white">Ombudsman HITL Escalations</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
          0 Pending Review
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Disputes exceeding ₹50,000 threshold or confidence &lt; 80% automatically pause here for human officer authorization.
      </p>
    </div>
  );
};
