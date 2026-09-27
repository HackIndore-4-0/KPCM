import asyncio
from typing import Dict, Any

class MockFinancialEcosystem:
    """Simulates Bank CBS, NPCI Switch, and Merchant Gateway APIs (Read & Mutation actions)."""

    # 1. READ / PROBING APIs
    @staticmethod
    async def query_bank_cbs(txn_id: str, force_fail: bool = False) -> Dict[str, Any]:
        await asyncio.sleep(0.1)
        if force_fail or txn_id.startswith("FAIL"):
            return {
                "source": "BANK_CBS",
                "status": "FAILED",
                "error": "CBS_SYSTEM_TIMEOUT",
                "details": "Core Banking System did not respond within timeout window."
            }
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
    async def query_npci_switch(utr: str, force_fail: bool = False) -> Dict[str, Any]:
        await asyncio.sleep(0.1)
        if force_fail or utr.startswith("FAIL"):
            return {
                "source": "NPCI_SWITCH",
                "status": "FAILED",
                "error": "SWITCH_NETWORK_ERROR",
                "details": "NPCI Switch network node unreachable."
            }
        return {
            "source": "NPCI_SWITCH",
            "utr": utr,
            "switch_status": "TIMEOUT_DEEMED_SUCCESS",
            "response_code": "U69",  # Beneficiary Switch Down
            "timestamp": "2026-09-24T14:10:05Z"
        }

    @staticmethod
    async def query_merchant_pg(order_id: str, force_fail: bool = False) -> Dict[str, Any]:
        await asyncio.sleep(0.1)
        if force_fail or order_id.startswith("FAIL"):
            return {
                "source": "MERCHANT_PG",
                "status": "FAILED",
                "error": "GATEWAY_502_BAD_GATEWAY",
                "details": "Merchant Payment Gateway returned 502 Bad Gateway."
            }
        return {
            "source": "MERCHANT_PG",
            "merchant_name": "MegaRetail Online",
            "order_id": order_id,
            "payment_status": "PAYMENT_NOT_CREDITED",
            "amount_received": 0.00,
            "timestamp": "2026-09-24T14:15:00Z"
        }

    # 2. IRREVERSIBLE MUTATION APIs (Challenge 2)
    @staticmethod
    async def execute_bank_reversal(
        dispute_id: str,
        account_no: str,
        amount: float,
        utr: str,
        force_fail: bool = False
    ) -> Dict[str, Any]:
        """Irreversible financial mutation: Credits citizen account & debits bank suspense pool."""
        await asyncio.sleep(0.1)
        if force_fail:
            return {
                "status": "FAILED",
                "error": "REVERSAL_REJECTED",
                "details": "CBS refused reversal batch due to balance lock."
            }
        return {
            "status": "EXECUTED",
            "action": "BANK_REVERSAL_MUTATION",
            "dispute_id": dispute_id,
            "account_no": account_no,
            "amount_credited": amount,
            "utr": utr,
            "reversal_ref": f"REV-{utr[-6:]}",
            "cbs_batch_id": "BATCH-CBS-9921",
            "timestamp": "2026-09-27T18:00:00Z"
        }
