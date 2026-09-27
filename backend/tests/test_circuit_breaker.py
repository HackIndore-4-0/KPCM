import pytest
from core.telemetry import (
    set_execution_context,
    get_in_memory_spans,
    clear_in_memory_telemetry,
)
from safety.circuit_breaker import (
    CircuitBreaker,
    BreakerAction,
    BreakerTrigger,
)


@pytest.fixture(autouse=True)
def setup_breaker_test():
    clear_in_memory_telemetry()
    set_execution_context(
        case_id="case-cb-100",
        run_id="run-cb-100",
        node="merchant_verification",
        agent="safety_evaluator",
        iteration=1,
    )
    yield
    clear_in_memory_telemetry()


def test_consecutive_tool_failures_trips_breaker():
    breaker = CircuitBreaker(max_consecutive_tool_failures=4)

    # 1st failure -> ALLOW
    d1 = breaker.record_tool_result("merchant_api", False, node="merchant_verification")
    assert d1.action == BreakerAction.ALLOW
    assert breaker.is_tripped is False

    # 2nd failure -> ALLOW
    d2 = breaker.record_tool_result("merchant_api", False, node="merchant_verification")
    assert d2.action == BreakerAction.ALLOW

    # 3rd failure -> ALLOW
    d3 = breaker.record_tool_result("merchant_api", False, node="merchant_verification")
    assert d3.action == BreakerAction.ALLOW

    # 4th failure -> TRIPS breaker (HALT)
    d4 = breaker.record_tool_result("merchant_api", False, node="merchant_verification")
    assert d4.action == BreakerAction.HALT
    assert d4.trigger == BreakerTrigger.CONSECUTIVE_TOOL_FAILURES
    assert d4.threshold == 4
    assert d4.observed == 4
    assert d4.node == "merchant_verification"
    assert breaker.is_tripped is True

    # Check structured halt event
    event = breaker.trip_event
    assert event is not None
    assert event.event == "CIRCUIT_BREAKER_TRIPPED"
    assert event.node == "merchant_verification"
    assert event.trigger == BreakerTrigger.CONSECUTIVE_TOOL_FAILURES
    assert event.threshold == 4
    assert event.observed == 4
    assert event.tool == "merchant_api"
    assert "Merchant verification failed" in event.reason or "merchant_api" in event.reason


def test_consecutive_failure_reset_on_success():
    breaker = CircuitBreaker(max_consecutive_tool_failures=4)

    breaker.record_tool_result("bank_api", False)
    breaker.record_tool_result("bank_api", False)
    breaker.record_tool_result("bank_api", False)
    assert breaker.consecutive_tool_failures == 3

    # Success resets counter
    d_succ = breaker.record_tool_result("bank_api", True)
    assert d_succ.action == BreakerAction.ALLOW
    assert breaker.consecutive_tool_failures == 0

    # 1 more failure should NOT trip (count is now 1, not 4)
    d_fail = breaker.record_tool_result("bank_api", False)
    assert d_fail.action == BreakerAction.ALLOW
    assert breaker.consecutive_tool_failures == 1
    assert breaker.is_tripped is False


def test_token_budget_exceeded_trips_breaker():
    breaker = CircuitBreaker(max_token_budget=5000)

    # 2500 tokens -> ALLOW
    d1 = breaker.record_token_consumption(2500, node="planner")
    assert d1.action == BreakerAction.ALLOW
    assert breaker.is_tripped is False

    # Another 2600 tokens -> Total 5100 -> TRIPS (HALT)
    d2 = breaker.record_token_consumption(2600, node="planner")
    assert d2.action == BreakerAction.HALT
    assert d2.trigger == BreakerTrigger.TOKEN_BUDGET_EXCEEDED
    assert d2.threshold == 5000
    assert d2.observed == 5100
    assert d2.node == "planner"
    assert breaker.is_tripped is True

    # Verify event
    assert breaker.trip_event is not None
    assert breaker.trip_event.trigger == BreakerTrigger.TOKEN_BUDGET_EXCEEDED
    assert breaker.trip_event.total_tokens == 5100


def test_max_iterations_exceeded_trips_breaker():
    breaker = CircuitBreaker(max_iterations=5)

    for i in range(1, 5):
        d = breaker.record_iteration(iteration=i, node="monitor")
        assert d.action == BreakerAction.ALLOW

    # 5th iteration reached
    d5 = breaker.record_iteration(iteration=5, node="monitor")
    assert d5.action == BreakerAction.HALT
    assert d5.trigger == BreakerTrigger.MAX_ITERATIONS_EXCEEDED
    assert d5.threshold == 5
    assert d5.observed == 5
    assert d5.node == "monitor"
    assert breaker.is_tripped is True


def test_normal_successful_run_stays_allowed():
    breaker = CircuitBreaker(
        max_consecutive_tool_failures=4,
        max_token_budget=10000,
        max_iterations=10,
    )

    breaker.record_iteration(iteration=1, node="intake")
    breaker.record_token_consumption(500, node="triage")
    breaker.record_tool_result("bank_cbs", True, node="evidence_gatherer")
    breaker.record_tool_result("npci_switch", True, node="evidence_gatherer")
    breaker.record_token_consumption(800, node="planner")
    decision = breaker.evaluate(node="monitor")

    assert decision.action == BreakerAction.ALLOW
    assert breaker.is_tripped is False
    assert breaker.trip_event is None
