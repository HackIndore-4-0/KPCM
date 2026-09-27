import React from 'react';
import { AlertOctagon, Smartphone, MapPin } from 'lucide-react';
import { sound } from '../../lib/audio';
import { useLanguage } from '../../lib/i18n';

interface EscalationInboxProps {
  pendingCount?: number;
  isHITLActive?: boolean;
  onSelectEscalation?: () => void;
}

export const EscalationInbox: React.FC<EscalationInboxProps> = ({
  pendingCount = 1,
  isHITLActive = true,
  onSelectEscalation,
}) => {
  const { t } = useLanguage();

  return (
    <div className="qronos-card rounded-3xl p-6 space-y-3.5 transition-all">
      <div className="flex items-center justify-between border-b border-earth-750 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-earth-800 border border-earth-700 flex items-center justify-center text-bronze-400 shadow-earth-sm">
            <AlertOctagon className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-sm text-earth-100 font-mono block">
              {t('ombudsmanHeading')} Docket
            </span>
            <span className="text-[11px] text-earth-400">
              Statutory safety intercepts awaiting officer ratification
            </span>
          </div>
        </div>

        <span
          className={`text-xs px-3 py-1 rounded-full font-mono font-medium border ${
            isHITLActive
              ? 'bg-bronze-500/15 text-bronze-300 border-bronze-500/40 shadow-glow-bronze animate-pulse'
              : 'bg-earth-900 text-earth-400 border-earth-750'
          }`}
        >
          {isHITLActive ? `${pendingCount} Case Under Review` : '0 Pending'}
        </span>
      </div>

      {isHITLActive ? (
        <div
          onClick={() => {
            sound.playTick();
            onSelectEscalation?.();
          }}
          className="p-4 rounded-2xl bg-earth-900/90 border border-bronze-500/40 hover:border-bronze-400 cursor-pointer transition-all space-y-2.5 group shadow-earth-sm"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-bronze-300 font-bold">GRV-2026-8841</span>
              <span className="text-earth-200 font-medium">Dr. Priya Raman</span>
            </div>
            <span className="font-mono font-bold text-rose-400 text-sm">₹80,000.00</span>
          </div>

          <p className="text-xs text-earth-300 leading-relaxed font-sans">
            Financial exposure (&gt;₹50,000 statutory limit). Contradictory IP origin telemetry vs residential jurisdiction with telecom SIM-swap alert.
          </p>

          <div className="flex items-center justify-between text-[10px] text-earth-400 pt-1 font-mono">
            <span className="flex items-center gap-1 text-bronze-400">
              <Smartphone className="w-3 h-3" /> SIM-Swap: 14m prior
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <MapPin className="w-3 h-3" /> Origin: 185.220.101.42
            </span>
            <span className="text-bronze-300 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
              Open Adjudication File &rarr;
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-earth-400 py-1">
          Disputes exceeding the ₹50,000 ceiling or with confidence &lt; 80% automatically pause here for human officer sign-off. All transactions presently reconciled.
        </p>
      )}
    </div>
  );
};
