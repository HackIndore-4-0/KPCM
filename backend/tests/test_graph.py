import pytest
from app.agents.graph import finresolve_app

@pytest.mark.asyncio
async def test_finresolve_graph_execution():
    initial_state = {
        "dispute_id": "TEST-001",
        "citizen_id": "9999999999",
        "raw_complaint": "₹25000 debited from my SBI account but MegaRetail claims payment failed.",
        "evidence_urls": ["mock_receipt.png"],
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
        "final_resolution": None
    }
    
    result = await finresolve_app.ainvoke(initial_state)
    assert result is not None
    assert result["domain"] == "DIGITAL_PAYMENTS_UPI"
    assert result["conflict_detected"] is True
    assert result["final_resolution"] is not None
