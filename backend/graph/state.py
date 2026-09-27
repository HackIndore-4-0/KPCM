from typing import Any, Dict, List, Literal, Optional, TypedDict
from pydantic import BaseModel


class LedgerRecord(BaseModel):
    source: Literal["BANK_CBS", "NPCI_SWITCH", "MERCHANT_PG"]
    txn_ref: str
    status: str                         # "SUCCESS", "PENDING", "NOT_CREDITED", "NOT_FOUND"
    amount_inr: Optional[float] = None
    response_code: Optional[str] = None # e.g. "U69"
    raw_payload: Optional[Dict[str, Any]] = None
    fetched_at: str


class ProposedAction(BaseModel):
    action_type: Literal[
        "AUTO_REVERSAL_ORDER",
        "CLEAR_MERCHANT_LIABILITY",
        "REQUEST_ADDITIONAL_EVIDENCE",
        "ESCALATE_TO_HUMAN",
        "NO_ACTION_CLEAN_MATCH",
    ]
    target_stakeholder: Optional[str] = None
    justification: str
    citation: Optional[str] = None


class GrievanceState(TypedDict, total=False):
    case_id: str
    run_id: str
    raw_complaint_text: str
    extracted_txn_ref: Optional[str]
    claimed_amount_inr: Optional[float]
    domain: str
    iteration: int
    total_tokens: int
    consecutive_tool_failures: int
    max_consecutive_tool_failures: int
    max_token_budget: int
    max_iterations: int
    ledger_records: List[Dict[str, Any]]
    conflict_detected: bool
    conflict_pattern: Optional[str]
    confidence_score: float
    proposed_action: Optional[Dict[str, Any]]
    status: str  # "intake", "investigating", "executing", "resolved", "halted", "escalated"
    breaker_tripped: bool
    breaker_decision: Optional[Dict[str, Any]]
    halt_event: Optional[Dict[str, Any]]
    human_review_required: bool
    human_review_reason: Optional[str]
    trace_log: List[Dict[str, Any]]
    execution_path: List[str]
    
    # Injection flags for testing and scenarios
    force_tool_fail: bool
    force_token_spike: int
    force_loop_until_limit: bool


class AgentRunState(TypedDict, total=False):
    """Minimal generic workflow state used by reusable breaker boundary tests."""
    case_id: str
    run_id: str
    node: str
    iteration: int
    status: str
    history: list[dict[str, Any]]
    halt: dict[str, Any]
    result: dict[str, Any]
    needs_human_review: bool
    error_type: str
    force_loop_until_limit: bool
