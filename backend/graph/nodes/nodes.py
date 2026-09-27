import re
from datetime import datetime, timezone
from typing import Any, Dict

from actions.registry import ALLOWED_ACTIONS
from core.telemetry import (
    get_tracer,
    get_standard_attributes,
    workflow_iterations_counter,
    workflow_completions_counter,
    human_escalations_counter,
)
from graph.state import GrievanceState
from llm.client import llm_call
from mocks.bank_cbs import query_bank_cbs
from mocks.npci_switch import query_npci_switch
from mocks.merchant_pg import query_merchant_pg
from safety.circuit_breaker import CircuitBreaker, BreakerAction


def triage_node(state: GrievanceState) -> Dict[str, Any]:
    """Extracts transaction reference, amount, and domain from complaint text."""
    path = list(state.get("execution_path", []))
    path.append("triage")
    trace_log = list(state.get("trace_log", []))

    text = state.get("raw_complaint_text", "")
    iteration = state.get("iteration", 0)

    # Regex or heuristic extraction of UPI reference
    txn_match = re.search(r"(?:UTR|TXN|REF)[-_:]?\s*([A-Za-z0-9]{8,16})", text, re.IGNORECASE)
    extracted_ref = txn_match.group(0).replace(" ", "") if txn_match else "TXN_UPI_9876543210"

    llm_res = llm_call(
        prompt=f"Triage financial grievance: {text}",
        node="triage",
        iteration=iteration,
        simulated_tokens={"input_tokens": 120, "output_tokens": 40, "total_tokens": 160},
    )

    trace_log.append({
        "node": "triage",
        "action": "TRIAGE_COMPLAINT",
        "summary": f"Extracted reference: {extracted_ref}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "extracted_txn_ref": extracted_ref,
        "claimed_amount_inr": state.get("claimed_amount_inr", 1499.0) or 1499.0,
        "domain": "PAYMENTS",
        "total_tokens": state.get("total_tokens", 0) + llm_res.total_tokens,
        "status": "investigating",
        "trace_log": trace_log,
        "execution_path": path,
    }


def skeptic_node(state: GrievanceState) -> Dict[str, Any]:
    """Analyzes claims, identifies potential contradictions or missing data."""
    path = list(state.get("execution_path", []))
    path.append("skeptic")
    trace_log = list(state.get("trace_log", []))

    iteration = state.get("iteration", 0)
    llm_res = llm_call(
        prompt=f"Evaluate dispute plausibility for {state.get('extracted_txn_ref')}",
        node="skeptic",
        iteration=iteration,
        simulated_tokens={"input_tokens": 90, "output_tokens": 30, "total_tokens": 120},
    )

    trace_log.append({
        "node": "skeptic",
        "action": "EVALUATE_CONTRADICTIONS",
        "summary": "Complaint verified plausible. Initiating ledger queries.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "total_tokens": state.get("total_tokens", 0) + llm_res.total_tokens,
        "trace_log": trace_log,
        "execution_path": path,
    }


def evidence_gatherer_node(state: GrievanceState) -> Dict[str, Any]:
    """Queries Bank CBS, NPCI Switch, and Merchant Payment Gateway."""
    path = list(state.get("execution_path", []))
    path.append("evidence_gatherer")
    trace_log = list(state.get("trace_log", []))

    txn_ref = state.get("extracted_txn_ref", "TXN_UPI_9876543210") or "TXN_UPI_9876543210"
    iteration = state.get("iteration", 0)
    records = list(state.get("ledger_records", []))
    consecutive_failures = state.get("consecutive_tool_failures", 0)

    force_fail = state.get("force_tool_fail", False)

    if force_fail:
        # Simulate consecutive failed tool calls on merchant verification
        # 4 consecutive failures to trigger policy
        failed_tool_name = "merchant_api"
        for _ in range(4):
            res = query_merchant_pg(
                txn_ref=txn_ref,
                force_fail=True,
                failure_reason="GATEWAY_504_TIMEOUT",
                node="merchant_verification",
                iteration=iteration,
            )
            consecutive_failures += 1
            trace_log.append({
                "node": "merchant_verification",
                "tool": failed_tool_name,
                "status": "FAILURE",
                "error": res.error_message,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    else:
        # Normal query path
        r_bank = query_bank_cbs(txn_ref=txn_ref, node="evidence_gatherer", iteration=iteration)
        r_npci = query_npci_switch(txn_ref=txn_ref, response_code="U69", node="evidence_gatherer", iteration=iteration)
        r_merchant = query_merchant_pg(txn_ref=txn_ref, order_status="NOT_CREDITED", node="evidence_gatherer", iteration=iteration)

        if r_bank.success and r_bank.data:
            records.append(r_bank.data)
        if r_npci.success and r_npci.data:
            records.append(r_npci.data)
        if r_merchant.success and r_merchant.data:
            records.append(r_merchant.data)

        consecutive_failures = 0
        trace_log.append({
            "node": "evidence_gatherer",
            "action": "EVIDENCE_COLLECTED",
            "records_count": len(records),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    return {
        "ledger_records": records,
        "consecutive_tool_failures": consecutive_failures,
        "trace_log": trace_log,
        "execution_path": path,
    }


def conflict_arbiter_node(state: GrievanceState) -> Dict[str, Any]:
    """Deterministic pattern detection comparing Bank, NPCI, and Merchant records."""
    path = list(state.get("execution_path", []))
    path.append("conflict_arbiter")
    trace_log = list(state.get("trace_log", []))

    records = state.get("ledger_records", [])
    bank = next((r for r in records if r.get("source") == "BANK_CBS"), None)
    npci = next((r for r in records if r.get("source") == "NPCI_SWITCH"), None)
    merchant = next((r for r in records if r.get("source") == "MERCHANT_PG"), None)

    pattern = None
    confidence = 0.98

    if bank and bank.get("status") == "SUCCESS" and merchant and merchant.get("status") == "NOT_CREDITED":
        if npci and npci.get("response_code") == "U69":
            pattern = "ASYMMETRIC_NPCI_TIMEOUT"
            confidence = 0.95
        else:
            pattern = "BANK_MERCHANT_MISMATCH_UNEXPLAINED"
            confidence = 0.55

    trace_log.append({
        "node": "conflict_arbiter",
        "pattern": pattern,
        "confidence": confidence,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "conflict_detected": pattern is not None,
        "conflict_pattern": pattern,
        "confidence_score": confidence,
        "trace_log": trace_log,
        "execution_path": path,
    }


def planner_node(state: GrievanceState) -> Dict[str, Any]:
    """Generates a structured ProposedAction from the allowlisted set."""
    path = list(state.get("execution_path", []))
    path.append("planner")
    trace_log = list(state.get("trace_log", []))

    iteration = state.get("iteration", 0)
    force_tokens = state.get("force_token_spike", 0)

    sim_tokens = (
        {"input_tokens": 500, "output_tokens": force_tokens - 500, "total_tokens": force_tokens}
        if force_tokens > 0
        else {"input_tokens": 150, "output_tokens": 50, "total_tokens": 200}
    )

    llm_res = llm_call(
        prompt=f"Propose resolution for pattern {state.get('conflict_pattern')}",
        node="planner",
        iteration=iteration,
        simulated_tokens=sim_tokens,
    )

    action = {
        "action_type": "AUTO_REVERSAL_ORDER",
        "target_stakeholder": "BANK_CBS",
        "justification": "Beneficiary timeout confirmed by NPCI U69 switch code; auto-reversal mandated.",
        "citation": "RBI DPSS.CO.PD — TAT harmonisation circular",
    }

    trace_log.append({
        "node": "planner",
        "action_type": action["action_type"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "proposed_action": action,
        "total_tokens": state.get("total_tokens", 0) + llm_res.total_tokens,
        "trace_log": trace_log,
        "execution_path": path,
    }


def validator_node(state: GrievanceState) -> Dict[str, Any]:
    """Deterministic validation ensuring proposed action is within the closed allowlist."""
    path = list(state.get("execution_path", []))
    path.append("validator")
    trace_log = list(state.get("trace_log", []))

    proposed = state.get("proposed_action")
    if not proposed or proposed.get("action_type") not in ALLOWED_ACTIONS:
        raise ValueError(f"Rejected: Action '{proposed}' is not allowlisted.")

    trace_log.append({
        "node": "validator",
        "status": "VALIDATED",
        "action_type": proposed["action_type"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "status": "executing",
        "trace_log": trace_log,
        "execution_path": path,
    }


def execute_node(state: GrievanceState) -> Dict[str, Any]:
    """Applies validated action against synthetic financial systems."""
    path = list(state.get("execution_path", []))
    path.append("execute")
    trace_log = list(state.get("trace_log", []))

    proposed = state.get("proposed_action", {})
    trace_log.append({
        "node": "execute",
        "applied_action": proposed.get("action_type"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "status": "executing",
        "trace_log": trace_log,
        "execution_path": path,
    }


def monitor_node(state: GrievanceState) -> Dict[str, Any]:
    """Monitors completion and increments loop iteration."""
    path = list(state.get("execution_path", []))
    path.append("monitor")
    trace_log = list(state.get("trace_log", []))

    current_iter = state.get("iteration", 0) + 1
    workflow_iterations_counter.add(1, {"case_id": state.get("case_id", ""), "iteration": current_iter})

    force_loop = state.get("force_loop_until_limit", False)
    max_iters = state.get("max_iterations", 10)

    # If force_loop is enabled and we haven't reached max_iterations yet, stay investigating
    if force_loop and current_iter < max_iters:
        new_status = "investigating"
    else:
        new_status = "resolved"

    trace_log.append({
        "node": "monitor",
        "iteration": current_iter,
        "status": new_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "iteration": current_iter,
        "status": new_status,
        "trace_log": trace_log,
        "execution_path": path,
    }


def breaker_check_node(state: GrievanceState) -> Dict[str, Any]:
    """Evaluates Circuit Breaker safety policy thresholds deterministically."""
    path = list(state.get("execution_path", []))
    path.append("breaker_check")
    trace_log = list(state.get("trace_log", []))

    breaker = CircuitBreaker(
        max_consecutive_tool_failures=state.get("max_consecutive_tool_failures"),
        max_token_budget=state.get("max_token_budget"),
        max_iterations=state.get("max_iterations"),
    )

    breaker.iteration = state.get("iteration", 0)
    breaker.total_tokens = state.get("total_tokens", 0)
    breaker.consecutive_tool_failures = state.get("consecutive_tool_failures", 0)

    # Node context for accurate halt trace attribution
    decision_node = "merchant_verification" if breaker.consecutive_tool_failures > 0 else (
        "planner" if state.get("force_token_spike", 0) > 0 else "monitor"
    )
    if breaker.consecutive_tool_failures > 0:
        breaker.last_failed_tool = "merchant_api"

    decision = breaker.evaluate(node=decision_node)

    trace_log.append({
        "node": "breaker_check",
        "action": decision.action.value,
        "trigger": decision.trigger.value if decision.trigger else None,
        "reason": decision.reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    if decision.action == BreakerAction.HALT:
        halt_event_dict = breaker.trip_event.model_dump() if breaker.trip_event else None
        return {
            "breaker_tripped": True,
            "breaker_decision": decision.model_dump(),
            "halt_event": halt_event_dict,
            "status": "halted",
            "trace_log": trace_log,
            "execution_path": path,
        }

    return {
        "breaker_tripped": False,
        "breaker_decision": decision.model_dump(),
        "trace_log": trace_log,
        "execution_path": path,
    }


def safe_halt_node(state: GrievanceState) -> Dict[str, Any]:
    """Graceful degradation node intercepting execution without crashing the application."""
    path = list(state.get("execution_path", []))
    path.append("safe_halt")
    trace_log = list(state.get("trace_log", []))

    halt_event = state.get("halt_event", {})
    reason = halt_event.get("reason", "Circuit breaker halted execution.")

    trace_log.append({
        "event": "CIRCUIT_BREAKER_TRIPPED",
        "node": "safe_halt",
        "halt_event": halt_event,
        "action": "HALT_AND_ESCALATE",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "status": "halted",
        "human_review_required": True,
        "human_review_reason": reason,
        "trace_log": trace_log,
        "execution_path": path,
    }


def human_review_node(state: GrievanceState) -> Dict[str, Any]:
    """Transitions workflow to Ombudsman / Human Escalation queue."""
    path = list(state.get("execution_path", []))
    path.append("human_review")
    trace_log = list(state.get("trace_log", []))

    human_escalations_counter.add(1, {"case_id": state.get("case_id", "")})

    trace_log.append({
        "node": "human_review",
        "status": "ESCALATED",
        "summary": "Case submitted to Ombudsman review queue.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "status": "escalated",
        "trace_log": trace_log,
        "execution_path": path,
    }


def resolve_node(state: GrievanceState) -> Dict[str, Any]:
    """Final resolution completion node."""
    path = list(state.get("execution_path", []))
    path.append("resolve")
    trace_log = list(state.get("trace_log", []))

    workflow_completions_counter.add(1, {"case_id": state.get("case_id", ""), "status": "success"})

    trace_log.append({
        "node": "resolve",
        "status": "RESOLVED",
        "summary": "Grievance resolved successfully with auto-reversal order.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {
        "status": "resolved",
        "trace_log": trace_log,
        "execution_path": path,
    }
