import asyncio
from typing import Dict, Any

class MockFinancialEcosystem:
    """Simulates Bank CBS, NPCI Switch, and Merchant Gateway APIs."""

    @staticmethod
    async def query_bank_cbs(txn_id: str) -> Dict[str, Any]:
        await asyncio.sleep(0.3)
        return {
            "source": "BANK_CBS",
            "bank_name": "State Bank of India",
            "txn_id": txn_id,
            "amount": 25000.00,
            "status": "SUCCESS",
            "utr": "UTR9832482348",
            "timestamp": "2026-09-24T14:10:02Z"
        }

    @staticmethod
    async def query_npci_switch(utr: str) -> Dict[str, Any]:
        await asyncio.sleep(0.4)
        return {
            "source": "NPCI_SWITCH",
            "utr": utr,
            "switch_status": "TIMEOUT_DEEMED_SUCCESS",
            "response_code": "U69",  # Beneficiary Switch Down
            "timestamp": "2026-09-24T14:10:05Z"
        }

    @staticmethod
    async def query_merchant_pg(order_id: str) -> Dict[str, Any]:
        await asyncio.sleep(0.3)
        return {
            "source": "MERCHANT_PG",
            "merchant_name": "MegaRetail Online",
            "order_id": order_id,
            "payment_status": "PAYMENT_NOT_CREDITED",
            "amount_received": 0.00,
            "timestamp": "2026-09-24T14:15:00Z"
        }
