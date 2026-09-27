from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.core.telemetry import (
    get_span_exporter,
    get_execution_context,
    get_consecutive_tool_failures
)
from app.core.llm import get_accumulated_tokens
from app.safety.circuit_breaker import CircuitBreakerPolicy
from app.api.v1.disputes import disputes_db

router = APIRouter()

@router.get("/metrics")
async def get_telemetry_metrics() -> Dict[str, Any]:
    """Exposes real-time OpenTelemetry metrics and execution counters."""
    ctx = get_execution_context()
    return {
        "status": "active",
        "consecutive_tool_failures": get_consecutive_tool_failures(),
        "accumulated_tokens": get_accumulated_tokens(),
        "active_context": ctx,
    }

@router.get("/spans")
async def get_telemetry_spans(limit: int = 50) -> List[Dict[str, Any]]:
    """Returns recorded OpenTelemetry finished spans for live audit tracing."""
    spans = get_span_exporter().get_finished_spans()
    result = []
    for s in spans[-limit:]:
        attrs = dict(s.attributes) if s.attributes else {}
        result.append({
            "name": s.name,
            "context": {
                "trace_id": hex(s.context.trace_id),
                "span_id": hex(s.context.span_id)
            },
            "parent_id": hex(s.parent.span_id) if s.parent else None,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "attributes": attrs,
            "status": s.status.status_code.name if s.status else "UNSET"
        })
    return result

@router.get("/circuit-breaker")
async def get_circuit_breaker_status() -> Dict[str, Any]:
    """Exposes default safety circuit breaker policies and live system status."""
    policy = CircuitBreakerPolicy()
    return {
        "status": "ARMED",
        "policy": policy.model_dump(),
        "live_metrics": {
            "current_consecutive_tool_failures": get_consecutive_tool_failures(),
            "current_accumulated_tokens": get_accumulated_tokens()
        }
    }

@router.get("/disputes/{dispute_id}/timeline")
async def get_dispute_timeline(dispute_id: str) -> Dict[str, Any]:
    """Returns structured execution timeline showing node progression and breaker trip status."""
    if dispute_id not in disputes_db:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    case_data = disputes_db[dispute_id]
    traces = case_data.get("agent_traces", [])
    
    timeline = []
    for t in traces:
        timeline.append({
            "node": t.get("node_name"),
            "action": t.get("action_type"),
            "content": t.get("content"),
            "metadata": t.get("metadata", {})
        })
        
    return {
        "dispute_id": dispute_id,
        "circuit_breaker_tripped": case_data.get("circuit_breaker_tripped", False),
        "circuit_breaker_event": case_data.get("circuit_breaker_event"),
        "status": "HALTED_BY_CIRCUIT_BREAKER" if case_data.get("circuit_breaker_tripped") else "COMPLETED",
        "timeline": timeline
    }
