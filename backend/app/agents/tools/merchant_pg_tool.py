from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem
from app.core.telemetry import tool_execution_span
from app.core.config import settings

async def query_merchant_pg(order_id: str, force_fail: bool = False) -> Dict[str, Any]:
    """Queries Merchant Payment Gateway for settlement status with OTel instrumentation and TLS enforcement."""
    settings.validate_tls_endpoint(settings.MERCHANT_PG_URL)
    
    with tool_execution_span("merchant_pg_api", is_irreversible=False, requires_hitl=False) as span:
        res = await MockFinancialEcosystem.query_merchant_pg(order_id, force_fail=force_fail)
        if res.get("status") == "FAILED":
            span.set_attribute("status", "FAILED")
            span.set_attribute("error_type", res.get("error", "MerchantPGError"))
        return res
