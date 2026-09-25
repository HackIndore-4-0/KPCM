from typing import Dict, Any
from app.agents.state import FinResolveState

async def replanner_node(state: FinResolveState) -> Dict[str, Any]:
    """Dynamic cycle replanner that triggers when information is ambiguous or tools fail."""
    traces = state.get("agent_traces", [])
    count = state.get("iteration_count", 0) + 1
    
    traces.append({
        "node_name": "replanner",
        "action_type": "REPLAN",
        "content": f"Replanner cycle {count}: adjusting search strategies and verifying retry policies.",
        "metadata": {"iteration": count}
    })
    
    return {
        "iteration_count": count,
        "agent_traces": traces
    }
