import React from 'react';
import { ShieldAlert, Cpu } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Cpu className="w-6 h-6" />
        </div>
        <div>
          <span className="font-bold text-lg text-white tracking-wider">FINRESOLVE</span>
          <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            HackIndore 4.0
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-2 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Autonomous Engine Ready
        </span>
      </div>
    </nav>
  );
};
