from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem
from app.core.telemetry import tool_execution_span

async def execute_bank_reversal(
    dispute_id: str,
    account_no: str,
    amount: float,
    utr: str,
    force_fail: bool = False
) -> Dict[str, Any]:
    """Executes an irreversible financial fund reversal in Core Banking System.
    
    Tagged with is_irreversible=True, requires_hitl=True for Challenge 2 state-preserving approval gate.
    """
    with tool_execution_span(
        "execute_bank_reversal",
        is_irreversible=True,
        requires_hitl=True
    ) as span:
        span.set_attribute("dispute_id", dispute_id)
        span.set_attribute("amount", amount)
        span.set_attribute("utr", utr)
        
        res = await MockFinancialEcosystem.execute_bank_reversal(
            dispute_id=dispute_id,
            account_no=account_no,
            amount=amount,
            utr=utr,
            force_fail=force_fail
        )
        if res.get("status") == "FAILED":
            span.set_attribute("status", "FAILED")
            span.set_attribute("error_type", res.get("error", "ReversalExecutionError"))
        return res
