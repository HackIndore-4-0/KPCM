from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from typing_extensions import TypedDict

class LedgerRecord(BaseModel):
    source: str        # 'BANK_CBS', 'NPCI_SWITCH', 'MERCHANT_PG'
    txn_id: str
    amount: float
    status: str        # 'SUCCESS', 'PENDING', 'FAILED', 'TIMEOUT', 'NOT_FOUND'
    timestamp: str
    raw_payload: Dict[str, Any] = Field(default_factory=dict)

class FinResolveState(TypedDict):
    dispute_id: str
    citizen_id: str
    raw_complaint: str
    evidence_urls: List[str]
    extracted_entities: Dict[str, Any]
    domain: str
    required_stakeholders: List[str]
    
    # Audit telemetry traces streamed to frontend
    agent_traces: List[Dict[str, Any]]
    
    # Inter-System Ledger Data
    ledger_records: List[LedgerRecord]
    conflict_detected: bool
    conflict_details: Optional[str]
    
    # Cyclic & HITL controls
    iteration_count: int
    confidence_score: float
    requires_human_escalation: bool
    escalation_reason: Optional[str]
    ombudsman_verdict: Optional[str]
    
    # Final Result
    final_resolution: Optional[Dict[str, Any]]
