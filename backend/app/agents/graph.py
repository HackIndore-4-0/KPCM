from langgraph.graph import StateGraph, END
from app.agents.state import FinResolveState
from app.agents.nodes.ingestion import ingestion_node
from app.agents.nodes.domain_router import domain_router_node
from app.agents.nodes.dependency_mapper import dependency_mapper_node
from app.agents.nodes.probing_agents import probing_agents_node
from app.agents.nodes.conflict_arbiter import conflict_arbiter_node
from app.agents.nodes.replanner import replanner_node
from app.agents.nodes.hitl_gate import hitl_gate_node
from app.agents.nodes.synthesizer import synthesizer_node

def route_after_arbitration(state: FinResolveState) -> str:
    """Evaluates whether to escalate to human, re-plan, or synthesize resolution."""
    if state.get("requires_human_escalation", False):
        return "hitl_gate"
    if state.get("confidence_score", 1.0) < 0.70 and state.get("iteration_count", 0) < 2:
        return "replanner"
    return "synthesizer"

def build_finresolve_graph():
    """Constructs and compiles the FinResolve LangGraph state machine."""
    workflow = StateGraph(FinResolveState)
    
    # Register Nodes
    workflow.add_node("ingestion", ingestion_node)
    workflow.add_node("domain_router", domain_router_node)
    workflow.add_node("dependency_mapper", dependency_mapper_node)
    workflow.add_node("probing_agents", probing_agents_node)
    workflow.add_node("conflict_arbiter", conflict_arbiter_node)
    workflow.add_node("replanner", replanner_node)
    workflow.add_node("hitl_gate", hitl_gate_node)
    workflow.add_node("synthesizer", synthesizer_node)
    
    # Linear Forward Edges
    workflow.set_entry_point("ingestion")
    workflow.add_edge("ingestion", "domain_router")
    workflow.add_edge("domain_router", "dependency_mapper")
    workflow.add_edge("dependency_mapper", "probing_agents")
    workflow.add_edge("probing_agents", "conflict_arbiter")
    
    # Conditional Edges & Cycles
    workflow.add_conditional_edges(
        "conflict_arbiter",
        route_after_arbitration,
        {
            "hitl_gate": "hitl_gate",
            "replanner": "replanner",
            "synthesizer": "synthesizer"
        }
    )
    
    # Cycle Edge from Replanner back to probing
    workflow.add_edge("replanner", "probing_agents")
    
    # Termination Edges
    workflow.add_edge("hitl_gate", END)
    workflow.add_edge("synthesizer", END)
    
    return workflow.compile()

finresolve_app = build_finresolve_graph()
