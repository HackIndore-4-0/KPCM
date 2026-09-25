from typing import Dict, Any
from app.agents.state import FinResolveState

async def dependency_mapper_node(state: FinResolveState) -> Dict[str, Any]:
    """Identifies the external institutions, banks, or gateways that must be probed."""
    traces = state.get("agent_traces", [])
    domain = state.get("domain", "DIGITAL_PAYMENTS_UPI")
    
    stakeholders = ["BANK_CBS", "NPCI_SWITCH", "MERCHANT_PG"]
    if domain == "PENSION_DISPUTE":
        stakeholders = ["CPAO_PENSION_PORTAL", "DISBURSING_BANK"]
        
    traces.append({
        "node_name": "dependency_mapper",
        "action_type": "MAP_DEPENDENCIES",
        "content": f"Mapped {len(stakeholders)} required external institutions for parallel cross-querying: {', '.join(stakeholders)}",
        "metadata": {"stakeholders": stakeholders}
    })
    
    return {
        "required_stakeholders": stakeholders,
        "agent_traces": traces
    }
