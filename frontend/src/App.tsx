import React, { useState, useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import LandingPage from './pages/LandingPage';
import SubmitGrievance from './pages/SubmitGrievance';
import CaseDetail from './pages/CaseDetail';
import OmbudsmanDashboard from './pages/OmbudsmanDashboard';
import { Language } from './lib/translations';

function parseRouteFromLocation(): { tab: string; caseId?: string } {
  if (typeof window === 'undefined') {
    return { tab: 'landing' };
  }

  // Check pathname first
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  if (pathname.startsWith('/case/')) {
    const id = decodeURIComponent(pathname.replace('/case/', ''));
    if (id) return { tab: 'case', caseId: id };
    return { tab: 'case' };
  }
  if (pathname === '/case') {
    return { tab: 'case' };
  }
  if (pathname === '/submit') {
    return { tab: 'submit' };
  }
  if (pathname === '/ombudsman') {
    return { tab: 'ombudsman' };
  }

  // Fallback: check hash for deep links like #case/..., #submit, #ombudsman
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash) {
    if (hash.startsWith('case/')) {
      const id = decodeURIComponent(hash.replace('case/', ''));
      if (id) return { tab: 'case', caseId: id };
      return { tab: 'case' };
    }
    if (hash === 'case') return { tab: 'case' };
    if (hash === 'submit') return { tab: 'submit' };
    if (hash === 'ombudsman') return { tab: 'ombudsman' };
  }

  return { tab: 'landing' };
}

export const App: React.FC = () => {
  const initialRoute = parseRouteFromLocation();
  const [activeTab, setActiveTab] = useState<string>(initialRoute.tab);
  const [activeCaseId, setActiveCaseId] = useState<string>(initialRoute.caseId || 'CASE-2026-9041');
  const [lang, setLang] = useState<Language>('en');

  // Handle URL pathname and hash changes for deep linking and back/forward navigation
  useEffect(() => {
    const syncRoute = () => {
      const route = parseRouteFromLocation();
      setActiveTab(route.tab);
      if (route.caseId) {
        setActiveCaseId(route.caseId);
      }
    };

    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, []);

  const handleNavigate = (tab: string, caseId?: string) => {
    let targetPath = '/';
    if (tab === 'case' && caseId) {
      setActiveCaseId(caseId);
      targetPath = `/case/${encodeURIComponent(caseId)}`;
    } else if (tab === 'case') {
      targetPath = activeCaseId ? `/case/${encodeURIComponent(activeCaseId)}` : '/case';
    } else if (tab === 'submit') {
      targetPath = '/submit';
    } else if (tab === 'ombudsman') {
      targetPath = '/ombudsman';
    } else {
      targetPath = '/';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab, caseId }, '', targetPath);
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
