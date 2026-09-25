from typing import Dict, Any
from app.agents.state import FinResolveState

async def domain_router_node(state: FinResolveState) -> Dict[str, Any]:
    """Classifies grievance into relevant regulatory domains."""
    traces = state.get("agent_traces", [])
    raw_text = state.get("raw_complaint", "").lower()
    
    domain = "DIGITAL_PAYMENTS_UPI"
    if "pension" in raw_text:
        domain = "PENSION_DISPUTE"
    elif "tax" in raw_text or "refund" in raw_text and "itr" in raw_text:
        domain = "DIRECT_TAX"
        
    traces.append({
        "node_name": "domain_router",
        "action_type": "CLASSIFICATION",
        "content": f"Complaint classified under regulatory domain: {domain}",
        "metadata": {"domain": domain, "confidence": 0.98}
    })
    
    return {
        "domain": domain,
        "agent_traces": traces
    }
