from typing import Dict, Any, Optional
from tools.base import execute_instrumented_tool, ToolResult


def _raw_query_npci_switch(
    txn_ref: str,
    force_fail: bool = False,
    response_code: str = "U69",
    failure_reason: str = "SWITCH_UNREACHABLE",
) -> Dict[str, Any]:
    if force_fail:
        raise TimeoutError(f"NPCI Switch lookup failed: {failure_reason}")

    return {
        "source": "NPCI_SWITCH",
        "txn_ref": txn_ref,
        "status": "SUCCESS",
        "response_code": response_code,  # "U69" = beneficiary timeout, "00" = approved
        "switch_status": "DEEMED_SUCCESS_BENEFICIARY_TIMEOUT" if response_code == "U69" else "COMPLETED",
        "npci_txn_id": f"NPCI-{txn_ref[:10]}",
    }


def query_npci_switch(
    txn_ref: str,
    force_fail: bool = False,
    response_code: str = "U69",
    failure_reason: str = "SWITCH_UNREACHABLE",
    node: Optional[str] = "evidence_gatherer",
    iteration: Optional[int] = None,
) -> ToolResult:
    """Instrumented wrapper for NPCI Switch API."""
    return execute_instrumented_tool(
        tool_name="npci_switch",
        fn=_raw_query_npci_switch,
        txn_ref=txn_ref,
        force_fail=force_fail,
        response_code=response_code,
        failure_reason=failure_reason,
        node=node,
        iteration=iteration,
    )
