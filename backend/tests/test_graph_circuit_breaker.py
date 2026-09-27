import pytest
from app.agents.graph import finresolve_app, resume_agent_execution
from app.core.telemetry import reset_consecutive_tool_failures, clear_recorded_spans
from app.core.llm import reset_accumulated_tokens
from app.safety.hitl_store import hitl_store, HITLReviewDecision

@pytest.mark.asyncio
async def test_langgraph_circuit_breaker_interception_on_tool_failures():
    clear_recorded_spans()
    reset_consecutive_tool_failures()
    reset_accumulated_tokens()

    initial_state = {
        "dispute_id": "GRV-TRIP-001",
        "citizen_id": "9999999999",
        "raw_complaint": "Testing runaway loop breaker",
        "evidence_urls": [],
        "extracted_entities": {"txn_id": "FAIL_1", "utr": "FAIL_2"},
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
        "max_token_budget": 10000,
        "max_iterations": 5,
        "hitl_action_id": None,
        "hitl_status": None,
        "proposed_action": None,
        "resumed_from_hitl": False,
        "resumed_payload": None,
        "final_resolution": None
    }
    
    result = await finresolve_app.ainvoke(initial_state)
    
    # Assertions
    assert result["circuit_breaker_tripped"] is True
    assert result["requires_human_escalation"] is True
    assert result["final_resolution"] is None  # Synthesizer was NEVER reached!
    
    # Verify structured halt event metadata
    event = result["circuit_breaker_event"]
    assert event is not None
    assert event["event"] == "CIRCUIT_BREAKER_TRIPPED"
    assert event["case_id"] == "GRV-TRIP-001"
    assert event["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert event["threshold"] == 4
    assert event["observed"] == 4
    assert event["action"] == "HALT_AND_ESCALATE"

@pytest.mark.asyncio
async def test_normal_successful_graph_execution():
    clear_recorded_spans()
    reset_consecutive_tool_failures()
    reset_accumulated_tokens()

    initial_state = {
        "dispute_id": "GRV-PASS-001",
        "citizen_id": "8888888888",
        "raw_complaint": "₹25000 debited from my SBI account but MegaRetail claims payment failed.",
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
        "max_consecutive_tool_failures": 4,
        "max_token_budget": 10000,
        "max_iterations": 5,
        "hitl_action_id": None,
        "hitl_status": None,
        "proposed_action": None,
        "resumed_from_hitl": False,
        "resumed_payload": None,
        "final_resolution": None
    }
    
    result = await finresolve_app.ainvoke(initial_state)
    
    assert result["circuit_breaker_tripped"] is False
    assert result["final_resolution"] is not None
    assert result["final_resolution"]["verdict"] == "FAVOR_CITIZEN_AUTO_REVERSAL"

@pytest.mark.asyncio
async def test_langgraph_hitl_pause_and_state_preservation():
    """Challenge 2: Verify pausing and state serialization before irreversible mutation."""
    clear_recorded_spans()
    reset_consecutive_tool_failures()
    reset_accumulated_tokens()

    state = {
        "dispute_id": "GRV-HITL-PAUSE-01",
        "citizen_id": "7777777777",
        "raw_complaint": "Payment timed out. Need fund reversal.",
        "evidence_urls": [],
        "extracted_entities": {
            "account_number": "ACC_SBI_1122",
            "claimed_amount": 25000.0,
            "utr": "UTR99887766"
        },
        "domain": "DIGITAL_PAYMENTS_UPI",
        "required_stakeholders": [],
        "agent_traces": [],
        "ledger_records": [],
        "conflict_detected": True,
        "conflict_details": "Discrepancy confirmed across Bank and Merchant.",
        "iteration_count": 0,
        "confidence_score": 0.95,
        "requires_human_escalation": False,
        "escalation_reason": None,
        "ombudsman_verdict": None,
        "circuit_breaker_tripped": False,
        "circuit_breaker_event": None,
        "accumulated_tokens": 0,
        "consecutive_tool_failures": 0,
        "max_consecutive_tool_failures": 4,
        "max_token_budget": 10000,
        "max_iterations": 5,
        "proposed_action": {
            "tool": "execute_bank_reversal",
            "parameters": {
                "dispute_id": "GRV-HITL-PAUSE-01",
                "account_no": "ACC_SBI_1122",
                "amount": 25000.0,
                "utr": "UTR99887766"
            }
        },
        "hitl_action_id": None,
        "hitl_status": None,
        "resumed_from_hitl": False,
        "resumed_payload": None,
        "final_resolution": None
    }
    
    # Run the graph: route_after_arbitration should route to hitl_gate because proposed_action is present
    result = await finresolve_app.ainvoke(state)
    
    # Assert execution safely PAUSED at hitl_gate
    assert result["requires_human_escalation"] is True
    assert result["hitl_status"] == "PENDING"
    assert result["hitl_action_id"] is not None
    assert result["final_resolution"] is None  # Mutation was NOT executed prematurely
    
    # Verify state was safely serialized in persistent hitl_store
    persisted = hitl_store.get_action_by_id(result["hitl_action_id"])
    assert persisted is not None
    assert persisted["dispute_id"] == "GRV-HITL-PAUSE-01"
    assert persisted["tool_name"] == "execute_bank_reversal"
    assert persisted["proposed_parameters"]["amount"] == 25000.0

@pytest.mark.asyncio
async def test_langgraph_hitl_resumption_on_approval():
    """Challenge 2: Verify resuming agent sequence upon human APPROVAL."""
    paused_state = {
        "dispute_id": "GRV-RESUME-APP-01",
        "citizen_id": "7777777777",
        "raw_complaint": "Payment timed out. Need fund reversal.",
        "evidence_urls": [],
        "extracted_entities": {
            "account_number": "ACC_SBI_1122",
            "claimed_amount": 25000.0,
            "utr": "UTR99887766"
        },
        "domain": "DIGITAL_PAYMENTS_UPI",
        "required_stakeholders": [],
        "agent_traces": [],
        "ledger_records": [],
        "conflict_detected": True,
        "conflict_details": "Discrepancy confirmed across Bank and Merchant.",
        "iteration_count": 0,
        "confidence_score": 0.95,
        "requires_human_escalation": False,
        "escalation_reason": None,
        "ombudsman_verdict": None,
        "circuit_breaker_tripped": False,
        "circuit_breaker_event": None,
        "accumulated_tokens": 0,
        "consecutive_tool_failures": 0,
        "max_consecutive_tool_failures": 4,
        "max_token_budget": 10000,
        "max_iterations": 5,
        "proposed_action": {
            "tool": "execute_bank_reversal",
            "parameters": {
                "dispute_id": "GRV-RESUME-APP-01",
                "account_no": "ACC_SBI_1122",
                "amount": 25000.0,
                "utr": "UTR99887766"
            }
        },
        "hitl_action_id": None,
        "hitl_status": None,
        "resumed_from_hitl": False,
        "resumed_payload": None,
        "final_resolution": None
    }
    
    # 1. Graph pauses at hitl_gate
    paused_result = await finresolve_app.ainvoke(paused_state)
    action_id = paused_result["hitl_action_id"]
    assert action_id is not None
    
    # 2. Human reviewer approves the action
    decision = HITLReviewDecision(
        action_id=action_id,
        verdict="APPROVE",
        officer_notes="Bank confirmed debit without switch acknowledgment. Reversal authorized."
    )
    hitl_store.submit_human_decision(decision)
    
    # 3. Agent workflow successfully resumes
    resumed_result = await resume_agent_execution(paused_result, action_id)
    
    assert resumed_result["resumed_from_hitl"] is True
    assert resumed_result["ombudsman_verdict"] == "APPROVE"
    assert resumed_result["final_resolution"] is not None
    assert "FAVOR_CITIZEN_REVERSAL_APPROVE" in resumed_result["final_resolution"]["verdict"]
    assert resumed_result["final_resolution"]["execution_receipt"]["status"] == "EXECUTED"

@pytest.mark.asyncio
async def test_langgraph_hitl_resumption_on_rejection():
    """Challenge 2: Verify agent adapts its behavior and omits mutation upon REJECTION."""
    paused_state = {
        "dispute_id": "GRV-RESUME-REJ-01",
        "citizen_id": "7777777777",
        "raw_complaint": "Payment timed out. Need fund reversal.",
        "evidence_urls": [],
        "extracted_entities": {
            "account_number": "ACC_SBI_1122",
            "claimed_amount": 25000.0,
            "utr": "UTR99887766"
        },
        "domain": "DIGITAL_PAYMENTS_UPI",
        "required_stakeholders": [],
        "agent_traces": [],
        "ledger_records": [],
        "conflict_detected": True,
        "conflict_details": "Discrepancy confirmed across Bank and Merchant.",
        "iteration_count": 0,
        "confidence_score": 0.95,
        "requires_human_escalation": False,
        "escalation_reason": None,
        "ombudsman_verdict": None,
        "circuit_breaker_tripped": False,
        "circuit_breaker_event": None,
        "accumulated_tokens": 0,
        "consecutive_tool_failures": 0,
        "max_consecutive_tool_failures": 4,
        "max_token_budget": 10000,
        "max_iterations": 5,
        "proposed_action": {
            "tool": "execute_bank_reversal",
            "parameters": {
                "dispute_id": "GRV-RESUME-REJ-01",
                "account_no": "ACC_SBI_1122",
                "amount": 25000.0,
                "utr": "UTR99887766"
            }
        },
        "hitl_action_id": None,
        "hitl_status": None,
        "resumed_from_hitl": False,
        "resumed_payload": None,
        "final_resolution": None
    }
    
    # 1. Graph pauses at hitl_gate
    paused_result = await finresolve_app.ainvoke(paused_state)
    action_id = paused_result["hitl_action_id"]
    
    # 2. Human reviewer rejects the action
    decision = HITLReviewDecision(
        action_id=action_id,
        verdict="REJECT",
        officer_notes="Merchant records show cash refund already handed over to citizen."
    )
    hitl_store.submit_human_decision(decision)
    
    # 3. Agent workflow adapts behavior on resume
    resumed_result = await resume_agent_execution(paused_result, action_id)
    
    assert resumed_result["resumed_from_hitl"] is True
    assert resumed_result["ombudsman_verdict"] == "REJECT"
    assert resumed_result["final_resolution"]["verdict"] == "REVERSAL_REJECTED_BY_OMBUDSMAN"
    assert "execution_receipt" not in resumed_result["final_resolution"]
    assert "cash refund already handed over" in resumed_result["final_resolution"]["citizen_summary"].lower()
