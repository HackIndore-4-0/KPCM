import React from 'react';
import { FileText, Download } from 'lucide-react';

export const AuditExport: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-blue-400" />
        <div>
          <span className="text-xs font-semibold text-white block">RBI Redressal Audit Package</span>
          <span className="text-[11px] text-slate-400">Cryptographically signed dispute resolution order</span>
        </div>
      </div>
      <button className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export PDF
      </button>
    </div>
  );
};
