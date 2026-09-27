import hashlib
from typing import Dict, Any, Optional
from tools.base import execute_instrumented_tool, ToolResult


def _raw_query_bank_cbs(txn_ref: str, force_fail: bool = False, failure_reason: str = "CBS_CORE_TIMEOUT") -> Dict[str, Any]:
    if force_fail:
        raise ConnectionError(f"Bank CBS connection failed: {failure_reason}")
    
    # Deterministic generation based on txn_ref hash
    hash_val = int(hashlib.sha256(txn_ref.encode()).hexdigest(), 16)
    amount = float((hash_val % 4500) + 500)
    
    return {
        "source": "BANK_CBS",
        "txn_ref": txn_ref,
        "status": "SUCCESS",
        "amount_inr": amount,
        "account_debited": True,
        "cbs_rrn": f"RRN{txn_ref[:8]}",
    }


def query_bank_cbs(
    txn_ref: str,
    force_fail: bool = False,
    failure_reason: str = "CBS_CORE_TIMEOUT",
    node: Optional[str] = "evidence_gatherer",
    iteration: Optional[int] = None,
) -> ToolResult:
    """Instrumented wrapper for Bank CBS API."""
    return execute_instrumented_tool(
        tool_name="bank_cbs",
        fn=_raw_query_bank_cbs,
        txn_ref=txn_ref,
        force_fail=force_fail,
        failure_reason=failure_reason,
        node=node,
        iteration=iteration,
    )
