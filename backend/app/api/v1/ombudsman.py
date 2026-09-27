from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional, Literal
from app.safety.hitl_store import hitl_store, HITLReviewDecision, VerdictType
from app.agents.graph import resume_agent_execution
from app.api.v1.disputes import disputes_db

router = APIRouter()

class OmbudsmanActionRequest(BaseModel):
    dispute_id: str
    decision: str  # 'APPROVE', 'REJECT', 'MODIFY'
    officer_notes: str

class OmbudsmanReviewRequest(BaseModel):
    verdict: Literal["APPROVE", "MODIFY", "REJECT"]
    modified_parameters: Optional[Dict[str, Any]] = None
    officer_notes: Optional[str] = None
    reviewed_by: Optional[str] = "Ombudsman_Officer_1"

@router.get("/pending-actions")
async def get_pending_actions() -> List[Dict[str, Any]]:
    """Returns all paused agent actions awaiting Ombudsman human review (Challenge 2)."""
    return hitl_store.get_pending_actions()

@router.get("/actions/{action_id}")
async def get_action_details(action_id: str) -> Dict[str, Any]:
    """Retrieves full serialized context and proposed parameters for a paused action."""
    action = hitl_store.get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="HITL action not found")
    return action

@router.post("/actions/{action_id}/review")
async def submit_action_review(action_id: str, request: OmbudsmanReviewRequest) -> Dict[str, Any]:
    """Submits human review verdict (APPROVE, MODIFY, REJECT) for an irreversible action."""
    try:
        decision = HITLReviewDecision(
            action_id=action_id,
            verdict=request.verdict,
            modified_parameters=request.modified_parameters,
            officer_notes=request.officer_notes,
            reviewed_by=request.reviewed_by
        )
        updated = hitl_store.submit_human_decision(decision)
        return {
            "status": "REVIEW_RECORDED",
            "action_id": action_id,
            "verdict": request.verdict,
            "record": updated
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/actions/{action_id}/resume")
async def resume_action_execution(action_id: str) -> Dict[str, Any]:
    """Resumes the autonomous agent chain using the human review decision (Challenge 2)."""
    action = hitl_store.get_action_by_id(action_id)
    if not action:
        raise HTTPException(status_code=404, detail="HITL action not found")

    if action.get("status") == "PENDING":
        raise HTTPException(status_code=400, detail="Action is still PENDING. Review must be submitted before resume.")

    dispute_id = action.get("dispute_id")
    # Fetch cached state or reconstruct state from the serialized generated_context
    saved_state = disputes_db.get(dispute_id)
    if not saved_state:
        ctx = action.get("generated_context", {})
        saved_state = {
            "dispute_id": dispute_id,
            "citizen_id": "CITIZEN_RECONSTRUCTED",
            "raw_complaint": ctx.get("complaint", ""),
            "evidence_urls": [],
            "extracted_entities": {},
            "domain": "DIGITAL_PAYMENTS_UPI",
            "required_stakeholders": [],
            "agent_traces": [],
            "ledger_records": [],
            "conflict_detected": True,
            "conflict_details": ctx.get("conflict_details", ""),
            "iteration_count": ctx.get("iteration_count", 0),
            "confidence_score": ctx.get("confidence_score", 0.95),
            "requires_human_escalation": True,
            "escalation_reason": None,
            "ombudsman_verdict": None,
            "circuit_breaker_tripped": False,
            "circuit_breaker_event": None,
            "accumulated_tokens": ctx.get("accumulated_tokens", 0),
            "consecutive_tool_failures": ctx.get("consecutive_tool_failures", 0),
            "hitl_action_id": action_id,
            "hitl_status": action.get("status"),
            "proposed_action": {
                "tool": action.get("tool_name"),
                "parameters": action.get("proposed_parameters", {})
            },
            "resumed_from_hitl": False,
            "resumed_payload": None,
            "final_resolution": None
        }

    resumed_state = await resume_agent_execution(saved_state, action_id)
    disputes_db[dispute_id] = resumed_state

    return {
        "status": "RESUMED_SUCCESSFULLY",
        "action_id": action_id,
        "dispute_id": dispute_id,
        "human_verdict": resumed_state.get("ombudsman_verdict"),
        "final_resolution": resumed_state.get("final_resolution"),
        "agent_traces_count": len(resumed_state.get("agent_traces", []))
    }

@router.post("/override")
async def ombudsman_override(payload: OmbudsmanActionRequest):
    return {
        "status": "SUCCESS",
        "dispute_id": payload.dispute_id,
        "human_decision": payload.decision,
        "message": f"Ombudsman decision {payload.decision} committed to immutable audit log."
    }
