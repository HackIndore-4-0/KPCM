import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, FileImage, Loader2, Sparkles } from 'lucide-react';

interface EvidenceUploaderProps {
  onUploadComplete: (url: string, ocrData?: any) => void;
  defaultReceiptName?: string;
  defaultReceiptUrl?: string;
}

export const EvidenceUploader: React.FC<EvidenceUploaderProps> = ({
  onUploadComplete,
  defaultReceiptName = 'sbi_gpay_receipt_25000.jpg',
  defaultReceiptUrl = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isUploaded, setIsUploaded] = useState(true);
  const [ocrResult] = useState<{
    utr: string;
    amount: string;
    bank: string;
    confidence: string;
  }>({
    utr: 'UTR9832482348',
    amount: '₹25,000.00',
    bank: 'State Bank of India',
    confidence: '98.6%',
  });

  const handleSimulatedUpload = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setIsUploaded(true);
      onUploadComplete(defaultReceiptUrl, ocrResult);
    }, 1100);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <label className="font-medium flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide">
          <FileImage className="w-3.5 h-3.5 text-blue-400" />
          <span>Transaction Evidence &amp; Clearing Slip</span>
        </label>
        <span className="text-[10px] text-slate-400 font-mono">OCR Protocol: Active</span>
      </div>

      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleSimulatedUpload}
        className={`relative border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all overflow-hidden ${
          isUploaded
            ? 'border-emerald-500/40 bg-slate-950/60 shadow-md'
            : 'border-slate-700 hover:border-blue-500/60 bg-slate-950/30'
        }`}
      >
        {/* Laser Scanning Overlay during OCR with Framer Motion */}
        <AnimatePresence>
          {isScanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 space-y-2"
            >
              <div className="w-full h-0.5 bg-blue-400 shadow-[0_0_15px_#38bdf8] animate-pulse" />
              <div className="flex items-center gap-2 text-blue-300 text-xs font-mono font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Cryptographic OCR &amp; PII Scrubbing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isUploaded ? (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white font-mono">{defaultReceiptName}</div>
                  <div className="text-[10px] text-emerald-400/90 font-mono">
                    OCR Ingestion Verified &bull; Confidence {ocrResult.confidence}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSimulatedUpload();
                }}
                className="text-[10px] text-slate-400 hover:text-white px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 font-mono transition-colors"
              >
                Re-Scan
              </motion.button>
            </div>

            {/* Extracted Tokens with Staggered Entrance */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px] text-left">
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Extracted UTR</span>
                <span className="text-blue-300 font-bold truncate block">{ocrResult.utr}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Amount Read</span>
                <span className="text-emerald-400 font-bold block">{ocrResult.amount}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 block text-[9px] uppercase">Bank Entity</span>
                <span className="text-slate-200 truncate block">{ocrResult.bank}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 flex flex-col items-center gap-2 text-slate-400">
            <UploadCloud className="w-8 h-8 text-blue-400" />
            <div className="text-xs">
              <span className="font-semibold text-white">Click to upload UPI screenshot or receipt</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
