"""Small LangGraph workflow boundary with real circuit-breaker interruption."""
from datetime import datetime, timezone
from typing import Callable, Optional
from uuid import uuid4

from langgraph.graph import END, START, StateGraph
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

from core.config import settings
from core.telemetry import (
    agent_runs_counter, get_standard_attributes, get_tracer, human_escalations_counter,
    set_execution_context, workflow_completions_counter, workflow_iterations_counter,
)
from graph.state import AgentRunState
from safety.circuit_breaker import (
    BreakerDecision, CircuitBreaker, ExecutionHalted, bind_circuit_breaker,
    reset_circuit_breaker_binding,
)

AGENT_NODES = ("triage", "skeptic", "planner", "validator", "execute", "monitor")


def build_workflow(
    breaker: CircuitBreaker,
    handlers: Optional[dict[str, Callable[[AgentRunState], dict]]] = None,
):
    handlers = handlers or {}
    graph = StateGraph(AgentRunState)

    for name in AGENT_NODES:
        def execute_node(state: AgentRunState, node_name=name):
            decision = breaker.begin_iteration(node_name)
            iteration = breaker.iteration
            set_execution_context(state["case_id"], state["run_id"], node_name, iteration=iteration)
            workflow_iterations_counter.add(1, {"node": node_name})
            if decision.action == "HALT":
                return {"node": node_name, "iteration": iteration, "halt": decision.to_dict(),
                        "history": list(state.get("history", [])) + [{"node": node_name, "status": "HALTED", "iteration": iteration}]}
            handler = handlers.get(node_name)
            try:
                update = handler(state) if handler else {}
            except ExecutionHalted as exc:
                return {"node": node_name, "iteration": iteration, "halt": exc.decision.to_dict(),
                        "history": list(state.get("history", [])) + [{"node": node_name, "status": "HALTED", "iteration": iteration}]}
            except Exception as exc:
                # Node failures degrade to human review; they never escape the graph boundary.
                failed = breaker.evaluate(node_name)
                if failed.action == "ALLOW":
                    failed = BreakerDecision(
                        action="HALT", trigger="NODE_ERROR", threshold=None, observed=None,
                        node=node_name, iteration=iteration, total_tokens=breaker.total_tokens,
                        failure_count=breaker.consecutive_failures,
                        reason=f"Workflow node failed ({type(exc).__name__}); execution was stopped for human review.",
                        timestamp=datetime.now(timezone.utc).isoformat(),
                    )
                return {"node": node_name, "iteration": iteration, "halt": failed.to_dict(), "error_type": type(exc).__name__,
                        "history": list(state.get("history", [])) + [{"node": node_name, "status": "ERROR", "iteration": iteration}]}
            history = list(state.get("history", [])) + [{"node": node_name, "status": "SUCCESS", "iteration": iteration}]
            return {**(update or {}), "node": node_name, "iteration": iteration, "history": history}

        graph.add_node(name, execute_node)

    def safe_halt(state: AgentRunState):
        return {"status": "escalated", "needs_human_review": True}

    def human_review(state: AgentRunState):
        return {"status": "escalated", "needs_human_review": True}

    graph.add_node("safe_halt", safe_halt)
    graph.add_node("human_review", human_review)
    graph.add_edge(START, AGENT_NODES[0])

    for index, name in enumerate(AGENT_NODES):
        next_node = AGENT_NODES[index + 1] if index + 1 < len(AGENT_NODES) else END
        graph.add_conditional_edges(
            name,
            lambda state: "safe_halt" if state.get("halt") else "continue",
            {"safe_halt": "safe_halt", "continue": next_node},
        )
    graph.add_edge("safe_halt", "human_review")
    graph.add_edge("human_review", END)
    return graph.compile()


def run_agent_workflow(
    case_id: str,
    run_id: Optional[str] = None,
    handlers: Optional[dict[str, Callable[[AgentRunState], dict]]] = None,
    breaker: Optional[CircuitBreaker] = None,
) -> AgentRunState:
    """Execute and return final state; breaker signals are caught within LangGraph."""
    run_id = run_id or str(uuid4())
    breaker = breaker or CircuitBreaker()
    initial: AgentRunState = {"case_id": case_id, "run_id": run_id, "status": "running", "history": []}
    token = bind_circuit_breaker(breaker)
    set_execution_context(case_id, run_id, node="agent_root", iteration=0)
    tracer = get_tracer()
    root = tracer.start_span("agent_run", attributes=get_standard_attributes(
        node="agent_root", iteration=0, status="RUNNING", additional={"case_id": case_id, "run_id": run_id}
    ))
    agent_runs_counter.add(1, {"agent": "finresolve_orchestrator"})
    try:
        with trace.use_span(root, end_on_exit=False):
            result = build_workflow(breaker, handlers).invoke(initial)
        if result.get("halt"):
            root.set_attribute("status", "HALTED")
            root.add_event("CIRCUIT_BREAKER_TRIPPED", result["halt"])
            human_escalations_counter.add(1, {"trigger": result["halt"].get("trigger", "NODE_ERROR")})
        else:
            result["status"] = "resolved"
            workflow_completions_counter.add(1, {"status": "SUCCESS"})
        root.set_status(Status(StatusCode.OK))
        return result
    except Exception as exc:
        # Final host safety net: callers receive a structured degraded run.
        root.record_exception(RuntimeError(type(exc).__name__))
        root.set_status(Status(StatusCode.ERROR, type(exc).__name__))
        return {
            **initial, "status": "escalated", "needs_human_review": True,
            "error_type": type(exc).__name__,
            "halt": {"action": "HALT", "trigger": "WORKFLOW_ERROR", "node": breaker.last_node,
                     "iteration": breaker.iteration, "total_tokens": breaker.total_tokens,
                     "reason": "Workflow execution stopped safely after an internal error."},
        }
    finally:
        root.end()
        reset_circuit_breaker_binding(token)
