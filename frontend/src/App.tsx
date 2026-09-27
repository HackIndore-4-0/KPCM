import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import SubmitGrievance from './pages/SubmitGrievance';
import CaseDetail from './pages/CaseDetail';
import OmbudsmanDashboard from './pages/OmbudsmanDashboard';
import { Language } from './lib/translations';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [activeCaseId, setActiveCaseId] = useState<string>('CASE-2026-9041');
  const [lang, setLang] = useState<Language>('en');

  // Handle URL hash changes for deep linking
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (!hash) {
        setActiveTab('landing');
        return;
      }
      if (hash.startsWith('case/')) {
        const id = hash.replace('case/', '');
        if (id) setActiveCaseId(id);
        setActiveTab('case');
      } else if (hash === 'case') {
        setActiveTab('case');
      } else if (hash === 'submit') {
        setActiveTab('submit');
      } else if (hash === 'ombudsman') {
        setActiveTab('ombudsman');
      } else {
        setActiveTab('landing');
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const handleNavigate = (tab: string, caseId?: string) => {
    if (caseId) {
      setActiveCaseId(caseId);
      window.location.hash = `#case/${caseId}`;
    } else {
      window.location.hash = `#${tab}`;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#05060A] text-[#E6E8EC]">
      {/* Top sticky frosted navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => handleNavigate(tab)}
        lang={lang}
        setLang={setLang}
        currentCaseId={activeTab === 'case' ? activeCaseId : undefined}
      />

      {/* Main Page View Area */}
      <main className="flex-1 w-full">
        {activeTab === 'landing' && (
          <LandingPage onNavigate={handleNavigate} lang={lang} />
        )}

        {activeTab === 'submit' && (
          <SubmitGrievance onNavigate={handleNavigate} lang={lang} />
        )}

        {activeTab === 'case' && (
          <CaseDetail
            caseId={activeCaseId}
            onNavigate={handleNavigate}
            lang={lang}
          />
        )}

        {activeTab === 'ombudsman' && (
          <OmbudsmanDashboard onNavigate={handleNavigate} lang={lang} />
        )}
      </main>

      {/* Footer */}
      <Footer lang={lang} />
    </div>
  );
};

export default App;
