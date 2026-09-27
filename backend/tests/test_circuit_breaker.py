from safety.circuit_breaker import CircuitBreaker


def test_four_consecutive_failures_trip_and_success_resets_counter():
    breaker = CircuitBreaker(max_consecutive_tool_failures=4, max_token_budget=100, max_iterations=10)
    for _ in range(3):
        decision = breaker.record_tool_result(False, "merchant_api", node="merchant_verification", iteration=7)
        assert decision.action == "ALLOW"
    assert breaker.record_tool_result(True, "merchant_api").failure_count == 0
    for _ in range(3):
        assert breaker.record_tool_result(False, "merchant_api").action == "ALLOW"
    decision = breaker.record_tool_result(False, "merchant_api", node="merchant_verification")
    assert decision.action == "HALT"
    assert decision.trigger == "CONSECUTIVE_TOOL_FAILURES"
    assert decision.threshold == decision.observed == 4
    assert decision.node == "merchant_verification"


def test_token_and_iteration_thresholds_halt_independently():
    tokens = CircuitBreaker(max_consecutive_tool_failures=4, max_token_budget=10, max_iterations=10)
    assert tokens.record_tokens(10).action == "ALLOW"
    assert tokens.record_tokens(1, node="planner").trigger == "TOKEN_BUDGET"

    iterations = CircuitBreaker(max_consecutive_tool_failures=4, max_token_budget=100, max_iterations=2)
    assert iterations.begin_iteration("triage").action == "ALLOW"
    assert iterations.begin_iteration("planner").action == "ALLOW"
    decision = iterations.begin_iteration("monitor")
    assert (decision.action, decision.trigger, decision.threshold, decision.observed) == ("HALT", "MAX_ITERATIONS", 2, 3)


def test_decision_is_sticky_and_structured():
    breaker = CircuitBreaker(max_consecutive_tool_failures=1, max_token_budget=100, max_iterations=10)
    first = breaker.record_tool_result(False, "bank_api", node="evidence_gatherer")
    second = breaker.record_tool_result(True, "bank_api", node="later")
    assert first == second
    assert second.to_dict()["action"] == "HALT"
