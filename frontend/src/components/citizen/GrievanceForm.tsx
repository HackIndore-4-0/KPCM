import React, { useState, useEffect } from 'react';
import { Send, Sparkles, User, Phone, FileText, BookmarkCheck, ArrowRight } from 'lucide-react';
import { EvidenceUploader } from './EvidenceUploader';
import { sound } from '../../lib/audio';

interface GrievanceFormProps {
  onSubmit: (complaint: string, evidenceUrls: string[], citizenData?: { name: string; contact: string }) => void;
  isLoading: boolean;
  prefillComplaint?: string;
  prefillScenario?: string;
}

export const GrievanceForm: React.FC<GrievanceFormProps> = ({
  onSubmit,
  isLoading,
  prefillComplaint,
}) => {
  const [citizenName, setCitizenName] = useState('Vaidik Lahoria');
  const [citizenContact, setCitizenContact] = useState('+91 98765 43210');
  const [complaint, setComplaint] = useState(
    prefillComplaint ||
      '₹25,000 was debited from my SBI account to buy an iPad from MegaRetail, but the store says payment failed and merchant never received funds.'
  );
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([
    'https://mock-storage.supabase.co/receipt_sbi_25000.png',
  ]);

  useEffect(() => {
    if (prefillComplaint) {
      setComplaint(prefillComplaint);
    }
  }, [prefillComplaint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim() || isLoading) return;
    sound.playTick();
    onSubmit(complaint, evidenceUrls, { name: citizenName, contact: citizenContact });
  };

  const setPreset = (text: string, name: string) => {
    sound.playTick();
    setComplaint(text);
    setCitizenName(name);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Citizen Identification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
            <User className="w-3 h-3 text-blue-400" />
            Citizen Name
          </label>
          <input
            type="text"
            value={citizenName}
            onChange={(e) => setCitizenName(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1">
            <Phone className="w-3 h-3 text-cyan-400" />
            Contact / Registered Mobile
          </label>
          <input
            type="text"
            value={citizenContact}
            onChange={(e) => setCitizenContact(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            required
          />
        </div>
      </div>

      {/* Complaint Natural Language Box */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Describe Financial Grievance in Plain Language</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono">Zero PII Leakage Guarantee</span>
        </div>

        <textarea
          rows={3}
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="e.g. ₹25,000 debited from SBI for merchant order ORD-9912 but merchant says transaction failed..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all leading-relaxed"
          required
        />
      </div>

      {/* Preset Quick-Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="text-slate-500 font-mono">Presets:</span>
        <button
          type="button"
          onClick={() =>
            setPreset(
              '₹25,000 was debited from my SBI account to buy an iPad from MegaRetail, but the store says payment failed and merchant never received funds.',
              'Vaidik Lahoria'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          ₹25k Failed UPI
        </button>
        <button
          type="button"
          onClick={() =>
            setPreset(
              '₹80,000 unauthorized debit at 3:18 AM from my HDFC salary account. I never shared any OTP or initiated this wire transfer.',
              'Dr. Priya Raman'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          ₹80k Fraud HITL
        </button>
        <button
          type="button"
          onClick={() =>
            setPreset(
              'My September pension of ₹18,500 has not arrived in PNB account after branch merger and IFSC migration.',
              'Rameshwar Dayal'
            )
          }
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
        >
          ₹18.5k Pension Delay
        </button>
      </div>

      {/* Evidence Uploader */}
      <EvidenceUploader
        onUploadComplete={(url) => setEvidenceUrls((prev) => [...prev, url])}
      />

      {/* Submit Trigger */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-50 transition-all cursor-pointer group"
      >
        <Sparkles className="w-4 h-4 text-cyan-300 group-hover:rotate-12 transition-transform" />
        <span className="font-semibold tracking-wide">
          {isLoading ? 'Autonomous Engine Probing Ledgers...' : 'Launch FinResolve Autonomous Redressal'}
        </span>
        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </button>
    </form>
  );
};
