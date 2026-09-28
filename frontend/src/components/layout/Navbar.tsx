import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Cpu, Scale, FileText, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import { checkBackendHealth } from '../../lib/api';
import { Language, translations } from '../../lib/translations';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  currentCaseId?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  currentCaseId,
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const t = translations[lang] || translations.en;

  useEffect(() => {
    let isMounted = true;
    const verifyHealth = async () => {
      try {
        const healthy = await checkBackendHealth();
        if (isMounted) setIsHealthy(healthy);
      } catch {
        if (isMounted) setIsHealthy(false);
      }
    };

    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#05060A]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div 
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-magenta/20 border border-cyan/40 flex items-center justify-center shadow-cyan-sm group-hover:border-cyan transition-all">
            <Cpu className="w-5 h-5 text-cyan group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan transition-colors">
                FinResolve
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan hidden sm:inline-block">
                Decision Support
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Prototype Decision-Support Engine
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'landing'
                ? 'bg-cyan/10 text-cyan border border-cyan/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.nav_overview}
          </button>
          
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'submit'
                ? 'bg-cyan/10 text-cyan border border-cyan/30'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {t.nav_submit}
          </button>

          <button
            onClick={() => setActiveTab('case')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'case'
                ? 'bg-cyan/10 text-cyan border border-cyan/30 shadow-cyan-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan" />
            {t.nav_investigation}
            {currentCaseId && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-panel-border rounded text-gray-300">
                {currentCaseId.slice(0, 8)}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ombudsman')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'ombudsman'
                ? 'bg-magenta/10 text-magenta border border-magenta/30 shadow-magenta-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-magenta" />
            {t.nav_ombudsman}
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* Health Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-panel border border-panel-border text-[11px] font-mono">
            {isHealthy === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald animate-pulse" />
                <span className="text-gray-300">GATEWAY 8000</span>
              </>
            ) : isHealthy === false ? (
              <>
                <span className="w-2 h-2 rounded-full bg-terracotta" />
                <span className="text-terracotta">OFFLINE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber animate-ping" />
                <span className="text-gray-400">CONNECTING</span>
              </>
            )}
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher current={lang} onChange={setLang} />

          {/* Fast Submit Action */}
          <button
            onClick={() => setActiveTab('submit')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan to-blue-500 text-black hover:opacity-90 transition-opacity shadow-cyan-sm"
          >
            <span>Submit Grievance</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
