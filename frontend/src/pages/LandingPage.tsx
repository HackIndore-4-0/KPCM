import React from 'react';
import { ArrowRight, ShieldCheck, Zap, GitFork, Scale, Activity, Lock, CheckCircle2 } from 'lucide-react';
import HeroDAG from '../components/landing/HeroDAG';
import { Language, translations } from '../lib/translations';

interface LandingPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
  lang: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, lang }) => {
  const t = translations[lang] || translations.en;

  const capabilityIndicators = [
    { label: 'Token Safety Ceiling', value: '10K TOKENS', sub: 'Authoritative Safety Budget' },
    { label: 'Circuit Breaker Guard', value: '4 FAILURES', sub: 'Deterministic Safe-Halt' },
    { label: 'Telemetry Stream', value: 'REAL-TIME SSE', sub: 'Live Event Tracing' },
    { label: 'Observability & Oversight', value: 'OPENTELEMETRY', sub: 'Human-in-the-Loop Review' },
  ];

  const features = [
    {
      icon: GitFork,
      title: 'Tri-Party Multi-Ledger Arbitration',
      desc: 'Simultaneously cross-checks Core Banking System (CBS), NPCI central switches, and Merchant Payment Gateways in a synthetic banking environment to pinpoint asymmetric packet drops (U69 timeouts).',
      badge: 'Synthetic Sandbox',
      color: 'text-cyan',
    },
    {
      icon: Lock,
      title: 'Deterministic Action Allowlist',
      desc: 'Restricts agent recommendations to pre-approved banking actions: RECOMMEND_REVERSAL, REQUEST_EVIDENCE, or HUMAN_ESCALATION. Closed allowlist prevents unauthorized side-effects.',
      badge: 'Allowlist Guard',
      color: 'text-emerald',
    },
    {
      icon: Activity,
      title: 'Runaway-Loop Circuit Breaker',
      desc: 'Enforces hardware safety: halts execution on 4 consecutive tool failures, iteration caps (10), or token budget exhaustion (10,000 tokens). Safely degrades into human review.',
      badge: 'Safety Enforcement',
      color: 'text-amber',
    },
    {
      icon: Scale,
      title: 'Human-in-the-Loop Governance',
      desc: 'High-value claims (> ₹50,000), circuit breaker trips, or low-confidence determinations are routed to the human oversight queue with complete OpenTelemetry audit trails.',
      badge: 'Decision-Support',
      color: 'text-magenta',
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-14 text-center max-w-4xl mx-auto px-4">
        {/* Glowing cyber aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono mb-6 shadow-cyan-sm">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          <span>DECISION-SUPPORT PROTOTYPE &bull; SYNTHETIC BANKING SANDBOX</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Resolve Complex Financial Grievances. <br />
          <span className="bg-gradient-to-r from-cyan via-blue-400 to-magenta bg-clip-text text-transparent">
            With Explainable AI.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Prototype agentic decision-support system for complex financial grievances using synthetic banking data, OpenTelemetry observability, deterministic circuit breakers, and human oversight for consequential decisions.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('submit')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-blue-500 text-black font-semibold text-sm hover:opacity-95 transition-all shadow-cyan-md flex items-center gap-2"
          >
            <span>Submit Demo Grievance</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('case', 'CASE-2026-9041')}
            className="px-6 py-3 rounded-xl bg-panel hover:bg-panel-border border border-cyan/30 text-cyan font-mono text-sm transition-all flex items-center gap-2 shadow-cyan-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Launch Live Investigation</span>
          </button>

          <button
            onClick={() => onNavigate('ombudsman')}
            className="px-5 py-3 rounded-xl bg-panel hover:bg-panel-border border border-panel-border text-gray-300 hover:text-white font-mono text-sm transition-all flex items-center gap-2"
          >
            <Scale className="w-4 h-4 text-magenta" />
            <span>Human Review Desk</span>
          </button>
        </div>
      </section>

      {/* Capability Indicators Grid (Factual Architecture, No Fabricated Benchmarks) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-panel/60 border border-panel-border backdrop-blur-md">
          {capabilityIndicators.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {stat.value}
              </span>
              <p className="text-xs font-semibold text-gray-300">{stat.label}</p>
              <p className="text-[10px] text-gray-500 font-mono">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HeroDAG Evidence & Reconciliation Flow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroDAG onExploreClick={() => onNavigate('case', 'CASE-2026-9041')} />
      </section>

      {/* Feature Capabilities Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan">
            DETERMINISTIC ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
            Engineered for Safety, Observability & Human Oversight
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto mt-2">
            Every investigation step is constrained by deterministic allowlists, state machines, and mathematical circuit breakers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-panel border border-panel-border hover:border-gray-700 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-obsidian border border-panel-border">
                    <Icon className={`w-5 h-5 ${feat.color}`} />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400">
                    {feat.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-cyan transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom Regulatory Callout Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-cyan/30 bg-gradient-to-r from-panel via-panel-hover to-panel p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald" />
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald">
                Policy-Informed Prototype &bull; Decision-Support
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Multi-Ledger Cross-Check for Stranded Digital Transactions
            </h3>
            <p className="text-xs text-gray-400">
              When a citizen's account is debited but the merchant ledger confirms non-receipt, FinResolve cross-references mock banking telemetries under simulated turnaround guidelines to prepare explainable recommendations for human review.
            </p>
          </div>

          <button
            onClick={() => onNavigate('submit')}
            className="shrink-0 px-6 py-3 rounded-xl bg-cyan hover:bg-cyan/90 text-black font-semibold text-xs transition-all shadow-cyan-sm flex items-center gap-2"
          >
            <span>Test a Scenario</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
