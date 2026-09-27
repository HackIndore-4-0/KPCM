import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  Cpu,
  Store,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Lock,
} from 'lucide-react';

/**
 * VortexCanvas — Canvas-based converging particle-line funnel
 * Creates a subtle, lightweight atmospheric background.
 */
function VortexCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let raf = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvas.width = clientWidth * DPR;
      canvas.height = clientHeight * DPR;
      ctx.scale(DPR, DPR);
    };
    resize();
    window.addEventListener('resize', resize);

    const LINES = 44;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const neckY = h * 0.44; // where the funnel pinches
      const t = frame * 0.005;

      for (let i = 0; i < LINES; i++) {
        const phase = (i / LINES) * Math.PI * 2;
        const wobble = Math.sin(t * 1.8 + phase) * 0.12 + 0.88;
        const spread = (i / LINES - 0.5) * w * 1.15 * wobble;

        ctx.beginPath();
        ctx.moveTo(cx + spread, 0);
        ctx.quadraticCurveTo(
          cx + spread * 0.16,
          neckY,
          cx + spread * 0.04,
          neckY
        );
        ctx.quadraticCurveTo(
          cx - spread * 0.16,
          neckY + (h - neckY) * 0.88,
          cx - spread * (0.92 + 0.08 * Math.sin(t + phase)),
          h
        );

        // Muted white / teal-tinted lines
        const alpha = 0.04 + 0.04 * Math.sin(t * 2.5 + phase);
        ctx.strokeStyle = `rgba(224, 242, 254, ${Math.max(0.02, alpha)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      frame++;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    />
  );
}

/**
 * ReconciliationCenterpiece — The core product visual
 * Illustrates Bank CBS, NPCI Switch, and Merchant PG converging into
 * FinResolve's Autonomous Consensus Engine to issue a statutory order.
 */
function ReconciliationCenterpiece() {
  const [activeStep, setActiveStep] = useState(0);

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

  // Auto-cycle through reconciliation steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl bg-neutral-950/80 border border-white/[0.08] p-5 sm:p-7 shadow-[0_0_50px_-12px_rgba(14,165,233,0.15)] backdrop-blur-xl">
      {/* Top Status & Window Chrome */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06] text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="text-white/40 font-mono text-[11px] ml-1">
            finresolve::consensus-stream (live)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-[11px] font-mono text-sky-400">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Active Reconciliation Loop
          </span>
        </div>
      </div>

      {/* The 3 Source Ingress Rails */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
        {/* Node 1: Bank CBS */}
        <motion.div
          animate={{
            borderColor:
              steps[activeStep].activeNodes.includes('cbs')
                ? 'rgba(56, 189, 248, 0.5)'
                : 'rgba(255, 255, 255, 0.06)',
            boxShadow:
              steps[activeStep].activeNodes.includes('cbs')
                ? '0 0 20px -3px rgba(56, 189, 248, 0.2)'
                : 'none',
          }}
          className="rounded-2xl bg-neutral-900/60 border p-4 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Bank CBS</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Debited
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="text-white/80 font-bold text-sm">₹25,000.00</div>
            <div className="text-white/40 truncate">Ref: SBI-98421890</div>
            <div className="text-emerald-400/80 text-[10px]">SUCCESS &bull; 14:02:11 IST</div>
          </div>
        </motion.div>

        {/* Node 2: NPCI UPI Switch */}
        <motion.div
          animate={{
            borderColor:
              steps[activeStep].activeNodes.includes('npci')
                ? 'rgba(245, 158, 11, 0.5)'
                : 'rgba(255, 255, 255, 0.06)',
            boxShadow:
              steps[activeStep].activeNodes.includes('npci')
                ? '0 0 20px -3px rgba(245, 158, 11, 0.2)'
                : 'none',
          }}
          className="rounded-2xl bg-neutral-900/60 border p-4 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">NPCI Switch</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 animate-pulse">
              U69 Timeout
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="text-white/80 font-bold text-sm">RRN 402918847</div>
            <div className="text-white/40 truncate">Switch: Inter-Bank Rail</div>
            <div className="text-amber-400/80 text-[10px]">DROP &bull; ACK Not Received</div>
          </div>
        </motion.div>

        {/* Node 3: Merchant PG */}
        <motion.div
          animate={{
            borderColor:
              steps[activeStep].activeNodes.includes('merchant')
                ? 'rgba(244, 63, 94, 0.5)'
                : 'rgba(255, 255, 255, 0.06)',
            boxShadow:
              steps[activeStep].activeNodes.includes('merchant')
                ? '0 0 20px -3px rgba(244, 63, 94, 0.2)'
                : 'none',
          }}
          className="rounded-2xl bg-neutral-900/60 border p-4 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                <Store className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-white">Merchant PG</span>
            </div>
            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Not Credited
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px]">
            <div className="text-white/80 font-bold text-sm">₹0.00 Received</div>
            <div className="text-white/40 truncate">Cart: ORD-88319-X</div>
            <div className="text-rose-400/80 text-[10px]">EXPIRED &bull; Goods Withheld</div>
          </div>
        </motion.div>
      </div>

      {/* Centerpiece Convergence Funnel & Engine */}
      <div className="relative py-2 flex flex-col items-center">
        {/* Animated Connecting Stream Beams */}
        <div className="w-full flex justify-around items-center h-8 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />
          </div>
          <motion.div
            animate={{
              y: [0, 8, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-6 rounded-full bg-gradient-to-b from-sky-400 to-transparent"
          />
          <motion.div
            animate={{
              y: [0, 8, 0],
              opacity: [0.4, 0.9, 0.4],
            }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
            className="w-1.5 h-6 rounded-full bg-gradient-to-b from-amber-400 to-transparent"
          />
          <motion.div
            animate={{
              y: [0, 8, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            className="w-1.5 h-6 rounded-full bg-gradient-to-b from-rose-400 to-transparent"
          />
        </div>

        {/* Central Engine Node */}
        <motion.div
          animate={{
            scale: steps[activeStep].activeNodes.includes('engine') ? [1, 1.02, 1] : 1,
            boxShadow: steps[activeStep].activeNodes.includes('engine')
              ? '0 0 35px -5px rgba(14, 165, 233, 0.3)'
              : '0 0 15px -5px rgba(255, 255, 255, 0.05)',
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-full max-w-xl rounded-2xl bg-neutral-900 border border-sky-500/30 p-4 relative z-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  FinResolve Consensus Engine
                </span>
                <span className="text-[10px] text-white/50 font-mono">
                  Autonomous Multi-Ledger Reconciliation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-white/40">Confidence:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                99.4%
              </span>
            </div>
          </div>

          {/* Dynamic Active Step Narrative */}
          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0 animate-ping" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white font-mono text-[11px]">
                  {steps[activeStep].label}
                </span>
                <span className="text-[10px] text-sky-400 font-mono">
                  {steps[activeStep].status}
                </span>
              </div>
              <p className="text-white/60 text-[11px] leading-relaxed">
                {steps[activeStep].desc}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Downward Directive Vector */}
        <div className="h-6 w-px bg-gradient-to-b from-sky-500/40 to-emerald-500/60 my-1" />

        {/* Deterministic Resolution Output */}
        <motion.div
          animate={{
            scale: steps[activeStep].activeNodes.includes('directive') ? [1, 1.01, 1] : 1,
            borderColor: steps[activeStep].activeNodes.includes('directive')
              ? 'rgba(16, 185, 129, 0.4)'
              : 'rgba(255, 255, 255, 0.08)',
          }}
          className="w-full max-w-xl rounded-2xl bg-emerald-950/20 border border-emerald-500/25 p-3.5 flex items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-300 block font-mono text-[11px]">
                Statutory Redressal Directive Issued
              </span>
              <span className="text-[11px] text-white/60">
                Direct credit auto-reversal to citizen account + ₹100/day penal compensation
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded bg-emerald-500/10 hidden sm:inline-block flex-shrink-0">
            RBI T+1 Enforced
          </span>
        </motion.div>
      </div>
    </div>
  );
}

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
    <section className="relative min-h-[920px] w-full overflow-hidden bg-[#070707] text-white flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      {/* Background Funnel Canvas */}
      <VortexCanvas />

      {/* Subtle top-to-bottom vignette overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#070707] via-transparent to-[#070707]" />

      {/* Top Minimal Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-12 max-w-6xl mx-auto w-full border-b border-white/[0.06]"
      >
        {/* Brand */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-white cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-sky-400">
            <ShieldCheck className="h-4 h-4" />
          </div>
          <span className="font-mono tracking-wider font-bold">FINRESOLVE</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-white/50 font-mono hidden sm:inline-block">
            v1.0 Public Rail
          </span>
        </motion.div>

        {/* Minimal 3-4 Nav Links with Micro-Interactions */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-white/60">
          {NAV_LINKS.map((link) => (
            <motion.a
              key={link.label}
              href={link.href}
              whileHover={{ scale: 1.05, color: '#ffffff' }}
              whileTap={{ scale: 0.96 }}
              onClick={(e) => {
                e.preventDefault();
                if (link.href === '#ombudsman') {
                  onNavigateToOmbudsman?.();
                } else {
                  onViewLiveDemo?.();
                }
              }}
              className="transition-colors hover:text-white cursor-pointer"
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* Single Right CTA Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onFileGrievance}
          className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-transform cursor-pointer shadow-md hover:bg-neutral-100"
        >
          Lodge Grievance
        </motion.button>
      </motion.nav>

      {/* Main Hero Header Block */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-4 pt-12 sm:pt-16 text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-sky-300 mb-6 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>Statutory Inter-Bank Dispute Reconciliation</span>
        </motion.div>

        {/* Bold Large Headline (Qronos / Linear Style) */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12]"
        >
          The autonomous reconciliation engine
          <br />
          <span className="bg-gradient-to-r from-sky-200 via-sky-400 to-teal-300 bg-clip-text text-transparent">
            for financial grievances
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5 max-w-2xl text-xs sm:text-sm md:text-base text-white/60 leading-relaxed font-sans"
        >
          FinResolve cross-checks bank, switch, and merchant ledgers in real time —
          resolving payment timeouts and disputed debits within a closed, auditable set of RBI regulatory rules.
        </motion.p>

        {/* Exactly Two Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full justify-center"
        >
          {/* Primary Filled Button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onFileGrievance}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold text-black transition-transform cursor-pointer shadow-lg hover:bg-neutral-100"
          >
            <span>File a Grievance</span>
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          {/* Secondary Outlined Button */}
          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
            whileTap={{ scale: 0.97 }}
            onClick={onViewLiveDemo}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-xs font-semibold text-white transition-all cursor-pointer hover:border-white/40"
          >
            <Play className="h-3.5 w-3.5 text-sky-400" />
            <span>View Live Demo</span>
          </motion.button>
        </motion.div>

        {/* The Animated Centerpiece (The Product's Core Mechanic) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full mt-12 mb-6"
        >
          <ReconciliationCenterpiece />
        </motion.div>
      </div>

      {/* Product-Led Institutional Trust Strip (Bottom of Hero) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="relative z-10 w-full border-t border-white/[0.06] bg-black/40 py-6 px-6 backdrop-blur-sm"
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-xs font-mono">
          <span className="text-[11px] uppercase tracking-wider text-white/30">
            Integrated With Core Financial Rails:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-semibold text-white/60">
            <span className="hover:text-white transition-colors">Bank CBS (Finacle)</span>
            <span className="text-white/20">&bull;</span>
            <span className="hover:text-white transition-colors">NPCI UPI Switch</span>
            <span className="text-white/20">&bull;</span>
            <span className="hover:text-white transition-colors">Merchant PG Rails</span>
            <span className="text-white/20">&bull;</span>
            <span className="hover:text-white transition-colors text-sky-400/80">RBI Circular 1164</span>
            <span className="text-white/20">&bull;</span>
            <span className="hover:text-white transition-colors">T+1 Auto-Reversal</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingHero;
