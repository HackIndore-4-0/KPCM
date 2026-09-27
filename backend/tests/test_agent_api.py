from fastapi.testclient import TestClient
from main import app


client = TestClient(app)


def test_agent_run_success_and_timeline_api():
    response = client.post("/agent/run/case-api-ok", json={"complaint": "Payment was debited."})
    assert response.status_code == 200
    run = response.json()
    assert run["status"] == "resolved"
    assert run["breaker_status"] == "ALLOW"
    assert run["timeline"][-1]["node"] == "monitor"
    timeline = client.get(f"/agent/runs/{run['run_id']}/timeline")
    assert timeline.status_code == 200
    assert timeline.json()["case_id"] == "case-api-ok"


def test_breaker_api_returns_structured_halt_and_host_stays_healthy():
    response = client.post("/agent/run/case-api-halt", json={
        "complaint": "Payment dispute.", "demo_scenario": "consecutive_tool_failures",
    })
    assert response.status_code == 200
    run = response.json()
    assert run["status"] == "escalated"
    assert run["breaker_status"] == "TRIPPED"
    assert run["halt_event"]["event"] == "CIRCUIT_BREAKER_TRIPPED"
    assert run["halt_event"]["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert run["halt_event"]["threshold"] == 4
    assert run["halt_event"]["node"] == "merchant_verification"
    assert run["safe_degradation_action"] == "HALT_AND_ESCALATE"
    assert client.get("/health").status_code == 200


def test_token_budget_demo_trips():
    response = client.post("/agent/run/case-api-token", json={
        "complaint": "Payment dispute.", "max_token_budget": 100, "demo_scenario": "token_budget",
    })
    assert response.status_code == 200
    run = response.json()
    assert run["halt_event"]["trigger"] == "TOKEN_BUDGET"
    assert run["halt_event"]["total_tokens"] == 10500
