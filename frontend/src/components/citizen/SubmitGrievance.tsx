import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, FileText, User, Phone, Sparkles } from 'lucide-react';
import { EvidenceUploader } from './EvidenceUploader';

interface SubmitGrievanceProps {
  onSubmit: (complaint: string, evidenceUrls: string[], citizenData: { name: string; contact: string }) => void;
  isLoading: boolean;
  onSelectPreset?: (presetId: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

export const SubmitGrievance: React.FC<SubmitGrievanceProps> = ({
  onSubmit,
  isLoading,
  onSelectPreset,
}) => {
  const [citizenName, setCitizenName] = useState('Vaidik Lahoria');
  const [contact, setContact] = useState('+91 98765 43210');
  const [complaint, setComplaint] = useState(
    '₹25,000 was debited from my SBI account to buy an iPad from MegaRetail, but payment failed and merchant never received funds.'
  );
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([
    'https://mock-storage.supabase.co/receipt_sbi_25000.png',
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim() || isLoading) return;
    onSubmit(complaint, evidenceUrls, { name: citizenName, contact });
  };

  const handlePreset = (id: string, text: string, name: string) => {
    setComplaint(text);
    setCitizenName(name);
    onSelectPreset?.(id);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto space-y-7 py-4"
    >
      {/* Calm, Trustworthy Civic Header */}
      <motion.div variants={itemVariants} className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>RBI Ombudsman Redressal Protocol &bull; T+1 Mandate</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Lodge Financial Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          Submit your transaction details for autonomous ledger verification across Core Banking, NPCI, and Merchant settlement systems.
        </p>
      </motion.div>

      {/* Demo Quick-Fill Bar with Staggered Interactive Chips */}
      <motion.div
        variants={itemVariants}
        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs"
      >
        <span className="text-[11px] text-slate-400 font-mono">Demo Scenarios:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            {
              id: 'SCENARIO_A',
              text: '₹25,000 was debited from my SBI account to buy an iPad from MegaRetail, but payment failed and merchant never received funds.',
              name: 'Vaidik Lahoria',
              label: '₹25k Failed UPI',
              highlight: false,
            },
            {
              id: 'SCENARIO_B',
              text: '₹80,000 unauthorized debit at 3:18 AM from my HDFC salary account. I never shared any OTP or initiated this wire transfer.',
              name: 'Dr. Priya Raman',
              label: '₹80k Fraud (HITL)',
              highlight: true,
            },
            {
              id: 'SCENARIO_C',
              text: 'My September pension of ₹18,500 has not arrived in PNB account after branch merger and IFSC migration.',
              name: 'Rameshwar Dayal',
              label: '₹18.5k Pension Delay',
              highlight: false,
            },
          ].map((preset) => (
            <motion.button
              key={preset.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePreset(preset.id, preset.text, preset.name)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer border ${
                preset.highlight
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {preset.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Main Submission Card */}
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit}
        className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 backdrop-blur-md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.div variants={itemVariants}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Mobile / WhatsApp Number</span>
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Describe the Transaction Dispute</span>
          </label>
          <textarea
            rows={3}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            placeholder="e.g. ₹25,000 debited from SBI account for merchant order but payment timed out..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
            required
          />
        </motion.div>

        {/* Evidence Uploader */}
        <motion.div variants={itemVariants}>
          <EvidenceUploader
            onUploadComplete={(url) => setEvidenceUrls((prev) => [...prev, url])}
          />
        </motion.div>

        {/* The ONE Primary Action with Tactile Motion & Shimmer State */}
        <motion.div variants={itemVariants}>
          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="relative w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 transition-all overflow-hidden"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span>Initiating Multi-Bank Investigation...</span>
              </div>
            ) : (
              <>
                <span>Submit Grievance for Autonomous Audit</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.form>
    </motion.div>
  );
};
