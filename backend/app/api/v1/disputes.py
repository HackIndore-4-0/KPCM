import uuid
from fastapi import APIRouter, HTTPException
from app.schemas.dispute_schemas import DisputeCreateRequest, DisputeResponse
from app.agents.graph import finresolve_app

router = APIRouter()

# In-memory store for fast local hackathon prototyping
disputes_db = {}

@router.post("/", response_model=DisputeResponse)
async def create_and_investigate_dispute(request: DisputeCreateRequest):
    dispute_id = f"GRV-{str(uuid.uuid4())[:8].upper()}"
    
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
        "final_resolution": None
    }
    
    # Run the autonomous LangGraph workflow
    result = await finresolve_app.ainvoke(initial_state)
    disputes_db[dispute_id] = result
    
    return DisputeResponse(
        dispute_id=dispute_id,
        status="ESCALATED_HITL" if result.get("requires_human_escalation") else "RESOLVED",
        domain=result.get("domain"),
        claimed_amount=result.get("extracted_entities", {}).get("claimed_amount", 25000.0),
        confidence_score=result.get("confidence_score", 0.95),
        final_resolution=result.get("final_resolution")
    )

@router.get("/{dispute_id}")
async def get_dispute(dispute_id: str):
    if dispute_id not in disputes_db:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return disputes_db[dispute_id]
