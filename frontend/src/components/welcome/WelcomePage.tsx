import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Scale,
  ArrowRight,
  User,
  Building2,
  Clock,
  Sparkles,
  Play,
  Cpu,
  Store,
  ChevronRight,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface WelcomePageProps {
  onSelectRole: (role: 'citizen' | 'ombudsman') => void;
  onExploreDemo: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onSelectRole,
  onExploreDemo,
}) => {
  return (
    <div className="min-h-[88vh] flex flex-col justify-between py-6 px-4 sm:px-8 max-w-6xl mx-auto relative z-10">
      {/* Top Banner / Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center mb-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/20 text-xs font-mono text-cyan-300 shadow-[0_0_20px_-5px_rgba(0,240,255,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Statutory Inter-Bank Financial Redressal Platform &bull; RBI Circular 1164</span>
        </div>
      </motion.div>

      {/* Main Hero Header */}
      <div className="text-center max-w-4xl mx-auto mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(0,240,255,0.4)] p-2.5 overflow-hidden">
            <img src="/icons/finresolve-icon.svg" alt="FinResolve Logo" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#e6e8ec] leading-[1.12]"
        >
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400">FinResolve</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 text-sm sm:text-base text-[#8892a4] max-w-2xl mx-auto leading-relaxed"
        >
          India’s first autonomous multi-ledger reconciliation engine. We arbitrate payment drops
          across Bank Core Banking Systems, NPCI UPI rails, and Merchant Gateways within statutory RBI T+1 turnaround time.
        </motion.p>
      </div>

      {/* Two Portal Cards (Citizen vs Ombudsman) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mb-8">
        {/* Card 1: Citizen Portal */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          whileHover={{ y: -4, borderColor: 'rgba(0, 240, 255, 0.4)' }}
          className="rounded-3xl bg-[#080a12]/80 border border-cyan-500/20 backdrop-blur-xl p-6 flex flex-col justify-between shadow-[0_0_35px_-10px_rgba(0,240,255,0.12)] relative overflow-hidden group cursor-pointer"
          onClick={() => onSelectRole('citizen')}
        >
          {/* Subtle top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-cyan-500/5 blur-2xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Public Access
              </span>
            </div>

            <h3 className="text-xl font-bold text-[#e6e8ec] mb-2 group-hover:text-cyan-300 transition-colors">
              Citizen Grievance Portal
            </h3>
            <p className="text-xs text-[#8892a4] leading-relaxed mb-4">
              Were funds deducted from your bank without merchant order confirmation? Submit your complaint to initiate
              instant multi-ledger automated arbitration and claim statutory ₹100/day penal restitution.
            </p>

            <ul className="space-y-2 text-xs text-[#e6e8ec]/80 mb-6 font-mono text-[11px]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Automated PCI-DSS Card & Aadhaar Sanitization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Live multi-agent execution telemetry stream</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>Direct credit auto-reversal to source account</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 text-[#05060a] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_-3px_rgba(0,240,255,0.4)] group-hover:shadow-[0_0_30px_-3px_rgba(0,240,255,0.6)] transition-all cursor-pointer"
          >
            <span>Enter Citizen Portal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Card 2: Ombudsman Cockpit */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -4, borderColor: 'rgba(176, 38, 255, 0.4)' }}
          className="rounded-3xl bg-[#080a12]/80 border border-violet-500/20 backdrop-blur-xl p-6 flex flex-col justify-between shadow-[0_0_35px_-10px_rgba(176,38,255,0.12)] relative overflow-hidden group cursor-pointer"
          onClick={() => onSelectRole('ombudsman')}
        >
          {/* Subtle top shimmer */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-violet-500/5 blur-2xl group-hover:bg-violet-500/10 transition-all pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-mono text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                Institutional Authority
              </span>
            </div>

            <h3 className="text-xl font-bold text-[#e6e8ec] mb-2 group-hover:text-violet-300 transition-colors">
              Ombudsman HITL Cockpit
            </h3>
            <p className="text-xs text-[#8892a4] leading-relaxed mb-4">
              Restricted portal for Reserve Bank of India Ombudsmen and Bank Nodal Officers. Review paused high-value
              disputes, inspect isolated ledger discrepancies, and ratify statutory reversal directives.
            </p>

            <ul className="space-y-2 text-xs text-[#e6e8ec]/80 mb-6 font-mono text-[11px]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>State-preserving Human-in-the-Loop review queue</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>Three-way cross-ledger audit diff matrix</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                <span>One-click statutory ratification & parameter adaptation</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_-3px_rgba(176,38,255,0.4)] group-hover:shadow-[0_0_30px_-3px_rgba(176,38,255,0.6)] transition-all cursor-pointer"
          >
            <span>Authenticate Ombudsman Gate</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Quick Demo Bypass Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center max-w-md mx-auto"
      >
        <button
          onClick={onExploreDemo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/10 hover:border-cyan-400/40 text-xs font-semibold text-[#e6e8ec] hover:text-white transition-all cursor-pointer shadow-sm hover:shadow-[0_0_15px_-3px_rgba(0,240,255,0.3)]"
        >
          <Play className="w-3.5 h-3.5 text-cyan-400" />
          <span>Launch Interactive Engine Demo (No Sign-In Needed)</span>
        </button>
      </motion.div>

      {/* Institutional Trust Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="mt-10 pt-4 border-t border-cyan-500/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#4a5568]"
      >
        <span className="text-[#8892a4]">
          FINRESOLVE &bull; Reserve Bank of India Ombudsman Scheme 2021
        </span>
        <div className="flex items-center gap-4">
          <span>Bank CBS</span>
          <span>&bull;</span>
          <span>NPCI UPI Switch</span>
          <span>&bull;</span>
          <span>Merchant PG</span>
          <span>&bull;</span>
          <span className="text-cyan-400/80">T+1 Mandatory TAT</span>
        </div>
      </motion.div>
    </div>
  );
};
