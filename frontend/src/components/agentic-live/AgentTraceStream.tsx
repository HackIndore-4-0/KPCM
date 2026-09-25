import React from 'react';
import { Terminal } from 'lucide-react';
import { TraceEvent } from '../../hooks/useDisputeStream';

interface AgentTraceStreamProps {
  traces: TraceEvent[];
  isStreaming: boolean;
}

export const AgentTraceStream: React.FC<AgentTraceStreamProps> = ({ traces, isStreaming }) => {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 h-[260px] overflow-y-auto">
      <div className="flex items-center justify-between text-slate-500 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          <span>Autonomous Agent Telemetry Stream</span>
        </div>
        {isStreaming && (
          <span className="flex items-center gap-1.5 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Live SSE
          </span>
        )}
      </div>

      <div className="space-y-1.5 pt-1">
        {traces.length === 0 ? (
          <div className="text-slate-600 italic py-4 text-center">
            Waiting for dispute submission to initiate live agent traces...
          </div>
        ) : (
          traces.map((trace, idx) => (
            <div key={idx} className="leading-relaxed flex items-start gap-2">
              <span className="text-blue-400 select-none">[{trace.node}]</span>
              <span className="text-slate-400 select-none">({trace.action})</span>
              <span className="text-slate-200">{trace.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
