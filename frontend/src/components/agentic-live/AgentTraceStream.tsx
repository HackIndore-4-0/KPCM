import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Download, Search, Filter, AlertTriangle, ShieldAlert } from 'lucide-react';
import { AgentTrace } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/audio';

interface AgentTraceStreamProps {
  traces: AgentTrace[];
  isStreaming: boolean;
}

export const AgentTraceStream: React.FC<AgentTraceStreamProps> = ({
  traces,
  isStreaming,
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'ALL' | 'DECISION' | 'TOOL_CALL' | 'WARNING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [traces, autoScroll]);

  const handleCopy = () => {
    const rawText = traces
      .map((t) => `[${t.node_name}] (${t.action_type}) ${t.content}`)
      .join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    sound.playTick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(traces, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `finresolve_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    sound.playTick();
  };

  const filteredTraces = traces.filter((t) => {
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'DECISION' && (t.action_type.includes('ORDER') || t.action_type.includes('ARBITRATION') || t.action_type.includes('CLASSIFIED'))) ||
      (filter === 'TOOL_CALL' && (t.action_type.includes('QUERY') || t.action_type.includes('PROBE') || t.action_type.includes('CBS') || t.action_type.includes('OCR'))) ||
      (filter === 'WARNING' && (t.status === 'WARNING' || t.status === 'ERROR' || t.action_type.includes('INTERRUPT') || t.action_type.includes('CIRCUIT_BREAKER') || t.content.includes('U69')));

    const matchesSearch =
      searchQuery.trim() === '' ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.node_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.action_type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div id="telemetry-stream" className="qronos-card rounded-3xl p-5 font-mono text-xs text-earth-300 shadow-earth-lg flex flex-col h-[340px] transition-all">
      {/* Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-earth-750 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-bronze-400" />
          <span className="font-semibold text-earth-100 text-xs tracking-wide">
            {t('telemetryTitle')}
          </span>
          {isStreaming ? (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-bronze-500/15 text-bronze-300 border border-bronze-500/30 text-[10px] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-bronze-400 animate-ping" />
              Live SSE Telemetry
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-earth-900 text-earth-400 border border-earth-750 text-[10px]">
              {traces.length} Consensus Cycles
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-earth-900 hover:bg-earth-800 text-earth-300 border border-earth-750 transition-colors text-[11px] cursor-pointer"
            title="Copy audit stream"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-earth-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-earth-900 hover:bg-earth-800 text-earth-300 border border-earth-750 transition-colors text-[11px] cursor-pointer"
            title="Export JSON audit payload"
          >
            <Download className="w-3 h-3 text-earth-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-earth-800 text-[11px]">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-earth-500 mr-1" />
          {(['ALL', 'TOOL_CALL', 'DECISION', 'WARNING'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                sound.playTick();
                setFilter(mode);
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors cursor-pointer ${
                filter === mode
                  ? 'bg-bronze-500/20 text-bronze-300 border border-bronze-500/40'
                  : 'text-earth-400 hover:text-earth-200 hover:bg-earth-850'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="relative flex items-center">
          <Search className="w-3 h-3 text-earth-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search telemetry..."
            className="bg-earth-900 border border-earth-750 rounded-full pl-7 pr-3 py-1 text-[10px] text-earth-200 placeholder-earth-500 focus:outline-none focus:border-bronze-500 w-36 sm:w-44 transition-all"
          />
        </div>
      </div>

      {/* Log Stream */}
      <div className="flex-1 overflow-y-auto space-y-1.5 py-2 px-1 text-earth-300 select-text">
        {filteredTraces.length === 0 ? (
          <div className="text-earth-500 italic py-8 text-center text-xs">
            Initiate dispute resolution audit to stream live multi-agent reasoning steps...
          </div>
        ) : (
          filteredTraces.map((trace, idx) => {
            const isBreakerTrip = trace.action_type === 'CIRCUIT_BREAKER_TRIPPED' || trace.node_name === 'circuit_breaker';

            if (isBreakerTrip) {
              return (
                <div
                  key={idx}
                  className="my-2 p-3 rounded-xl bg-rose-950/60 border border-rose-600/80 text-rose-200 text-[11px] shadow-lg flex flex-col gap-1.5 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-rose-400">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      CIRCUIT BREAKER TRIPPED
                    </span>
                    <span className="text-[10px] font-semibold bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded-full border border-rose-500/40">
                      SAFE HALT & ESCALATE
                    </span>
                  </div>
                  <p className="text-earth-200 leading-relaxed font-sans">{trace.content}</p>
                  {trace.metadata && (
                    <div className="flex flex-wrap gap-3 text-[10px] font-mono text-rose-300/90 pt-1 border-t border-rose-800/60">
                      <span>Trigger: <strong>{trace.metadata.trigger || 'SAFETY_POLICY'}</strong></span>
                      <span>Threshold: <strong>{trace.metadata.threshold ?? 4}</strong></span>
                      <span>Observed: <strong>{trace.metadata.observed ?? 4}</strong></span>
                      <span>Node: <strong>{trace.node_name}</strong></span>
                    </div>
                  )}
                </div>
              );
            }

            let statusColor = 'text-earth-300';
            let badgeBg = 'bg-earth-900 text-earth-400 border-earth-750';

            if (trace.status === 'WARNING' || trace.action_type.includes('TIMEOUT') || trace.content.includes('U69')) {
              statusColor = 'text-bronze-300';
              badgeBg = 'bg-bronze-950/40 text-bronze-300 border-bronze-700/60';
            } else if (trace.status === 'ERROR' || trace.action_type.includes('INTERRUPT') || trace.action_type.includes('FAIL')) {
              statusColor = 'text-rose-300';
              badgeBg = 'bg-rose-950/40 text-rose-300 border-rose-700/60';
            } else if (trace.status === 'SUCCESS' || trace.action_type.includes('ORDER')) {
              statusColor = 'text-emerald-300';
              badgeBg = 'bg-emerald-950/40 text-emerald-300 border-emerald-700/60';
            }

            return (
              <div
                key={idx}
                className="leading-relaxed flex items-start gap-2 p-1 rounded-lg hover:bg-earth-900/60 transition-colors group"
              >
                <span className="text-[10px] text-earth-500 font-mono select-none pt-0.5">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="text-bronze-400 font-semibold select-none whitespace-nowrap">
                  [{trace.node_name}]
                </span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full border font-mono select-none ${badgeBg} whitespace-nowrap`}>
                  {trace.action_type}
                </span>
                <span className={`flex-1 break-words ${statusColor}`}>
                  {trace.content}
                </span>
                {trace.latency_ms && (
                  <span className="text-[10px] text-earth-500 font-mono select-none opacity-60 group-hover:opacity-100">
                    {trace.latency_ms}ms
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-earth-800 flex items-center justify-between text-[10px] text-earth-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Deterministic Zero-Hallucination Protocol Active
        </span>
        <label className="flex items-center gap-1 cursor-pointer select-none text-earth-400 hover:text-earth-200">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="rounded border-earth-700 bg-earth-900 text-bronze-500 focus:ring-0 w-3 h-3"
          />
          Auto-scroll
        </label>
      </div>
    </div>
  );
};
