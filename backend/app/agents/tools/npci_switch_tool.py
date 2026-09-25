from typing import Dict, Any
from app.mocks.mock_service import MockFinancialEcosystem

async def query_npci_switch(utr: str) -> Dict[str, Any]:
    """Queries NPCI UPI switch logs for inter-bank transaction status."""
    return await MockFinancialEcosystem.query_npci_switch(utr)
