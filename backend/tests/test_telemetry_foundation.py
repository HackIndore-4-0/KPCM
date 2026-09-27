import pytest
from fastapi.testclient import TestClient

from core.telemetry import (
    get_tracer,
    get_meter,
    set_execution_context,
    get_current_context,
    get_standard_attributes,
    start_agent_run_span,
    get_in_memory_spans,
    clear_in_memory_telemetry,
    agent_runs_counter,
    workflow_iterations_counter,
)
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_teardown():
    clear_in_memory_telemetry()
    yield
    clear_in_memory_telemetry()


def test_tracer_and_meter_initialization():
    tracer = get_tracer()
    meter = get_meter()
    assert tracer is not None
    assert meter is not None


def test_context_management():
    set_execution_context(
        case_id="case-101",
        run_id="run-505",
        node="intake",
        agent="triage_agent",
        iteration=1,
    )
    ctx = get_current_context()
    assert ctx["case_id"] == "case-101"
    assert ctx["run_id"] == "run-505"
    assert ctx["node"] == "intake"
    assert ctx["agent"] == "triage_agent"
    assert ctx["iteration"] == 1


def test_root_agent_run_span_creation():
    case_id = "case-test-999"
    run_id = "run-test-111"
    
    span = start_agent_run_span(
        case_id=case_id,
        run_id=run_id,
        node="agent_root",
        agent="finresolve_orchestrator",
        iteration=0,
    )
    span.end()
    
    spans = get_in_memory_spans()
    assert len(spans) == 1
    root_span = spans[0]
    
    assert root_span.name == "agent_run"
    attrs = root_span.attributes
    assert attrs["case_id"] == case_id
    assert attrs["run_id"] == run_id
    assert attrs["node"] == "agent_root"
    assert attrs["agent"] == "finresolve_orchestrator"
    assert attrs["iteration"] == 0
    assert attrs["status"] == "RUNNING"
    assert "timestamp" in attrs


def test_metric_instruments_recording():
    # Verify metric instruments accept recordings without throwing errors
    agent_runs_counter.add(1, {"case_id": "test_case", "agent": "orchestrator"})
    workflow_iterations_counter.add(1, {"case_id": "test_case", "iteration": 1})
    assert True


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "FinResolve" in data["app_name"]
