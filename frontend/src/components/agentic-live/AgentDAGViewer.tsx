import React from 'react';
import { CheckCircle, Circle, RefreshCw, AlertCircle } from 'lucide-react';

interface AgentDAGViewerProps {
  currentNode?: string;
}

export const AgentDAGViewer: React.FC<AgentDAGViewerProps> = ({ currentNode = 'synthesizer' }) => {
  const nodes = [
    { id: 'ingestion', label: 'Ingestion & OCR' },
    { id: 'domain_router', label: 'Domain Router' },
    { id: 'probing_agents', label: 'Parallel Probing' },
    { id: 'conflict_arbiter', label: 'Conflict Arbiter' },
    { id: 'synthesizer', label: 'Resolution Synthesizer' },
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">LangGraph Execution DAG</span>
        <span className="text-xs text-blue-400 font-mono">Cyclic Graph Active</span>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
        {nodes.map((node, index) => {
          const isComplete = true; // For demo visualization
          return (
            <React.Fragment key={node.id}>
              <div className="flex flex-col items-center gap-1 min-w-[100px]">
                <div className="w-8 h-8 rounded-full border border-blue-500/40 bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[11px] text-slate-300 text-center font-medium">
                  {node.label}
                </span>
              </div>
              {index < nodes.length - 1 && (
                <div className="h-0.5 w-6 bg-slate-700 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
