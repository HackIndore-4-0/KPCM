import React, { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

interface EvidenceUploaderProps {
  onUploadComplete: (url: string) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onUploadComplete }) => {
  const [uploaded, setUploaded] = useState(false);

  const handleSimulatedUpload = () => {
    setUploaded(true);
    onUploadComplete('https://mock-storage.supabase.co/receipt_sbi_25000.png');
  };

  return (
    <div
      onClick={handleSimulatedUpload}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
        uploaded
          ? 'border-emerald-500/50 bg-emerald-500/5'
          : 'border-slate-800 hover:border-blue-500/50 hover:bg-slate-900/40'
      }`}
    >
      {uploaded ? (
        <div className="flex flex-col items-center gap-2 text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
          <span className="text-sm font-medium">receipt_sbi_25000.png attached & parsed</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <UploadCloud className="w-8 h-8 text-slate-500" />
          <span className="text-sm">Click to attach UPI screenshot or bank statement</span>
          <span className="text-xs text-slate-600">Supports PNG, JPG, PDF up to 10MB</span>
        </div>
      )}
    </div>
  );
};
