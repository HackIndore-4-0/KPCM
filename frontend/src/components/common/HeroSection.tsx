import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Zap, Layers, Scale, Sparkles, Building2, Cpu, Landmark, CreditCard, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/audio';

interface HeroSectionProps {
  onInitialize: () => void;
  onViewDirectives: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onInitialize,
  onViewDirectives,
}) => {
  const { t } = useLanguage();

  const partners = [
    { name: 'State Bank of India', icon: Building2, detail: 'CBS Core Rail' },
    { name: 'NPCI UPI Switch', icon: Cpu, detail: 'National Clearing Ingress' },
    { name: 'Reserve Bank of India', icon: Landmark, detail: 'CMS Ombudsman Protocol' },
    { name: 'HDFC Finacle Core', icon: Building2, detail: 'Inter-Bank IMPS Hub' },
    { name: 'Razorpay / PG Rails', icon: CreditCard, detail: 'Merchant Settlement Gateway' },
  ];

  return (
    <section className="relative z-10 pt-12 pb-16 px-4 text-center max-w-5xl mx-auto space-y-8">
      {/* Top Badge Pill */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-earth-900/90 border border-earth-700/80 shadow-earth-sm backdrop-blur-md"
      >
        <span className="w-2 h-2 rounded-full bg-bronze-400 animate-pulse" />
        <span className="text-xs font-mono font-medium text-earth-200 tracking-wide">
          {t('heroBadge')}
        </span>
      </motion.div>

      {/* Main Bold Headline (QRONOS Style) */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-earth-100 max-w-4xl mx-auto leading-[1.12]"
      >
        The autonomous reconciliation system for{' '}
        <span className="text-earth-gradient font-serif italic text-bronze-300">
          inter-bank payment failures
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="text-sm sm:text-base text-earth-300 max-w-2xl mx-auto leading-relaxed font-sans"
      >
        {t('heroSubheading')}
      </motion.p>

      {/* Hero Action Buttons (Directly modeled after QRONOS) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center justify-center gap-3.5 pt-2"
      >
        {/* Primary Button */}
        <button
          onClick={() => {
            sound.playTick();
            onInitialize();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-earth-900 hover:bg-earth-850 text-earth-100 font-semibold text-xs tracking-wider uppercase border border-earth-650 hover:border-bronze-500 shadow-earth-md transition-all group cursor-pointer"
        >
          <span>{t('ctaPrimary')}</span>
          <ChevronRight className="w-4 h-4 text-bronze-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Secondary White Pill Button */}
        <button
          onClick={() => {
            sound.playTick();
            onViewDirectives();
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-earth-100 hover:bg-earth-50 text-earth-950 font-bold text-xs tracking-wider uppercase shadow-earth-sm transition-all cursor-pointer"
        >
          <span>{t('ctaSecondary')}</span>
        </button>
      </motion.div>

      {/* Metrics Row (Earth Toned) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-earth-750/50 max-w-4xl mx-auto"
      >
        <div className="p-3.5 rounded-2xl bg-earth-900/60 border border-earth-750/70 text-left">
          <span className="text-[10px] text-earth-400 font-mono block uppercase">{t('statTps')}</span>
          <span className="text-base font-bold text-earth-100 font-mono">{t('statTpsVal')}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-earth-900/60 border border-earth-750/70 text-left">
          <span className="text-[10px] text-earth-400 font-mono block uppercase">{t('statLatency')}</span>
          <span className="text-base font-bold text-bronze-400 font-mono">{t('statLatencyVal')}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-earth-900/60 border border-earth-750/70 text-left">
          <span className="text-[10px] text-earth-400 font-mono block uppercase">{t('statAccuracy')}</span>
          <span className="text-base font-bold text-emerald-400 font-mono">{t('statAccuracyVal')}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-earth-900/60 border border-earth-750/70 text-left">
          <span className="text-[10px] text-earth-400 font-mono block uppercase">{t('statOmbudsman')}</span>
          <span className="text-base font-bold text-earth-100 font-mono">{t('statOmbudsmanVal')}</span>
        </div>
      </motion.div>

      {/* Partners / Payment Rails Strip (QRONOS Style Logo Strip) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="pt-8 space-y-4"
      >
        <div className="text-[11px] font-mono tracking-widest text-earth-400 uppercase">
          {t('partnerSectionTitle')}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 opacity-75 grayscale hover:grayscale-0 transition-all">
          {partners.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="flex items-center gap-2 text-earth-300 font-mono text-xs">
                <Icon className="w-4 h-4 text-bronze-400/80" />
                <span className="font-semibold">{p.name}</span>
                <span className="text-[10px] text-earth-500 hidden sm:inline">({p.detail})</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
};
