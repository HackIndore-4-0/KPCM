import React, { useState } from 'react';
import { Scale, ShieldAlert, CheckCircle2, Clock, Filter, AlertTriangle, ArrowUpRight, CheckCheck, RefreshCw } from 'lucide-react';
import EscalationCard, { EscalationItem } from '../components/ombudsman/EscalationCard';
import { formatINR } from '../lib/utils';
import { Language, translations } from '../lib/translations';

interface OmbudsmanDashboardProps {
  onNavigate: (tab: string, caseId?: string) => void;
  lang: Language;
}

export const OmbudsmanDashboard: React.FC<OmbudsmanDashboardProps> = ({ onNavigate, lang }) => {
  const t = translations[lang] || translations.en;
  const [filterType, setFilterType] = useState<string>('ALL');

  // Simulated pending escalations routed from LangGraph
  const [escalations, setEscalations] = useState<EscalationItem[]>([
    {
      id: 'ESC-001',
      caseId: 'CASE-2026-8812',
      citizenName: 'Rahul Verma',
      amount: 85000,
      date: '2026-09-28 09:40 IST',
      reason: 'HIGH_VALUE_THRESHOLD',
      reasonText: 'Transaction amount (₹85,000) exceeds autonomous resolution cap of ₹50,000.',
      agentRecommendation: 'AUTHORIZE_REVERSAL_UPON_MANUAL_REVIEW (Evidence verifies vendor non-receipt)',
      confidence: 0.92,
      tokenUsage: 4120,
      status: 'PENDING_REVIEW',
    },
    {
      id: 'ESC-002',
      caseId: 'CASE-2026-FAIL',
      citizenName: 'Priya Sharma',
      amount: 2500,
      date: '2026-09-28 12:15 IST',
      reason: 'CIRCUIT_BREAKER_TRIP',
      reasonText: '3 consecutive CBS tool timeouts triggered deterministic runaway-loop circuit breaker.',
      agentRecommendation: 'SAFE_HALT_RECOVERY (Requires manual CBS reconciliation before payout)',
      confidence: 0.58,
      tokenUsage: 12400,
      status: 'PENDING_REVIEW',
    },
    {
      id: 'ESC-003',
      caseId: 'CASE-2026-4409',
      citizenName: 'Amit Patel',
      amount: 4200,
      date: '2026-09-28 13:50 IST',
      reason: 'LOW_CONFIDENCE',
      reasonText: 'Merchant gateway returned ambiguous response code M99; confidence 68% (< 75% threshold).',
      agentRecommendation: 'HOLD_AND_RETRY_BATCH_QUERY',
      confidence: 0.68,
      tokenUsage: 5310,
      status: 'PENDING_REVIEW',
    },
  ]);

  const filteredEscalations = escalations.filter((item) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'HIGH_VALUE') return item.reason === 'HIGH_VALUE_THRESHOLD';
    if (filterType === 'BREAKER') return item.reason === 'CIRCUIT_BREAKER_TRIP';
    if (filterType === 'LOW_CONFIDENCE') return item.reason === 'LOW_CONFIDENCE';
    return true;
  });

  const handleEscalationAction = (
    action: 'APPROVE_RECOMMENDATION' | 'MODIFY_RESOLUTION' | 'ESCALATE_HUMAN_REVIEW',
    item: EscalationItem
  ) => {
    setEscalations((prev) =>
      prev.map((esc) => {
        if (esc.id === item.id) {
          const newStatus: EscalationItem['status'] =
            action === 'APPROVE_RECOMMENDATION'
              ? 'APPROVED_RECOMMENDATION'
              : action === 'MODIFY_RESOLUTION'
              ? 'MODIFIED_RESOLUTION'
              : 'ESCALATED_HUMAN_REVIEW';
          return { ...esc, status: newStatus };
        }
        return esc;
      })
    );
  };

  const pendingCount = escalations.filter((e) => e.status === 'PENDING_REVIEW').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-magenta" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Human-in-the-Loop Oversight Desk
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Decision-support review console for high-value claims (&gt; ₹50,000), circuit breaker trips, and ambiguous discrepancies. Synthetic demo environment.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-magenta/15 text-magenta border border-magenta/30 font-semibold">
            {pendingCount} Pending Human Reviews
          </span>
        </div>
      </div>

      {/* Capability & Architecture Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-panel border border-panel-border space-y-1">
          <span className="text-[11px] font-mono text-gray-400">Token Budget Cap</span>
          <div className="text-xl font-bold font-mono text-cyan">10K TOKENS</div>
          <p className="text-[10px] text-gray-500">Authoritative safety ceiling</p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-panel-border space-y-1">
          <span className="text-[11px] font-mono text-gray-400">Circuit Breaker Policy</span>
          <div className="text-xl font-bold font-mono text-amber">4 FAILURES</div>
          <p className="text-[10px] text-gray-500">Runaway loop safe-halt</p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-panel-border space-y-1">
          <span className="text-[11px] font-mono text-gray-400">Telemetry Channel</span>
          <div className="text-xl font-bold font-mono text-emerald">REAL-TIME SSE</div>
          <p className="text-[10px] text-gray-500">OpenTelemetry trace stream</p>
        </div>

        <div className="p-4 rounded-xl bg-panel border border-panel-border space-y-1">
          <span className="text-[11px] font-mono text-gray-400">Oversight Governance</span>
          <div className="text-xl font-bold font-mono text-magenta">HITL QUEUE</div>
          <p className="text-[10px] text-gray-500">Consequential decision review</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-panel-border pb-3 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'ALL'
              ? 'bg-magenta/20 text-magenta border border-magenta/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          All Cases ({escalations.length})
        </button>

        <button
          onClick={() => setFilterType('HIGH_VALUE')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'HIGH_VALUE'
              ? 'bg-amber/20 text-amber border border-amber/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          High Value &gt; ₹50k (1)
        </button>

        <button
          onClick={() => setFilterType('BREAKER')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'BREAKER'
              ? 'bg-terracotta/20 text-terracotta border border-terracotta/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Circuit Breakers (1)
        </button>

        <button
          onClick={() => setFilterType('LOW_CONFIDENCE')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'LOW_CONFIDENCE'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Low Confidence &lt; 75% (1)
        </button>
      </div>

      {/* Escalation Cards List */}
      <div className="space-y-4">
        {filteredEscalations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-panel-border rounded-2xl bg-panel">
            <CheckCircle2 className="w-8 h-8 text-emerald mx-auto mb-2" />
            <p className="text-xs">No pending escalations in this category.</p>
          </div>
        ) : (
          filteredEscalations.map((item) => (
            <EscalationCard
              key={item.id}
              item={item}
              onAction={handleEscalationAction}
            />
          ))
        )}
      </div>

      {/* Historical Ombudsman Verdicts Table */}
      <div className="p-5 rounded-2xl bg-panel border border-panel-border space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-panel-border">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-emerald" />
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
              Recently Audited Ombudsman Determinations
            </h4>
          </div>
          <span className="text-[10px] font-mono text-gray-500">Cryptographically Signed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-obsidian/60 text-gray-400 border-b border-panel-border text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Claimant</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Final Determination</th>
                <th className="py-2.5 px-3">Auditor ID</th>
                <th className="py-2.5 px-3">Resolved Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-panel-border/60 text-gray-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">CASE-2026-1192</td>
                <td className="py-2.5 px-3 font-sans">Kavita Nair</td>
                <td className="py-2.5 px-3">{formatINR(72000)}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald/15 text-emerald border border-emerald/30">
                    APPROVED_RECOMMENDATION
                  </span>
                </td>
                <td className="py-2.5 px-3 text-gray-400">REVIEWER-04</td>
                <td className="py-2.5 px-3 text-gray-400">2026-09-27</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">CASE-2026-0924</td>
                <td className="py-2.5 px-3 font-sans">Vikram Seth</td>
                <td className="py-2.5 px-3">{formatINR(3100)}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber/15 text-amber border border-amber/30">
                    MODIFIED_RESOLUTION
                  </span>
                </td>
                <td className="py-2.5 px-3 text-gray-400">REVIEWER-02</td>
                <td className="py-2.5 px-3 text-gray-400">2026-09-26</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OmbudsmanDashboard;
