export type NodeStatus =
  | 'RUNNING'
  | 'SUCCESS'
  | 'COMPLETED'
  | 'FAILURE'
  | 'FAILED'
  | 'TRIPPED'
  | 'HALTED'
  | 'HUMAN_REVIEW'
  | 'IDLE';

export interface HaltEvent {
  event: string;
  case_id: string;
  run_id: string;
  trigger: string;
  threshold?: number | null;
  observed?: number | null;
  node?: string;
  tool?: string | null;
  iteration?: number;
  total_tokens?: number;
  tokens_consumed?: number;
  consecutive_failures?: number;
  reason?: string;
  action?: string;
  timestamp?: string;
}

export interface TimelineEvent {
  name?: string;
  node?: string;
  action?: string;
  status?: 'SUCCESS' | 'FAILURE' | 'TRIPPED' | 'HALTED' | 'RUNNING' | string;
  icon?: string;
  error?: string;
  reason?: string;
  msg?: string;
  details?: Record<string, any>;
  token_usage?: number;
  iteration?: number;
  timestamp?: string;
  created_at?: string;
}

export interface AgentRunRequest {
  complaint: string;
  max_consecutive_tool_failures?: number;
  max_token_budget?: number;
  max_iterations?: number;
  demo_scenario?:
    | 'consecutive_tool_failures'
    | 'token_budget'
    | 'max_iterations'
    | 'timeout'
    | 'clean'
    | 'high_value'
    | 'breaker_trip'
    | string
    | null;
}

export interface AgentRunResponse {
  case_id: string;
  run_id: string;
  status: 'resolved' | 'escalated' | 'running' | string;
  current_node: string;
  iteration: number;
  max_iterations: number;
  token_usage: number;
  token_budget: number;
  tool_failure_count: number;
  tool_failure_threshold: number;
  breaker_status: 'ALLOW' | 'TRIPPED' | string;
  trigger?: string | null;
  safe_degradation_action?: string | null;
  halt_event?: HaltEvent | null;
  timeline: TimelineEvent[];
  needs_human_review: boolean;
}

export interface TraceEvent {
  node: string;
  action: string;
  status: string;
  msg: string;
  details?: Record<string, any>;
  case_id?: string;
  run_id?: string;
  breaker_status?: string;
  token_usage?: number;
  iteration?: number;
  timestamp?: string;
  created_at?: string;
  halt_event?: HaltEvent | null;
}

export interface TimelineResponse {
  case_id: string;
  run_id: string;
  timeline: TimelineEvent[];
  breaker_status: string;
  trigger?: string | null;
  token_usage: number;
  token_budget: number;
  tool_failure_count: number;
  tool_failure_threshold: number;
  halt_event?: HaltEvent | null;
}

export interface HealthResponse {
  status: string;
  app_name?: string;
  environment?: string;
  telemetry_service?: string;
  active_spans_count?: number;
}

export interface SyntheticLedgerRecord {
  institution: string;
  system: 'Tier 1 Bank CBS' | 'NPCI Switch 2.0' | 'Merchant PG Gateway';
  status: 'SUCCESS 00' | 'TIMEOUT U69' | 'NOT CREDITED M404' | 'MATCH' | string;
  amount: number;
  utrRef: string;
  responseCode: string;
  rawPayload: Record<string, any>;
}

export type Language = 'en' | 'hi' | 'hinglish';
