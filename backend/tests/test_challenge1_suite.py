import pytest
from fastapi.testclient import TestClient
from main import app

from app.safety.circuit_breaker import CircuitBreaker, CircuitBreakerPolicy
from app.core.telemetry import (
    reset_consecutive_tool_failures,
    get_consecutive_tool_failures,
    clear_recorded_spans
)
from app.core.llm import reset_accumulated_tokens
from app.agents.tools.bank_cbs_tool import query_bank_cbs
from app.agents.tools.merchant_pg_tool import query_merchant_pg
from app.agents.graph import finresolve_app

client = TestClient(app)

# Scenario 1: 4 consecutive tool failures -> Breaker trips
@pytest.mark.asyncio
async def test_scenario_1_four_consecutive_tool_failures_trips_breaker():
    reset_consecutive_tool_failures()
    cb = CircuitBreaker(CircuitBreakerPolicy(max_consecutive_tool_failures=4))
    
    await query_merchant_pg("FAIL_1")
    await query_merchant_pg("FAIL_2")
    await query_merchant_pg("FAIL_3")
    await query_merchant_pg("FAIL_4")
    
    assert get_consecutive_tool_failures() == 4
    decision = cb.evaluate(node="probing_agents", iteration=1, total_tokens=100, consecutive_tool_failures=4)
    assert decision.action == "HALT"
    assert decision.trigger == "CONSECUTIVE_TOOL_FAILURES"

# Scenario 2: 3 failures then a success -> Consecutive-failure counter resets
@pytest.mark.asyncio
async def test_scenario_2_three_failures_then_success_resets_counter():
    reset_consecutive_tool_failures()
    cb = CircuitBreaker(CircuitBreakerPolicy(max_consecutive_tool_failures=4))
    
    await query_merchant_pg("FAIL_1")
    await query_merchant_pg("FAIL_2")
    await query_merchant_pg("FAIL_3")
    assert get_consecutive_tool_failures() == 3
    
    # Success MUST reset counter
    await query_bank_cbs("TXN25000")
    assert get_consecutive_tool_failures() == 0
    
    decision = cb.evaluate(node="probing_agents", iteration=1, total_tokens=100, consecutive_tool_failures=0)
    assert decision.action == "ALLOW"

# Scenario 3: Token budget exceeded -> Breaker trips
def test_scenario_3_token_budget_exceeded_trips_breaker():
    cb = CircuitBreaker(CircuitBreakerPolicy(max_token_budget=2000))
    decision = cb.evaluate(node="planner", iteration=1, total_tokens=2500, consecutive_tool_failures=0)
    assert decision.action == "HALT"
    assert decision.trigger == "TOKEN_BUDGET_EXCEEDED"
    assert decision.threshold == 2000
    assert decision.observed == 2500

# Scenario 4: Max iterations exceeded -> Breaker trips
def test_scenario_4_max_iterations_exceeded_trips_breaker():
    cb = CircuitBreaker(CircuitBreakerPolicy(max_iterations=5))
    decision = cb.evaluate(node="replanner", iteration=5, total_tokens=500, consecutive_tool_failures=0)
    assert decision.action == "HALT"
    assert decision.trigger == "MAX_ITERATIONS_EXCEEDED"

# Scenario 5: Breaker trips inside LangGraph -> No further agent execution occurs
@pytest.mark.asyncio
async def test_scenario_5_breaker_trips_inside_langgraph_prevents_synthesizer():
    reset_consecutive_tool_failures()
    reset_accumulated_tokens()
    
    state = {
        "dispute_id": "GRV-S5-001",
        "citizen_id": "9999999999",
        "raw_complaint": "Runaway test",
        "evidence_urls": [],
        "extracted_entities": {},
        "domain": "DIGITAL_PAYMENTS_UPI",
        "required_stakeholders": [],
        "agent_traces": [],
        "ledger_records": [],
        "conflict_detected": False,
        "conflict_details": None,
        "iteration_count": 0,
        "confidence_score": 0.0,
        "requires_human_escalation": False,
        "escalation_reason": None,
        "ombudsman_verdict": None,
        "circuit_breaker_tripped": False,
        "circuit_breaker_event": None,
        "accumulated_tokens": 0,
        "consecutive_tool_failures": 4, # Simulate 4 consecutive failures
        "max_consecutive_tool_failures": 4,
        "final_resolution": None
    }
    
    result = await finresolve_app.ainvoke(state)
    assert result["circuit_breaker_tripped"] is True
    assert result["final_resolution"] is None  # Synthesizer was blocked!

# Scenario 6: Breaker trips -> FastAPI host stays healthy
def test_scenario_6_fastapi_host_stays_healthy_on_breaker_trip():
    # Make API request that triggers dispute creation
    res = client.post("/api/v1/disputes/", json={
        "citizen_name": "Prakhar Sharma",
        "complaint_text": "Trigger breaker test",
        "citizen_contact": "9999999999",
        "evidence_urls": []
    })
    assert res.status_code == 200
    
    # Immediately check health endpoint to confirm server did not crash
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

# Scenario 7: Breaker trips -> Halt event contains the exact node
def test_scenario_7_halt_event_contains_exact_node():
    cb = CircuitBreaker()
    decision = cb.evaluate(node="merchant_verification", iteration=2, total_tokens=100, consecutive_tool_failures=4)
    event = cb.generate_structured_halt_event("GRV-S7", "RUN-S7", decision)
    assert event["node"] == "merchant_verification"

# Scenario 8: Breaker trips -> Halt event contains trigger + threshold
def test_scenario_8_halt_event_contains_trigger_and_threshold():
    cb = CircuitBreaker(CircuitBreakerPolicy(max_consecutive_tool_failures=4))
    decision = cb.evaluate(node="probing_agents", iteration=2, total_tokens=100, consecutive_tool_failures=4)
    event = cb.generate_structured_halt_event("GRV-S8", "RUN-S8", decision)
    assert event["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert event["threshold"] == 4
    assert event["observed"] == 4

# Scenario 9: Normal successful run -> Breaker never trips
@pytest.mark.asyncio
async def test_scenario_9_normal_successful_run_breaker_never_trips():
    reset_consecutive_tool_failures()
    reset_accumulated_tokens()
    
    state = {
        "dispute_id": "GRV-PASS-S9",
        "citizen_id": "9999999999",
        "raw_complaint": "₹25000 debited from SBI but payment failed",
        "evidence_urls": [],
        "extracted_entities": {},
        "domain": "UNCLASSIFIED",
        "required_stakeholders": [],
        "agent_traces": [],
        "ledger_records": [],
        "conflict_detected": False,
        "conflict_details": None,
        "iteration_count": 0,
        "confidence_score": 0.0,
        "requires_human_escalation": False,
        "escalation_reason": None,
        "ombudsman_verdict": None,
        "circuit_breaker_tripped": False,
        "circuit_breaker_event": None,
        "accumulated_tokens": 0,
        "consecutive_tool_failures": 0,
        "final_resolution": None
    }
    
    result = await finresolve_app.ainvoke(state)
    assert result["circuit_breaker_tripped"] is False
    assert result["final_resolution"] is not None

# Scenario 10: Failure -> successful retry, within limits -> Workflow continues normally
@pytest.mark.asyncio
async def test_scenario_10_failure_then_successful_retry_within_limits_continues():
    reset_consecutive_tool_failures()
    cb = CircuitBreaker(CircuitBreakerPolicy(max_consecutive_tool_failures=4))
    
    # Failure 1
    await query_merchant_pg("FAIL_1")
    assert get_consecutive_tool_failures() == 1
    assert cb.evaluate(node="probing_agents", iteration=1, total_tokens=100, consecutive_tool_failures=1).action == "ALLOW"
    
    # Failure 2
    await query_merchant_pg("FAIL_2")
    assert get_consecutive_tool_failures() == 2
    assert cb.evaluate(node="probing_agents", iteration=1, total_tokens=100, consecutive_tool_failures=2).action == "ALLOW"
    
    # Successful retry
    await query_bank_cbs("TXN25000")
    assert get_consecutive_tool_failures() == 0
    decision = cb.evaluate(node="probing_agents", iteration=1, total_tokens=100, consecutive_tool_failures=0)
    assert decision.action == "ALLOW"
