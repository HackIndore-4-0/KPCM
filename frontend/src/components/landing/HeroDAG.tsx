import React, { useState, useEffect } from 'react';
import { Shield, Building2, Network, ShoppingBag, GitMerge, CheckCircle, ArrowRight, Zap, AlertTriangle } from 'lucide-react';

interface HeroDAGProps {
  onExploreClick?: () => void;
}

export const HeroDAG: React.FC<HeroDAGProps> = ({ onExploreClick }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'intake',
      title: 'Citizen Intake',
      subtitle: 'NL NLP Complaint Extraction',
      icon: Shield,
      color: 'text-cyan',
      border: 'border-cyan/50',
      bg: 'bg-cyan/10',
      glow: 'shadow-cyan-sm',
      detail: 'Validates RRN, amount (₹1,499), timestamp, and citizen grievance claim',
    },
    {
      id: 'cbs',
      title: 'Bank CBS Query',
      subtitle: 'Core Banking Ledger Check',
      icon: Building2,
      color: 'text-emerald',
      border: 'border-emerald/50',
      bg: 'bg-emerald/10',
      glow: 'shadow-emerald-sm',
      detail: 'Confirmed DEBIT of ₹1,499.00 with Auth code 204891 at 14:32:01 IST',
    },
    {
      id: 'npci',
      title: 'NPCI Switch Telemetry',
      subtitle: 'Central Switch Reconciliation',
      icon: Network,
      color: 'text-amber',
      border: 'border-amber/50',
      bg: 'bg-amber/10',
      glow: 'shadow-amber-sm',
      detail: 'Asymmetric Timeout U69 detected. Response packet lost before beneficiary CBS',
    },
    {
      id: 'pg',
      title: 'Merchant Gateway',
      subtitle: 'PayU / Razorpay Settlement',
      icon: ShoppingBag,
      color: 'text-magenta',
      border: 'border-magenta/50',
      bg: 'bg-magenta/10',
      glow: 'shadow-magenta-sm',
      detail: 'Merchant order status: UNPAID (No incoming credit acknowledged)',
    },
    {
      id: 'arbiter',
      title: 'Conflict Arbiter',
      subtitle: 'Deterministic Action Allowlist',
      icon: GitMerge,
      color: 'text-cyan',
      border: 'border-cyan/60',
      bg: 'bg-cyan/15',
      glow: 'shadow-cyan-md',
      detail: 'Tri-party mismatch verified. Autonomous INSTANT_REVERSAL authorized in 1.2s',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="w-full relative rounded-2xl border border-panel-border bg-panel/70 backdrop-blur-md p-6 lg:p-8 overflow-hidden">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-panel-border/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan animate-pulse" />
          <div>
            <h3 className="text-white font-mono font-semibold text-sm tracking-wide flex items-center gap-2">
              AUTONOMOUS TRI-PARTY RECONCILIATION DAG
              <span className="text-[10px] text-cyan px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/30">
                LIVE SIMULATION
              </span>
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              Deterministic state traversal across simulated financial institutions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-gray-400">Step {activeStep + 1} of 5</span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === activeStep ? 'bg-cyan w-5' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* DAG Visualization Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStep;
          const isPassed = idx < activeStep;

          return (
            <div
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className={`cursor-pointer rounded-xl p-4 transition-all duration-300 relative border ${
                isActive
                  ? `${step.bg} ${step.border} ${step.glow} scale-[1.02]`
                  : isPassed
                  ? 'bg-panel/40 border-panel-border hover:border-gray-600'
                  : 'bg-panel/20 border-panel-border/40 opacity-60 hover:opacity-80'
              }`}
            >
              {/* Connector arrow for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-20">
                  <ArrowRight
                    className={`w-4 h-4 transition-colors ${
                      isActive || isPassed ? 'text-cyan' : 'text-gray-700'
                    }`}
                  />
                </div>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-gray-400">0{idx + 1}</span>
                <div className={`p-1.5 rounded-lg ${isActive ? step.bg : 'bg-white/5'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? step.color : 'text-gray-400'}`} />
                </div>
              </div>

              <h4 className="text-white text-xs font-semibold tracking-tight">{step.title}</h4>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">{step.subtitle}</p>

              {isActive && (
                <div className="mt-3 pt-2 border-t border-white/10">
                  <p className="text-[11px] text-gray-200 leading-tight">{step.detail}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active step summary callout */}
      <div className="mt-6 p-4 rounded-xl bg-obsidian border border-panel-border relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-cyan shrink-0 mt-0.5 animate-bounce" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-cyan">
                ACTIVE TELEMETRY: {steps[activeStep].title.toUpperCase()}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
                Latency: 24ms
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1">{steps[activeStep].detail}</p>
          </div>
        </div>

        {onExploreClick && (
          <button
            onClick={onExploreClick}
            className="shrink-0 px-4 py-2 rounded-lg bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <span>Launch Interactive Case</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Trust Badges */}
      <div className="mt-6 pt-4 border-t border-panel-border/60 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-gray-400 relative z-10">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald" />
          <span>RBI Master Direction Compliant (TAT &le; 24h)</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-cyan" />
          <span>Multi-Ledger Cryptographic Audit Trail</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber" />
          <span>Deterministic Circuit Breakers (Budget &lt; 50k tokens)</span>
        </div>
      </div>
    </div>
  );
};

export default HeroDAG;
