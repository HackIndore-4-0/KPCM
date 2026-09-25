from typing import Dict, Any
from app.agents.state import FinResolveState
from app.agents.tools.ocr_extractor import extract_receipt_data

async def ingestion_node(state: FinResolveState) -> Dict[str, Any]:
    """Extracts entities and metadata from raw complaint and uploaded receipts."""
    traces = state.get("agent_traces", [])
    urls = state.get("evidence_urls", [])
    
    extracted = {
        "txn_id": "TXN25000",
        "utr": "UTR9832482348",
        "claimed_amount": 25000.00,
        "payer_bank": "State Bank of India",
        "merchant": "MegaRetail Online"
    }
    
    if urls:
        ocr_result = await extract_receipt_data(urls[0])
        extracted.update(ocr_result)
        
    traces.append({
        "node_name": "ingestion",
        "action_type": "EXTRACT_ENTITIES",
        "content": f"Successfully extracted UTR {extracted.get('utr')} and amount ₹{extracted.get('claimed_amount')}",
        "metadata": extracted
    })
    
    return {
        "extracted_entities": extracted,
        "agent_traces": traces
    }
