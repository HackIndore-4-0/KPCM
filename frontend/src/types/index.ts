export interface Dispute {
  dispute_id: string;
  status: 'INGESTED' | 'INVESTIGATING' | 'CONFLICT_DETECTED' | 'ESCALATED_HITL' | 'RESOLVED';
  domain?: string;
  claimed_amount?: number;
  confidence_score?: number;
  final_resolution?: {
    verdict: string;
    actionable_order: string;
    regulatory_basis: string;
    compensation_entitlement: string;
    merchant_status: string;
    citizen_summary: string;
  };
}

export interface AgentTrace {
  node_name: string;
  action_type: string;
  content: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface LedgerRecord {
  source: string;
  txn_id: string;
  amount: number;
  status: string;
  timestamp: string;
}
