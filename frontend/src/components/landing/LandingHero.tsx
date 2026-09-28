import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Cpu,
  Store,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { BlueMeshyBackground } from '@/components/ui/blue-meshy-background';
import { cn } from '@/lib/utils';

// ============================================================
// GLASS NODE CARD — ledger source nodes
// ============================================================
interface GlassNodeProps {
  icon: React.ReactNode;
  label: string;
  statusLabel: string;
  statusVariant: 'emerald' | 'amber' | 'rose';
  primaryValue: string;
  refLabel: string;
  detail: string;
  detailColor: string;
  active: boolean;
  borderColor: string;
  shadowColor: string;
  glowColor: string;
}

const variantMap = {
  emerald: { pill: 'status-pill status-pill-emerald', dot: 'bg-emerald-400', icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  amber: { pill: 'status-pill status-pill-amber', dot: 'bg-amber-400', icon: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
  rose: { pill: 'status-pill status-pill-rose', dot: 'bg-rose-400', icon: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
};

function GlassNode({
  icon, label, statusLabel, statusVariant, primaryValue, refLabel, detail, detailColor,
  active, borderColor, shadowColor, glowColor,
}: GlassNodeProps) {
  const vm = variantMap[statusVariant];
  return (
    <motion.div
      animate={{
        borderColor: active ? borderColor : 'rgba(0,240,255,0.06)',
        boxShadow: active ? `0 0 24px -4px ${glowColor}, 0 8px 32px -4px rgba(0,0,0,0.8)` : '0 8px 32px -4px rgba(0,0,0,0.8)',
      }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border bg-[#08090f]/80 backdrop-blur-xl p-4 flex flex-col gap-2.5 relative overflow-hidden"
    >
      {/* Top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {/* Dot grid texture */}
      {active && <div className="absolute inset-0 dot-grid-texture opacity-30 pointer-events-none" />}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-xl border flex items-center justify-center', vm.icon)}>
            {icon}
          </div>
          <span className="text-xs font-semibold text-[#e6e8ec]">{label}</span>
        </div>
        <span className={vm.pill}>
          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', vm.dot, active ? 'animate-pulse' : '')} />
          {statusLabel}
        </span>
      </div>

      <div className="space-y-1 font-mono text-[11px]">
        <div className="text-[#e6e8ec] font-bold text-sm">{primaryValue}</div>
        <div className="text-[#4a5568] truncate">{refLabel}</div>
        <div className={cn('text-[10px]', detailColor)}>{detail}</div>
      </div>

      {/* Bottom glow junction dot */}
      {active && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: borderColor, boxShadow: `0 0 8px 3px ${glowColor}` }}
        />
      )}
    </motion.div>
  );
}

// ============================================================
// SVG CONNECTOR LINES — animated flowing light pulses
// ============================================================
function ConnectorSVG({ active }: { active: boolean }) {
  return (
    <div className="relative w-full h-10 flex items-center justify-center my-0">
      <svg
        viewBox="0 0 600 40"
        className="w-full h-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="connGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#b026ff" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="connGradR" x1="1" y1="0" x2="0" y2="0">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#b026ff" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Left connector: from left-third to center */}
        <path
          d="M 100 0 Q 200 40 300 20"
          stroke="url(#connGrad)"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          className={active ? 'animate-[dashFlow_2s_linear_infinite]' : ''}
          opacity={active ? 0.8 : 0.2}
        />
        {/* Center connector: straight down */}
        <path
          d="M 300 0 L 300 20"
          stroke="url(#connGrad)"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          className={active ? 'animate-[dashFlow_2s_linear_infinite_0.3s]' : ''}
          opacity={active ? 0.9 : 0.2}
        />
        {/* Right connector: from right-third to center */}
        <path
          d="M 500 0 Q 400 40 300 20"
          stroke="url(#connGradR)"
          strokeWidth="1.5"
          strokeDasharray="8 4"
          className={active ? 'animate-[dashFlow_2s_linear_infinite_0.6s]' : ''}
          opacity={active ? 0.8 : 0.2}
        />
        {/* Junction dot at convergence */}
        <circle
          cx="300"
          cy="20"
          r="4"
          fill="#00f0ff"
          opacity={active ? 0.9 : 0.3}
          className={active ? 'animate-pulse' : ''}
        />
      </svg>
    </div>
  );
}

// ============================================================
// GRAPH VISUALIZER (the elevated centerpiece)
// ============================================================
function ReconciliationCenterpiece() {
  const [activeStep, setActiveStep] = useState(0);
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const steps = [
    {
      label: 'Stage 1: CBS Ingress',
      desc: 'State Bank confirms ₹25,000 debit from citizen account #****4819 at 14:02:11 IST.',
      activeNodes: ['cbs'],
      status: 'DEBIT_VERIFIED',
    },
    {
      label: 'Stage 2: Switch Telemetry',
      desc: 'NPCI UPI rail detected switch timeout error code U69 (inter-bank packet drop).',
      activeNodes: ['cbs', 'npci'],
      status: 'TIMEOUT_ISOLATED',
    },
    {
      label: 'Stage 3: Merchant Audit',
      desc: 'Razorpay PG confirms ₹0.00 settled. Cart session expired without goods dispatch.',
      activeNodes: ['cbs', 'npci', 'merchant'],
      status: 'ZERO_CREDIT_CONFIRMED',
    },
    {
      label: 'Stage 4: Consensus Engine',
      desc: 'LangGraph deterministic rule engine flags ₹25,000 discrepancy between CBS & Merchant.',
      activeNodes: ['engine'],
      status: 'CONSENSUS_REACHED',
    },
    {
      label: 'Stage 5: Statutory Directive',
      desc: 'Mandatory auto-reversal dispatched under RBI Circular 1164 with ₹100/day penal clause.',
      activeNodes: ['directive'],
      status: 'MANDATE_ISSUED',
    },
  ];

  useEffect(() => {
    if (prefersReduced) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [steps.length, prefersReduced]);

  const step = steps[activeStep];
  const nodesActive = step.activeNodes;
  const connectorsActive = nodesActive.includes('cbs') || nodesActive.includes('npci') || nodesActive.includes('merchant');

  return (
    // Outer glass container with gradient border
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden">
      {/* Gradient border via pseudo-element substitute */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none z-10"
        style={{
          padding: '1px',
          background: 'linear-gradient(135deg, rgba(0,240,255,0.4), rgba(176,38,255,0.4))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'destination-out',
          maskComposite: 'exclude',
        }}
      />

      {/* Glass surface */}
      <div
        className="relative rounded-3xl bg-[#06071080]/80 backdrop-blur-2xl p-5 sm:p-7"
        style={{ boxShadow: '0 0 50px -12px rgba(0,240,255,0.12), 0 0 100px -20px rgba(176,38,255,0.08)' }}
      >
        {/* Inner top highlight line */}
        <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Dot grid texture overlay */}
        <div className="absolute inset-0 dot-grid-texture opacity-20 rounded-3xl pointer-events-none" />

        {/* Slow sheen sweep */}
        {!prefersReduced && <div className="absolute inset-0 sheen-sweep rounded-3xl pointer-events-none opacity-50" />}

        {/* === HEADER === */}
        <div className="relative z-10 flex items-center justify-between pb-5 mb-5 border-b border-cyan-500/10">
          <div className="flex items-center gap-3">
            {/* Window chrome dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>

            {/* Floating title chip */}
            <div
              className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono"
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(176,38,255,0.06))',
                border: '1px solid',
                borderColor: 'transparent',
                backgroundClip: 'padding-box',
                boxShadow: 'inset 0 0 0 1px rgba(0,240,255,0.2)',
              }}
            >
              {/* Pulsing live dot */}
              <span className="relative flex h-1.5 w-1.5">
                {!prefersReduced && <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping" />}
                <span className="relative w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </span>
              <span
                className="font-semibold tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #b026ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Deterministic 5-Node Graph Visualizer
              </span>
            </div>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/8 border border-cyan-500/20 text-[11px] font-mono text-cyan-400">
            <span className="relative flex h-1.5 w-1.5">
              {!prefersReduced && <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-50 animate-ping" />}
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </span>
            Active Reconciliation Loop
          </div>
        </div>

        {/* === 3 LEDGER SOURCE NODES === */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-1">
          <GlassNode
            icon={<Building2 className="w-4 h-4" />}
            label="Bank CBS"
            statusLabel="DEBIT SUCCESS"
            statusVariant="emerald"
            primaryValue="₹25,000.00"
            refLabel="Ref: SBI-98421890"
            detail="SUCCESS • 14:02:11 IST"
            detailColor="text-emerald-400/80"
            active={nodesActive.includes('cbs')}
            borderColor="rgba(52,211,153,0.5)"
            shadowColor="rgba(16,185,129,0.25)"
            glowColor="rgba(16,185,129,0.3)"
          />
          <GlassNode
            icon={<Cpu className="w-4 h-4" />}
            label="NPCI Switch"
            statusLabel="TIMEOUT U69"
            statusVariant="amber"
            primaryValue="RRN 402918847"
            refLabel="Switch: Inter-Bank Rail"
            detail="DROP • ACK Not Received"
            detailColor="text-amber-400/80"
            active={nodesActive.includes('npci')}
            borderColor="rgba(251,191,36,0.5)"
            shadowColor="rgba(245,158,11,0.25)"
            glowColor="rgba(245,158,11,0.3)"
          />
          <GlassNode
            icon={<Store className="w-4 h-4" />}
            label="Merchant PG"
            statusLabel="NOT CREDITED"
            statusVariant="rose"
            primaryValue="₹0.00 Received"
            refLabel="Cart: ORD-88319-X"
            detail="EXPIRED • Goods Withheld"
            detailColor="text-rose-400/80"
            active={nodesActive.includes('merchant')}
            borderColor="rgba(251,113,133,0.5)"
            shadowColor="rgba(244,63,94,0.25)"
            glowColor="rgba(244,63,94,0.3)"
          />
        </div>

        {/* === SVG ANIMATED CONNECTORS === */}
        <div className="relative z-10">
          <ConnectorSVG active={connectorsActive} />
        </div>

        {/* === CENTRAL ENGINE NODE === */}
        <motion.div
          animate={{
            boxShadow: nodesActive.includes('engine')
              ? '0 0 40px -6px rgba(0,240,255,0.35), 0 8px 32px -4px rgba(0,0,0,0.9)'
              : '0 8px 32px -4px rgba(0,0,0,0.8)',
            borderColor: nodesActive.includes('engine') ? 'rgba(0,240,255,0.35)' : 'rgba(0,240,255,0.08)',
          }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-xl mx-auto rounded-2xl border bg-[#07090d]/85 backdrop-blur-xl p-4 mb-1"
        >
          {/* Inner top highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rounded-t-2xl" />

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-500/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-xl flex items-center justify-center text-cyan-400 border transition-all',
                  nodesActive.includes('engine')
                    ? 'bg-cyan-500/15 border-cyan-500/40 shadow-[0_0_12px_-2px_rgba(0,240,255,0.4)]'
                    : 'bg-cyan-500/8 border-cyan-500/15'
                )}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span
                  className="text-xs font-bold block"
                  style={{
                    background: 'linear-gradient(90deg, #e6e8ec 0%, #8892a4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  FinResolve Consensus Engine
                </span>
                <span className="text-[10px] text-[#4a5568] font-mono">
                  Autonomous Multi-Ledger Reconciliation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#4a5568]">Confidence:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/25">
                95%
              </span>
              {/* Visual confidence bar */}
              <div className="hidden sm:flex w-16 h-1 rounded-full bg-surface-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00f0ff, #b026ff)' }}
                  initial={{ width: 0 }}
                  animate={{ width: '95%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Step narrative */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-start gap-2.5 text-xs"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 animate-pulse" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#e6e8ec] font-mono text-[11px]">{step.label}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">{step.status}</span>
                </div>
                <p className="text-[#8892a4] text-[11px] leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* === DOWNWARD VECTOR === */}
        <div className="relative z-10 flex justify-center my-1">
          <div className="relative">
            <div className="h-7 w-px bg-gradient-to-b from-cyan-500/50 to-violet-500/70" />
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full"
              style={{ background: '#b026ff', boxShadow: '0 0 8px 3px rgba(176,38,255,0.4)' }}
            />
          </div>
        </div>

        {/* === RESOLUTION PANEL === */}
        <motion.div
          animate={{
            borderColor: nodesActive.includes('directive')
              ? 'rgba(52,211,153,0.4)'
              : 'rgba(0,240,255,0.06)',
            boxShadow: nodesActive.includes('directive')
              ? '0 0 30px -6px rgba(16,185,129,0.3), 0 8px 32px -4px rgba(0,0,0,0.8)'
              : '0 8px 32px -4px rgba(0,0,0,0.8)',
          }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-xl mx-auto rounded-2xl border bg-emerald-950/10 backdrop-blur-xl p-3.5 flex items-center justify-between gap-3 overflow-hidden"
        >
          {/* Inner highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
          {/* Sheen on resolution panel */}
          {!prefersReduced && <div className="absolute inset-0 sheen-sweep pointer-events-none opacity-40" />}

          <div className="flex items-center gap-2.5 relative z-10">
            <div
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400 flex-shrink-0 border transition-all',
                nodesActive.includes('directive')
                  ? 'bg-emerald-500/15 border-emerald-500/40 shadow-[0_0_12px_-2px_rgba(16,185,129,0.5)]'
                  : 'bg-emerald-500/8 border-emerald-500/15'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h6 className="font-semibold text-emerald-300 block font-mono text-[11px] tracking-widest mb-0.5">
                Deterministic Conflict Resolution
              </h6>
              <span className="text-[11px] text-[#8892a4]">
                Direct credit auto-reversal to citizen account + ₹100/day penal compensation
              </span>
            </div>
          </div>

          {/* RBI T+1 Enforced pill */}
          <motion.span
            animate={{
              boxShadow: nodesActive.includes('directive')
                ? '0 0 12px -2px rgba(16,185,129,0.5)'
                : 'none',
            }}
            className="text-[10px] font-mono text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-lg bg-emerald-500/10 hidden sm:inline-flex items-center gap-1 flex-shrink-0 relative z-10"
          >
            <span className={cn('w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0', !prefersReduced && nodesActive.includes('directive') ? 'animate-pulse' : '')} />
            RBI T+1 Enforced
          </motion.span>
        </motion.div>

        {/* Bottom highlight edge */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>
    </div>
  );
}

// ============================================================
// LANDING HERO
// ============================================================
interface LandingHeroProps {
  onFileGrievance?: () => void;
  onViewLiveDemo?: () => void;
  onNavigateToOmbudsman?: () => void;
}

const NAV_LINKS = [
  { label: 'Reconciliation Engine', href: '#engine' },
  { label: 'Multi-Ledger Ingress', href: '#ingress' },
  { label: 'RBI T+1 Mandate', href: '#mandate' },
  { label: 'Ombudsman Gate', href: '#ombudsman' },
];

export const LandingHero: React.FC<LandingHeroProps> = ({
  onFileGrievance,
  onViewLiveDemo,
  onNavigateToOmbudsman,
}) => {
  return (
    <section className="relative min-h-[920px] w-full overflow-hidden bg-[#05060a] text-white flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* WebGL Meshy Background — base layer */}
      <BlueMeshyBackground className="opacity-40" />

      {/* Vignette overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#05060a] via-transparent to-[#05060a]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#05060a]/60 via-transparent to-[#05060a]/60" />

      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12 max-w-6xl mx-auto w-full border-b border-cyan-500/10"
      >
        {/* Brand */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center group-hover:border-cyan-500/40 group-hover:shadow-[0_0_15px_-2px_rgba(0,240,255,0.5)] transition-all overflow-hidden p-1">
            <img src="/icons/finresolve-icon.svg" alt="FinResolve Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-mono tracking-wider font-bold text-[#e6e8ec]">
            FINRESOLVE
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#080a10] border border-cyan-500/12 text-[#4a5568] font-mono hidden sm:inline-block">
            v1.0 Public Rail
          </span>
        </motion.div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-[#8892a4]">
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.label}
              href={link.href}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.preventDefault();
                if (link.href === '#ombudsman') onNavigateToOmbudsman?.();
                else onViewLiveDemo?.();
              }}
              className="transition-colors hover:text-[#e6e8ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 rounded cursor-pointer"
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onFileGrievance}
          className="btn-neon btn-neon-primary cursor-pointer"
        >
          Lodge Grievance
        </motion.button>
      </motion.nav>

      {/* Hero Body */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-12 sm:pt-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/6 text-[11px] font-mono text-cyan-300 mb-6 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Statutory Inter-Bank Dispute Reconciliation</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-[#e6e8ec] leading-[1.1]"
        >
          The autonomous reconciliation engine
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #b026ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            for financial grievances
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-2xl text-xs sm:text-sm md:text-base text-[#8892a4] leading-relaxed"
        >
          FinResolve cross-checks bank, switch, and merchant ledgers in real time —
          resolving payment timeouts and disputed debits within a closed, auditable set of RBI regulatory rules.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFileGrievance}
            className="btn-neon btn-neon-primary w-full sm:w-auto flex items-center gap-2 cursor-pointer"
          >
            <span>File a Grievance</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onViewLiveDemo}
            className="btn-neon btn-neon-outline w-full sm:w-auto flex items-center gap-2 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 text-cyan-400" />
            <span>View Live Demo</span>
          </motion.button>
        </motion.div>

        {/* Elevated Centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-12 mb-6"
        >
          <ReconciliationCenterpiece />
        </motion.div>
      </div>

      {/* Trust Strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 w-full border-t border-cyan-500/8 bg-[#05060a]/60 py-6 px-6 backdrop-blur-sm"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <span className="text-[11px] uppercase tracking-wider text-[#4a5568]">
            Integrated With Core Financial Rails:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-semibold text-[#8892a4]">
            <span className="hover:text-[#e6e8ec] transition-colors cursor-default">Bank CBS (Finacle)</span>
            <span className="text-[#1c2038]">&bull;</span>
            <span className="hover:text-[#e6e8ec] transition-colors cursor-default">NPCI UPI Switch</span>
            <span className="text-[#1c2038]">&bull;</span>
            <span className="hover:text-[#e6e8ec] transition-colors cursor-default">Merchant PG Rails</span>
            <span className="text-[#1c2038]">&bull;</span>
            <span className="text-cyan-400/80 hover:text-cyan-400 transition-colors cursor-default">RBI Circular 1164</span>
            <span className="text-[#1c2038]">&bull;</span>
            <span className="hover:text-[#e6e8ec] transition-colors cursor-default">T+1 Auto-Reversal</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
