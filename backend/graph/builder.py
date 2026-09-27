from langgraph.graph import StateGraph, START, END
from graph.state import GrievanceState
from graph.nodes.nodes import (
    triage_node,
    skeptic_node,
    evidence_gatherer_node,
    conflict_arbiter_node,
    planner_node,
    validator_node,
    execute_node,
    monitor_node,
    breaker_check_node,
    safe_halt_node,
    human_review_node,
    resolve_node,
)


def route_after_evidence(state: GrievanceState) -> str:
    """Early interception if tool failure threshold is breached during evidence gathering."""
    failures = state.get("consecutive_tool_failures", 0)
    max_failures = state.get("max_consecutive_tool_failures", 4)
    if failures >= max_failures:
        return "breaker_check"
    return "conflict_arbiter"


def route_after_breaker(state: GrievanceState) -> str:
    """Interception router evaluating Circuit Breaker decision."""
    if state.get("breaker_tripped"):
        return "safe_halt"
    
    if state.get("status") == "investigating":
        return "planner"
    
    return "resolve"


def build_grievance_graph():
    """Builds and compiles the FinResolve LangGraph workflow with Circuit Breaker safety gates."""
    builder = StateGraph(GrievanceState)

    # Register Nodes
    builder.add_node("triage", triage_node)
    builder.add_node("skeptic", skeptic_node)
    builder.add_node("evidence_gatherer", evidence_gatherer_node)
    builder.add_node("conflict_arbiter", conflict_arbiter_node)
    builder.add_node("planner", planner_node)
    builder.add_node("validator", validator_node)
    builder.add_node("execute", execute_node)
    builder.add_node("monitor", monitor_node)
    builder.add_node("breaker_check", breaker_check_node)
    builder.add_node("safe_halt", safe_halt_node)
    builder.add_node("human_review", human_review_node)
    builder.add_node("resolve", resolve_node)

    # Core Pipeline Transitions
    builder.add_edge(START, "triage")
    builder.add_edge("triage", "skeptic")
    builder.add_edge("skeptic", "evidence_gatherer")

    # Conditional Routing from Evidence Gatherer
    builder.add_conditional_edges(
        "evidence_gatherer",
        route_after_evidence,
        {
            "breaker_check": "breaker_check",
            "conflict_arbiter": "conflict_arbiter",
        },
    )

    builder.add_edge("conflict_arbiter", "planner")
    builder.add_edge("planner", "validator")
    builder.add_edge("validator", "execute")
    builder.add_edge("execute", "monitor")
    builder.add_edge("monitor", "breaker_check")

    # Conditional Routing from Breaker Check
    builder.add_conditional_edges(
        "breaker_check",
        route_after_breaker,
        {
            "safe_halt": "safe_halt",
            "planner": "planner",
            "resolve": "resolve",
        },
    )

    # Safe Halt and Degradation Transitions
    builder.add_edge("safe_halt", "human_review")
    builder.add_edge("human_review", END)
    builder.add_edge("resolve", END)

    return builder.compile()
