import pytest
from app.core.telemetry import (
    agent_run_span,
    node_execution_span,
    get_span_exporter,
    clear_recorded_spans,
    get_execution_context
)

def test_telemetry_foundation_spans():
    clear_recorded_spans()
    
    with agent_run_span(case_id="CASE-1001", run_id="RUN-1001") as root_span:
        assert get_execution_context()["case_id"] == "CASE-1001"
        assert get_execution_context()["run_id"] == "RUN-1001"
        
        with node_execution_span(node_name="triage", agent_name="triage_agent", iteration=1) as n_span:
            assert get_execution_context()["node"] == "triage"
            assert get_execution_context()["iteration"] == 1

    spans = get_span_exporter().get_finished_spans()
    assert len(spans) == 2
    
    node_span = [s for s in spans if s.name == "node.triage"][0]
    run_span = [s for s in spans if s.name == "agent_run"][0]
    
    assert node_span.attributes["case_id"] == "CASE-1001"
    assert node_span.attributes["node"] == "triage"
    assert node_span.attributes["iteration"] == 1
    assert run_span.attributes["status"] == "COMPLETED"
