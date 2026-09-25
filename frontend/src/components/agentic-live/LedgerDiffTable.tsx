import React from 'react';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const LedgerDiffTable: React.FC = () => {
  const records = [
    {
      system: 'State Bank of India (CBS)',
      role: 'Payer Bank',
      status: 'SUCCESS',
      amount: '₹25,000.00',
      statusClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: CheckCircle2,
    },
    {
      system: 'NPCI UPI Switch',
      role: 'Payment Rail',
      status: 'U69 TIMEOUT',
      amount: '₹25,000.00',
      statusClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: AlertCircle,
    },
    {
      system: 'MegaRetail PG',
      role: 'Merchant Gateway',
      status: 'UNPAID',
      amount: '₹0.00',
      statusClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: XCircle,
    },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Cross-System Discrepancy Matrix</span>
        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Discrepancy Confirmed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2">System</th>
              <th className="py-2">Role</th>
              <th className="py-2">Reported Status</th>
              <th className="py-2">Balance Shift</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {records.map((r, i) => {
              const Icon = r.icon;
              return (
                <tr key={i} className="text-slate-200">
                  <td className="py-2.5 font-medium">{r.system}</td>
                  <td className="py-2.5 text-slate-400">{r.role}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] ${r.statusClass}`}>
                      <Icon className="w-3 h-3" />
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono">{r.amount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
