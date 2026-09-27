from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem
from app.core.telemetry import tool_execution_span

async def query_npci_switch(utr: str, force_fail: bool = False) -> Dict[str, Any]:
    """Queries NPCI Switch network for transaction routing log with OTel instrumentation."""
    with tool_execution_span("npci_switch_api", is_irreversible=False, requires_hitl=False) as span:
        res = await MockFinancialEcosystem.query_npci_switch(utr, force_fail=force_fail)
        if res.get("status") == "FAILED":
            span.set_attribute("status", "FAILED")
            span.set_attribute("error_type", res.get("error", "NPCISwitchError"))
        return res
