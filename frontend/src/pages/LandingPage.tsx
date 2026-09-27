import React from 'react';
import { ArrowRight, ShieldCheck, Zap, GitFork, Scale, Activity, Cpu, CheckCircle2, Lock, FileSearch, ArrowUpRight } from 'lucide-react';
import HeroDAG from '../components/landing/HeroDAG';
import { Language, translations } from '../lib/translations';

interface LandingPageProps {
  onNavigate: (tab: string, caseId?: string) => void;
  lang: Language;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, lang }) => {
  const t = translations[lang] || translations.en;

  const stats = [
    { label: 'Autonomous Resolution Rate', value: '94.2%', sub: 'Sub-second Tri-party Settlement' },
    { label: 'Average Dispute TAT', value: '1.4 sec', sub: 'vs RBI 24h - 30d manual mandate' },
    { label: 'Token Safety Ceiling', value: '50k Tokens', sub: 'Hardware-enforced Circuit Breaker' },
    { label: 'Multi-Ledger Coverage', value: '100%', sub: 'Sender CBS + NPCI + Beneficiary PG' },
  ];

  const features = [
    {
      icon: GitFork,
      title: 'Tri-Party Multi-Ledger Arbitration',
      desc: 'Simultaneously queries Core Banking System (CBS), NPCI central switches, and Merchant Payment Gateways to pinpoint asymmetric packet drops (U69 timeouts).',
      badge: 'Zero Hallucination',
      color: 'text-cyan',
    },
    {
      icon: Lock,
      title: 'Deterministic Action Allowlist',
      desc: 'Strictly restricts agent execution to approved banking operations: EXECUTE_REVERSAL, NOTIFY_PARTIES, or HUMAN_ESCALATION. No arbitrary code execution.',
      badge: 'Allowlist Guard',
      color: 'text-emerald',
    },
    {
      icon: Activity,
      title: 'Runaway-Loop Circuit Breakers',
      desc: 'Monitors tool failure spikes (max 3 consecutive), iteration limits, and token budgets. Instantly safely halts into Human-in-the-Loop on anomaly detection.',
      badge: 'Fail-Safe Halted',
      color: 'text-amber',
    },
    {
      icon: Scale,
      title: 'Ombudsman HITL Governance Desk',
      desc: 'High-value claims (> ₹50,000) or low-confidence determinations are automatically routed to the Ombudsman portal with complete cryptographic audit trails.',
      badge: 'RBI ODR Compliant',
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
          <span>AUTONOMOUS FINANCIAL ODR ENGINE &bull; CHALLENGE 1 PROTOTYPE</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Sub-Second Resolution for <br />
          <span className="bg-gradient-to-r from-cyan via-blue-400 to-magenta bg-clip-text text-transparent">
            Failed Digital Payments
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Autonomous multi-agent grievance resolution platform under RBI Master Directions. Cross-checks Core Banking, NPCI, and Merchant ledgers with deterministic circuit breakers.
        </p>

        {/* CTA Group */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('submit')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-blue-500 text-black font-semibold text-sm hover:opacity-95 transition-all shadow-cyan-md flex items-center gap-2"
          >
            <span>File Grievance Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('case', 'CASE-2026-9041')}
            className="px-6 py-3 rounded-xl bg-panel hover:bg-panel-border border border-cyan/30 text-cyan font-mono text-sm transition-all flex items-center gap-2 shadow-cyan-sm"
          >
            <Activity className="w-4 h-4" />
            <span>Launch Live Case Demo</span>
          </button>

          <button
            onClick={() => onNavigate('ombudsman')}
            className="px-5 py-3 rounded-xl bg-panel hover:bg-panel-border border border-panel-border text-gray-300 hover:text-white font-mono text-sm transition-all flex items-center gap-2"
          >
            <Scale className="w-4 h-4 text-magenta" />
            <span>Ombudsman Desk</span>
          </button>
        </div>
      </section>

      {/* Real-time Stats Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-panel/60 border border-panel-border backdrop-blur-md">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {stat.value}
              </span>
              <p className="text-xs font-semibold text-gray-300">{stat.label}</p>
              <p className="text-[10px] text-gray-500 font-mono">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HeroDAG Interactive Pipeline Section */}
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
            Engineered for Banking Rigor & Zero Hallucination
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto mt-2">
            Every step is governed by deterministic allowlists, state machines, and mathematical circuit breakers.
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
                Reserve Bank of India (RBI) Compliant ODR
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              Instantaneous Auto-Reversal for Failed UPI & IMPS Transactions
            </h3>
            <p className="text-xs text-gray-400">
              When a customer's account is debited but the merchant does not receive credit within standard settlement intervals, FinResolve automatically initiates the statutory auto-reversal to the source account.
            </p>
          </div>

          <button
            onClick={() => onNavigate('submit')}
            className="shrink-0 px-6 py-3 rounded-xl bg-cyan hover:bg-cyan/90 text-black font-semibold text-xs transition-all shadow-cyan-sm flex items-center gap-2"
          >
            <span>Resolve a Failed Payment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
