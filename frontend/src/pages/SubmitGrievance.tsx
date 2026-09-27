import React, { useState } from 'react';
import { FileText, Send, Sparkles, AlertCircle, ShieldAlert, Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import EvidenceUploader from '../components/citizen/EvidenceUploader';
import { runAgentWorkflow } from '../lib/api';
import { AgentRunRequest } from '../lib/types';
import { Language, translations } from '../lib/translations';

interface SubmitGrievanceProps {
  onNavigate: (tab: string, caseId?: string) => void;
  lang: Language;
}

export const SubmitGrievance: React.FC<SubmitGrievanceProps> = ({ onNavigate, lang }) => {
  const t = translations[lang] || translations.en;

  const [caseId, setCaseId] = useState<string>('CASE-2026-9041');
  const [complaint, setComplaint] = useState<string>(
    'My account was debited ₹1,499 via UPI to Swiggy on 28 Sep 14:32, but merchant app shows payment pending/expired. RRN: 408219482910.'
  );
  const [amount, setAmount] = useState<number>(1499);
  const [rrn, setRrn] = useState<string>('408219482910');
  const [demoScenario, setDemoScenario] = useState<string>('timeout');
  const [maxFailures, setMaxFailures] = useState<number>(4);
  const [maxTokens, setMaxTokens] = useState<number>(10000);
  const [maxIterations, setMaxIterations] = useState<number>(10);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load Presets
  const handleSelectPreset = (preset: 'timeout' | 'clean' | 'high_value' | 'breaker_trip') => {
    if (preset === 'timeout') {
      setCaseId('CASE-2026-9041');
      setAmount(1499);
      setRrn('408219482910');
      setComplaint('My account was debited ₹1,499 via UPI to Swiggy on 28 Sep 14:32, but merchant app shows payment pending/expired. RRN: 408219482910.');
      setDemoScenario('timeout');
      setMaxFailures(4);
      setMaxTokens(10000);
    } else if (preset === 'clean') {
      setCaseId('CASE-2026-3108');
      setAmount(450);
      setRrn('329184029182');
      setComplaint('I claim ₹450 was debited twice at Cafe Coffee Day. Please refund the duplicate debit. RRN: 329184029182.');
      setDemoScenario('clean');
      setMaxFailures(4);
      setMaxTokens(10000);
    } else if (preset === 'high_value') {
      setCaseId('CASE-2026-8812');
      setAmount(85000);
      setRrn('992019482711');
      setComplaint('Transferred ₹85,000 for vendor inventory via NEFT/IMPS. Vendor claims non-receipt after 6 hours. RRN: 992019482711.');
      setDemoScenario('high_value');
      setMaxFailures(4);
      setMaxTokens(10000);
    } else if (preset === 'breaker_trip') {
      setCaseId('CASE-2026-FAIL');
      setAmount(2500);
      setRrn('555123984102');
      setComplaint('Test trigger for runaway loop protection. Tool failure threshold simulation.');
      setDemoScenario('breaker_trip');
      setMaxFailures(2); // Strict failure threshold to force breaker halt
      setMaxTokens(10000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload: AgentRunRequest = {
      complaint: complaint,
      max_consecutive_tool_failures: maxFailures,
      max_token_budget: maxTokens,
      max_iterations: maxIterations,
      demo_scenario: demoScenario,
    };

    try {
      const resp = await runAgentWorkflow(caseId, payload);
      // Navigate to live investigation room
      onNavigate('case', caseId);
    } catch (err: any) {
      console.error('Failed to trigger agent workflow:', err);
      // Even if API returns non-200 or network lag, navigate to CaseDetail so user can observe stream/retry
      setErrorMsg(err.message || 'Workflow launch failed');
      onNavigate('case', caseId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan" />
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.submit_title}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-400">
          Submit your transaction grievance. The FinResolve multi-agent system will reconcile ledgers across your bank, NPCI, and the merchant.
        </p>
      </div>

      {/* Preset Selector Banner */}
      <div className="p-4 rounded-2xl bg-panel border border-panel-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-cyan flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Quick One-Click Test Presets
          </span>
          <span className="text-[10px] font-mono text-gray-500">
            Simulates actual Challenge 1 conditions
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleSelectPreset('timeout')}
            className={`p-3 rounded-xl border text-left transition-all ${
              demoScenario === 'timeout'
                ? 'bg-cyan/15 border-cyan text-cyan'
                : 'bg-obsidian border-panel-border hover:border-gray-600 text-gray-300'
            }`}
          >
            <div className="text-xs font-bold font-mono">1. Asymmetric U69</div>
            <div className="text-[11px] font-mono text-white mt-1">₹1,499 &bull; Swiggy</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Triggers Auto-Reversal</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('clean')}
            className={`p-3 rounded-xl border text-left transition-all ${
              demoScenario === 'clean'
                ? 'bg-emerald/15 border-emerald text-emerald'
                : 'bg-obsidian border-panel-border hover:border-gray-600 text-gray-300'
            }`}
          >
            <div className="text-xs font-bold font-mono">2. Clean 3-Way Match</div>
            <div className="text-[11px] font-mono text-white mt-1">₹450 &bull; CCD Coffee</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Dispute Dismissed</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('high_value')}
            className={`p-3 rounded-xl border text-left transition-all ${
              demoScenario === 'high_value'
                ? 'bg-amber/15 border-amber text-amber'
                : 'bg-obsidian border-panel-border hover:border-gray-600 text-gray-300'
            }`}
          >
            <div className="text-xs font-bold font-mono">3. High-Value Netbank</div>
            <div className="text-[11px] font-mono text-white mt-1">₹85,000 &bull; Vendor</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Ombudsman HITL</div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('breaker_trip')}
            className={`p-3 rounded-xl border text-left transition-all ${
              demoScenario === 'breaker_trip'
                ? 'bg-terracotta/20 border-terracotta text-terracotta'
                : 'bg-obsidian border-panel-border hover:border-gray-600 text-gray-300'
            }`}
          >
            <div className="text-xs font-bold font-mono">4. Breaker Trip Test</div>
            <div className="text-[11px] font-mono text-white mt-1">Simulate Runaway Loop</div>
            <div className="text-[10px] text-gray-400 mt-0.5">Deterministic Safe Halt</div>
          </button>
        </div>
      </div>

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-panel border border-panel-border space-y-6">
        {/* Row 1: Case ID, RRN, Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">
              Case Tracking ID
            </label>
            <input
              type="text"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-obsidian border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">
              NPCI RRN / Transaction Ref
            </label>
            <input
              type="text"
              value={rrn}
              onChange={(e) => setRrn(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-obsidian border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-cyan"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-400 mb-1.5">
              Disputed Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
              min={1}
              className="w-full px-3 py-2 rounded-lg bg-obsidian border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-cyan"
            />
          </div>
        </div>

        {/* Row 2: Grievance Complaint Text */}
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">
            Grievance Description (Natural Language or Hindi/Hinglish)
          </label>
          <textarea
            rows={4}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-obsidian border border-panel-border text-xs text-white focus:outline-none focus:border-cyan font-sans leading-relaxed"
            placeholder="Explain what happened: amount debited, merchant, date, and error message received..."
          />
        </div>

        {/* Row 3: Evidence Uploader */}
        <div>
          <label className="block text-xs font-mono text-gray-400 mb-1.5">
            Supporting Evidence & Bank Statement
          </label>
          <EvidenceUploader
            onExtractedData={(data) => {
              if (data.rrn) setRrn(data.rrn);
              if (data.amount) setAmount(data.amount);
              if (data.complaintText) setComplaint(data.complaintText);
            }}
          />
        </div>

        {/* Row 4: Circuit Breaker Parameter Controls (Advanced Sandbox Guardrails) */}
        <div className="pt-4 border-t border-panel-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-gray-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber" />
              Circuit Breaker Guardrail Parameters (Hardware Safety Bounds)
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              Deterministic Limits
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">
                Max Consecutive Failures (Breaker Trip)
              </label>
              <input
                type="number"
                value={maxFailures}
                onChange={(e) => setMaxFailures(Number(e.target.value))}
                min={1}
                max={5}
                className="w-full px-2.5 py-1.5 rounded bg-obsidian border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">
                Max Token Budget (10,000 Safety Budget)
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min={1000}
                max={20000}
                step={1000}
                className="w-full px-2.5 py-1.5 rounded bg-obsidian border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 mb-1">
                Max Loop Iterations
              </label>
              <input
                type="number"
                value={maxIterations}
                onChange={(e) => setMaxIterations(Number(e.target.value))}
                min={3}
                max={25}
                className="w-full px-2.5 py-1.5 rounded bg-obsidian border border-panel-border text-xs font-mono text-white focus:outline-none focus:border-cyan"
              />
            </div>
          </div>
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-terracotta/15 border border-terracotta/40 text-terracotta text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] font-mono text-gray-500">
            Directly routes to: <span className="text-cyan">FastAPI &rarr; LangGraph &rarr; Supabase</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-blue-500 hover:opacity-90 text-black font-semibold text-xs transition-all shadow-cyan-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Cpu className="w-4 h-4 animate-spin" />
                <span>Initiating LangGraph...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Launch Autonomous Investigation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubmitGrievance;
