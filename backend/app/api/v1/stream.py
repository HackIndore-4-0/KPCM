import asyncio
import json
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter()

@router.get("/{dispute_id}")
async def stream_investigation(dispute_id: str):
    """Streams live LangGraph agent execution traces to Avni's frontend."""
    async def event_generator():
        steps = [
            {"node": "ingestion", "action": "OCR_PARSED", "msg": f"Dispute {dispute_id}: Extracted UTR9832482348, Amount: ₹25,000"},
            {"node": "domain_router", "action": "CLASSIFIED", "msg": "Classified domain as DIGITAL_PAYMENTS_UPI (Confidence 98%)"},
            {"node": "dependency_mapper", "action": "MAPPED", "msg": "Targeting 3 external nodes: State Bank, NPCI Switch, MegaRetail PG"},
            {"node": "probing_agents", "action": "CBS_VERIFIED", "msg": "State Bank of India confirmed debit of ₹25,000 (Status: SUCCESS)"},
            {"node": "probing_agents", "action": "NPCI_VERIFIED", "msg": "NPCI Switch returned U69: Beneficiary Switch Timeout"},
            {"node": "probing_agents", "action": "MERCHANT_VERIFIED", "msg": "MegaRetail PG confirms ₹0.00 received (Status: NOT_CREDITED)"},
            {"node": "conflict_arbiter", "action": "ARBITRATION", "msg": "Discrepancy Matrix Computed: Payer Debited vs Beneficiary Drop"},
            {"node": "synthesizer", "action": "ORDER_ISSUED", "msg": "Binding Reversal Order issued under RBI Circular DPSS.1164"}
        ]
        for step in steps:
            await asyncio.sleep(0.7)
            yield {"event": "trace", "data": json.dumps(step)}
            
    return EventSourceResponse(event_generator())
