import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { AgentTrace } from '../../types';

interface TraceStreamProps {
  traces: AgentTrace[];
  isStreaming: boolean;
}

export const TraceStream: React.FC<TraceStreamProps> = ({
  traces,
  isStreaming,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new entries arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [traces.length, isStreaming]);

  // Color & icon mappings based on state
  const getStatusIndicator = (trace: AgentTrace) => {
    const isError = trace.status === 'ERROR' || trace.action_type.includes('INTERRUPT') || trace.action_type.includes('FAIL');
    const isWarning = trace.status === 'WARNING' || trace.action_type.includes('TIMEOUT') || trace.content.includes('U69');
    const isSuccess = trace.status === 'SUCCESS' || trace.action_type.includes('ORDER') || trace.action_type.includes('VERIFIED');

    if (isError) {
      return {
        dotClass: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
        textClass: 'text-rose-200',
        badgeBg: 'bg-rose-500/10 border-rose-500/25 text-rose-300',
      };
    }
    if (isWarning) {
      return {
        dotClass: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]',
        textClass: 'text-amber-100',
        badgeBg: 'bg-amber-500/10 border-amber-500/25 text-amber-300',
      };
    }
    if (isSuccess) {
      return {
        dotClass: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
        textClass: 'text-emerald-100',
        badgeBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300',
      };
    }
    return {
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-200',
      badgeBg: 'bg-slate-800/60 border-slate-700/60 text-slate-300',
    };
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[320px] backdrop-blur-md transition-all">
      {/* Calm, trustworthy header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
            Autonomous Audit Trail
          </h3>
        </div>

        {isStreaming ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-medium">
              Verifying ledgers live...
            </span>
          </div>
        ) : (
          <span className="text-[11px] font-mono text-slate-500">
            {traces.length} Verification Steps Recorded
          </span>
        )}
      </div>

      {/* Stream body with Framer Motion item-by-item animation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
        {traces.length === 0 && !isStreaming ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Awaiting grievance submission to begin multi-bank audit.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {traces.map((trace, idx) => {
              const indicator = getStatusIndicator(trace);
              return (
                <motion.div
                  key={trace.id || `${trace.node_name}-${idx}`}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.008, x: 2 }}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:border-slate-700/80 transition-colors cursor-default"
                >
                  {/* Visual Status Dot */}
                  <span className="mt-1 flex-shrink-0">
                    <span className={`inline-block w-2 h-2 rounded-full ${indicator.dotClass}`} />
                  </span>

                  {/* Node & Action Badge */}
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold tracking-wide uppercase select-none ${indicator.badgeBg}`}
                  >
                    {trace.node_name}
                  </span>

                  {/* Clean Content */}
                  <span className={`flex-1 text-xs leading-relaxed font-sans ${indicator.textClass}`}>
                    {trace.content}
                  </span>

                  {/* Millisecond latency */}
                  {trace.latency_ms && (
                    <span className="text-[10px] text-slate-500 font-mono self-center select-none">
                      {trace.latency_ms}ms
                    </span>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* Honest "Thinking" Shimmer Load State */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/40 border border-slate-800/50"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-3/4 bg-slate-800 rounded animate-pulse" />
              <div className="h-2 w-1/2 bg-slate-800/60 rounded animate-pulse" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
