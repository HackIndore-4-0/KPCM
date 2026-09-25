import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

export interface TraceEvent {
  node: string;
  action: string;
  msg: string;
}

export function useDisputeStream(disputeId: string | null) {
  const [traces, setTraces] = useState<TraceEvent[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!disputeId) return;

    setIsStreaming(true);
    setTraces([]);
    const eventSource = new EventSource(`${API_BASE_URL}/api/v1/stream/${disputeId}`);

    eventSource.addEventListener('trace', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        setTraces((prev) => [...prev, parsed]);
      } catch (err) {
        console.error('Failed to parse SSE event', err);
      }
    });

    eventSource.onerror = () => {
      eventSource.close();
      setIsStreaming(false);
    };

    return () => {
      eventSource.close();
      setIsStreaming(false);
    };
  }, [disputeId]);

  return { traces, isStreaming };
}
