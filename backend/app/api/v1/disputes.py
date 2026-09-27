import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.dispute_schemas import DisputeCreateRequest, DisputeResponse
from app.agents.graph import finresolve_app
from app.core.telemetry import agent_run_span
from app.core.llm import reset_accumulated_tokens

router = APIRouter()

# In-memory store for fast local hackathon prototyping
disputes_db = {}

@router.post("/", response_model=DisputeResponse)
async def create_and_investigate_dispute(request: DisputeCreateRequest):
    dispute_id = f"GRV-{str(uuid.uuid4())[:8].upper()}"
    run_id = f"RUN-{str(uuid.uuid4())[:8].upper()}"
    
    reset_accumulated_tokens()
    
    initial_state = {
        "dispute_id": dispute_id,
        "citizen_id": request.citizen_contact,
        "raw_complaint": request.complaint_text,
        "evidence_urls": request.evidence_urls,
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
        "final_resolution": None
    }
    
    # Run the autonomous LangGraph workflow inside root OTel span
    try:
        with agent_run_span(case_id=dispute_id, run_id=run_id):
            result = await finresolve_app.ainvoke(initial_state)
    except Exception as e:
        # Prevent FastAPI app crash, convert to safe degradation
        result = initial_state
        result["requires_human_escalation"] = True
        result["circuit_breaker_tripped"] = True
        result["escalation_reason"] = f"Workflow execution error: {str(e)}"

    disputes_db[dispute_id] = result
    
    status_str = "RESOLVED"
    if result.get("circuit_breaker_tripped"):
        status_str = "CIRCUIT_BREAKER_HALTED"
    elif result.get("requires_human_escalation"):
        status_str = "ESCALATED_HITL"

    return DisputeResponse(
        dispute_id=dispute_id,
        status=status_str,
        domain=result.get("domain", "UNCLASSIFIED"),
        claimed_amount=result.get("extracted_entities", {}).get("claimed_amount", 25000.0),
        confidence_score=result.get("confidence_score", 0.95),
        final_resolution=result.get("final_resolution")
    )

@router.get("/{dispute_id}")
async def get_dispute(dispute_id: str):
    if dispute_id not in disputes_db:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return disputes_db[dispute_id]
