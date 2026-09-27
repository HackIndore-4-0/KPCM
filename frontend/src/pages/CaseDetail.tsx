import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Terminal,
  Scale,
  CheckCircle2,
  Clock,
  ArrowRight,
  GitPullRequest,
  CheckCheck,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useCaseStream } from '../hooks/useCaseStream';
import AgentDAGViewer from '../components/agentic-live/AgentDAGViewer';
import AgentTraceStream from '../components/agentic-live/AgentTraceStream';
import ConfidenceMeter from '../components/agentic-live/ConfidenceMeter';
import LedgerDiffTable from '../components/agentic-live/LedgerDiffTable';
import { formatINR } from '../lib/utils';
import { getCaseStatus, runAgentWorkflow } from '../lib/api';
import { Language, translations } from '../lib/translations';

interface CaseDetailProps {
  caseId: string;
  onNavigate: (tab: string, caseId?: string) => void;
  lang: Language;
}

export const CaseDetail: React.FC<CaseDetailProps> = ({ caseId, onNavigate, lang }) => {
  const t = translations[lang] || translations.en;
  const [activeTab, setActiveTab] = useState<'dag' | 'trace' | 'ledgers' | 'verdict'>('dag');
  const [isRetriggering, setIsRetriggering] = useState<boolean>(false);

  // Real-time SSE stream hook
  const {
    events,
    isStreaming,
    activeNode,
    completedNodes,
    haltedNode,
    haltEvent,
    breakerStatus,
    finalResolution,
    confidence,
    tokenUsage,
    clearEvents,
    reconnect,
  } = useCaseStream(caseId);

  // If stream is empty or finished, optionally fetch initial snapshot
  useEffect(() => {
    let isMounted = true;
    const loadSnapshot = async () => {
      try {
        const snap = await getCaseStatus(caseId);
        // Snapshot fetched if needed
      } catch (err) {
        // Backend might still be spinning up or case not yet persisted
      }
    };
    if (caseId && events.length === 0) {
      loadSnapshot();
    }
    return () => {
      isMounted = false;
    };
  }, [caseId]);

  const handleRetrigger = async () => {
    setIsRetriggering(true);
    clearEvents();
    try {
      await runAgentWorkflow(caseId, {
        complaint: `Re-executing investigation for case ${caseId} with fresh multi-ledger queries.`,
        max_consecutive_tool_failures: 3,
        max_token_budget: 50000,
        max_iterations: 10,
        demo_scenario: 'timeout',
      });
      reconnect();
    } catch (err) {
      console.error('Retrigger failed:', err);
    } finally {
      setIsRetriggering(false);
    }
  };

  // Derive status
  const isBreakerHalted = !!haltEvent || !!haltedNode;
  const isCompleted = !isStreaming && events.length > 0 && !isBreakerHalted;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner Bar */}
      <div className="p-5 rounded-2xl bg-panel border border-panel-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-obsidian border border-panel-border flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-mono text-white">{caseId}</h2>
              {isBreakerHalted ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-terracotta/20 text-terracotta border border-terracotta/40 animate-pulse">
                  CIRCUIT BREAKER HALTED
                </span>
              ) : isStreaming ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping" />
                  RECONCILIATION IN PROGRESS
                </span>
              ) : isCompleted ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald/15 text-emerald border border-emerald/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  INVESTIGATION CONCLUDED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-gray-800 text-gray-300">
                  READY
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Ref RRN: 408219482910 &bull; Disputed Amount: {formatINR(1499)} &bull; Swiggy UPI
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetrigger}
            disabled={isRetriggering || isStreaming}
            className="px-3.5 py-2 rounded-xl bg-obsidian hover:bg-panel-border border border-panel-border text-xs font-mono text-gray-300 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetriggering ? 'animate-spin' : ''}`} />
            <span>Re-run Investigation</span>
          </button>

          <button
            onClick={() => onNavigate('ombudsman')}
            className="px-3.5 py-2 rounded-xl bg-magenta/15 hover:bg-magenta/25 border border-magenta/40 text-xs font-mono text-magenta transition-colors flex items-center gap-2"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Ombudsman Desk</span>
          </button>
        </div>
      </div>

      {/* Circuit Breaker Alert Banner if Halted */}
      {isBreakerHalted && (
        <div className="p-4 rounded-2xl bg-terracotta/15 border border-terracotta/50 text-white space-y-2 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-terracotta shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-terracotta">
                  SAFETY GUARDRAIL TRIGGERED: SAFE_HALT EXECUTED
                </h4>
                <p className="text-xs text-gray-200 mt-0.5 font-sans">
                  The autonomous engine detected a potential runaway loop or exceeded threshold. All mutating actions are frozen.
                </p>
                {haltEvent && (
                  <div className="mt-2 p-2 rounded bg-black/60 border border-panel-border text-[11px] font-mono text-terracotta">
                    <span>Reason: {haltEvent.reason || haltEvent.trigger}</span> &bull;{' '}
                    <span>Consecutive Failures: {haltEvent.consecutive_failures || 3}</span> &bull;{' '}
                    <span>Tokens: {haltEvent.tokens_consumed || tokenUsage}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => onNavigate('ombudsman')}
              className="px-3 py-1.5 rounded-lg bg-terracotta text-white font-semibold text-xs shrink-0 hover:bg-terracotta/90 transition-colors"
            >
              Route to Ombudsman
            </button>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-panel-border pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dag')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'dag'
              ? 'bg-cyan/15 text-cyan border border-cyan/40 shadow-cyan-sm'
              : 'text-gray-400 hover:text-white hover:bg-panel'
          }`}
        >
          <GitPullRequest className="w-4 h-4" />
          <span>Interactive LangGraph DAG</span>
        </button>

        <button
          onClick={() => setActiveTab('trace')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'trace'
              ? 'bg-cyan/15 text-cyan border border-cyan/40 shadow-cyan-sm'
              : 'text-gray-400 hover:text-white hover:bg-panel'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Live Telemetry Console ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ledgers')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'ledgers'
              ? 'bg-cyan/15 text-cyan border border-cyan/40 shadow-cyan-sm'
              : 'text-gray-400 hover:text-white hover:bg-panel'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Tri-Party Ledger Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('verdict')}
          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'verdict'
              ? 'bg-emerald/15 text-emerald border border-emerald/40 shadow-emerald-sm'
              : 'text-gray-400 hover:text-white hover:bg-panel'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Final Verdict & Payout</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'dag' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AgentDAGViewer
              activeNode={activeNode}
              completedNodes={completedNodes}
              haltedNode={haltedNode}
              events={events}
            />
          </div>
          <div className="space-y-6">
            <ConfidenceMeter
              confidence={confidence}
              amount={1499}
              tokenUsage={tokenUsage}
              consecutiveFailures={haltEvent ? 3 : 0}
              circuitBreakerTripped={isBreakerHalted}
            />
            
            {/* Quick Trace Teaser */}
            <div className="p-4 rounded-2xl bg-panel border border-panel-border space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                <span>Latest Telemetry Event</span>
                <button
                  onClick={() => setActiveTab('trace')}
                  className="text-cyan hover:underline text-[11px]"
                >
                  View All &rarr;
                </button>
              </div>
              {events.length > 0 ? (
                <div className="p-2.5 rounded-lg bg-obsidian border border-panel-border text-xs text-gray-300 font-mono">
                  <div className="text-[10px] text-cyan font-semibold">
                    {events[events.length - 1].action || events[events.length - 1].node}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">
                    {events[events.length - 1].msg}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No events streamed yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trace' && (
        <div className="h-[640px]">
          <AgentTraceStream
            events={events}
            isStreaming={isStreaming}
            onClear={clearEvents}
          />
        </div>
      )}

      {activeTab === 'ledgers' && (
        <div className="space-y-6">
          <LedgerDiffTable
            caseId={caseId}
            rrn="408219482910"
            amount={1499}
          />
        </div>
      )}

      {activeTab === 'verdict' && (
        <div className="p-6 rounded-2xl bg-panel border border-panel-border space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Autonomous Resolution Determination
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Audit Hash: 0x8f7a29bc142e01938fae890124 &bull; Verified by Deterministic Policy
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald/20 text-emerald border border-emerald/50">
              REVERSAL AUTHORIZED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3 p-4 rounded-xl bg-obsidian border border-panel-border">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Reconciliation Findings
              </span>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald" />
                  <span>Sender CBS: Debit confirmed at 14:32:01 IST (₹1,499.00)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                  <span>NPCI Switch: Beneficiary timeout code U69 returned</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  <span>Merchant Gateway: Order expired unpaid (No credit received)</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-obsidian border border-panel-border">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                Statutory Execution Order
              </span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between text-gray-400">
                  <span>Action:</span>
                  <span className="text-cyan font-bold">EXECUTE_REVERSAL_TO_SENDER</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Refund Batch ID:</span>
                  <span className="text-white">REV-2026-9041-001</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>TAT Performance:</span>
                  <span className="text-emerald font-bold">1.28 Seconds (Sub-second)</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>RBI Rule Reference:</span>
                  <span className="text-gray-300">DPSS.CO.PD No.629 T+1 Reversal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald/10 border border-emerald/30 flex items-center justify-between text-xs">
            <span className="text-emerald font-medium">
              Customer account refunded. Confirmation SMS and cryptographic audit receipt sent.
            </span>
            <button
              onClick={() => onNavigate('submit')}
              className="px-4 py-2 rounded-lg bg-emerald text-black font-semibold text-xs hover:bg-emerald/90 transition-colors"
            >
              Process Another Case
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseDetail;
