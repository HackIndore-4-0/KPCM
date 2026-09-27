import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale } from 'lucide-react';
import { LandingHero } from './components/landing/LandingHero';
import { SubmitGrievance } from './components/citizen/SubmitGrievance';
import { CaseDetail } from './components/citizen/CaseDetail';
import { OmbudsmanDashboard } from './components/ombudsman/OmbudsmanDashboard';
import { Dispute, LedgerRecord, AgentTrace } from './types';
import { SCENARIO_DATA } from './lib/mockData';
import { useDisputeStream } from './hooks/useDisputeStream';
import { apiClient } from './lib/api';

type ActiveScreen = 'LANDING' | 'SUBMIT' | 'CASE_DETAIL' | 'OMBUDSMAN';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('LANDING');

  // Core Dispute State
  const initialData = SCENARIO_DATA['SCENARIO_A'];
  const [dispute, setDispute] = useState<Dispute>(initialData.dispute);
  const [ledgers, setLedgers] = useState<LedgerRecord[]>(initialData.ledgers);
  const [traces, setTraces] = useState<AgentTrace[]>(initialData.traces);
  const [isLoading, setIsLoading] = useState(false);

  // Hook into real SSE if dispute_id changes
  const { traces: sseTraces } = useDisputeStream(dispute?.dispute_id || null);

  // Keyboard Shortcuts for Demo Pitching ([1], [2], [3] for scenarios)
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

  // Format real-time SSE traces if available
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
      if (presetId === 'SCENARIO_B') {
        setCurrentScreen('OMBUDSMAN');
      } else {
        setCurrentScreen('CASE_DETAIL');
      }
    }
  };

  // Run Progressive Trace Animation for Demo Resilience
  const runProgressiveSimulation = (scenarioKey: string) => {
    const data = SCENARIO_DATA[scenarioKey];
    if (!data) return;

    setIsLoading(true);
    setTraces([]);
    setDispute({
      ...data.dispute,
      status: 'INVESTIGATING',
      final_resolution: undefined,
    });
    setCurrentScreen('CASE_DETAIL');

    const stepTraces = data.traces;
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < stepTraces.length) {
        const nextTrace = stepTraces[stepIndex];
        setTraces((prev) => [...prev, nextTrace]);
        stepIndex++;
      } else {
        clearInterval(interval);
        setIsLoading(false);
        setDispute(data.dispute);
        setLedgers(data.ledgers);
      }
    }, 600);
  };

  // Handle Complaint Submission from citizen
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
      // Offline fallback simulation
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

  // Handle Ombudsman Action
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      <AnimatePresence mode="wait">
        {currentScreen === 'LANDING' ? (
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
        ) : (
          <motion.div
            key="app-shell-route"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="min-h-screen flex flex-col"
          >
            {/* Calm, Trustworthy Civic Header */}
            <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
              <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Brand */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentScreen('LANDING')}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400">
                    <Scale className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base tracking-wide text-white font-mono">
                        FINRESOLVE
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                        Civic Redressal
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Clean Screen Navigation */}
                <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-xl p-1 text-xs">
                  {[
                    { id: 'LANDING', label: 'Overview' },
                    { id: 'SUBMIT', label: 'Lodge Grievance' },
                    { id: 'CASE_DETAIL', label: 'Case Details' },
                    { id: 'OMBUDSMAN', label: 'Ombudsman Review' },
                  ].map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setCurrentScreen(tab.id as ActiveScreen)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        currentScreen === tab.id
                          ? tab.id === 'OMBUDSMAN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Engine Live Status Pill */}
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono hidden sm:inline-flex">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Engine Online
                  </span>
                </div>
              </div>
            </header>

            {/* Main Screen Content with Page-Level Animation */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
              <AnimatePresence mode="wait">
                {currentScreen === 'SUBMIT' && (
                  <motion.div
                    key="submit-screen-content"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <SubmitGrievance
                      onSubmit={handleGrievanceSubmit}
                      isLoading={isLoading}
                      onSelectPreset={handlePresetSelect}
                    />
                  </motion.div>
                )}

                {currentScreen === 'CASE_DETAIL' && (
                  <motion.div
                    key="case-detail-screen-content"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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

                {currentScreen === 'OMBUDSMAN' && (
                  <motion.div
                    key="ombudsman-screen-content"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
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
            </main>

            {/* Calm, Trustworthy Footer */}
            <footer className="border-t border-slate-800/60 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
              <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
                <span>
                  FINRESOLVE &bull; Reserve Bank of India Integrated Ombudsman Protocol
                </span>
                <span className="text-slate-600">
                  DPSS.CO.PD.No.1164/2019-20 &bull; Mandatory T+1 Turnaround Time
                </span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
