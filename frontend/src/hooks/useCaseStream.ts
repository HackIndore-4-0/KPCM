import { useState, useEffect, useCallback, useRef } from 'react';
import { getCaseStreamUrl, getRunTimeline } from '../lib/api';
import { TraceEvent, TimelineEvent, HaltEvent } from '../lib/types';

export interface UseCaseStreamResult {
  traces: TraceEvent[];
  events: TimelineEvent[];
  latestEvent: TraceEvent | null;
  runId: string | null;
  activeNode: string | null;
  completedNodes: string[];
  haltedNode: string | null;
  haltEvent: HaltEvent | null;
  breakerStatus: string;
  finalResolution: string | null;
  confidence: number | null;
  tokenUsage: number;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  clearEvents: () => void;
  reconnect: () => void;
  syncTimeline: () => Promise<void>;
}

function getSyntheticFallbackData(caseId?: string | null) {
  if (caseId === 'CASE-2026-FAIL') {
    return {
      activeNode: 'safe_halt',
      completedNodes: ['triage', 'skeptic', 'evidence_gatherer'],
      haltedNode: 'safe_halt',
      breakerStatus: 'TRIPPED',
      haltEvent: {
        event: 'CIRCUIT_BREAKER_TRIPPED',
        case_id: 'CASE-2026-FAIL',
        run_id: 'RUN-DEMO-BREAKER-01',
        trigger: 'CONSECUTIVE_TOOL_FAILURES',
        threshold: 4,
        observed: 4,
        node: 'evidence_gatherer',
        tool: 'query_bank_cbs',
        consecutive_failures: 4,
        tokens_consumed: 3420,
        reason: '4 consecutive Core Banking CBS timeouts detected. Circuit breaker halted execution.',
        action: 'HALT_AND_ESCALATE',
        timestamp: new Date().toISOString(),
      },
      confidence: null,
      tokenUsage: 3420,
      finalResolution: 'SAFE_HALT_EXECUTED',
      traces: [
        {
          node: 'triage',
          action: 'PARSE_GRIEVANCE',
          status: 'SUCCESS',
          msg: 'Runaway-loop test scenario loaded: Synthetic tool failure injection.',
          details: { case_id: 'CASE-2026-FAIL', mode: 'SIMULATED_FAILURE_INJECTION' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'skeptic',
          action: 'ANOMALY_SCAN',
          status: 'SUCCESS',
          msg: 'Simulated failure injection test in progress. Monitoring breaker thresholds.',
          details: { risk_level: 'CONTROLLED_TEST' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_CBS',
          status: 'FAILED',
          msg: 'Core Banking CBS gateway timeout (Attempt 1 of 4).',
          details: { consecutive_failures: 1, limit: 4 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_CBS',
          status: 'FAILED',
          msg: 'Core Banking CBS gateway timeout (Attempt 2 of 4).',
          details: { consecutive_failures: 2, limit: 4 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_CBS',
          status: 'FAILED',
          msg: 'Core Banking CBS gateway timeout (Attempt 3 of 4).',
          details: { consecutive_failures: 3, limit: 4 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_CBS',
          status: 'FAILED',
          msg: 'Core Banking CBS gateway timeout (Attempt 4 of 4) — Safety Limit Reached.',
          details: { consecutive_failures: 4, limit: 4 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'safe_halt',
          action: 'CIRCUIT_BREAKER_HALT',
          status: 'CIRCUIT_BREAKER_HALT',
          msg: 'SAFETY GUARDRAIL TRIGGERED: 4 consecutive tool failures exceeded safety ceiling. Execution safely halted.',
          details: { trigger: 'CONSECUTIVE_TOOL_FAILURES', limit: 4, safe_degradation: 'HUMAN_REVIEW_REQUIRED' },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  if (caseId === 'CASE-2026-8812') {
    return {
      activeNode: 'human_review',
      completedNodes: ['triage', 'skeptic', 'evidence_gatherer', 'conflict_arbiter', 'planner', 'validator', 'human_review'],
      haltedNode: null,
      breakerStatus: 'ALLOW',
      haltEvent: null,
      confidence: 0.92,
      tokenUsage: 4120,
      finalResolution: 'ESCALATE_FOR_HUMAN_REVIEW',
      traces: [
        {
          node: 'triage',
          action: 'PARSE_GRIEVANCE',
          status: 'SUCCESS',
          msg: 'High-value transaction identified: ₹85,000.00 NEFT/IMPS transfer to vendor.',
          details: { amount: 85000, rrn: '992019482711' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'skeptic',
          action: 'ANOMALY_SCAN',
          status: 'SUCCESS',
          msg: 'Vendor account status and IFSC verified against beneficiary records.',
          details: { anomaly_flag: false },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_CBS',
          status: 'SUCCESS',
          msg: 'Core Banking debited ₹85,000.00 at 09:40:12 IST with Batch REF-99201.',
          details: { status: 'DEBIT_CONFIRMED', amount: 85000 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_NPCI',
          status: 'SUCCESS',
          msg: 'Switch response pending clearing reconciliation window.',
          details: { switch_status: 'CLEARING_PENDING' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_MERCHANT_PG',
          status: 'SUCCESS',
          msg: 'Vendor ERP reports non-receipt of payment.',
          details: { vendor_ack: 'UNCONFIRMED' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'conflict_arbiter',
          action: 'CROSS_CHECK_LEDGERS',
          status: 'SUCCESS',
          msg: 'Discrepancy identified: Funds held in transit buffer awaiting RTGS/NEFT settlement batch.',
          details: { discrepancy: 'TRANSIT_HOLD' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'planner',
          action: 'SELECT_POLICY',
          status: 'SUCCESS',
          msg: 'Disputed amount (₹85,000) exceeds autonomous threshold (> ₹50,000).',
          details: { policy: 'HIGH_VALUE_HITL_ESCALATION' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'validator',
          action: 'THRESHOLD_EVAL',
          status: 'SUCCESS',
          msg: 'Consequential financial threshold triggered: Mandatory Human Review required.',
          details: { threshold: 50000, observed: 85000 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'human_review',
          action: 'HITL_ROUTING',
          status: 'SUCCESS',
          msg: 'Escalated to Human Oversight Desk with full multi-ledger telemetry packet.',
          details: { queue: 'OMBUDSMAN_HITL' },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  if (caseId === 'CASE-2026-3108') {
    return {
      activeNode: 'resolve',
      completedNodes: ['triage', 'skeptic', 'evidence_gatherer', 'conflict_arbiter', 'planner', 'validator', 'execute', 'resolve'],
      haltedNode: null,
      breakerStatus: 'ALLOW',
      haltEvent: null,
      confidence: 0.98,
      tokenUsage: 2150,
      finalResolution: 'DISPUTE_DISMISSED_MERCHANT_CREDIT_CONFIRMED',
      traces: [
        {
          node: 'triage',
          action: 'PARSE_GRIEVANCE',
          status: 'SUCCESS',
          msg: 'Extracted RRN 329184029182, amount ₹450.00, merchant Cafe Coffee Day.',
          details: { amount: 450, rrn: '329184029182' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'skeptic',
          action: 'ANOMALY_SCAN',
          status: 'SUCCESS',
          msg: 'Checking claimed duplicate debit against transaction history.',
          details: { duplicate_search: 'COMPLETED' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_CBS',
          status: 'SUCCESS',
          msg: 'Bank CBS confirms single debit of ₹450.00 (No duplicate debit recorded).',
          details: { cbs_debit_count: 1 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_NPCI',
          status: 'SUCCESS',
          msg: 'NPCI Switch confirms success code 00 with single settlement batch.',
          details: { switch_code: '00' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'evidence_gatherer',
          action: 'QUERY_MERCHANT_PG',
          status: 'SUCCESS',
          msg: 'Merchant POS confirms order paid and beverage dispensed at 11:15:30 IST.',
          details: { pos_status: 'PAID' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'conflict_arbiter',
          action: 'CROSS_CHECK_LEDGERS',
          status: 'SUCCESS',
          msg: 'All 3 ledgers match cleanly. Claim of duplicate debit is unsubstantiated.',
          details: { match_type: 'PERFECT_3_WAY_MATCH' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'planner',
          action: 'SELECT_POLICY',
          status: 'SUCCESS',
          msg: 'Selected policy: DISMISS_DISPUTE_WITH_PROOF.',
          details: { policy: 'DISMISS' },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'validator',
          action: 'SAFETY_CHECK',
          status: 'SUCCESS',
          msg: 'Token usage 2,150 / 10,000 budget cap. Consecutive tool failures: 0 / 4.',
          details: { token_usage: 2150 },
          timestamp: new Date().toISOString(),
        },
        {
          node: 'resolve',
          action: 'PERSIST_AUDIT',
          status: 'SUCCESS',
          msg: 'Case closed with verifiable merchant credit confirmation sent to citizen.',
          details: { resolution: 'DISMISSED_WITH_PROOF' },
          timestamp: new Date().toISOString(),
        },
      ],
    };
  }

  // Default: CASE-2026-9041 (Preset 1: Asymmetric U69 Timeout ₹1,499)
  return {
    activeNode: 'resolve',
    completedNodes: ['triage', 'skeptic', 'evidence_gatherer', 'conflict_arbiter', 'planner', 'validator', 'execute', 'resolve'],
    haltedNode: null,
    breakerStatus: 'ALLOW',
    haltEvent: null,
    confidence: 0.94,
    tokenUsage: 3420,
    finalResolution: 'RECOMMEND_REVERSAL_TO_SENDER',
    traces: [
      {
        node: 'triage',
        action: 'PARSE_GRIEVANCE',
        status: 'SUCCESS',
        msg: 'Extracted RRN 408219482910, amount ₹1,499.00, merchant Swiggy, timestamp 28 Sep 14:32:01 IST.',
        details: { rrn: '408219482910', amount: 1499, merchant: 'Swiggy' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'skeptic',
        action: 'ANOMALY_SCAN',
        status: 'SUCCESS',
        msg: 'Zero fraud anomalies flagged. Citizen history verified clean under standard profile.',
        details: { fraud_score: 0.02 },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'evidence_gatherer',
        action: 'QUERY_CBS',
        status: 'SUCCESS',
        msg: 'Bank CBS confirms debit of ₹1,499.00 with Auth Token 204891.',
        details: { debit_status: 'SUCCESS', code: '00', auth_ref: '204891' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'evidence_gatherer',
        action: 'QUERY_NPCI',
        status: 'SUCCESS',
        msg: 'NPCI Central Switch telemetry recorded asymmetric timeout code U69.',
        details: { switch_code: 'U69', timeout: true },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'evidence_gatherer',
        action: 'QUERY_MERCHANT_PG',
        status: 'SUCCESS',
        msg: 'Merchant PG confirms order expired unpaid with code M404.',
        details: { pg_status: 'EXPIRED_UNPAID', code: 'M404' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'conflict_arbiter',
        action: 'CROSS_CHECK_LEDGERS',
        status: 'SUCCESS',
        msg: 'Tri-party discrepancy verified: Debited at CBS, uncredited at Merchant PG.',
        details: { mismatch: 'ASYMMETRIC_DEBIT_TIMEOUT' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'planner',
        action: 'SELECT_POLICY',
        status: 'SUCCESS',
        msg: 'Matched simulated turnaround policy for stranded funds.',
        details: { policy: 'REVERSAL_TO_SOURCE' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'validator',
        action: 'SAFETY_CHECK',
        status: 'SUCCESS',
        msg: 'Token usage 3,420 / 10,000 budget cap. Consecutive tool failures: 0 / 4.',
        details: { token_usage: 3420, breaker_status: 'ALLOW' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'execute',
        action: 'ALLOWLIST_ACTION',
        status: 'SUCCESS',
        msg: 'Generated allowlisted recommendation: RECOMMEND_REVERSAL_TO_SENDER.',
        details: { action: 'RECOMMEND_REVERSAL_TO_SENDER' },
        timestamp: new Date().toISOString(),
      },
      {
        node: 'resolve',
        action: 'PERSIST_AUDIT',
        status: 'SUCCESS',
        msg: 'Immutable case trace persisted to audit ledger with cryptographic verification.',
        details: { audit_hash: '0x8f7a29bc142e01938fae890124' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function useCaseStream(caseId: string | null | undefined): UseCaseStreamResult {
  const fallback = getSyntheticFallbackData(caseId);

  const [traces, setTraces] = useState<TraceEvent[]>(fallback.traces);
  const [latestEvent, setLatestEvent] = useState<TraceEvent | null>(fallback.traces[fallback.traces.length - 1] || null);
  const [activeNode, setActiveNode] = useState<string | null>(fallback.activeNode);
  const [completedNodes, setCompletedNodes] = useState<string[]>(fallback.completedNodes);
  const [haltedNode, setHaltedNode] = useState<string | null>(fallback.haltedNode);
  const [haltEvent, setHaltEvent] = useState<HaltEvent | null>(fallback.haltEvent);
  const [breakerStatus, setBreakerStatus] = useState<string>(fallback.breakerStatus);
  const [finalResolution, setFinalResolution] = useState<string | null>(fallback.finalResolution);
  const [confidence, setConfidence] = useState<number | null>(fallback.confidence);
  const [tokenUsage, setTokenUsage] = useState<number>(fallback.tokenUsage);
  const [runId, setRunId] = useState<string | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectTrigger, setConnectTrigger] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Update fallback when caseId changes
  useEffect(() => {
    const data = getSyntheticFallbackData(caseId);
    setTraces(data.traces);
    setLatestEvent(data.traces[data.traces.length - 1] || null);
    setRunId(null);
    setActiveNode(data.activeNode);
    setCompletedNodes(data.completedNodes);
    setHaltedNode(data.haltedNode);
    setHaltEvent(data.haltEvent);
    setBreakerStatus(data.breakerStatus);
    setFinalResolution(data.finalResolution);
    setConfidence(data.confidence);
    setTokenUsage(data.tokenUsage);
    setIsComplete(true);
  }, [caseId]);

  const clearEvents = useCallback(() => {
    setTraces([]);
    setLatestEvent(null);
    setRunId(null);
    setActiveNode(null);
    setCompletedNodes([]);
    setHaltedNode(null);
    setHaltEvent(null);
    setBreakerStatus('ALLOW');
    setFinalResolution(null);
    setIsComplete(false);
    setError(null);
  }, []);

  const syncTimeline = useCallback(async () => {
    if (!runId) return;
    try {
      const data = await getRunTimeline(runId);
      if (data && data.timeline) {
        setTraces(
          data.timeline.map((item) => ({
            node: item.node || 'workflow',
            action: item.status === 'TRIPPED' ? 'HALTED' : 'EXECUTED',
            status: item.status || 'SUCCESS',
            msg: item.msg || `${item.name}: ${item.status}`,
            details: item,
            case_id: data.case_id,
            run_id: data.run_id,
            breaker_status: data.breaker_status,
            token_usage: data.token_usage,
            halt_event: data.halt_event,
          }))
        );
        if (data.breaker_status) setBreakerStatus(data.breaker_status);
        if (data.token_usage !== undefined) setTokenUsage(data.token_usage);
        if (data.halt_event) {
          setHaltEvent(data.halt_event);
          setHaltedNode(data.halt_event.node || 'execute');
        }
      }
    } catch (err) {
      console.error('[useCaseStream] syncTimeline failed', err);
    }
  }, [runId]);

  const reconnect = useCallback(() => {
    clearEvents();
    setConnectTrigger((prev) => prev + 1);
  }, [clearEvents]);

  useEffect(() => {
    if (!caseId) {
      setIsStreaming(false);
      setIsComplete(false);
      return;
    }

    let hasReceivedLiveEvents = false;

    try {
      const streamUrl = getCaseStreamUrl(caseId);
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      const handleTrace = (e: MessageEvent) => {
        try {
          const payload: TraceEvent = JSON.parse(e.data);
          payload.timestamp = payload.timestamp || payload.created_at || new Date().toISOString();

          // If first live event arrives, clear the synthetic fallback
          if (!hasReceivedLiveEvents) {
            hasReceivedLiveEvents = true;
            setTraces([]);
            setCompletedNodes([]);
          }

          setLatestEvent(payload);
          if (payload.run_id) {
            setRunId(payload.run_id);
          }
          if (payload.node) {
            setActiveNode(payload.node);
          }

          if (payload.token_usage) {
            setTokenUsage(payload.token_usage);
          }

          if (payload.breaker_status) {
            setBreakerStatus(payload.breaker_status);
          }

          if (payload.halt_event) {
            setHaltEvent(payload.halt_event);
            setHaltedNode(payload.halt_event.node || payload.node || 'execute');
            setBreakerStatus('TRIPPED');
          }

          if (payload.status === 'COMPLETED' || payload.status === 'SUCCESS') {
            if (payload.node && payload.node !== 'system') {
              setCompletedNodes((prev) => (prev.includes(payload.node) ? prev : [...prev, payload.node]));
            }
          }

          if (payload.status === 'TRIPPED' || payload.status === 'HALTED' || payload.action === 'HALTED') {
            setHaltedNode(payload.node || 'execute');
            setBreakerStatus('TRIPPED');
          }

          if (payload.details?.confidence !== undefined) {
            setConfidence(payload.details.confidence);
          }

          if (payload.action === 'RESOLVE' || payload.action === 'EXECUTE_REVERSAL') {
            setFinalResolution(payload.msg || payload.action);
          }

          setTraces((prev) => {
            const exists = prev.some(
              (p) =>
                p.node === payload.node &&
                p.action === payload.action &&
                p.iteration === payload.iteration &&
                p.status === payload.status &&
                p.msg === payload.msg
            );
            if (exists) return prev;
            return [...prev, payload];
          });

          if (payload.action === 'COMPLETE') {
            setIsComplete(true);
            setIsStreaming(false);
            if (payload.status === 'escalated') {
              setFinalResolution('ESCALATE_FOR_HUMAN_REVIEW');
            } else if (payload.status === 'resolved') {
              setFinalResolution('RESOLVED');
            }
            if (payload.halt_event) {
              setHaltEvent(payload.halt_event);
              setBreakerStatus('TRIPPED');
              setHaltedNode(payload.halt_event.node || 'execute');
            }
            es.close();
          }
        } catch (err) {
          console.error('[useCaseStream] Failed to parse SSE event data', err);
        }
      };

      es.addEventListener('trace', handleTrace);
      es.onmessage = (e: MessageEvent) => {
        handleTrace(e);
      };

      es.onerror = () => {
        // In local UI review mode with backend offline, retain the synthetic fallback
        setIsStreaming(false);
        setIsComplete(true);
        es.close();
      };
    } catch {
      // In local UI review mode, keep synthetic data
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsStreaming(false);
    };
  }, [caseId, connectTrigger]);

  // Convert traces to TimelineEvents format
  const events: TimelineEvent[] = traces.map((t) => ({
    node: t.node,
    action: t.action,
    status: t.status,
    msg: t.msg,
    details: t.details,
    token_usage: t.token_usage,
    iteration: t.iteration,
    timestamp: t.timestamp || t.created_at,
    created_at: t.created_at || t.timestamp,
  }));

  return {
    traces,
    events,
    latestEvent,
    runId,
    activeNode,
    completedNodes,
    haltedNode,
    haltEvent,
    breakerStatus,
    finalResolution,
    confidence,
    tokenUsage,
    isStreaming,
    isComplete,
    error,
    clearEvents,
    reconnect,
    syncTimeline,
  };
}

export default useCaseStream;
