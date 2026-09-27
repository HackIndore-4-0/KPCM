import React from 'react';
import { ShieldCheck, AlertTriangle, Cpu, Gauge, Zap, CheckCircle2 } from 'lucide-react';
import { formatINR, formatTokens } from '../../lib/utils';

interface ConfidenceMeterProps {
  confidence?: number; // 0.0 to 1.0 or 0 to 100
  amount?: number;
  tokenUsage?: number;
  maxTokens?: number;
  consecutiveFailures?: number;
  maxFailures?: number;
  circuitBreakerTripped?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidence = 0.94,
  amount = 1499,
  tokenUsage = 3420,
  maxTokens = 50000,
  consecutiveFailures = 0,
  maxFailures = 3,
  circuitBreakerTripped = false,
}) => {
  // Normalize confidence to 0-100
  const normalizedConfidence = confidence <= 1.0 ? Math.round(confidence * 100) : Math.min(100, Math.round(confidence));
  const isHighValue = (amount || 0) > 50000;
  const isLowConfidence = normalizedConfidence < 75;
  const requiresHITL = isHighValue || isLowConfidence || circuitBreakerTripped;

  const getColor = () => {
    if (circuitBreakerTripped) return { text: 'text-terracotta', stroke: '#EF4444', bg: 'bg-terracotta/15', border: 'border-terracotta/40' };
    if (normalizedConfidence >= 85) return { text: 'text-emerald', stroke: '#10B981', bg: 'bg-emerald/15', border: 'border-emerald/40' };
    if (normalizedConfidence >= 75) return { text: 'text-amber', stroke: '#F59E0B', bg: 'bg-amber/15', border: 'border-amber/40' };
    return { text: 'text-terracotta', stroke: '#EF4444', bg: 'bg-terracotta/15', border: 'border-terracotta/40' };
  };

  const colorConfig = getColor();
  const tokenPercentage = Math.min(100, Math.round(((tokenUsage || 0) / (maxTokens || 50000)) * 100));

  return (
    <div className="rounded-2xl border border-panel-border bg-panel p-5 space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-3 border-b border-panel-border/80">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-cyan" />
          <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-white">
            Confidence & Risk Telemetry
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
          RBI TAT v2.1
        </span>
      </div>

      {/* Main Score Dial / Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-5 justify-between p-4 rounded-xl bg-obsidian border border-panel-border">
        {/* Circular Dial Representation */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#1A1F2C"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={colorConfig.stroke}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={(2 * Math.PI * 40) * (1 - normalizedConfidence / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className={`text-2xl font-black font-mono tracking-tight ${colorConfig.text}`}>
              {normalizedConfidence}%
            </span>
            <span className="text-[9px] font-mono text-gray-400 uppercase">Confidence</span>
          </div>
        </div>

        {/* Evaluation Summary */}
        <div className="flex-1 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Resolution Category:</span>
            <span className="font-semibold text-white font-mono">
              {normalizedConfidence >= 85 ? 'AUTONOMOUS CLEAR' : normalizedConfidence >= 75 ? 'REVIEW ADVISED' : 'MANUAL HITL'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Disputed Amount:</span>
            <span className={`font-semibold font-mono ${isHighValue ? 'text-amber' : 'text-white'}`}>
              {formatINR(amount)} {isHighValue && '(> ₹50,000 Cap)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Verification Source:</span>
            <span className="text-gray-300 font-mono text-[11px]">
              Tri-Party Consensus
            </span>
          </div>
        </div>
      </div>

      {/* HITL Notice Banner if applicable */}
      {requiresHITL && (
        <div className={`p-3 rounded-xl border ${colorConfig.bg} ${colorConfig.border} flex items-start gap-2.5`}>
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${colorConfig.text}`} />
          <div className="text-xs">
            <p className={`font-semibold ${colorConfig.text}`}>
              MANDATORY HUMAN-IN-THE-LOOP (HITL) ESCALATION
            </p>
            <p className="text-gray-300 text-[11px] mt-0.5">
              {circuitBreakerTripped
                ? 'Deterministic circuit breaker tripped. Execution safely halted to prevent runaway loops.'
                : isHighValue
                ? `Disputed amount (${formatINR(amount)}) exceeds the ₹50,000 autonomous payout threshold.`
                : `Confidence level (${normalizedConfidence}%) is below the 75% autonomous threshold.`}
            </p>
          </div>
        </div>
      )}

      {/* Safety & Token Budget Gauges */}
      <div className="space-y-3 pt-2">
        {/* Token Budget Gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400">Token Budget Cap (Safety Guardrail)</span>
            <span className="text-gray-300">
              {formatTokens(tokenUsage)} / {formatTokens(maxTokens)} ({tokenPercentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-obsidian overflow-hidden border border-panel-border">
            <div
              className={`h-full transition-all duration-500 ${
                tokenPercentage > 80 ? 'bg-terracotta' : tokenPercentage > 50 ? 'bg-amber' : 'bg-cyan'
              }`}
              style={{ width: `${tokenPercentage}%` }}
            />
          </div>
        </div>

        {/* Consecutive Failure Circuit Breaker Gauge */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-gray-400">Consecutive Tool Failures</span>
            <span className={consecutiveFailures > 0 ? 'text-amber font-semibold' : 'text-gray-300'}>
              {consecutiveFailures} / {maxFailures} Allowed
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: maxFailures }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full border border-panel-border transition-colors ${
                  i < consecutiveFailures ? 'bg-terracotta shadow-red-sm' : 'bg-obsidian'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceMeter;
