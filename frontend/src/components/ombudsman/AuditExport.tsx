import React, { useState } from 'react';
import { FileText, Download, Printer, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { Dispute } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { sound } from '../../lib/audio';

interface AuditExportProps {
  dispute?: Dispute | null;
}

export const AuditExport: React.FC<AuditExportProps> = ({ dispute }) => {
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);

  const disputeId = dispute?.dispute_id || 'GRV-2026-9921';
  const amount = dispute?.claimed_amount || 25000;
  const citizen = dispute?.citizen_name || 'Vaidik Lahoria';

  const handlePrint = () => {
    sound.playTick();
    window.print();
  };

  const handleDownloadMarkdown = () => {
    sound.playTick();
    const mdContent = `
# RESERVE BANK OF INDIA — FINANCIAL OMBUDSMAN DIRECTIVE
## FORMAL STATUTORY ADJUDICATION ORDER (DOCKET REF: ${disputeId})

**Date of Directive:** 26 September 2026  
**Jurisdiction:** Section 35A of Banking Regulation Act, 1949 r/w RBI Ombudsman Scheme 2021  
**Statutory Framework:** Master Direction DPSS.CO.PD.No.1164/02.12.004/2019-20 (Harmonisation of TAT)  

---

### 1. PARTIES TO THE PROCEEDING
- **Complainant / Citizen:** ${citizen}
- **Respondent Institution 1 (Issuer Core CBS):** State Bank of India
- **Respondent Institution 2 (National Rail):** National Payments Corporation of India (NPCI)
- **Respondent Institution 3 (Beneficiary):** MegaRetail Pvt Ltd / Merchant Gateway

---

### 2. CONSENSUS LEDGER RECONCILIATION FINDINGS
The FinResolve Multi-Agent Arbitration Protocol executed automated cryptographic queries across the respective clearing databases:
- **Core Banking System (SBI):** Account successfully debited for ₹${amount.toLocaleString('en-IN')}.00 (Status: SUCCESS).
- **NPCI UPI Switch Ingress:** Switch reported response code U69 (Beneficiary Bank Network Partition).
- **Merchant Gateway Log:** Transaction marked UNPAID / Order Cancelled.

**Statutory Root Cause Finding:** Asymmetric settlement drop. Funds remain uncredited to merchant and stranded in inter-bank settlement transit pool.

---

### 3. STATUTORY OPERATIVE DIRECTIVES
1. **Unconditional Auto-Reversal:** State Bank of India is hereby ORDERED to reverse the sum of ₹${amount.toLocaleString('en-IN')}.00 directly into the complainant's source account within T+1 day.
2. **Statutory Penal Compensation:** Upon delay exceeding T+1 days, SBI shall automatically credit statutory penal compensation of ₹100.00 per calendar day directly to the complainant.
3. **Exoneration of Merchant:** Merchant MegaRetail Pvt Ltd is hereby exonerated from restitution liability.

**Cryptographic Validation Hash:** SHA256:d8c2e91a0f44bc7190e4f3a76e93e2b9c512a8f89e21df9043210190ab77192a
`;

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RBI_Statutory_Order_${disputeId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="qronos-card rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-earth-800 border border-earth-700 flex items-center justify-center text-bronze-400 shadow-earth-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-earth-100 font-mono block">
              {t('modalTitle')}
            </span>
            <span className="text-[11px] text-earth-400">
              {t('modalAuthority')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playTick();
              setShowModal(true);
            }}
            className="flex items-center gap-1.5 py-2 px-4 rounded-full bg-earth-100 hover:bg-earth-50 text-earth-950 text-xs font-bold shadow-earth-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('viewCertificate')}</span>
          </button>

          <button
            onClick={handleDownloadMarkdown}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-full bg-earth-850 hover:bg-earth-800 text-earth-300 border border-earth-700 text-xs font-medium transition-colors cursor-pointer"
            title="Download formal legal markdown"
          >
            <Download className="w-3.5 h-3.5 text-bronze-400" />
            <span>{t('exportMd')}</span>
          </button>
        </div>
      </div>

      {/* Modal Dossier */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-earth-900 border border-earth-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 text-earth-200 space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-earth-400 hover:text-earth-100 p-1.5 rounded-full bg-earth-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center border-b border-earth-750 pb-5 space-y-1.5">
              <div className="text-xs tracking-widest text-bronze-400 font-mono uppercase font-bold">
                Reserve Bank of India &bull; Integrated Ombudsman Protocol
              </div>
              <h2 className="text-lg font-extrabold text-earth-100 font-mono tracking-tight">
                STATUTORY DISPUTE RESOLUTION ORDER
              </h2>
              <div className="text-xs text-earth-400 font-mono">
                Order Case Reference: <span className="text-earth-100 font-bold">{disputeId}</span> &bull; 
                Date: 26-Sep-2026
              </div>
            </div>

            {/* Legal Body */}
            <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-2xl bg-earth-950 border border-earth-800 space-y-1">
                <span className="text-earth-400 text-[10px] uppercase font-mono block">
                  Complainant &amp; Transaction Claim:
                </span>
                <div className="text-earth-100 font-semibold font-mono text-sm">
                  {citizen} &bull; Claimed Amount: ₹{amount.toLocaleString('en-IN')}.00
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-bronze-400 font-semibold font-mono text-xs block">
                  1. Multi-Agent Reconciliation Findings:
                </span>
                <p className="text-earth-300 text-xs leading-relaxed">
                  Autonomous state machine probed Core Banking (State Bank of India), NPCI Inter-bank Switch, and Merchant Payment Gateway. Telemetry established that ₹{amount.toLocaleString('en-IN')}.00 was successfully debited, but NPCI rail encountered code U69 (Beneficiary Timeout). The merchant received zero funds.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-bronze-400 font-semibold font-mono text-xs block">
                  2. Directive to Payer Institution:
                </span>
                <p className="text-earth-300 text-xs leading-relaxed">
                  Under RBI Harmonisation Circular DPSS.CO.PD.No.1164/2019-20, State Bank of India is mandated to complete automatic reversal within T+1 day. Delay beyond T+1 mandates statutory customer compensation of ₹100 per calendar day.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-earth-950 border border-emerald-500/30 text-emerald-300 flex items-center justify-between">
                <div>
                  <span className="block font-semibold text-xs font-mono">Ombudsman Seal &amp; Signature:</span>
                  <span className="text-[10px] font-mono text-bronze-400">
                    SHA256:d8c2e91a0f44bc7190e4f3a76e93e2b9c512...
                  </span>
                </div>
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-earth-750">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-earth-800 hover:bg-earth-750 text-earth-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-bronze-400" />
                <span>{t('btnPrint')}</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-full bg-earth-100 hover:bg-earth-50 text-earth-950 text-xs font-bold transition-colors cursor-pointer"
              >
                {t('btnClose')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
