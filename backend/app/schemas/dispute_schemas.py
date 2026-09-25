from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class DisputeCreateRequest(BaseModel):
    citizen_name: str
    citizen_contact: str
    complaint_text: str
    evidence_urls: List[str] = Field(default_factory=list)

class DisputeResponse(BaseModel):
    dispute_id: str
    status: str
    domain: Optional[str] = None
    claimed_amount: Optional[float] = None
    confidence_score: Optional[float] = 0.0
    final_resolution: Optional[Dict[str, Any]] = None
