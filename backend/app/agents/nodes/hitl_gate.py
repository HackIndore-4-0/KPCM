from typing import Dict, Any
from app.agents.state import FinResolveState

async def hitl_gate_node(state: FinResolveState) -> Dict[str, Any]:
    """Human-in-the-Loop checkpoint for high-risk, ambiguous, or fraud-flagged cases."""
    traces = state.get("agent_traces", [])
    
    traces.append({
        "node_name": "hitl_gate",
        "action_type": "ESCALATION_CHECKPOINT",
        "content": "Execution paused. High-value dispute routed to Ombudsman Cockpit for human authorization.",
        "metadata": {"status": "AWAITING_HUMAN_SIGN_OFF"}
    })
    
    return {
        "requires_human_escalation": True,
        "agent_traces": traces
    }
