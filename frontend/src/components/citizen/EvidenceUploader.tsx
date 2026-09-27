import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Eye, Trash2, Sparkles } from 'lucide-react';

interface EvidenceFile {
  name: string;
  size: string;
  type: string;
  extractedRRN?: string;
  extractedAmount?: number;
  extractedDate?: string;
}

interface EvidenceUploaderProps {
  onExtractedData?: (data: { rrn?: string; amount?: number; complaintText?: string }) => void;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({ onExtractedData }) => {
  const [files, setFiles] = useState<EvidenceFile[]>([
    {
      name: 'UPI_Debit_SMS_Alert.png',
      size: '184 KB',
      type: 'image/png',
      extractedRRN: '408219482910',
      extractedAmount: 1499,
      extractedDate: '2026-09-28 14:32:01 IST',
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSimulatingOcr, setIsSimulatingOcr] = useState(false);

  const handleSimulateUpload = (sampleType: 'timeout' | 'clean' | 'high_value') => {
    setIsSimulatingOcr(true);
    setTimeout(() => {
      let newFile: EvidenceFile;
      if (sampleType === 'timeout') {
        newFile = {
          name: 'SBI_Passbook_Statement_U69.pdf',
          size: '342 KB',
          type: 'application/pdf',
          extractedRRN: '408219482910',
          extractedAmount: 1499,
          extractedDate: '2026-09-28 14:32:01 IST',
        };
        onExtractedData?.({
          rrn: '408219482910',
          amount: 1499,
          complaintText: 'My account was debited ₹1,499 via UPI to Swiggy, but the merchant never received payment. Ref 408219482910.',
        });
      } else if (sampleType === 'clean') {
        newFile = {
          name: 'Merchant_Receipt_Verified.png',
          size: '210 KB',
          type: 'image/png',
          extractedRRN: '329184029182',
          extractedAmount: 450,
          extractedDate: '2026-09-28 11:15:30 IST',
        };
        onExtractedData?.({
          rrn: '329184029182',
          amount: 450,
          complaintText: 'I claim ₹450 was debited twice at Cafe Coffee Day. Please refund the duplicate debit.',
        });
      } else {
        newFile = {
          name: 'HighValue_Netbanking_Challan.pdf',
          size: '512 KB',
          type: 'application/pdf',
          extractedRRN: '992019482711',
          extractedAmount: 85000,
          extractedDate: '2026-09-28 09:40:12 IST',
        };
        onExtractedData?.({
          rrn: '992019482711',
          amount: 85000,
          complaintText: 'Transferred ₹85,000 for vendor inventory via NEFT/IMPS. Vendor claims non-receipt after 6 hours. RRN 992019482711.',
        });
      }

      setFiles((prev) => [newFile, ...prev]);
      setIsSimulatingOcr(false);
    }, 600);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleSimulateUpload('timeout');
        }}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          isDragging
            ? 'border-cyan bg-cyan/10'
            : 'border-panel-border bg-obsidian/60 hover:border-gray-600'
        }`}
      >
        <UploadCloud className="w-8 h-8 text-cyan mx-auto mb-2" />
        <p className="text-xs text-white font-medium">
          Drag & drop transaction screenshot, bank passbook, or SMS PDF
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          Supports PNG, JPG, PDF up to 10MB (Synthetic OCR Sandbox)
        </p>

        {/* Quick Sample Loaders */}
        <div className="mt-4 pt-3 border-t border-panel-border flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-mono text-gray-400">Load Synthetic Evidence:</span>
          <button
            type="button"
            onClick={() => handleSimulateUpload('timeout')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-panel hover:bg-cyan/10 border border-panel-border text-cyan transition-colors"
          >
            + U69 Asymmetric (₹1,499)
          </button>
          <button
            type="button"
            onClick={() => handleSimulateUpload('clean')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-panel hover:bg-emerald/10 border border-panel-border text-emerald transition-colors"
          >
            + Clean Match (₹450)
          </button>
          <button
            type="button"
            onClick={() => handleSimulateUpload('high_value')}
            className="text-[10px] font-mono px-2 py-1 rounded bg-panel hover:bg-amber/10 border border-panel-border text-amber transition-colors"
          >
            + High-Value (₹85k)
          </button>
        </div>
      </div>

      {/* Extracted Evidence List */}
      {isSimulatingOcr && (
        <div className="p-3 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center gap-2 text-cyan text-xs">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Simulating client-side OCR & entity extraction...</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-gray-400">
            Attached Documents & Extracted Parameters ({files.length}):
          </span>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-panel border border-panel-border flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-black/40 border border-panel-border text-cyan">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white truncate max-w-xs">{file.name}</span>
                    <span className="text-[10px] font-mono text-gray-500">({file.size})</span>
                  </div>
                  {file.extractedRRN && (
                    <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-0.5">
                      <span className="text-cyan">RRN: {file.extractedRRN}</span>
                      <span>&bull;</span>
                      <span className="text-emerald">Amt: ₹{file.extractedAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald/15 text-emerald border border-emerald/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  VERIFIED
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded text-gray-500 hover:text-terracotta transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceUploader;
