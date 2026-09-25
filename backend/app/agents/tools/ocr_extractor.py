import re
from typing import Dict, Any

async def extract_receipt_data(image_url: str) -> Dict[str, Any]:
    """
    Simulates OCR extraction of key payment attributes from an uploaded receipt screenshot.
    """
    return {
        "txn_id": "TXN25000",
        "utr": "UTR9832482348",
        "amount": 25000.00,
        "sender_bank": "State Bank of India",
        "merchant": "MegaRetail Online",
        "timestamp": "2026-09-24T14:10:02Z",
        "confidence": 0.96
    }
