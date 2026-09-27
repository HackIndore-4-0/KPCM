"""State-Preserving Human-in-the-Loop (HITL) Persistence Store.

Challenge 2 Implementation:
Provides an asynchronous human approval gate for irreversible agent actions
(e.g., execute_bank_reversal, external API triggers, or database mutations).

Pauses the agent chain, serializes current context and proposed tool parameters
into Supabase PostgreSQL (human_escalations table) with in-memory fallback,
and provides review & resume lifecycle methods (APPROVE, MODIFY, REJECT).
"""

import time
import uuid
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from app.core.telemetry import (
    get_tracer,
    get_execution_context,
    m_escalations_human
)
from app.core.supabase_client import supabase

VerdictType = Literal["APPROVE", "MODIFY", "REJECT"]
EscalationStatus = Literal["PENDING", "APPROVED", "MODIFIED", "REJECTED"]

class HITLActionProposal(BaseModel):
    id: Optional[str] = None
    dispute_id: str
    run_id: str
    action_type: str = "IRREVERSIBLE_TOOL_MUTATION"
    tool_name: str
    proposed_parameters: Dict[str, Any] = Field(default_factory=dict)
    generated_context: Dict[str, Any] = Field(default_factory=dict)
    status: EscalationStatus = "PENDING"
    suggested_action: Optional[str] = "EXECUTE_REVERSAL"
    created_at: Optional[str] = None

class HITLReviewDecision(BaseModel):
    action_id: str
    verdict: VerdictType
    modified_parameters: Optional[Dict[str, Any]] = None
    officer_notes: Optional[str] = None
    reviewed_by: Optional[str] = "Ombudsman_Officer_1"

class HITLResumePayload(BaseModel):
    action_id: str
    verdict: VerdictType
    status: EscalationStatus
    should_execute: bool
    tool_name: str
    execution_parameters: Dict[str, Any]
    officer_notes: Optional[str] = None
    reason: str

class HITLStore:
    """Manages persistence and lifecycle of paused HITL actions."""

    def __init__(self):
        # In-memory store cache for local tests, zero-latency reads, and offline resilience
        self._memory_store: Dict[str, Dict[str, Any]] = {}

    def pause_and_persist(self, proposal: HITLActionProposal) -> HITLActionProposal:
        """Pauses autonomous agent execution and safely serializes state to Supabase."""
        action_id = proposal.id or str(uuid.uuid4())
        proposal.id = action_id
        timestamp = proposal.created_at or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        proposal.created_at = timestamp
        proposal.status = "PENDING"

        record_data = {
            "id": action_id,
            "dispute_id": proposal.dispute_id,
            "run_id": proposal.run_id,
            "action_type": proposal.action_type,
            "tool_name": proposal.tool_name,
            "proposed_parameters": proposal.proposed_parameters,
            "generated_context": proposal.generated_context,
            "status": "PENDING",
            "suggested_action": proposal.suggested_action,
            "human_verdict": None,
            "modified_parameters": None,
            "officer_notes": None,
            "created_at": timestamp,
            "resolved_at": None
        }

        # Cache in memory
        self._memory_store[action_id] = record_data

        # Persist to Supabase PostgreSQL table 'human_escalations'
        if supabase:
            try:
                supabase.table("human_escalations").insert(record_data).execute()
            except Exception as e:
                # Log telemetry event, in-memory cache preserves state
                tracer = get_tracer()
                with tracer.start_as_current_span("hitl.supabase_fallback") as span:
                    span.set_attribute("error", str(e))
                    span.set_attribute("action_id", action_id)

        # OpenTelemetry telemetry recording
        tracer = get_tracer()
        with tracer.start_as_current_span("hitl.pause_and_persist") as span:
            span.set_attribute("action_id", action_id)
            span.set_attribute("dispute_id", proposal.dispute_id)
            span.set_attribute("run_id", proposal.run_id)
            span.set_attribute("tool_name", proposal.tool_name)
            span.set_attribute("action_type", proposal.action_type)
            span.set_status(Status(StatusCode.OK))

        if m_escalations_human:
            m_escalations_human.add(1, {"tool": proposal.tool_name, "action_type": proposal.action_type})

        return proposal

    def get_pending_actions(self) -> List[Dict[str, Any]]:
        """Returns all actions currently awaiting human review."""
        if supabase:
            try:
                res = supabase.table("human_escalations").select("*").eq("status", "PENDING").execute()
                if res.data:
                    # Sync into local memory store
                    for item in res.data:
                        self._memory_store[item["id"]] = item
                    return res.data
            except Exception:
                pass
        
        return [v for v in self._memory_store.values() if v.get("status") == "PENDING"]

    def get_action_by_id(self, action_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single action record by ID."""
        if supabase:
            try:
                res = supabase.table("human_escalations").select("*").eq("id", action_id).execute()
                if res.data and len(res.data) > 0:
                    self._memory_store[action_id] = res.data[0]
                    return res.data[0]
            except Exception:
                pass

        return self._memory_store.get(action_id)

    def submit_human_decision(self, decision: HITLReviewDecision) -> Dict[str, Any]:
        """Applies human review verdict (APPROVE, MODIFY, REJECT) to a paused action."""
        action = self.get_action_by_id(decision.action_id)
        if not action:
            raise ValueError(f"HITL Action {decision.action_id} not found.")

        resolved_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        status_map: Dict[VerdictType, EscalationStatus] = {
            "APPROVE": "APPROVED",
            "MODIFY": "MODIFIED",
            "REJECT": "REJECTED"
        }
        new_status = status_map[decision.verdict]

        updated_fields = {
            "status": new_status,
            "human_verdict": decision.verdict,
            "modified_parameters": decision.modified_parameters or {},
            "officer_notes": decision.officer_notes,
            "resolved_at": resolved_at
        }

        action.update(updated_fields)
        self._memory_store[decision.action_id] = action

        # Update Supabase
        if supabase:
            try:
                supabase.table("human_escalations").update(updated_fields).eq("id", decision.action_id).execute()
            except Exception as e:
                tracer = get_tracer()
                with tracer.start_as_current_span("hitl.supabase_update_fallback") as span:
                    span.set_attribute("error", str(e))
                    span.set_attribute("action_id", decision.action_id)

        # OTel span
        tracer = get_tracer()
        with tracer.start_as_current_span("hitl.human_decision") as span:
            span.set_attribute("action_id", decision.action_id)
            span.set_attribute("verdict", decision.verdict)
            span.set_attribute("new_status", new_status)
            span.set_attribute("officer_notes", decision.officer_notes or "")
            span.set_status(Status(StatusCode.OK))

        return action

    def resume_action(self, action_id: str) -> HITLResumePayload:
        """Prepares resume execution parameters for the autonomous agent workflow."""
        action = self.get_action_by_id(action_id)
        if not action:
            raise ValueError(f"HITL Action {action_id} not found.")

        verdict = action.get("human_verdict")
        status = action.get("status")
        tool_name = action.get("tool_name", "execute_bank_reversal")
        proposed_params = action.get("proposed_parameters", {})
        modified_params = action.get("modified_parameters") or {}
        officer_notes = action.get("officer_notes")

        if verdict == "APPROVE":
            return HITLResumePayload(
                action_id=action_id,
                verdict="APPROVE",
                status="APPROVED",
                should_execute=True,
                tool_name=tool_name,
                execution_parameters=proposed_params,
                officer_notes=officer_notes,
                reason="Action approved by human reviewer without modifications."
            )
        elif verdict == "MODIFY":
            effective_params = dict(proposed_params)
            effective_params.update(modified_params)
            return HITLResumePayload(
                action_id=action_id,
                verdict="MODIFY",
                status="MODIFIED",
                should_execute=True,
                tool_name=tool_name,
                execution_parameters=effective_params,
                officer_notes=officer_notes,
                reason="Action approved by human reviewer with modified parameters."
            )
        elif verdict == "REJECT":
            return HITLResumePayload(
                action_id=action_id,
                verdict="REJECT",
                status="REJECTED",
                should_execute=False,
                tool_name=tool_name,
                execution_parameters={},
                officer_notes=officer_notes,
                reason=f"Action rejected by human reviewer. Reason: {officer_notes or 'No reason provided'}"
            )
        else:
            raise ValueError(f"Action {action_id} is still in PENDING state. Cannot resume without human verdict.")

# Global instance
hitl_store = HITLStore()
