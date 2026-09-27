import { useState, useEffect, useCallback, useRef } from 'react';
import { getCaseStreamUrl } from '../lib/api';
import { TraceEvent, TimelineEvent, HaltEvent } from '../lib/types';

export interface UseCaseStreamResult {
  traces: TraceEvent[];
  events: TimelineEvent[];
  latestEvent: TraceEvent | null;
  activeNode: string | null;
  completedNodes: string[];
  haltedNode: string | null;
  haltEvent: HaltEvent | null;
  breakerStatus: string;
  finalResolution: string | null;
  confidence: number;
  tokenUsage: number;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  clearEvents: () => void;
  reconnect: () => void;
}

export function useCaseStream(caseId: string | null | undefined): UseCaseStreamResult {
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<TraceEvent | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [haltedNode, setHaltedNode] = useState<string | null>(null);
  const [haltEvent, setHaltEvent] = useState<HaltEvent | null>(null);
  const [breakerStatus, setBreakerStatus] = useState<string>('ALLOW');
  const [finalResolution, setFinalResolution] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0.94);
  const [tokenUsage, setTokenUsage] = useState<number>(3420);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectTrigger, setConnectTrigger] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);

  const clearEvents = useCallback(() => {
    setTraces([]);
    setLatestEvent(null);
    setActiveNode(null);
    setCompletedNodes([]);
    setHaltedNode(null);
    setHaltEvent(null);
    setBreakerStatus('ALLOW');
    setFinalResolution(null);
    setIsComplete(false);
    setError(null);
  }, []);

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

    setIsStreaming(true);
    setError(null);

    const streamUrl = getCaseStreamUrl(caseId);
    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    const handleTrace = (e: MessageEvent) => {
      try {
        const payload: TraceEvent = JSON.parse(e.data);
        payload.timestamp = payload.timestamp || payload.created_at || new Date().toISOString();

        setLatestEvent(payload);
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
          setHaltedNode(payload.halt_event.node || payload.node || 'safe_halt');
        }

        if (payload.status === 'COMPLETED' || payload.status === 'SUCCESS') {
          if (payload.node) {
            setCompletedNodes((prev) => (prev.includes(payload.node) ? prev : [...prev, payload.node]));
          }
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
              p.status === payload.status
          );
          if (exists) return prev;
          return [...prev, payload];
        });

        if (
          payload.action === 'COMPLETE' ||
          payload.breaker_status === 'TRIPPED' ||
          payload.status === 'CIRCUIT_BREAKER_HALT' ||
          payload.status === 'HALTED'
        ) {
          setIsComplete(true);
          setIsStreaming(false);
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
      if (es.readyState === EventSource.CLOSED) {
        setIsStreaming(false);
        setIsComplete(true);
      } else {
        setError('Connection to live telemetry stream interrupted. Retrying...');
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
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
  };
}

export default useCaseStream;
