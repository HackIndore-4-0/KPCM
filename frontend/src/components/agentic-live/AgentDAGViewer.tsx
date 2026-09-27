import React, { useState } from 'react';
import { 
  Scan, 
  GitBranch, 
  Network, 
  SearchCode, 
  Scale, 
  FileCheck2, 
  UserCog, 
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { sound } from '../../lib/audio';

interface NodeInfo {
  id: string;
  name: string;
  subtitle: string;
  icon: any;
  category: 'core' | 'parallel' | 'decision' | 'terminal';
  inputSchema: string;
  outputSchema: string;
  description: string;
}

const NODES_METADATA: NodeInfo[] = [
  {
    id: 'ingestion',
    name: 'Ingestion & OCR',
    subtitle: 'PII Scrubbing & NER',
    icon: Scan,
    category: 'core',
    inputSchema: '{ complaint_text: str, evidence_urls: list[str] }',
    outputSchema: '{ extracted_entities: { utr, amount, bank, merchant } }',
    description: 'Parses dispute screenshot via OCR, sanitizes sensitive citizen PII, and validates Pydantic entity schema.',
  },
  {
    id: 'domain_router',
    name: 'Domain Router',
    subtitle: 'Intent & Rule Mapping',
    icon: GitBranch,
    category: 'core',
    inputSchema: '{ extracted_entities: dict }',
    outputSchema: '{ domain: "DIGITAL_PAYMENTS_UPI", confidence: 0.98 }',
    description: 'Classifies dispute into regulatory domain and binds applicable RBI / NPCI turnaround guidelines.',
  },
  {
    id: 'dependency_mapper',
    name: 'Topology Mapper',
    subtitle: 'Stakeholder Graph',
    icon: Network,
    category: 'core',
    inputSchema: '{ domain: str, extracted_entities: dict }',
    outputSchema: '{ stakeholders: ["BANK_CBS", "NPCI_SWITCH", "MERCHANT_PG"] }',
    description: 'Calculates the directed graph of financial institutions and gateways implicated in this transaction.',
  },
  {
    id: 'probing_agents',
    name: 'Parallel Probing',
    subtitle: 'Async Core Banking & Switch',
    icon: SearchCode,
    category: 'parallel',
    inputSchema: '{ stakeholders: list, utr: str, txn_id: str }',
    outputSchema: '{ ledger_records: [ BankCBS, NPCISwitch, MerchantPG ] }',
    description: 'Forks 3 concurrent asynchronous API probes with exponential backoff to gather raw ledger telemetry.',
  },
  {
    id: 'conflict_arbiter',
    name: 'Conflict Arbiter',
    subtitle: 'Ledger Discrepancy Matrix',
    icon: Scale,
    category: 'decision',
    inputSchema: '{ ledger_records: list[LedgerRecord] }',
    outputSchema: '{ conflict_detected: bool, root_cause: str, confidence: float }',
    description: 'Computes multi-system reconciliation matrix. Detects asymmetric drops (e.g. U69 timeout vs debited funds).',
  },
  {
    id: 'synthesizer',
    name: 'Resolution Synthesizer',
    subtitle: 'Autonomous Order Generator',
    icon: FileCheck2,
    category: 'terminal',
    inputSchema: '{ conflict_details: str, regulatory_basis: str }',
    outputSchema: '{ final_resolution: { verdict, actionable_order, compensation } }',
    description: 'Issues binding restitution directive under RBI Circular DPSS.1164 with automated statutory penalty accrual.',
  },
  {
    id: 'hitl_gate',
    name: 'Ombudsman HITL Gate',
    subtitle: 'Human Checkpoint',
    icon: UserCog,
    category: 'terminal',
    inputSchema: '{ requires_human_escalation: true, risk_factors: list }',
    outputSchema: '{ ombudsman_verdict: "APPROVED" | "ESCALATED" }',
    description: 'Deterministic safety boundary triggered if claim > ₹50,000 or confidence < 80%. Freezes state for human sign-off.',
  },
  {
    id: 'replanner',
    name: 'Dynamic Replanner',
    subtitle: 'Cyclic Feedback Loop',
    icon: RotateCcw,
    category: 'core',
    inputSchema: '{ failed_probe: "CBS_TIMEOUT", iteration_count: 1 }',
    outputSchema: '{ retry_strategy: "QUERY_CENTRAL_CLEARING_CYCLE" }',
    description: 'Cyclic LangGraph node that dynamically re-routes failed probes or ambiguous identifiers before escalation.',
  },
];

interface AgentDAGViewerProps {
  currentNode?: string;
  isConflict?: boolean;
  isHITL?: boolean;
  isStreaming?: boolean;
}

export const AgentDAGViewer: React.FC<AgentDAGViewerProps> = ({
  currentNode = 'synthesizer',
  isConflict = true,
  isHITL = false,
  isStreaming = false,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('conflict_arbiter');

  const selectedNode = NODES_METADATA.find((n) => n.id === selectedNodeId) || NODES_METADATA[4];

  const handleNodeClick = (nodeId: string) => {
    sound.playTick();
    setSelectedNodeId(nodeId);
  };

  const getNodeState = (nodeId: string) => {
    if (isStreaming) {
      if (nodeId === currentNode) return 'active';
      return 'completed';
    }
    if (nodeId === 'hitl_gate') {
      return isHITL ? 'escalated' : 'bypassed';
    }
    if (nodeId === 'synthesizer') {
      return isHITL ? 'bypassed' : 'completed';
    }
    if (nodeId === 'conflict_arbiter' && isConflict) {
      return 'conflict';
    }
    if (nodeId === 'replanner') {
      return 'cyclic';
    }
    return 'completed';
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 space-y-4 backdrop-blur-md shadow-xl transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              LangGraph Autonomous State Machine
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-400 border border-blue-500/30 font-mono">
                Cyclic State Graph
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic routing logic with parallel probing and HITL safety boundary
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-slate-300 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Node: <span className="text-cyan-400 font-bold">{currentNode}</span>
          </span>
        </div>
      </div>

      {/* Visual DAG Flow Chart */}
      <div className="relative py-4 px-2 overflow-x-auto">
        <div className="min-w-[680px]">
          {/* Main Pipeline Row */}
          <div className="grid grid-cols-5 gap-3 items-center">
            {NODES_METADATA.slice(0, 5).map((node, index) => {
              const state = getNodeState(node.id);
              const isSelected = selectedNodeId === node.id;
              const Icon = node.icon;

              let borderClass = 'border-slate-800 bg-slate-950/70 text-slate-400';
              let badgeColor = 'bg-slate-800 text-slate-400';

              if (state === 'active') {
                borderClass = 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-glow-cyan animate-pulse';
                badgeColor = 'bg-cyan-500/20 text-cyan-300';
              } else if (state === 'conflict') {
                borderClass = 'border-amber-500/80 bg-amber-950/30 text-amber-300 shadow-glow-amber';
                badgeColor = 'bg-amber-500/20 text-amber-300';
              } else if (state === 'completed') {
                borderClass = 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
                badgeColor = 'bg-emerald-500/20 text-emerald-300';
              }

              return (
                <div key={node.id} className="relative flex flex-col items-center">
                  <button
                    onClick={() => handleNodeClick(node.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all relative group cursor-pointer ${borderClass} ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950' : 'hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/50 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-slate-200" />
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${badgeColor}`}>
                        Step {index + 1}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-white truncate">{node.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{node.subtitle}</div>
                  </button>

                  {/* Connecting Arrow between sequential nodes */}
                  {index < 4 && (
                    <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <div className="w-4 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400 animate-data-stream" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Conditional Branching Fork after Conflict Arbiter */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-12 gap-3 items-center">
            <div className="col-span-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Arbitration Branching Logic
              </span>
              <span className="text-[10px] text-slate-500">Evaluates Risk &amp; Confidence</span>
            </div>

            {/* Synthesizer Node (Standard Auto-Resolution Branch) */}
            <div className="col-span-4">
              {(() => {
                const node = NODES_METADATA[5]; // synthesizer
                const state = getNodeState('synthesizer');
                const isSelected = selectedNodeId === 'synthesizer';
                const Icon = node.icon;
                return (
                  <button
                    onClick={() => handleNodeClick('synthesizer')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      state === 'completed'
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 shadow-glow-emerald'
                        : 'border-slate-800/60 bg-slate-950/40 text-slate-500 opacity-60'
                    } ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">Synthesizer</div>
                          <div className="text-[10px] text-emerald-400 font-mono">Confidence &ge; 80% (Auto-Order)</div>
                        </div>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  </button>
                );
              })()}
            </div>

            {/* HITL Gate Node (High Value / Low Confidence Branch) */}
            <div className="col-span-4">
              {(() => {
                const node = NODES_METADATA[6]; // hitl_gate
                const state = getNodeState('hitl_gate');
                const isSelected = selectedNodeId === 'hitl_gate';
                const Icon = node.icon;
                return (
                  <button
                    onClick={() => handleNodeClick('hitl_gate')}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isHITL
                        ? 'border-rose-500 bg-rose-950/30 text-rose-300 shadow-glow-rose animate-pulse'
                        : 'border-slate-800/60 bg-slate-950/40 text-slate-500 opacity-60'
                    } ${isSelected ? 'ring-2 ring-rose-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-rose-400" />
                        <div>
                          <div className="text-xs font-semibold text-white">HITL Gatekeeper</div>
                          <div className="text-[10px] text-rose-400 font-mono">&gt;₹50k or Conf &lt;80%</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                        {isHITL ? 'INTERRUPT' : 'STANDBY'}
                      </span>
                    </div>
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Cyclic Edge Callout */}
          <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-300">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>
                <strong>Cyclic Self-Healing Edge:</strong> If bank API times out, Replanner triggers retry loop without breaking state.
              </span>
            </div>
            <button
              onClick={() => handleNodeClick('replanner')}
              className="text-cyan-400 hover:underline font-mono text-[10px]"
            >
              Inspect Replanner Node &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Selected Node Deep-Dive Inspector (Glass-Box Inspection for Judges) */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Glass-Box Node Inspector: <span className="text-cyan-400 font-mono">{selectedNode.name}</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Node ID: {selectedNode.id}
          </span>
        </div>

        <p className="text-slate-300 text-[11px] leading-relaxed">
          {selectedNode.description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
            <span className="text-slate-400 block mb-0.5">Input State Signature:</span>
            <code className="text-blue-300 block truncate">{selectedNode.inputSchema}</code>
          </div>
          <div className="p-2 rounded bg-slate-900/80 border border-slate-800/80">
            <span className="text-slate-400 block mb-0.5">Pydantic Output Contract:</span>
            <code className="text-emerald-300 block truncate">{selectedNode.outputSchema}</code>
          </div>
        </div>
      </div>
    </div>
  );
};
