import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { EvidenceUploader } from './EvidenceUploader';

interface GrievanceFormProps {
  onSubmit: (complaint: string, evidenceUrls: string[]) => void;
  isLoading: boolean;
}

export const GrievanceForm: React.FC<GrievanceFormProps> = ({ onSubmit, isLoading }) => {
  const [complaint, setComplaint] = useState(
    '₹25,000 was debited from my SBI account to buy an iPad from MegaRetail, but merchant never received funds and order was cancelled.'
  );
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) return;
    onSubmit(complaint, evidenceUrls);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Describe Financial Grievance in Plain Language
        </label>
        <textarea
          rows={3}
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="e.g. ₹25,000 debited via UPI but merchant didn't receive it..."
          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <EvidenceUploader
        onUploadComplete={(url) => setEvidenceUrls((prev) => [...prev, url])}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        {isLoading ? 'Autonomous Engine Probing Ledgers...' : 'Launch FinResolve Autonomous Redressal'}
      </button>
    </form>
  );
};
