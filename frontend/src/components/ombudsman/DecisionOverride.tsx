import React, { useState } from 'react';
import { Check, Edit3, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../../lib/audio';
import { useLanguage } from '../../lib/i18n';

interface DecisionOverrideProps {
  disputeId?: string;
  onDecision?: (decision: 'APPROVE' | 'MODIFY' | 'REJECT', notes: string) => void;
  isEscalated?: boolean;
}

export const DecisionOverride: React.FC<DecisionOverrideProps> = ({
  disputeId = 'GRV-2026-9921',
  onDecision,
  isEscalated = false,
}) => {
  const { t } = useLanguage();
  const [officerNotes, setOfficerNotes] = useState(
    'Dispute verified against NPCI U69 switch error telemetry. Directing immediate Core Banking credit reversal under RBI DPSS.1164.'
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleAction = (decision: 'APPROVE' | 'MODIFY' | 'REJECT') => {
    sound.playSuccessChime();

    if (decision === 'APPROVE') {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#d97706', '#f59e0b', '#22c55e', '#fafaf9'],
      });
    }

    setIsSubmitted(true);
    setLastAction(decision);
    onDecision?.(decision, officerNotes);
  };

  return (
    <div id="ombudsman-cockpit" className="qronos-card rounded-3xl p-6 space-y-4 transition-all">
      <div className="flex items-center justify-between border-b border-earth-750 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-earth-800 border border-earth-700 flex items-center justify-center text-bronze-400 shadow-earth-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm text-earth-100 font-mono block">
              {t('ombudsmanHeading')}
            </span>
            <span className="text-[11px] text-earth-400">
              {t('ombudsmanSub')}
            </span>
          </div>
        </div>

        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-earth-900 border border-earth-750 text-earth-300">
          Target: {disputeId}
        </span>
      </div>

      {isSubmitted ? (
        <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-xs">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">STATUTORY DIRECTIVE COMMITTED: {lastAction}</span>
          </div>
          <p className="text-xs text-earth-200 leading-relaxed font-sans">
            Immutable settlement record ratified with SHA-256 seal. Core Banking System webhook notified for automated credit reversal.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-[11px] text-bronze-400 hover:underline pt-1 cursor-pointer font-mono"
          >
            &larr; Re-open Adjudication Controls
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-mono uppercase text-earth-300 mb-1.5">
              Ombudsman Adjudication Finding &amp; Directive
            </label>
            <textarea
              rows={2}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full bg-earth-900 border border-earth-750 rounded-2xl p-3 text-xs text-earth-200 placeholder-earth-500 focus:outline-none focus:border-bronze-500 font-mono transition-colors leading-relaxed"
              placeholder="Enter official ombudsman adjudication remarks..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => handleAction('APPROVE')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-earth-50 text-xs font-semibold shadow-glow-sage cursor-pointer transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('btnApprove')}</span>
            </button>

            <button
              onClick={() => handleAction('MODIFY')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-earth-850 border border-earth-700 hover:border-earth-600 text-earth-200 text-xs font-semibold cursor-pointer transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-bronze-400" />
              <span>{t('btnModify')}</span>
            </button>

            <button
              onClick={() => handleAction('REJECT')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-rose-950/30 border border-rose-800/60 hover:bg-rose-900/40 text-rose-300 text-xs font-semibold cursor-pointer transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t('btnEscalate')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
