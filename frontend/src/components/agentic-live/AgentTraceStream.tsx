import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Download, Filter, Pause, Play, RefreshCw } from 'lucide-react';
import { TimelineEvent } from '../../lib/types';
import { formatTokens } from '../../lib/utils';

interface AgentTraceStreamProps {
  events: TimelineEvent[];
  isStreaming?: boolean;
  onClear?: () => void;
}

export const AgentTraceStream: React.FC<AgentTraceStreamProps> = ({
  events,
  isStreaming = false,
  onClear,
}) => {
  const [filterNode, setFilterNode] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new events arrive
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  const toggleExpand = (idx: number) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const filteredEvents = events.filter((ev) => {
    if (filterNode === 'ALL') return true;
    return ev.node?.toLowerCase() === filterNode.toLowerCase();
  });

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `finresolve-trace-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'SUCCESS' || s === 'COMPLETED' || s === 'VERIFIED') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald/15 text-emerald border border-emerald/30">
          SUCCESS
        </span>
      );
    }
    if (s.includes('HALT') || s.includes('BREAKER') || s.includes('CIRCUIT')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-terracotta/20 text-terracotta border border-terracotta/50 font-bold animate-pulse">
          BREAKER HALT
        </span>
      );
    }
    if (s === 'RUNNING' || s === 'IN_PROGRESS' || s === 'ACTIVE') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan/15 text-cyan border border-cyan/30">
          RUNNING
        </span>
      );
    }
    if (s === 'FAILED' || s === 'ERROR') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-terracotta/20 text-terracotta border border-terracotta/40">
          FAILED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gray-800 text-gray-300 border border-gray-700">
        {s || 'INFO'}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-panel-border bg-obsidian overflow-hidden">
      {/* Top Header Console Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-panel-border bg-panel">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan" />
          <span className="font-mono text-xs font-semibold text-white tracking-wide">
            LIVE AGENT TELEMETRY STREAM
          </span>
          {isStreaming ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-[10px] text-cyan font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping" />
              STREAMING
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-gray-400 font-mono">
              IDLE ({events.length} EVENTS)
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Node Filter */}
          <select
            value={filterNode}
            onChange={(e) => setFilterNode(e.target.value)}
            className="px-2 py-1 rounded bg-obsidian border border-panel-border text-[11px] font-mono text-gray-300 focus:outline-none focus:border-cyan"
          >
            <option value="ALL">All Nodes</option>
            <option value="triage">Triage</option>
            <option value="skeptic">Skeptic</option>
            <option value="evidence_gatherer">Evidence</option>
            <option value="conflict_arbiter">Arbiter</option>
            <option value="planner">Planner</option>
            <option value="validator">Validator</option>
            <option value="execute">Execute</option>
            <option value="safe_halt">Safe Halt</option>
            <option value="human_review">Human Review</option>
          </select>

          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded text-xs transition-colors ${
              autoScroll ? 'bg-cyan/15 text-cyan' : 'bg-white/5 text-gray-400'
            }`}
            title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
          >
            {autoScroll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Export JSON */}
          <button
            onClick={exportJSON}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-cyan transition-colors"
            title="Download JSON Telemetry"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stream Terminal Window */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2.5 bg-[#05060A]/95"
      >
        {filteredEvents.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-gray-500 space-y-2">
            <Terminal className="w-6 h-6 text-gray-600 animate-pulse" />
            <p className="text-xs">Awaiting agent workflow execution...</p>
            <p className="text-[11px] text-gray-600">Events will stream here in real-time</p>
          </div>
        ) : (
          filteredEvents.map((ev, idx) => {
            const isExpanded = expandedIndices.has(idx);
            const timeStr = ev.created_at
              ? new Date(ev.created_at).toLocaleTimeString()
              : `T+${idx * 150}ms`;

            return (
              <div
                key={idx}
                className="group p-2.5 rounded-lg border border-panel-border/80 bg-panel/40 hover:bg-panel hover:border-gray-700 transition-all"
              >
                {/* Event header line */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-500 text-[10px]">{timeStr}</span>
                    
                    {ev.node && (
                      <span className="px-2 py-0.5 rounded bg-cyan/10 border border-cyan/20 text-cyan text-[10px] font-semibold">
                        {ev.node}
                      </span>
                    )}

                    {ev.action && (
                      <span className="text-gray-300 text-[11px] font-medium">
                        {ev.action}
                      </span>
                    )}

                    {getStatusBadge(ev.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.token_usage !== undefined && (
                      <span className="text-[10px] text-gray-400">
                        {formatTokens(ev.token_usage)} tok
                      </span>
                    )}
                    
                    {ev.details && Object.keys(ev.details).length > 0 && (
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="text-gray-400 hover:text-white p-0.5"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Event message / rationale */}
                {ev.msg && (
                  <p className="mt-1.5 text-gray-300 text-[11px] leading-relaxed font-sans">
                    {ev.msg}
                  </p>
                )}

                {/* Expandable details json */}
                {isExpanded && ev.details && (
                  <div className="mt-2.5 p-2 rounded bg-black/60 border border-panel-border text-[10px] text-cyan overflow-x-auto">
                    <pre>{JSON.stringify(ev.details, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="px-4 py-2 border-t border-panel-border bg-panel flex items-center justify-between text-[11px] font-mono text-gray-400">
        <div className="flex items-center gap-3">
          <span>Total Logs: {events.length}</span>
          <span>&bull;</span>
          <span className="text-emerald">Strict Output Guardrails Active</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Zero Chain-of-Thought Leaks</span>
        </div>
      </div>
    </div>
  );
};

export default AgentTraceStream;
