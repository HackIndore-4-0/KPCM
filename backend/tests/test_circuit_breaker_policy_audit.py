"""Direct verification of authoritative production CircuitBreaker thresholds.

Authoritative policies:
- MAX_CONSECUTIVE_TOOL_FAILURES = 4
- MAX_TOKEN_BUDGET = 10,000
- MAX_ITERATIONS = 10
"""
from fastapi.testclient import TestClient
from main import app
from safety.circuit_breaker import CircuitBreaker
from core.config import settings

client = TestClient(app)


def test_production_thresholds_configured_correctly():
    """Verify settings defaults match the authoritative specifications."""
    assert settings.max_consecutive_tool_failures == 4
    assert settings.max_token_budget == 10000
    assert settings.max_iterations == 10


def test_failures_1_2_3_allow_and_failure_4_halts():
    """Verify failures 1, 2, 3 do NOT halt, and failure 4 HALTS."""
    cb = CircuitBreaker()  # Uses authoritative settings defaults

    # Failures 1, 2, 3 -> must ALLOW
    for count in range(1, 4):
        decision = cb.record_tool_result(False, "query_bank_cbs", node="execute")
        assert decision.action == "ALLOW", f"Failure {count} must ALLOW"
        assert cb.consecutive_failures == count
        assert not cb.is_tripped

    # Failure 4 -> must HALT
    decision_4 = cb.record_tool_result(False, "query_bank_cbs", node="execute")
    assert decision_4.action == "HALT"
    assert decision_4.trigger == "CONSECUTIVE_TOOL_FAILURES"
    assert decision_4.threshold == 4
    assert decision_4.observed == 4
    assert cb.is_tripped is True


def test_successful_tool_resets_consecutive_failures():
    """Verify a success resets consecutive failure count back to 0."""
    cb = CircuitBreaker()
    # 3 consecutive failures
    for _ in range(3):
        cb.record_tool_result(False, "query_npci_switch", node="execute")
    assert cb.consecutive_failures == 3

    # Success resets counter
    decision_success = cb.record_tool_result(True, "query_npci_switch", node="execute")
    assert decision_success.action == "ALLOW"
    assert cb.consecutive_failures == 0

    # Needs another full 4 failures to trip
    for _ in range(3):
        assert cb.record_tool_result(False, "query_npci_switch").action == "ALLOW"
    final_halt = cb.record_tool_result(False, "query_npci_switch")
    assert final_halt.action == "HALT"
    assert final_halt.observed == 4


def test_token_budget_10000_ceiling():
    """Verify exactly 10,000 tokens is allowed and 10,001 halts."""
    cb = CircuitBreaker()
    # Up to 10,000 tokens -> ALLOW
    assert cb.record_tokens(10000).action == "ALLOW"
    assert not cb.is_tripped

    # Exceeding budget -> HALT
    exceeded = cb.record_tokens(1)
    assert exceeded.action == "HALT"
    assert exceeded.trigger == "TOKEN_BUDGET"
    assert exceeded.threshold == 10000
    assert exceeded.observed == 10001


def test_iteration_limit_10_ceiling():
    """Verify 10 iterations is allowed and iteration 11 halts."""
    cb = CircuitBreaker()
    # Iterations 1 to 10 -> ALLOW
    for i in range(1, 11):
        decision = cb.begin_iteration(f"node_{i}")
        assert decision.action == "ALLOW"
        assert cb.iteration == i
        assert not cb.is_tripped

    # Iteration 11 -> HALT
    exceeded = cb.begin_iteration("node_11")
    assert exceeded.action == "HALT"
    assert exceeded.trigger == "MAX_ITERATIONS"
    assert exceeded.threshold == 10
    assert exceeded.observed == 11


def test_api_runaway_demo_trips_at_threshold_4():
    """Verify the default API consecutive_tool_failures demo halts at threshold 4."""
    resp = client.post(
        "/agent/run/test-audit-fail-4",
        json={"complaint": "Simulated tool failure audit", "demo_scenario": "consecutive_tool_failures"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["breaker_status"] == "TRIPPED"
    assert data["tool_failure_count"] == 4
    assert data["tool_failure_threshold"] == 4
    assert data["halt_event"]["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert data["halt_event"]["threshold"] == 4
    assert data["halt_event"]["observed"] == 4
