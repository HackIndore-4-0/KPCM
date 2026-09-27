import pytest
from fastapi.testclient import TestClient

from core.telemetry import clear_in_memory_telemetry, get_in_memory_spans
from graph.workflow import run_agent_workflow
from main import app
from mocks.merchant_pg import query_merchant_pg
from mocks.bank_cbs import query_bank_cbs
from safety.circuit_breaker import CircuitBreaker, BreakerAction
from tools.base import ToolExecutionTracker

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_teardown():
    clear_in_memory_telemetry()
    ToolExecutionTracker.reset()
    yield
    clear_in_memory_telemetry()
    ToolExecutionTracker.reset()


# Scenario 1: 4 consecutive tool failures -> Breaker trips
def test_scenario_1_consecutive_tool_failures_trips_breaker():
    breaker = CircuitBreaker(max_consecutive_tool_failures=4)
    for _ in range(3):
        d = breaker.record_tool_result(False, "merchant_pg", node="merchant_verification")
        assert d.action == BreakerAction.ALLOW
        assert breaker.is_tripped is False

    d4 = breaker.record_tool_result(False, "merchant_pg", node="merchant_verification")
    assert d4.action == BreakerAction.HALT
    assert d4.trigger == "CONSECUTIVE_TOOL_FAILURES"
    assert breaker.is_tripped is True
    assert breaker.consecutive_failures == 4


# Scenario 2: 3 failures then a success -> Consecutive-failure counter resets
def test_scenario_2_consecutive_failure_resets_on_success():
    breaker = CircuitBreaker(max_consecutive_tool_failures=4)
    for _ in range(3):
        breaker.record_tool_result(False, "bank_cbs")
    assert breaker.consecutive_failures == 3

    # Success resets counter
    d_ok = breaker.record_tool_result(True, "bank_cbs")
    assert d_ok.action == BreakerAction.ALLOW
    assert breaker.consecutive_failures == 0

    # Next failure is 1, not 4
    d_fail = breaker.record_tool_result(False, "bank_cbs")
    assert d_fail.action == BreakerAction.ALLOW
    assert breaker.consecutive_failures == 1
    assert breaker.is_tripped is False


# Scenario 3: Token budget exceeded -> Breaker trips
def test_scenario_3_token_budget_exceeded_trips_breaker():
    breaker = CircuitBreaker(max_token_budget=5000)
    d1 = breaker.record_tokens(3000, node="planner")
    assert d1.action == BreakerAction.ALLOW

    d2 = breaker.record_tokens(2500, node="planner")
    assert d2.action == BreakerAction.HALT
    assert d2.trigger == "TOKEN_BUDGET"
    assert breaker.is_tripped is True
    assert breaker.total_tokens == 5500


# Scenario 4: Max iterations exceeded -> Breaker trips
def test_scenario_4_max_iterations_exceeded_trips_breaker():
    breaker = CircuitBreaker(max_iterations=5)
    for i in range(5):
        d = breaker.begin_iteration(node="monitor")
        assert d.action == BreakerAction.ALLOW

    # Exceeding iteration 5
    d6 = breaker.begin_iteration(node="monitor")
    assert d6.action == BreakerAction.HALT
    assert d6.trigger == "MAX_ITERATIONS"
    assert breaker.is_tripped is True


def test_scenario_4b_graph_loop_stops_at_iteration_limit():
    response = client.post("/agent/run/case-loop-budget", json={
        "complaint": "Loop safety check", "max_iterations": 2,
        "demo_scenario": "max_iterations",
    })
    assert response.status_code == 200
    halt = response.json()["halt_event"]
    assert halt["trigger"] == "MAX_ITERATIONS"
    assert halt["threshold"] == 2
    assert halt["observed"] == 3
    assert halt["node"] == "triage"


# Scenario 5: Breaker trips inside LangGraph -> No further agent execution occurs
def test_scenario_5_breaker_trips_inside_langgraph_halts_further_agent_execution():
    executed_nodes = []

    def failing_execute(state):
        executed_nodes.append("execute")
        for attempt in range(10):
            query_merchant_pg(f"txn-{attempt}", force_fail=True, node="merchant_verification")
        executed_nodes.append("unreachable_post_execute")
        return {}

    handlers = {
        "triage": lambda s: executed_nodes.append("triage") or {},
        "skeptic": lambda s: executed_nodes.append("skeptic") or {},
        "planner": lambda s: executed_nodes.append("planner") or {},
        "validator": lambda s: executed_nodes.append("validator") or {},
        "execute": failing_execute,
        "monitor": lambda s: executed_nodes.append("monitor") or {},
    }

    breaker = CircuitBreaker(max_consecutive_tool_failures=4)
    result = run_agent_workflow("case-halt-chain", handlers=handlers, breaker=breaker)

    assert result["status"] == "escalated"
    assert result["needs_human_review"] is True
    assert "execute" in executed_nodes
    assert "unreachable_post_execute" not in executed_nodes
    assert "monitor" not in executed_nodes  # monitor was never executed!
    assert result["halt"]["trigger"] == "CONSECUTIVE_TOOL_FAILURES"


# Scenario 6: Breaker trips -> FastAPI host stays healthy
def test_scenario_6_breaker_trips_fastapi_host_stays_healthy():
    # Trigger breaker trip via API
    res = client.post(
        "/agent/run/case-host-check",
        json={"complaint": "Payment failed", "demo_scenario": "consecutive_tool_failures"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["breaker_status"] == "TRIPPED"

    # Verify FastAPI health is still 200 and healthy
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


# Scenario 7: Breaker trips -> Halt event contains the exact node
def test_scenario_7_halt_event_contains_exact_node():
    res = client.post(
        "/agent/run/case-node-trace",
        json={"complaint": "Payment failed", "demo_scenario": "consecutive_tool_failures"},
    )
    halt = res.json()["halt_event"]
    assert halt is not None
    assert halt["node"] == "merchant_verification"
    decision_span = next(span for span in get_in_memory_spans() if span.name == "circuit_breaker_decision")
    assert decision_span.attributes["case_id"] == "case-node-trace"
    assert decision_span.attributes["node"] == "merchant_verification"
    assert decision_span.attributes["failure_count"] == 4


# Scenario 8: Breaker trips -> Halt event contains trigger + threshold
def test_scenario_8_halt_event_contains_trigger_and_threshold():
    res = client.post(
        "/agent/run/case-trigger-check",
        json={
            "complaint": "Payment failed",
            "max_consecutive_tool_failures": 4,
            "demo_scenario": "consecutive_tool_failures",
        },
    )
    halt = res.json()["halt_event"]
    assert halt["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert halt["threshold"] == 4
    assert halt["observed"] == 4
    assert halt["action"] == "HALT_AND_ESCALATE"
    assert len([event for event in res.json()["timeline"] if event.get("status") == "FAILURE"]) == 4


# Scenario 9: Normal successful run -> Breaker never trips
def test_scenario_9_normal_successful_run_never_trips():
    res = client.post(
        "/agent/run/case-normal-success",
        json={"complaint": "Money deducted but order failed. UTR 9876543210"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "resolved"
    assert data["breaker_status"] == "ALLOW"
    assert data["halt_event"] is None
    assert data["needs_human_review"] is False


# Scenario 10: Failure -> successful retry, within limits -> Workflow continues normally
def test_scenario_10_failure_then_successful_retry_within_limits_workflow_continues():
    attempts = 0

    def retry_tool_handler(state):
        nonlocal attempts
        # 2 failures then 1 success (within 4 limit)
        query_bank_cbs("TXN_RETRY", force_fail=True, node="evidence_gatherer")
        query_bank_cbs("TXN_RETRY", force_fail=True, node="evidence_gatherer")
        res_ok = query_bank_cbs("TXN_RETRY", force_fail=False, node="evidence_gatherer")
        assert res_ok.success is True
        return {"retry_success": True}

    breaker = CircuitBreaker(max_consecutive_tool_failures=4)
    result = run_agent_workflow(
        "case-retry-ok",
        handlers={"execute": retry_tool_handler},
        breaker=breaker,
    )

    assert result["status"] == "resolved"
    assert breaker.is_tripped is False
    assert breaker.consecutive_failures == 0
    assert "halt" not in result
