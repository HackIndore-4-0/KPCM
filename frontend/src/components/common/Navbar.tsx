import React from 'react';
import { ShieldCheck, Volume2, VolumeX, Sparkles, Scale, ExternalLink, ArrowRight } from 'lucide-react';
import { sound } from '../../lib/audio';
import { useLanguage } from '../../lib/i18n';
import { LanguageSelector } from './LanguageSelector';
import { AgentStatusIndicator, AgentStatus } from './AgentStatusIndicator';

interface NavbarProps {
  activeScenarioId?: string;
  onSelectScenario: (scenarioId: string) => void;
  audioEnabled: boolean;
  setAudioEnabled: (val: boolean) => void;
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  onScrollToForm: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScenarioId,
  onSelectScenario,
  audioEnabled,
  setAudioEnabled,
  agentStatus,
  setAgentStatus,
  onScrollToForm,
}) => {
  const { t } = useLanguage();

  const toggleAudio = () => {
    const next = !audioEnabled;
    sound.enabled = next;
    setAudioEnabled(next);
    if (next) sound.playTick();
  };

  return (
    <header className="border-b border-earth-750/80 bg-earth-950/85 backdrop-blur-2xl sticky top-0 z-50 transition-all">
      {/* Top Statutory Ticker */}
      <div className="bg-earth-900/60 border-b border-earth-750/50 px-4 py-1.5 text-[11px] text-earth-400 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 text-bronze-400 font-semibold tracking-wide font-mono text-[10px] uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-bronze-400" />
            {t('heroBadge')}
          </span>
          <span className="text-earth-600">•</span>
          <span className="text-emerald-400/90 font-medium font-mono text-[10px]">
            {t('statOmbudsmanVal')} Beyond T+1
          </span>
        </div>

        <div className="hidden md:flex items-center gap-3 text-earth-400 font-mono text-[10px]">
          <span className="text-earth-300">HackIndore 4.0</span>
          <span className="text-earth-700">|</span>
          <span>PROTOCOL v2.4-AUTONOMOUS</span>
        </div>
      </div>

      {/* Main Navbar Bar (QRONOS Style) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-earth-700 to-earth-900 border border-earth-600 flex items-center justify-center text-earth-100 shadow-earth-sm group-hover:border-bronze-500/50 transition-colors">
              <Scale className="w-4 h-4 text-bronze-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-earth-100 font-mono">
                FIN<span className="text-bronze-400">RESOLVE</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-earth-850 border border-earth-700 text-earth-300 font-mono">
                Consensus
              </span>
            </div>
          </div>
        </div>

        {/* Clean Center Navigation Anchors */}
        <nav className="hidden lg:flex items-center gap-6 text-xs text-earth-300 font-medium">
          <a href="#claim-section" className="hover:text-earth-100 transition-colors">
            Lodge Claim
          </a>
          <a href="#ledger-matrix" className="hover:text-earth-100 transition-colors">
            Consensus Matrix
          </a>
          <a href="#telemetry-stream" className="hover:text-earth-100 transition-colors">
            Audit Telemetry
          </a>
          <a href="#ombudsman-cockpit" className="hover:text-earth-100 transition-colors">
            Statutory Directives
          </a>
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Live Blinking Agent Status Indicator */}
          <AgentStatusIndicator status={agentStatus} setStatus={setAgentStatus} />

          {/* Multi-Lingual Selector */}
          <LanguageSelector />

          {/* Sound FX Toggle */}
          <button
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute Interface Sound' : 'Enable Tactile Audio'}
            className="p-2 rounded-full bg-earth-900 hover:bg-earth-850 border border-earth-750 text-earth-400 hover:text-earth-100 transition-colors cursor-pointer"
          >
            {audioEnabled ? <Volume2 className="w-3.5 h-3.5 text-bronze-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Primary CTA (QRONOS Style White Button) */}
          <button
            onClick={onScrollToForm}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-earth-100 hover:bg-earth-50 text-earth-950 font-semibold text-xs transition-all shadow-earth-sm hover:shadow-glow-bronze cursor-pointer"
          >
            <span>{t('ctaPrimary')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Case Presets Quick-Launcher (Earth Toned Pills) */}
      <div className="border-t border-earth-750/60 bg-earth-950/70 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <span className="text-earth-400 font-medium flex items-center gap-1.5 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-bronze-400 animate-pulse" />
            Adjudication Dossiers:
          </span>

          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <button
              onClick={() => onSelectScenario('SCENARIO_A')}
              className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all border cursor-pointer ${
                activeScenarioId === 'SCENARIO_A'
                  ? 'bg-bronze-500/20 text-bronze-300 border-bronze-500/50 shadow-glow-bronze font-semibold'
                  : 'bg-earth-900/80 text-earth-400 border-earth-750 hover:border-earth-650 hover:text-earth-200'
              }`}
            >
              {t('presetUpi')}
            </button>

            <button
              onClick={() => onSelectScenario('SCENARIO_B')}
              className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all border cursor-pointer ${
                activeScenarioId === 'SCENARIO_B'
                  ? 'bg-terracotta-500/20 text-terracotta-400 border-terracotta-500/50 shadow-sm font-semibold'
                  : 'bg-earth-900/80 text-earth-400 border-earth-750 hover:border-earth-650 hover:text-earth-200'
              }`}
            >
              {t('presetFraud')}
            </button>

            <button
              onClick={() => onSelectScenario('SCENARIO_C')}
              className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all border cursor-pointer ${
                activeScenarioId === 'SCENARIO_C'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-glow-sage font-semibold'
                  : 'bg-earth-900/80 text-earth-400 border-earth-750 hover:border-earth-650 hover:text-earth-200'
              }`}
            >
              {t('presetPension')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
