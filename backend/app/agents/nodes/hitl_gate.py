from typing import Dict, Any
from app.agents.state import FinResolveState
from app.safety.hitl_store import HITLActionProposal, hitl_store
from app.core.telemetry import get_execution_context

async def hitl_gate_node(state: FinResolveState) -> Dict[str, Any]:
    """State-Preserving Human-in-the-Loop checkpoint for irreversible mutations and breaker trips.
    
    Challenge 2 Implementation:
    Pauses autonomous agent execution, serializes current context and proposed tool parameters
    into persistent storage (Supabase PostgreSQL / local store), awaiting human review.
    """
    traces = state.get("agent_traces", [])
    ctx = get_execution_context()
    
    dispute_id = state.get("dispute_id", "UNKNOWN")
    run_id = ctx.get("run_id", "RUN-UNKNOWN")
    
    if state.get("circuit_breaker_tripped"):
        action_type = "CIRCUIT_BREAKER_HALT"
        event = state.get("circuit_breaker_event") or {}
        tool_name = event.get("tool", "workflow_loop")
        proposed_params = {
            "trigger": event.get("trigger"),
            "observed": event.get("observed"),
            "threshold": event.get("threshold"),
            "reason": event.get("reason")
        }
        suggested_action = "MANUAL_INVESTIGATION"
    else:
        action_type = "IRREVERSIBLE_TOOL_MUTATION"
        tool_name = state.get("proposed_action", {}).get("tool", "execute_bank_reversal")
        proposed_params = state.get("proposed_action", {}).get("parameters", {
            "dispute_id": dispute_id,
            "account_no": state.get("extracted_entities", {}).get("account_number", "ACC_SBI_9981"),
            "amount": float(state.get("extracted_entities", {}).get("claimed_amount", 25000.0)),
            "utr": state.get("extracted_entities", {}).get("utr", "UTR9832482348")
        })
        suggested_action = "APPROVE_REVERSAL"
    
    generated_context = {
        "dispute_id": dispute_id,
        "complaint": state.get("raw_complaint"),
        "confidence_score": state.get("confidence_score", 0.0),
        "conflict_details": state.get("conflict_details"),
        "iteration_count": state.get("iteration_count", 0),
        "accumulated_tokens": state.get("accumulated_tokens", 0),
        "consecutive_tool_failures": state.get("consecutive_tool_failures", 0)
    }
    
    proposal = HITLActionProposal(
        dispute_id=dispute_id,
        run_id=run_id,
        action_type=action_type,
        tool_name=tool_name,
        proposed_parameters=proposed_params,
        generated_context=generated_context,
        suggested_action=suggested_action
    )
    
    persisted = hitl_store.pause_and_persist(proposal)
    
    traces.append({
        "node_name": "hitl_gate",
        "action_type": "STATE_PRESERVED_ESCALATION",
        "content": f"Workflow execution paused for human approval. State safely serialized to PostgreSQL (Action ID: {persisted.id}).",
        "metadata": {
            "hitl_action_id": persisted.id,
            "action_type": action_type,
            "tool_name": tool_name,
            "proposed_parameters": proposed_params,
            "status": "PENDING_APPROVAL"
        }
    })
    
    return {
        "requires_human_escalation": True,
        "hitl_action_id": persisted.id,
        "hitl_status": "PENDING",
        "agent_traces": traces
    }
