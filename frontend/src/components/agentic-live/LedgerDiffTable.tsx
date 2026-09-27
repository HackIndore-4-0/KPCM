import React from 'react';
import { Building2, Network, ShoppingBag, AlertCircle, CheckCircle2, XCircle, ArrowRightLeft } from 'lucide-react';
import { formatINR } from '../../lib/utils';

export interface LedgerEntry {
  source: 'Bank CBS' | 'NPCI Switch' | 'Merchant PG';
  refNumber: string;
  status: string;
  statusCode: string;
  amount: number;
  timestamp: string;
  isMatched: boolean;
  notes: string;
}

interface LedgerDiffTableProps {
  entries?: LedgerEntry[];
  caseId?: string;
  rrn?: string;
  amount?: number;
}

export const LedgerDiffTable: React.FC<LedgerDiffTableProps> = ({
  entries,
  caseId = 'CASE-2026-9041',
  rrn = '408219482910',
  amount = 1499,
}) => {
  // Default tri-party asymmetric timeout scenario if none provided
  const defaultEntries: LedgerEntry[] = [
    {
      source: 'Bank CBS',
      refNumber: rrn,
      status: 'DEBIT_SUCCESS',
      statusCode: '00',
      amount: amount,
      timestamp: '2026-09-28 14:32:01 IST',
      isMatched: true,
      notes: 'Customer account successfully debited; authorization token issued.',
    },
    {
      source: 'NPCI Switch',
      refNumber: rrn,
      status: 'TIMEOUT_ASYMMETRIC',
      statusCode: 'U69',
      amount: amount,
      timestamp: '2026-09-28 14:32:06 IST',
      isMatched: false,
      notes: 'Switch received debit confirmation; downstream beneficiary ACK timed out.',
    },
    {
      source: 'Merchant PG',
      refNumber: `ORD-${rrn.slice(-6)}`,
      status: 'PAYMENT_PENDING_EXPIRED',
      statusCode: 'M404',
      amount: 0,
      timestamp: '2026-09-28 14:35:00 IST',
      isMatched: false,
      notes: 'No inbound credit confirmed within 180s checkout window.',
    },
  ];

  const ledgerData = entries || defaultEntries;

  return (
    <div className="rounded-2xl border border-panel-border bg-panel overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-panel-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ArrowRightLeft className="w-4 h-4 text-cyan" />
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Tri-Party Ledger Discrepancy Matrix
            </h4>
            <p className="text-[11px] text-gray-400">
              Cross-reconciliation between Sender CBS, NPCI Central Switch, and Merchant Gateway
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="px-2 py-0.5 rounded bg-terracotta/15 border border-terracotta/40 text-terracotta">
            ASYMMETRIC DISCREPANCY DETECTED
          </span>
        </div>
      </div>

      {/* Table view */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-obsidian/80 text-gray-400 border-b border-panel-border text-[11px]">
            <tr>
              <th className="py-3 px-4">Ledger Entity</th>
              <th className="py-3 px-4">Audit Reference / RRN</th>
              <th className="py-3 px-4">Telemetry Status</th>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Recorded Amount</th>
              <th className="py-3 px-4">Ledger Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-border/60">
            {ledgerData.map((item, idx) => {
              const isDebit = item.source === 'Bank CBS';
              const isSwitch = item.source === 'NPCI Switch';
              const isPG = item.source === 'Merchant PG';

              return (
                <tr
                  key={idx}
                  className={`hover:bg-panel-hover transition-colors ${
                    !item.isMatched ? 'bg-terracotta/[0.03]' : ''
                  }`}
                >
                  {/* Entity Source */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2 font-sans">
                      {isDebit && <Building2 className="w-4 h-4 text-emerald" />}
                      {isSwitch && <Network className="w-4 h-4 text-amber" />}
                      {isPG && <ShoppingBag className="w-4 h-4 text-magenta" />}
                      <span>{item.source}</span>
                    </div>
                  </td>

                  {/* Reference */}
                  <td className="py-3.5 px-4 text-gray-300">
                    <span className="bg-black/40 px-2 py-0.5 rounded border border-panel-border">
                      {item.refNumber}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.isMatched
                          ? 'bg-emerald/15 text-emerald border border-emerald/30'
                          : 'bg-terracotta/15 text-terracotta border border-terracotta/40'
                      }`}
                    >
                      {item.isMatched ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {item.status}
                    </span>
                  </td>

                  {/* Code */}
                  <td className="py-3.5 px-4 font-bold text-gray-200">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      {item.statusCode}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    {formatINR(item.amount)}
                  </td>

                  {/* Notes */}
                  <td className="py-3.5 px-4 text-gray-400 font-sans text-[11px] max-w-xs">
                    {item.notes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Discrepancy Insight Footer */}
      <div className="p-4 bg-obsidian border-t border-panel-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-cyan">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-sans text-gray-300">
            <strong>Reconciliation Conclusion:</strong> Beneficiary bank failed to acknowledge receipt. Funds debited from citizen held in transit buffer.
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald/15 text-emerald border border-emerald/40 font-semibold">
            RECOMMENDED: IMMEDIATE REVERSAL TO SENDER
          </span>
        </div>
      </div>
    </div>
  );
};

export default LedgerDiffTable;
