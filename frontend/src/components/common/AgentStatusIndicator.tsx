import React, { useState } from 'react';
import { Wifi, WifiOff, Radio, X, Cpu } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/audio';

export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'HITL_PAUSED';

interface AgentStatusIndicatorProps {
  status: AgentStatus;
  setStatus: (status: AgentStatus) => void;
  latencyMs?: number;
}

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  status,
  setStatus,
  latencyMs = 24,
}) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const toggleStatus = () => {
    sound.playTick();
    const nextStatus: AgentStatus = status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    setStatus(nextStatus);
    if (nextStatus === 'ONLINE') {
      sound.playSuccessChime();
    } else {
      sound.playAlert();
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'ONLINE':
        return {
          label: t('agentActive'),
          dotColor: 'bg-emerald-400',
          ringColor: 'bg-emerald-400/80',
          textColor: 'text-emerald-300',
          borderColor: 'border-emerald-500/30',
          bgBadge: 'bg-emerald-950/20 hover:bg-emerald-950/40',
          glowShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]',
          icon: Wifi,
        };
      case 'OFFLINE':
        return {
          label: t('agentOffline'),
          dotColor: 'bg-rose-500',
          ringColor: 'bg-rose-500/80',
          textColor: 'text-rose-300',
          borderColor: 'border-rose-500/30',
          bgBadge: 'bg-rose-950/20 hover:bg-rose-950/40',
          glowShadow: 'shadow-[0_0_15px_rgba(244,63,94,0.25)]',
          icon: WifiOff,
        };
      case 'HITL_PAUSED':
        return {
          label: t('agentHitl'),
          dotColor: 'bg-amber-400',
          ringColor: 'bg-amber-400/80',
          textColor: 'text-amber-300',
          borderColor: 'border-amber-500/30',
          bgBadge: 'bg-amber-950/20 hover:bg-amber-950/40',
          glowShadow: 'shadow-[0_0_15px_rgba(245,158,11,0.25)]',
          icon: Radio,
        };
    }
  };

  const cfg = getStatusConfig();
  const StatusIcon = cfg.icon;

  return (
    <>
      {/* Blinking Live Agent Button */}
      <button
        type="button"
        onClick={() => {
          sound.playTick();
          setShowModal(true);
        }}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium transition-all duration-300 backdrop-blur-md cursor-pointer ${cfg.borderColor} ${cfg.bgBadge} ${cfg.glowShadow}`}
        title="Inspect Engine State & Connectivity"
      >
        {/* Animated Radar Pulse Ring */}
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status === 'ONLINE' ? 'animate-ping-subtle' : status === 'HITL_PAUSED' ? 'animate-pulse' : ''
            } ${cfg.ringColor}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dotColor} ${
              status === 'ONLINE' ? 'shadow-[0_0_8px_#34d399]' : ''
            }`}
          />
        </span>

        {/* Status Text & Execution Latency */}
        <span className={`text-[11px] font-semibold tracking-wider ${cfg.textColor}`}>
          {cfg.label}
        </span>

        {status === 'ONLINE' && (
          <span className="text-[10px] text-earth-400 font-normal pl-1.5 border-l border-earth-700 hidden sm:inline">
            {latencyMs}ms
          </span>
        )}
      </button>

      {/* Modal View for Health Telemetry */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-earth-850 border border-earth-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-earth-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-earth-400 hover:text-earth-100 p-1.5 rounded-lg bg-earth-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-earth-750 pb-3">
              <div className={`p-2 rounded-xl border ${cfg.borderColor} ${cfg.bgBadge}`}>
                <StatusIcon className={`w-5 h-5 ${cfg.textColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-earth-100">
                  Arbitration Consensus Engine Health
                </h3>
                <span className="text-[10px] font-mono text-earth-400">
                  LangGraph Autonomous State Machine Telemetry
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs font-mono">
              <div className="p-3 rounded-xl bg-earth-900 border border-earth-750">
                <span className="text-earth-400 block text-[10px]">Uptime SLA</span>
                <span className="text-emerald-400 font-bold text-xs">99.98% High-Avail</span>
              </div>
              <div className="p-3 rounded-xl bg-earth-900 border border-earth-750">
                <span className="text-earth-400 block text-[10px]">P95 Execution Latency</span>
                <span className="text-bronze-400 font-bold text-xs">{latencyMs} ms</span>
              </div>
              <div className="p-3 rounded-xl bg-earth-900 border border-earth-750">
                <span className="text-earth-400 block text-[10px]">Consensus Probes</span>
                <span className="text-earth-100 font-bold text-xs">3 Institutions</span>
              </div>
              <div className="p-3 rounded-xl bg-earth-900 border border-earth-750">
                <span className="text-earth-400 block text-[10px]">Self-Healing Engine</span>
                <span className="text-emerald-400 font-bold text-xs">Cyclic Loop ON</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-earth-900 border border-earth-750 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-earth-100 block">
                    Fault-Tolerance Simulation
                  </span>
                  <span className="text-[10px] text-earth-400">
                    Simulate network partition to evaluate fallback resilience
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleStatus}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-all border ${
                    status === 'ONLINE'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                      : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
                  }`}
                >
                  {status === 'ONLINE' ? 'Simulate Drop' : 'Restore Online'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-earth-800 hover:bg-earth-750 text-earth-200 text-xs font-medium transition-colors"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
