from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem

async def query_merchant_pg(order_id: str) -> Dict[str, Any]:
    """Queries Merchant Payment Gateway for settlement status."""
    return await MockFinancialEcosystem.query_merchant_pg(order_id)
