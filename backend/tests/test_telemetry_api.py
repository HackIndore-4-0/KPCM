import pytest
from fastapi.testclient import TestClient
from main import app
from app.api.v1.disputes import disputes_db
from app.safety.hitl_store import hitl_store, HITLActionProposal

client = TestClient(app)

def test_telemetry_metrics_endpoint():
    res = client.get("/api/v1/telemetry/metrics")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "active"
    assert "consecutive_tool_failures" in data
    assert "accumulated_tokens" in data

def test_telemetry_spans_endpoint():
    res = client.get("/api/v1/telemetry/spans")
    assert res.status_code == 200
    spans = res.json()
    assert isinstance(spans, list)

def test_circuit_breaker_status_endpoint():
    res = client.get("/api/v1/telemetry/circuit-breaker")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ARMED"
    assert data["policy"]["max_consecutive_tool_failures"] == 4

def test_dispute_timeline_endpoint():
    disputes_db["GRV-TIMELINE-001"] = {
        "dispute_id": "GRV-TIMELINE-001",
        "circuit_breaker_tripped": True,
        "circuit_breaker_event": {
            "event": "CIRCUIT_BREAKER_TRIPPED",
            "trigger": "CONSECUTIVE_TOOL_FAILURES"
        },
        "agent_traces": [
            {"node_name": "ingestion", "action_type": "EXTRACT", "content": "Extracted UTR"},
            {"node_name": "probing_agents", "action_type": "CIRCUIT_BREAKER_TRIPPED", "content": "Halted execution"}
        ]
    }
    
    res = client.get("/api/v1/telemetry/disputes/GRV-TIMELINE-001/timeline")
    assert res.status_code == 200
    data = res.json()
    assert data["circuit_breaker_tripped"] is True
    assert len(data["timeline"]) == 2

def test_ombudsman_pending_actions_and_review_api():
    """Challenge 2 API Test: Retrieve pending actions and submit review."""
    proposal = hitl_store.pause_and_persist(HITLActionProposal(
        dispute_id="GRV-API-001",
        run_id="RUN-API-001",
        tool_name="execute_bank_reversal",
        proposed_parameters={"dispute_id": "GRV-API-001", "amount": 12000.0},
        generated_context={"complaint": "Failed ATM withdrawal", "confidence_score": 0.92}
    ))
    action_id = proposal.id
    
    # 1. Fetch pending actions
    res = client.get("/api/v1/ombudsman/pending-actions")
    assert res.status_code == 200
    pending = res.json()
    assert any(a["id"] == action_id for a in pending)
    
    # 2. Fetch specific action details
    res_detail = client.get(f"/api/v1/ombudsman/actions/{action_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["dispute_id"] == "GRV-API-001"
    
    # 3. Submit Review
    res_review = client.post(f"/api/v1/ombudsman/actions/{action_id}/review", json={
        "verdict": "APPROVE",
        "officer_notes": "Atm log confirms cash dispense failure. Approved."
    })
    assert res_review.status_code == 200
    assert res_review.json()["status"] == "REVIEW_RECORDED"
    assert res_review.json()["record"]["status"] == "APPROVED"

def test_ombudsman_resume_execution_api_approve():
    """Challenge 2 API Test: Resume workflow upon approval."""
    proposal = hitl_store.pause_and_persist(HITLActionProposal(
        dispute_id="GRV-API-RESUME-01",
        run_id="RUN-API-002",
        tool_name="execute_bank_reversal",
        proposed_parameters={
            "dispute_id": "GRV-API-RESUME-01",
            "account_no": "ACC_SBI_001",
            "amount": 5000.0,
            "utr": "UTR11223344"
        },
        generated_context={"complaint": "Debit timeout", "confidence_score": 0.95}
    ))
    action_id = proposal.id
    
    # Review
    client.post(f"/api/v1/ombudsman/actions/{action_id}/review", json={
        "verdict": "APPROVE",
        "officer_notes": "Auto-reversal authorized."
    })
    
    # Resume
    res_resume = client.post(f"/api/v1/ombudsman/actions/{action_id}/resume")
    assert res_resume.status_code == 200
    data = res_resume.json()
    assert data["status"] == "RESUMED_SUCCESSFULLY"
    assert data["human_verdict"] == "APPROVE"
    assert data["final_resolution"]["execution_receipt"]["status"] == "EXECUTED"

def test_ombudsman_resume_execution_api_reject():
    """Challenge 2 API Test: Resume workflow upon rejection and verify adapted behavior."""
    proposal = hitl_store.pause_and_persist(HITLActionProposal(
        dispute_id="GRV-API-REJECT-01",
        run_id="RUN-API-003",
        tool_name="execute_bank_reversal",
        proposed_parameters={
            "dispute_id": "GRV-API-REJECT-01",
            "account_no": "ACC_SBI_002",
            "amount": 7000.0,
            "utr": "UTR55667788"
        },
        generated_context={"complaint": "Charge dispute", "confidence_score": 0.91}
    ))
    action_id = proposal.id
    
    # Review Reject
    client.post(f"/api/v1/ombudsman/actions/{action_id}/review", json={
        "verdict": "REJECT",
        "officer_notes": "Merchant proved successful delivery with signature."
    })
    
    # Resume
    res_resume = client.post(f"/api/v1/ombudsman/actions/{action_id}/resume")
    assert res_resume.status_code == 200
    data = res_resume.json()
    assert data["status"] == "RESUMED_SUCCESSFULLY"
    assert data["human_verdict"] == "REJECT"
    assert data["final_resolution"]["verdict"] == "REVERSAL_REJECTED_BY_OMBUDSMAN"
    assert "execution_receipt" not in data["final_resolution"]
