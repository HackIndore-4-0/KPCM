from core.telemetry import clear_in_memory_telemetry, get_in_memory_spans
from graph.workflow import run_agent_workflow
from safety.circuit_breaker import CircuitBreaker
from tools.base import ToolExecutionTracker


def setup_function():
    clear_in_memory_telemetry()
    ToolExecutionTracker.reset()


def test_breaker_trip_inside_langgraph_prevents_later_agent_nodes():
    calls = []

    def failing_execute(state):
        calls.append("execute")
        from mocks import query_merchant_pg
        for attempt in range(10):
            query_merchant_pg(f"txn-{attempt}", force_fail=True, node="merchant_verification")
        calls.append("unreachable")
        return {}

    handlers = {name: (lambda state, name=name: calls.append(name) or {})
                for name in ("triage", "skeptic", "planner", "validator", "monitor")}
    handlers["execute"] = failing_execute
    breaker = CircuitBreaker(max_consecutive_tool_failures=4, max_token_budget=100, max_iterations=20)
    result = run_agent_workflow("case-loop", handlers=handlers, breaker=breaker)

    assert result["status"] == "escalated"
    assert result["needs_human_review"] is True
    assert result["halt"]["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert result["halt"]["node"] == "merchant_verification"
    assert "unreachable" not in calls
    assert "monitor" not in calls
    assert len([span for span in get_in_memory_spans() if span.name == "tool_call:merchant_pg"]) == 4


def test_token_budget_trip_interrupts_llm_and_degrades():
    calls = []

    def planner(state):
        from llm.client import llm_call
        llm_call("prompt", simulated_tokens={"input_tokens": 8, "output_tokens": 5, "total_tokens": 13})
        calls.append("after_llm")
        return {}

    result = run_agent_workflow(
        "case-token", handlers={"planner": planner},
        breaker=CircuitBreaker(max_consecutive_tool_failures=4, max_token_budget=12, max_iterations=20),
    )
    assert result["halt"]["trigger"] == "TOKEN_BUDGET"
    assert result["halt"]["node"] == "planner"
    assert calls == []


def test_successful_workflow_does_not_trip():
    result = run_agent_workflow("case-ok", handlers={name: lambda state: {} for name in ("triage", "planner")})
    assert result["status"] == "resolved"
    assert "halt" not in result
