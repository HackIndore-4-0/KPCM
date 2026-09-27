import React from 'react';
import { ShieldAlert, Cpu, Terminal, ExternalLink } from 'lucide-react';
import { Language, translations } from '../../lib/translations';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang] || translations.en;

  return (
    <footer className="w-full border-t border-panel-border bg-[#05060A] text-gray-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: System Brand & Vision */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan" />
              <span className="font-bold text-white tracking-wide text-sm">FinResolve AI</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan/10 border border-cyan/30 text-cyan">
                Decision Support Prototype
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-lg">
              FinResolve is a prototype agentic decision-support system for complex financial grievances using synthetic banking data and human oversight for consequential decisions.
            </p>
            <div className="p-2.5 rounded-lg bg-panel border border-panel-border text-[11px] text-gray-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <span>
                <strong>Policy-Informed Prototype:</strong> References principles from RBI Master Directions for contextual dispute reconciliation. Not an official regulatory authority, banking switch, or legal adjudicator.
              </span>
            </div>
          </div>

          {/* Col 2: Pipeline Architecture */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 font-mono">
              Pipeline Stack
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
                <span>OpenTelemetry = Observability</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald"></span>
                <span>CircuitBreaker = Safety Enforcement</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-magenta"></span>
                <span>LangGraph = Workflow Orchestration</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber"></span>
                <span>Supabase = State Persistence</span>
              </li>
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span>React 18 = Human-in-the-Loop UI</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Sandbox Disclaimer */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3 font-mono">
              Compliance & Safety
            </h4>
            <div className="text-[11px] text-gray-400 space-y-2">
              <p>
                <strong>Synthetic Sandbox:</strong> All transaction hashes, RRNs, account numbers, and CBS logs are synthetically generated mock fixtures. Zero real customer PII is processed.
              </p>
              <p>
                <strong>Deterministic Limits:</strong> Max 4 consecutive tool failures, 10,000 token safety budget, and human review required for claimed amounts &gt; ₹50,000.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-panel-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <div>
            FinResolve Project &bull; HackIndore 4.0 Challenge 1 &bull; Autonomous Grievance Resolution
          </div>
          <div className="flex items-center gap-4 font-mono">
            <span>Deterministic Tri-Party Engine</span>
            <span>&bull;</span>
            <span className="text-emerald">Strict HITL Governance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
