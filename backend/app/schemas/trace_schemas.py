from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class AgentTraceStep(BaseModel):
    node_name: str
    action_type: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None
