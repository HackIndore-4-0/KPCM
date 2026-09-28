import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Zap, Download, LogIn, LogOut, User, ShieldCheck } from 'lucide-react';
import { WelcomePage } from './components/welcome/WelcomePage';
import { LoginPage, AuthUser } from './components/auth/LoginPage';
import { LandingHero } from './components/landing/LandingHero';
import { SubmitGrievance } from './components/citizen/SubmitGrievance';
import { CaseDetail } from './components/citizen/CaseDetail';
import { OmbudsmanDashboard } from './components/ombudsman/OmbudsmanDashboard';
import { GlowCursorTrail } from './components/ui/glow-cursor-trail';
import { Dispute, LedgerRecord, AgentTrace } from './types';
import { SCENARIO_DATA } from './lib/mockData';
import { useDisputeStream } from './hooks/useDisputeStream';
import { usePWAInstall } from './hooks/usePWAInstall';
import { apiClient } from './lib/api';

type ActiveScreen = 'WELCOME' | 'LOGIN' | 'LANDING' | 'SUBMIT' | 'CASE_DETAIL' | 'OMBUDSMAN';

const NAV_TABS = [
  { id: 'WELCOME', label: 'Welcome' },
  { id: 'LANDING', label: 'Engine Demo' },
  { id: 'SUBMIT', label: 'Lodge Grievance' },
  { id: 'CASE_DETAIL', label: 'Case Details' },
  { id: 'OMBUDSMAN', label: 'Ombudsman' },
] as const;

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('WELCOME');
  const [loginRole, setLoginRole] = useState<'citizen' | 'ombudsman'>('citizen');
  const [currentUser, setCurrentUser] = useState<{ username: string; role: 'citizen' | 'ombudsman' } | null>(null);
  const { isInstallable, promptInstall } = usePWAInstall();

  // Restore authenticated session from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem('finresolve_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('finresolve_token');
    localStorage.removeItem('finresolve_user');
    setCurrentUser(null);
    setCurrentScreen('WELCOME');
  };

  const initialData = SCENARIO_DATA['SCENARIO_A'];
  const [dispute, setDispute] = useState<Dispute>(initialData.dispute);
  const [ledgers, setLedgers] = useState<LedgerRecord[]>(initialData.ledgers);
  const [traces, setTraces] = useState<AgentTrace[]>(initialData.traces);
  const [isLoading, setIsLoading] = useState(false);

  const { traces: sseTraces } = useDisputeStream(dispute?.dispute_id || null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === '1') handlePresetSelect('SCENARIO_A');
      if (e.key === '2') handlePresetSelect('SCENARIO_B');
      if (e.key === '3') handlePresetSelect('SCENARIO_C');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (sseTraces && sseTraces.length > 0) {
      const formatted: AgentTrace[] = sseTraces.map((st) => ({
        node_name: st.node,
        action_type: st.action,
        content: st.msg,
        latency_ms: 100,
        status: st.action.includes('ERROR') ? 'ERROR' : st.action.includes('TIMEOUT') ? 'WARNING' : 'SUCCESS',
      }));
      setTraces(formatted);
    }
  }, [sseTraces]);

  const handlePresetSelect = (presetId: string) => {
    const data = SCENARIO_DATA[presetId];
    if (data) {
      setDispute(data.dispute);
      setLedgers(data.ledgers);
      setTraces(data.traces);
      setCurrentScreen(presetId === 'SCENARIO_B' ? 'OMBUDSMAN' : 'CASE_DETAIL');
    }
  };

  const runProgressiveSimulation = (scenarioKey: string) => {
    const data = SCENARIO_DATA[scenarioKey];
    if (!data) return;
    setIsLoading(true);
    setTraces([]);
    setDispute({ ...data.dispute, status: 'INVESTIGATING', final_resolution: undefined });
    setCurrentScreen('CASE_DETAIL');
    const stepTraces = data.traces;
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < stepTraces.length) {
        setTraces((prev) => [...prev, stepTraces[stepIndex++]]);
      } else {
        clearInterval(interval);
        setIsLoading(false);
        setDispute(data.dispute);
        setLedgers(data.ledgers);
      }
    }, 600);
  };

  const handleGrievanceSubmit = async (
    complaintText: string,
    evidenceUrls: string[],
    citizenData: { name: string; contact: string }
  ) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/api/v1/disputes/', {
        citizen_name: citizenData.name,
        citizen_contact: citizenData.contact,
        complaint_text: complaintText,
        evidence_urls: evidenceUrls,
      });
      setDispute(res.data);
      setCurrentScreen('CASE_DETAIL');
    } catch {
      if (complaintText.includes('80,000') || complaintText.toLowerCase().includes('fraud')) {
        runProgressiveSimulation('SCENARIO_B');
      } else if (complaintText.toLowerCase().includes('pension')) {
        runProgressiveSimulation('SCENARIO_C');
      } else {
        runProgressiveSimulation('SCENARIO_A');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOmbudsmanDecision = (decision: 'APPROVE' | 'MODIFY' | 'REJECT', notes: string) => {
    setDispute((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        status: 'RESOLVED',
        requires_human_escalation: false,
        ombudsman_verdict: decision,
        final_resolution: {
          verdict: `OMBUDSMAN_${decision}_RATIFIED`,
          actionable_order: `Official Ombudsman Directive: ${notes}`,
          regulatory_basis: 'Section 35A Banking Regulation Act r/w RBI Ombudsman Scheme 2021',
          compensation_entitlement: 'Standard statutory auto-reversal + ₹100/day penal compensation.',
          merchant_status: 'EXONERATED_NO_FUNDS_RECEIVED',
          citizen_summary: `Your dispute was personally ratified by the Financial Ombudsman with verdict: ${decision}.`,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-[#e6e8ec] flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Custom glow/trail cursor */}
      <GlowCursorTrail />

      {/* Persistent App Header on App Shell Screens */}
      {currentScreen !== 'WELCOME' && currentScreen !== 'LOGIN' && (
        <header className="border-b border-cyan-500/10 bg-[#05060a]/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentScreen('WELCOME')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:border-cyan-500/40 group-hover:shadow-glow-cyan transition-all overflow-hidden p-1">
                <img src="/icons/finresolve-icon.svg" alt="FinResolve" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-wider text-[#e6e8ec] font-mono">
                    FINRESOLVE
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-800 border border-cyan-500/15 text-[#8892a4] font-mono hidden sm:inline-block">
                    Civic Redressal
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Screen Navigation */}
            <nav aria-label="App sections" className="hidden md:flex items-center gap-1 bg-[#080a10]/80 border border-cyan-500/10 rounded-xl p-1 text-xs">
              {NAV_TABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCurrentScreen(tab.id as ActiveScreen)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500 ${
                    currentScreen === tab.id
                      ? tab.id === 'OMBUDSMAN'
                        ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/25'
                      : 'text-[#8892a4] hover:text-[#e6e8ec] hover:bg-[#0d0f18]'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </nav>

            {/* Status, User & PWA Actions */}
            <div className="flex items-center gap-2.5">
              {/* PWA Install Button */}
              {isInstallable && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={promptInstall}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-glow-cyan transition-all cursor-pointer"
                  title="Install FinResolve as a desktop or mobile app"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span className="hidden sm:inline">Install PWA</span>
                </motion.button>
              )}

              {/* User Account / Auth Status */}
              {currentUser ? (
                <div className="flex items-center gap-2 bg-[#080a12] border border-cyan-500/15 rounded-xl px-2.5 py-1 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    {currentUser.role === 'ombudsman' ? (
                      <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="text-[#e6e8ec] truncate max-w-[100px]">{currentUser.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="text-[#8892a4] hover:text-rose-400 transition-colors cursor-pointer p-0.5"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setLoginRole('citizen');
                    setCurrentScreen('LOGIN');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer font-mono"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Engine Live Status Pill */}
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono hidden lg:inline-flex">
                <span className="relative flex">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40 animate-ping" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </span>
                Engine Online
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Screen Router */}
      <AnimatePresence mode="wait">
        {/* 1. Welcome Screen */}
        {currentScreen === 'WELCOME' && (
          <motion.div
            key="welcome-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-1 flex flex-col justify-center"
          >
            <WelcomePage
              onSelectRole={(role) => {
                setLoginRole(role);
                setCurrentScreen('LOGIN');
              }}
              onExploreDemo={() => setCurrentScreen('LANDING')}
            />
          </motion.div>
        )}

        {/* 2. Login Screen */}
        {currentScreen === 'LOGIN' && (
          <motion.div
            key="login-route"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full flex-1 flex flex-col justify-center"
          >
            <LoginPage
              initialRole={loginRole}
              onLoginSuccess={(user: AuthUser) => {
                setCurrentUser({ username: user.username, role: user.role });
                setCurrentScreen(user.role === 'ombudsman' ? 'OMBUDSMAN' : 'SUBMIT');
              }}
              onBack={() => setCurrentScreen('WELCOME')}
            />
          </motion.div>
        )}

        {/* 3. Interactive Engine Landing & Graph Visualizer */}
        {currentScreen === 'LANDING' && (
          <motion.div
            key="landing-route"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <LandingHero
              onFileGrievance={() => setCurrentScreen('SUBMIT')}
              onViewLiveDemo={() => runProgressiveSimulation('SCENARIO_A')}
              onNavigateToOmbudsman={() => setCurrentScreen('OMBUDSMAN')}
            />
          </motion.div>
        )}

        {/* 4. Citizen Grievance Submission */}
        {currentScreen === 'SUBMIT' && (
          <motion.div
            key="submit-screen-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 max-w-5xl w-full mx-auto px-4 py-6"
          >
            <SubmitGrievance
              onSubmit={handleGrievanceSubmit}
              isLoading={isLoading}
              onSelectPreset={handlePresetSelect}
            />
          </motion.div>
        )}

        {/* 5. Case Details & Live Multi-Ledger Reconciliation */}
        {currentScreen === 'CASE_DETAIL' && (
          <motion.div
            key="case-detail-screen-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 max-w-5xl w-full mx-auto px-4 py-6"
          >
            <CaseDetail
              dispute={dispute}
              ledgers={ledgers}
              traces={traces}
              isLoading={isLoading}
              onBack={() => setCurrentScreen('SUBMIT')}
              onDecision={handleOmbudsmanDecision}
            />
          </motion.div>
        )}

        {/* 6. Ombudsman Review & Approval Cockpit */}
        {currentScreen === 'OMBUDSMAN' && (
          <motion.div
            key="ombudsman-screen-content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 max-w-5xl w-full mx-auto px-4 py-6"
          >
            <OmbudsmanDashboard
              dispute={dispute}
              ledgers={ledgers}
              traces={traces}
              isLoading={isLoading}
              onBack={() => setCurrentScreen('SUBMIT')}
              onDecision={handleOmbudsmanDecision}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark Neon Regulatory Footer */}
      {currentScreen !== 'WELCOME' && currentScreen !== 'LOGIN' && (
        <footer className="border-t border-cyan-500/10 bg-[#05060a] py-4 px-6 text-center">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-[#4a5568]">
            <span className="text-[#8892a4]">
              FINRESOLVE &bull; Reserve Bank of India Integrated Ombudsman Protocol
            </span>
            <span>
              DPSS.CO.PD.No.1164/2019-20 &bull; Mandatory T+1 Turnaround Time
            </span>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;
