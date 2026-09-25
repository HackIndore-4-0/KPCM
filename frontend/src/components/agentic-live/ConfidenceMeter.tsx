import React from 'react';
import { Gauge } from 'lucide-react';

interface ConfidenceMeterProps {
  score?: number;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ score = 0.95 }) => {
  const percentage = Math.round(score * 100);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Gauge className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs text-slate-400 block">Agent Confidence Level</span>
          <span className="text-sm font-semibold text-white">Responsible Automation Matrix</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono text-emerald-400">{percentage}%</span>
        <span className="text-xs text-slate-500">Autonomous Safe</span>
      </div>
    </div>
  );
};
