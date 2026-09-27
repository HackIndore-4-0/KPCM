import pytest
from app.safety.circuit_breaker import CircuitBreaker, CircuitBreakerPolicy
from app.safety.hitl_store import (
    HITLStore,
    HITLActionProposal,
    HITLReviewDecision,
    hitl_store
)

# --- Challenge 1: Circuit Breaker Tests ---

def test_circuit_breaker_consecutive_tool_failures():
    cb = CircuitBreaker(CircuitBreakerPolicy(max_consecutive_tool_failures=4))
    
    # 3 failures -> ALLOW
    d1 = cb.evaluate(node="merchant_verification", iteration=1, total_tokens=100, consecutive_tool_failures=3)
    assert d1.action == "ALLOW"
    assert d1.trigger == "NONE"
    
    # 4 failures -> HALT
    d2 = cb.evaluate(node="merchant_verification", iteration=1, total_tokens=100, consecutive_tool_failures=4)
    assert d2.action == "HALT"
    assert d2.trigger == "CONSECUTIVE_TOOL_FAILURES"
    assert d2.threshold == 4
    assert d2.observed == 4
    assert "four consecutive times" in d2.reason or "failed 4 consecutive times" in d2.reason

def test_circuit_breaker_token_budget():
    cb = CircuitBreaker(CircuitBreakerPolicy(max_token_budget=5000))
    
    # Below budget -> ALLOW
    d1 = cb.evaluate(node="planner", iteration=1, total_tokens=4999, consecutive_tool_failures=0)
    assert d1.action == "ALLOW"
    
    # Budget exceeded -> HALT
    d2 = cb.evaluate(node="planner", iteration=1, total_tokens=5050, consecutive_tool_failures=0)
    assert d2.action == "HALT"
    assert d2.trigger == "TOKEN_BUDGET_EXCEEDED"
    assert d2.observed == 5050

def test_circuit_breaker_max_iterations():
    cb = CircuitBreaker(CircuitBreakerPolicy(max_iterations=5))
    
    # Iteration 4 -> ALLOW
    d1 = cb.evaluate(node="replanner", iteration=4, total_tokens=200, consecutive_tool_failures=0)
    assert d1.action == "ALLOW"
    
    # Iteration 5 -> HALT
    d2 = cb.evaluate(node="replanner", iteration=5, total_tokens=200, consecutive_tool_failures=0)
    assert d2.action == "HALT"
    assert d2.trigger == "MAX_ITERATIONS_EXCEEDED"

def test_structured_halt_event_schema():
    cb = CircuitBreaker()
    decision = cb.evaluate(node="probing_agents", iteration=3, total_tokens=1200, consecutive_tool_failures=4)
    
    event = cb.generate_structured_halt_event(
        case_id="GRV-9999",
        run_id="RUN-9999",
        decision=decision,
        tool="merchant_pg_api"
    )
    
    assert event["event"] == "CIRCUIT_BREAKER_TRIPPED"
    assert event["case_id"] == "GRV-9999"
    assert event["run_id"] == "RUN-9999"
    assert event["trigger"] == "CONSECUTIVE_TOOL_FAILURES"
    assert event["threshold"] == 4
    assert event["observed"] == 4
    assert event["node"] == "probing_agents"
    assert event["tool"] == "merchant_pg_api"
    assert event["iteration"] == 3
    assert event["total_tokens"] == 1200
    assert event["action"] == "HALT_AND_ESCALATE"
    assert "reason" in event
    assert "timestamp" in event


# --- Challenge 2: State-Preserving HITL Persistence Tests ---

def test_hitl_store_pause_and_persist():
    store = HITLStore()
    
    proposal = HITLActionProposal(
        dispute_id="DISP-UPI-2026-001",
        run_id="RUN-TEST-001",
        action_type="IRREVERSIBLE_TOOL_MUTATION",
        tool_name="execute_bank_reversal",
        proposed_parameters={
            "txn_id": "TXN_UPI_998811",
            "account_number": "ACC_HDFC_0987",
            "reversal_amount": 2500.0,
            "reason": "Merchant timeout confirmation - debit without fulfillment"
        },
        generated_context={
            "citizen_complaint": "Amount debited but food not delivered",
            "npci_status": "SUCCESS",
            "merchant_status": "TIMEOUT",
            "confidence_score": 0.94
        }
    )
    
    persisted = store.pause_and_persist(proposal)
    assert persisted.id is not None
    assert persisted.status == "PENDING"
    
    # Verify retrieval
    retrieved = store.get_action_by_id(persisted.id)
    assert retrieved is not None
    assert retrieved["dispute_id"] == "DISP-UPI-2026-001"
    assert retrieved["tool_name"] == "execute_bank_reversal"
    assert retrieved["proposed_parameters"]["reversal_amount"] == 2500.0
    assert retrieved["generated_context"]["confidence_score"] == 0.94

def test_hitl_store_approve_decision():
    store = HITLStore()
    proposal = store.pause_and_persist(HITLActionProposal(
        dispute_id="DISP-APPROVE-01",
        run_id="RUN-APP-01",
        tool_name="execute_bank_reversal",
        proposed_parameters={"txn_id": "TXN_1122", "reversal_amount": 1000.0}
    ))
    
    # Reviewer approves
    decision = HITLReviewDecision(
        action_id=proposal.id,
        verdict="APPROVE",
        officer_notes="Evidence corroborated by NPCI trace. Approved."
    )
    updated = store.submit_human_decision(decision)
    assert updated["status"] == "APPROVED"
    assert updated["human_verdict"] == "APPROVE"
    assert updated["officer_notes"] == "Evidence corroborated by NPCI trace. Approved."
    
    # Resume payload
    resume = store.resume_action(proposal.id)
    assert resume.should_execute is True
    assert resume.verdict == "APPROVE"
    assert resume.execution_parameters["reversal_amount"] == 1000.0

def test_hitl_store_modify_decision():
    store = HITLStore()
    proposal = store.pause_and_persist(HITLActionProposal(
        dispute_id="DISP-MODIFY-01",
        run_id="RUN-MOD-01",
        tool_name="execute_bank_reversal",
        proposed_parameters={"txn_id": "TXN_3344", "reversal_amount": 1500.0}
    ))
    
    # Reviewer modifies amount to partial reversal
    decision = HITLReviewDecision(
        action_id=proposal.id,
        verdict="MODIFY",
        modified_parameters={"reversal_amount": 750.0},
        officer_notes="Merchant provided partial delivery credit; approving 50% reversal."
    )
    updated = store.submit_human_decision(decision)
    assert updated["status"] == "MODIFIED"
    assert updated["human_verdict"] == "MODIFY"
    
    # Resume payload
    resume = store.resume_action(proposal.id)
    assert resume.should_execute is True
    assert resume.verdict == "MODIFY"
    assert resume.execution_parameters["reversal_amount"] == 750.0
    assert resume.execution_parameters["txn_id"] == "TXN_3344"

def test_hitl_store_reject_decision():
    store = HITLStore()
    proposal = store.pause_and_persist(HITLActionProposal(
        dispute_id="DISP-REJECT-01",
        run_id="RUN-REJ-01",
        tool_name="execute_bank_reversal",
        proposed_parameters={"txn_id": "TXN_5566", "reversal_amount": 5000.0}
    ))
    
    # Reviewer rejects
    decision = HITLReviewDecision(
        action_id=proposal.id,
        verdict="REJECT",
        officer_notes="Merchant ledger shows item was fulfilled at 14:02. Rejecting reversal."
    )
    updated = store.submit_human_decision(decision)
    assert updated["status"] == "REJECTED"
    assert updated["human_verdict"] == "REJECT"
    
    # Resume payload
    resume = store.resume_action(proposal.id)
    assert resume.should_execute is False
    assert resume.verdict == "REJECT"
    assert resume.execution_parameters == {}
    assert "rejected by human reviewer" in resume.reason.lower()
