"""Execution Circuit Breaker Module for FinResolve Agentic Engine.

Monitors agent loop iterations, accumulated token budget, and consecutive tool failures in real time.
Provides deterministic ALLOW or HALT safety policy decisions to interrupt runaway loops gracefully.
"""

import time
from typing import Dict, Any, Optional, Literal
from pydantic import BaseModel, Field

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from app.core.telemetry import (
    get_tracer,
    get_execution_context,
    m_breaker_trips
)

ActionType = Literal["ALLOW", "HALT"]
TriggerType = Literal["NONE", "CONSECUTIVE_TOOL_FAILURES", "TOKEN_BUDGET_EXCEEDED", "MAX_ITERATIONS_EXCEEDED"]

class CircuitBreakerPolicy(BaseModel):
    max_consecutive_tool_failures: int = 4
    max_token_budget: int = 10000
    max_iterations: int = 5

class CircuitBreakerDecision(BaseModel):
    action: ActionType
    trigger: TriggerType
    threshold: int
    observed: int
    node: str
    iteration: int
    total_tokens: int
    reason: str

class CircuitBreaker:
    """Deterministic Safety Circuit Breaker for LangGraph workflows."""

    def __init__(self, policy: Optional[CircuitBreakerPolicy] = None):
        self.policy = policy or CircuitBreakerPolicy()

    def evaluate(
        self,
        node: str,
        iteration: int,
        total_tokens: int,
        consecutive_tool_failures: int
    ) -> CircuitBreakerDecision:
        """Evaluates execution state against safety thresholds deterministically."""
        tracer = get_tracer()
        ctx = get_execution_context()

        # Check 1: Consecutive Tool Failures
        if consecutive_tool_failures >= self.policy.max_consecutive_tool_failures:
            reason = (
                f"Tool execution failed {consecutive_tool_failures} consecutive times "
                f"(threshold: {self.policy.max_consecutive_tool_failures}). Execution halted to prevent cascading errors."
            )
            decision = CircuitBreakerDecision(
                action="HALT",
                trigger="CONSECUTIVE_TOOL_FAILURES",
                threshold=self.policy.max_consecutive_tool_failures,
                observed=consecutive_tool_failures,
                node=node,
                iteration=iteration,
                total_tokens=total_tokens,
                reason=reason
            )
            self._record_trip_telemetry(decision, ctx)
            return decision

        # Check 2: Cumulative Token Budget
        if total_tokens >= self.policy.max_token_budget:
            reason = (
                f"Cumulative token usage ({total_tokens}) reached budget limit of {self.policy.max_token_budget}. "
                f"Execution halted to prevent token overrun."
            )
            decision = CircuitBreakerDecision(
                action="HALT",
                trigger="TOKEN_BUDGET_EXCEEDED",
                threshold=self.policy.max_token_budget,
                observed=total_tokens,
                node=node,
                iteration=iteration,
                total_tokens=total_tokens,
                reason=reason
            )
            self._record_trip_telemetry(decision, ctx)
            return decision

        # Check 3: Max Iterations
        if iteration >= self.policy.max_iterations:
            reason = (
                f"Workflow iteration count ({iteration}) reached maximum iteration limit of {self.policy.max_iterations}. "
                f"Execution halted to prevent infinite looping."
            )
            decision = CircuitBreakerDecision(
                action="HALT",
                trigger="MAX_ITERATIONS_EXCEEDED",
                threshold=self.policy.max_iterations,
                observed=iteration,
                node=node,
                iteration=iteration,
                total_tokens=total_tokens,
                reason=reason
            )
            self._record_trip_telemetry(decision, ctx)
            return decision

        # Safe ALLOW decision
        return CircuitBreakerDecision(
            action="ALLOW",
            trigger="NONE",
            threshold=0,
            observed=0,
            node=node,
            iteration=iteration,
            total_tokens=total_tokens,
            reason="Execution parameters within safe policy limits."
        )

    def _record_trip_telemetry(self, decision: CircuitBreakerDecision, ctx: Dict[str, Any]):
        tracer = get_tracer()
        with tracer.start_as_current_span("circuit_breaker.trip") as span:
            span.set_attribute("case_id", ctx["case_id"])
            span.set_attribute("run_id", ctx["run_id"])
            span.set_attribute("trigger", decision.trigger)
            span.set_attribute("threshold", decision.threshold)
            span.set_attribute("observed", decision.observed)
            span.set_attribute("node", decision.node)
            span.set_attribute("iteration", decision.iteration)
            span.set_attribute("total_tokens", decision.total_tokens)
            span.set_attribute("reason", decision.reason)
            span.set_status(Status(StatusCode.ERROR, f"Circuit Breaker Tripped: {decision.trigger}"))

        if m_breaker_trips:
            m_breaker_trips.add(1, {"trigger": decision.trigger, "node": decision.node})

    def generate_structured_halt_event(
        self,
        case_id: str,
        run_id: str,
        decision: CircuitBreakerDecision,
        tool: Optional[str] = None
    ) -> Dict[str, Any]:
        """Emits a structured halt event according to FinResolve safety specification."""
        return {
            "event": "CIRCUIT_BREAKER_TRIPPED",
            "case_id": case_id,
            "run_id": run_id,
            "trigger": decision.trigger,
            "threshold": decision.threshold,
            "observed": decision.observed,
            "node": decision.node,
            "tool": tool or decision.node,
            "iteration": decision.iteration,
            "total_tokens": decision.total_tokens,
            "reason": decision.reason,
            "action": "HALT_AND_ESCALATE",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
