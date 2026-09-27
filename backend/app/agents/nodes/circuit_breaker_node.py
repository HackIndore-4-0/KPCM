from typing import Dict, Any
from app.agents.state import FinResolveState
from app.safety.circuit_breaker import CircuitBreaker, CircuitBreakerPolicy
from app.core.telemetry import (
    get_execution_context,
    get_consecutive_tool_failures
)
from app.core.llm import get_accumulated_tokens

async def circuit_breaker_check_node(state: FinResolveState) -> Dict[str, Any]:
    """Node that evaluates safety circuit breaker policies after workflow steps or tool executions."""
    traces = state.get("agent_traces", [])
    
    # Retrieve configured policy thresholds or standard defaults
    policy = CircuitBreakerPolicy(
        max_consecutive_tool_failures=state.get("max_consecutive_tool_failures") or 4,
        max_token_budget=state.get("max_token_budget") or 10000,
        max_iterations=state.get("max_iterations") or 5,
    )
    
    cb = CircuitBreaker(policy)
    
    ctx = get_execution_context()
    node_name = ctx.get("node", "workflow")
    iteration = state.get("iteration_count", 0)
    
    # Consume actual accumulated token budget & tool failure counts from real-time telemetry
    tokens = state.get("accumulated_tokens") or get_accumulated_tokens()
    failures = get_consecutive_tool_failures()
    if failures == 0 and state.get("consecutive_tool_failures"):
        failures = state["consecutive_tool_failures"]
        
    decision = cb.evaluate(
        node=node_name,
        iteration=iteration,
        total_tokens=tokens,
        consecutive_tool_failures=failures
    )
    
    if decision.action == "HALT":
        halt_event = cb.generate_structured_halt_event(
            case_id=state.get("dispute_id", "UNKNOWN"),
            run_id=ctx.get("run_id", "RUN-UNKNOWN"),
            decision=decision
        )
        
        traces.append({
            "node_name": node_name,
            "action_type": "CIRCUIT_BREAKER_TRIPPED",
            "content": decision.reason,
            "metadata": halt_event
        })
        
        return {
            "circuit_breaker_tripped": True,
            "circuit_breaker_event": halt_event,
            "requires_human_escalation": True,
            "escalation_reason": decision.reason,
            "accumulated_tokens": tokens,
            "consecutive_tool_failures": failures,
            "agent_traces": traces
        }
        
    return {
        "circuit_breaker_tripped": False,
        "accumulated_tokens": tokens,
        "consecutive_tool_failures": failures,
        "agent_traces": traces
    }
