from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem
from app.core.telemetry import tool_execution_span

async def query_bank_cbs(txn_id: str, force_fail: bool = False) -> Dict[str, Any]:
    """Queries Core Banking System for account debit verification with OTel instrumentation."""
    with tool_execution_span("bank_cbs_api", is_irreversible=False, requires_hitl=False) as span:
        res = await MockFinancialEcosystem.query_bank_cbs(txn_id, force_fail=force_fail)
        if res.get("status") == "FAILED":
            span.set_attribute("status", "FAILED")
            span.set_attribute("error_type", res.get("error", "BankCBSError"))
        return res
