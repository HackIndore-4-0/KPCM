from typing import Dict, Any, Optional
from tools.base import execute_instrumented_tool, ToolResult


def _raw_query_merchant_pg(
    txn_ref: str,
    force_fail: bool = False,
    order_status: str = "NOT_CREDITED",
    failure_reason: str = "GATEWAY_502_BAD_GATEWAY",
) -> Dict[str, Any]:
    if force_fail:
        raise ConnectionResetError(f"Merchant PG connection error: {failure_reason}")

    return {
        "source": "MERCHANT_PG",
        "txn_ref": txn_ref,
        "status": order_status,
        "settlement_status": "UNSETTLED",
        "merchant_order_id": f"ORD_{txn_ref[-6:]}",
    }


def query_merchant_pg(
    txn_ref: str,
    force_fail: bool = False,
    order_status: str = "NOT_CREDITED",
    failure_reason: str = "GATEWAY_502_BAD_GATEWAY",
    node: Optional[str] = "evidence_gatherer",
    iteration: Optional[int] = None,
) -> ToolResult:
    """Instrumented wrapper for Merchant Payment Gateway API."""
    return execute_instrumented_tool(
        tool_name="merchant_pg",
        fn=_raw_query_merchant_pg,
        txn_ref=txn_ref,
        force_fail=force_fail,
        order_status=order_status,
        failure_reason=failure_reason,
        node=node,
        iteration=iteration,
    )
