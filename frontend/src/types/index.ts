export type DisputeStatus = 
  | 'INGESTED' 
  | 'INVESTIGATING' 
  | 'CONFLICT_DETECTED' 
  | 'ESCALATED_HITL' 
  | 'RESOLVED' 
  | 'CLOSED';

export interface FinalResolution {
  verdict: string;
  actionable_order: string;
  regulatory_basis: string;
  compensation_entitlement: string;
  merchant_status: string;
  citizen_summary: string;
  digital_signature?: string;
  issued_at?: string;
  settlement_timeline?: string;
}

export interface ExtractedEntities {
  claimed_amount?: number;
  utr?: string;
  txn_id?: string;
  payer_bank?: string;
  merchant_name?: string;
  date?: string;
  contact?: string;
  raw_entities?: Record<string, any>;
}

export interface Dispute {
  dispute_id: string;
  citizen_name?: string;
  citizen_contact?: string;
  complaint_text?: string;
  status: DisputeStatus;
  domain?: string;
  claimed_amount?: number;
  confidence_score?: number;
  conflict_detected?: boolean;
  conflict_details?: string;
  requires_human_escalation?: boolean;
  escalation_reason?: string;
  ombudsman_verdict?: string;
  extracted_entities?: ExtractedEntities;
  final_resolution?: FinalResolution;
  ledger_records?: LedgerRecord[];
  agent_traces?: AgentTrace[];
  created_at?: string;
  updated_at?: string;
}

export interface AgentTrace {
  id?: string;
  node_name: string;
  action_type: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  latency_ms?: number;
  status?: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
}

export interface LedgerRecord {
  source: 'BANK_CBS' | 'NPCI_SWITCH' | 'MERCHANT_PG';
  institution_name: string;
  txn_id: string;
  amount: number;
  status: 'SUCCESS' | 'DEEMED_SUCCESS_BENEFICIARY_TIMEOUT' | 'PAYMENT_NOT_CREDITED' | 'NOT_FOUND' | 'SETTLED' | 'PENDING' | 'FAILED';
  timestamp: string;
  raw_payload?: Record<string, any>;
  utr?: string;
  narrative?: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  tag: string;
  category: 'UPI_FAILED' | 'FRAUD_HITL' | 'PENSION_DELAY';
  amount: number;
  bank: string;
  merchant: string;
  utr: string;
  complaint: string;
  receiptName: string;
  receiptUrl: string;
  ocrConfidence: number;
  expectedOutcome: 'AUTO_RESOLVED' | 'HITL_ESCALATED' | 'REPLAN_RESOLVED';
  description: string;
}

export interface DAGNodeState {
  id: string;
  label: string;
  shortDesc: string;
  status: 'idle' | 'running' | 'completed' | 'conflict' | 'escalated';
  confidence?: number;
  executionTime?: number;
  inputPayload?: any;
  outputPayload?: any;
}
