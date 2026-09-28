import axios from 'axios';
import { AgentRunRequest, AgentRunResponse, HealthResponse, TimelineResponse } from './types';

export const VITE_API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (import.meta.env?.DEV ? 'http://localhost:8000' : '')
).replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function handleAxiosError(err: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;
    const message = detail || err.message || fallbackMessage;
    throw new ApiError(message, status);
  }
  throw new ApiError(fallbackMessage);
}

/**
 * Health check endpoint for host backend engine.
 */
export async function getHealth(): Promise<HealthResponse> {
  try {
    const res = await apiClient.get<HealthResponse>('/health');
    return res.data;
  } catch (err) {
    handleAxiosError(err, 'Failed to fetch backend health status');
  }
}

/**
 * Fast boolean health probe for navbar and indicators.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const data = await getHealth();
    return data?.status === 'healthy' || data?.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Trigger LangGraph autonomous agent grievance execution under CircuitBreaker protection.
 */
export async function runAgentWorkflow(caseId: string, payload: AgentRunRequest): Promise<AgentRunResponse> {
  try {
    const res = await apiClient.post<AgentRunResponse>(`/agent/run/${encodeURIComponent(caseId)}`, payload);
    return res.data;
  } catch (err) {
    handleAxiosError(err, 'Failed to execute agent workflow');
  }
}

/**
 * Query current state of an existing agent run for a case.
 */
export async function getAgentRun(caseId: string): Promise<AgentRunResponse> {
  try {
    const res = await apiClient.get<AgentRunResponse>(`/agent/run/${encodeURIComponent(caseId)}`);
    return res.data;
  } catch (err) {
    handleAxiosError(err, `No active run found for case ${caseId}`);
  }
}

export const getCaseStatus = getAgentRun;

/**
 * Retrieve execution timeline and safety events by run_id.
 */
export async function getRunTimeline(runId: string): Promise<TimelineResponse> {
  try {
    const res = await apiClient.get<TimelineResponse>(`/agent/runs/${encodeURIComponent(runId)}/timeline`);
    return res.data;
  } catch (err) {
    handleAxiosError(err, `Failed to load timeline for run ${runId}`);
  }
}

/**
 * Constructs the canonical Server-Sent Events stream URL for live CaseDetail tracing.
 */
export function getCaseStreamUrl(caseId: string): string {
  return `${VITE_API_BASE_URL}/agent/run/${encodeURIComponent(caseId)}/stream`;
}
