from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem

async def query_bank_cbs(txn_id: str) -> Dict[str, Any]:
    """Queries Core Banking System for account debit verification."""
    return await MockFinancialEcosystem.query_bank_cbs(txn_id)
