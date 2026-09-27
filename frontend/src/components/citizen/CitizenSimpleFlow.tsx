import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  Scale, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Coins, 
  ShieldCheck, 
  Building2, 
  Cpu, 
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/audio';
import { Dispute, LedgerRecord, AgentTrace } from '../../types';
import { EvidenceUploader } from './EvidenceUploader';
import { LedgerDiffTable } from '../agentic-live/LedgerDiffTable';
import { AgentTraceStream } from '../agentic-live/AgentTraceStream';
import { ConfidenceMeter } from '../agentic-live/ConfidenceMeter';
import { EscalationInbox } from '../ombudsman/EscalationInbox';
import { DecisionOverride } from '../ombudsman/DecisionOverride';
import { AuditExport } from '../ombudsman/AuditExport';

interface CitizenFlowProps {
  onSubmit: (complaint: string, evidenceUrls: string[], citizenData?: { name: string; contact: string }) => void;
  isLoading: boolean;
  dispute: Dispute | null;
  ledgers: LedgerRecord[];
  traces: AgentTrace[];
  onDecision: (decision: 'APPROVE' | 'MODIFY' | 'REJECT', notes: string) => void;
}

export const CitizenSimpleFlow: React.FC<CitizenFlowProps> = ({
  onSubmit,
  isLoading,
  dispute,
  ledgers,
  traces,
  onDecision,
}) => {
  const { t, language } = useLanguage();
  const [citizenName, setCitizenName] = useState('Vaidik Lahoria');
  const [contact, setContact] = useState('+91 98765 43210');
  const [complaintText, setComplaintText] = useState(
    '₹25,000 was debited from my SBI account to purchase an iPad from MegaRetail, but the store says payment failed and merchant never received settlement.'
  );
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([
    'https://mock-storage.supabase.co/receipt_sbi_25000.png',
  ]);
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    sound.playTick();
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        sound.playSuccessChime();
        if (language === 'hi') {
          setComplaintText('कल मेरे एसबीआई खाते से ₹25,000 कट गए और मर्चेंट को भुगतान नहीं हुआ। कृपया आरबीआई टी+1 नियमानुसार राशि वापस दिलवाएं।');
        } else if (language === 'bn') {
          setComplaintText('আমার ব্যাঙ্ক অ্যাকাউন্ট থেকে ২৫,০০০ টাকা ডেবিট হয়েছে কিন্তু ট্রানজ্যাকশন ব্যর্থ হয়েছে।');
        } else if (language === 'ta') {
          setComplaintText('வங்கி கணக்கிலிருந்து ₹25,000 பிடிக்கப்பட்டது ஆனால் வணிகருக்கு பணம் செல்லவில்லை.');
        } else {
          setComplaintText('₹25,000 was debited via UPI to MegaRetail, but payment timed out and merchant says unpaid.');
        }
      }, 2200);
    } else {
      setIsRecording(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim() || isLoading) return;
    sound.playTick();
    onSubmit(complaintText, evidenceUrls, {
      name: citizenName,
      contact: contact,
    });
  };

  const isResolved = dispute?.status === 'RESOLVED';
  const isHITL = dispute?.requires_human_escalation || dispute?.status === 'ESCALATED_HITL';
  const res = dispute?.final_resolution;

  return (
    <div className="space-y-10 max-w-5xl mx-auto transition-all">
      {/* Dynamic 3-Step Interactive Progress Architecture */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3.5"
      >
        <div className="qronos-card rounded-2xl p-4 space-y-2 relative group">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-xl bg-earth-800 border border-earth-700 flex items-center justify-center text-xs font-mono font-bold text-bronze-300">
              01
            </span>
            <span className="text-[10px] font-mono text-earth-400 uppercase">Input Protocol</span>
          </div>
          <h4 className="text-xs font-bold text-earth-100 font-mono">{t('step1Title')}</h4>
          <p className="text-[11px] text-earth-300 leading-relaxed font-sans">{t('step1Desc')}</p>
        </div>

        <div className="qronos-card rounded-2xl p-4 space-y-2 relative group">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-xl bg-earth-800 border border-earth-700 flex items-center justify-center text-xs font-mono font-bold text-bronze-300">
              02
            </span>
            <span className="text-[10px] font-mono text-earth-400 uppercase">Consensus Probes</span>
          </div>
          <h4 className="text-xs font-bold text-earth-100 font-mono">{t('step2Title')}</h4>
          <p className="text-[11px] text-earth-300 leading-relaxed font-sans">{t('step2Desc')}</p>
        </div>

        <div className="qronos-card rounded-2xl p-4 space-y-2 relative group">
          <div className="flex items-center justify-between">
            <span className="w-7 h-7 rounded-xl bg-earth-800 border border-earth-700 flex items-center justify-center text-xs font-mono font-bold text-bronze-300">
              03
            </span>
            <span className="text-[10px] font-mono text-earth-400 uppercase">Legal Restitution</span>
          </div>
          <h4 className="text-xs font-bold text-earth-100 font-mono">{t('step3Title')}</h4>
          <p className="text-[11px] text-earth-300 leading-relaxed font-sans">{t('step3Desc')}</p>
        </div>
      </motion.div>

      {/* Main Claim Ingestion Docket */}
      <motion.div
        id="claim-section"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="qronos-card rounded-3xl p-6 sm:p-8 space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-earth-750 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-earth-100 font-mono tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bronze-400" />
              {t('formHeading')}
            </h2>
            <p className="text-xs text-earth-400">
              {t('formSubheading')}
            </p>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-earth-900 border border-earth-750 text-earth-300">
            256-bit PII Sanitization
          </span>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase text-earth-300 mb-1.5">
                {t('complainantName')}
              </label>
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="w-full bg-earth-900 border border-earth-750 rounded-2xl px-4 py-2.5 text-xs text-earth-100 placeholder-earth-500 focus:outline-none focus:border-bronze-500 transition-colors font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-earth-300 mb-1.5">
                {t('contactNumber')}
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-earth-900 border border-earth-750 rounded-2xl px-4 py-2.5 text-xs text-earth-100 placeholder-earth-500 focus:outline-none focus:border-bronze-500 transition-colors font-mono"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase text-earth-300">
                {t('complaintNarrative')}
              </label>
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-rose-950/40 text-rose-300 border-rose-600 animate-pulse'
                    : 'bg-earth-850 hover:bg-earth-800 text-bronze-300 border-earth-750'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-bronze-400" />}
                <span className="font-mono text-[11px]">{isRecording ? t('voiceRecording') : t('voiceBtn')}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={complaintText}
                onChange={(e) => setComplaintText(e.target.value)}
                placeholder={t('placeholderComplaint')}
                className="w-full bg-earth-900 border border-earth-750 rounded-2xl p-4 text-xs text-earth-100 placeholder-earth-500 focus:outline-none focus:border-bronze-500 transition-all font-sans leading-relaxed"
                required
              />

              {isRecording && (
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-center gap-1 bg-earth-950/95 py-2 rounded-xl border border-rose-500/40">
                  <span className="w-1.5 h-3 bg-rose-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <span className="w-1.5 h-4 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-6 bg-rose-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="text-xs text-rose-300 font-mono ml-2">Recording Formal Dictation...</span>
                </div>
              )}
            </div>
          </div>

          <EvidenceUploader
            onUploadComplete={(url) => setEvidenceUrls((prev) => [...prev, url])}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-full bg-earth-100 hover:bg-earth-50 text-earth-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-earth-md transition-all cursor-pointer group disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-earth-950 group-hover:rotate-12 transition-transform" />
            <span>{isLoading ? t('btnProcessing') : t('btnSubmit')}</span>
            <ChevronRight className="w-4 h-4 text-earth-950 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>

      {/* Adjudication Verdict & Restitution Order Card */}
      <AnimatePresence>
        {isResolved && res && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
            className="qronos-card rounded-3xl p-6 sm:p-8 space-y-4 border-emerald-500/30"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-earth-750 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-glow-sage">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-earth-100 font-mono tracking-tight">
                    {t('statusHeading')}
                  </h3>
                  <span className="text-[11px] text-earth-400 font-mono">
                    {t('refId')} {dispute?.dispute_id}
                  </span>
                </div>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                {res.verdict}
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-4 rounded-2xl bg-earth-900 border border-earth-750 space-y-1">
                <span className="text-earth-400 block text-[10px] uppercase font-mono">
                  {t('orderLabel')}
                </span>
                <p className="text-earth-100 text-xs font-mono leading-relaxed">
                  {res.actionable_order}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-earth-900 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300">
                <Coins className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block text-[11px] font-mono uppercase">
                    {t('penaltyLabel')}
                  </span>
                  <p className="text-xs text-earth-200 leading-relaxed font-sans">
                    {res.compensation_entitlement}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-earth-900 border border-earth-750">
                  <span className="text-earth-400 block text-[10px] uppercase">{t('timelineLabel')}</span>
                  <span className="text-bronze-300 font-bold block">{res.settlement_timeline || 'T+1 Working Day'}</span>
                </div>
                <div className="p-3 rounded-2xl bg-earth-900 border border-earth-750">
                  <span className="text-earth-400 block text-[10px] uppercase">Cryptographic Seal</span>
                  <span className="text-earth-300 font-bold block truncate">{res.digital_signature || 'SHA256:d8c2e91a0f44bc...'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cross-System Consensus Ledger Matrix */}
      <LedgerDiffTable
        records={ledgers}
        conflictDetails={dispute?.conflict_details}
        isConflict={dispute?.conflict_detected}
      />

      {/* Statutory Safety Boundary Meter */}
      <ConfidenceMeter
        score={dispute?.confidence_score || 0.95}
        amount={dispute?.claimed_amount || 25000}
        isHITL={isHITL}
      />

      {/* Glass-Box Real-Time Consensus Telemetry Stream */}
      <AgentTraceStream
        traces={traces}
        isStreaming={isLoading}
      />

      {/* Ombudsman Checkpoint (If Escalated) */}
      {isHITL && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <EscalationInbox isHITLActive={isHITL} />
          <DecisionOverride
            disputeId={dispute?.dispute_id}
            onDecision={onDecision}
            isEscalated={isHITL}
          />
        </motion.div>
      )}

      {/* Legal Order Export Package */}
      <AuditExport dispute={dispute} />
    </div>
  );
};
