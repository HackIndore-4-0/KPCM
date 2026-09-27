import pytest
from fastapi.testclient import TestClient
from main import app
from core.telemetry import clear_in_memory_telemetry
from tools.base import ToolExecutionTracker

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_api_test():
    clear_in_memory_telemetry()
    ToolExecutionTracker.reset()
    yield
    clear_in_memory_telemetry()
    ToolExecutionTracker.reset()


def test_api_normal_run():
    response = client.post(
        "/agent/run/case-norm-100",
        json={
            "complaint": "Money deducted but not reached merchant. UTR 1234567890",
            "max_consecutive_tool_failures": 4,
            "max_token_budget": 10000,
            "max_iterations": 10,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["case_id"] == "case-norm-100"
    assert data["status"] == "resolved"
    assert data["breaker_status"] == "ALLOW"
    assert data["halt_event"] is None
    assert len(data["timeline"]) > 0


def test_api_consecutive_tool_failure_trip():
    response = client.post(
        "/agent/run/case-tool-trip",
        json={
            "complaint": "Dispute on merchant payment. UTR 999888777",
            "max_consecutive_tool_failures": 4,
            "demo_scenario": "consecutive_tool_failures",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "escalated"
    assert data["breaker_status"] == "TRIPPED"
    assert data["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert data["tool_failure_count"] >= 4

    halt = data["halt_event"]
    assert halt is not None
    assert halt["event"] == "CIRCUIT_BREAKER_TRIPPED"
    assert halt["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert halt["node"] == "merchant_verification"
    assert halt["threshold"] == 4
    assert halt["observed"] == 4
    assert halt["action"] == "HALT_AND_ESCALATE"
    assert "consecutive tool calls failed" in halt["reason"] or "blocked" in halt["reason"]


def test_api_token_budget_trip():
    response = client.post(
        "/agent/run/case-token-trip",
        json={
            "complaint": "Large document reconciliation request",
            "max_token_budget": 5000,
            "demo_scenario": "token_budget",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "escalated"
    assert data["breaker_status"] == "TRIPPED"
    assert data["trigger"] == "TOKEN_BUDGET"

    halt = data["halt_event"]
    assert halt is not None
    assert halt["trigger"] == "TOKEN_BUDGET"
    assert halt["threshold"] == 5000
    assert halt["observed"] > 5000


def test_api_timeline_query():
    # Run a case
    res = client.post(
        "/agent/run/case-query-1",
        json={"complaint": "Test complaint", "demo_scenario": "consecutive_tool_failures"},
    )
    run_id = res.json()["run_id"]

    # Query timeline
    timeline_res = client.get(f"/agent/runs/{run_id}/timeline")
    assert timeline_res.status_code == 200
    data = timeline_res.json()
    assert data["run_id"] == run_id
    assert data["breaker_status"] == "TRIPPED"
    assert len(data["timeline"]) > 0


def test_dashboard_html_view():
    res = client.get("/dashboard")
    assert res.status_code == 200
    assert "text/html" in res.headers["content-type"]
    assert "FinResolve Circuit Breaker" in res.text
    assert "Execution Trace Timeline" in res.text
