"""Deterministic execution limits. This module contains no business policy."""
from contextvars import ContextVar, Token
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Literal, Optional

from core.config import settings


class BreakerAction(str, Enum):
    ALLOW = "ALLOW"
    HALT = "HALT"


@dataclass(frozen=True)
class BreakerDecision:
    action: Literal["ALLOW", "HALT"]
    trigger: Optional[str] = None
    threshold: Optional[int] = None
    observed: Optional[int] = None
    node: str = ""
    iteration: int = 0
    total_tokens: int = 0
    failure_count: int = 0
    reason: str = "Execution is within configured safety limits."
    timestamp: str = ""

    def to_dict(self) -> dict:
        return asdict(self)


class ExecutionHalted(Exception):
    """Internal control-flow signal caught by the LangGraph node boundary."""
    def __init__(self, decision: BreakerDecision):
        self.decision = decision
        super().__init__(decision.reason)


class CircuitBreaker:
    def __init__(self, max_consecutive_tool_failures=None, max_token_budget=None, max_iterations=None):
        self.max_consecutive_tool_failures = settings.max_consecutive_tool_failures if max_consecutive_tool_failures is None else max_consecutive_tool_failures
        self.max_token_budget = settings.max_token_budget if max_token_budget is None else max_token_budget
        self.max_iterations = settings.max_iterations if max_iterations is None else max_iterations
        self.iteration = 0
        self.total_tokens = 0
        self.consecutive_failures = 0
        self.last_node = ""
        self.last_tool = ""
        self._halt: Optional[BreakerDecision] = None

    @property
    def is_tripped(self) -> bool:
        return self._halt is not None

    def begin_iteration(self, node: str) -> BreakerDecision:
        self.iteration += 1
        self.last_node = node
        return self.evaluate(node=node)

    def record_tokens(self, tokens: int, node: str = "") -> BreakerDecision:
        self.total_tokens += max(0, int(tokens))
        if node:
            self.last_node = node
        return self.evaluate(node=node or self.last_node)

    def record_tool_result(self, success: bool, tool_name: str, node: str = "", iteration: Optional[int] = None) -> BreakerDecision:
        self.last_tool = tool_name
        if node:
            self.last_node = node
        if iteration is not None:
            self.iteration = max(self.iteration, iteration)
        self.consecutive_failures = 0 if success else self.consecutive_failures + 1
        return self.evaluate(node=node or self.last_node)

    def evaluate(self, node: str = "") -> BreakerDecision:
        if self._halt is not None:
            return self._halt
        checks = (
            (self.consecutive_failures >= self.max_consecutive_tool_failures,
             "CONSECUTIVE_TOOL_FAILURES", self.max_consecutive_tool_failures, self.consecutive_failures,
             f"{self.consecutive_failures} consecutive tool calls failed; further retries are blocked by the execution safety policy."),
            (self.total_tokens > self.max_token_budget,
             "TOKEN_BUDGET", self.max_token_budget, self.total_tokens,
             f"Cumulative token usage exceeded the configured budget of {self.max_token_budget} tokens."),
            (self.iteration > self.max_iterations,
             "MAX_ITERATIONS", self.max_iterations, self.iteration,
             f"Workflow iteration count exceeded the configured limit of {self.max_iterations}."),
        )
        for tripped, trigger, threshold, observed, reason in checks:
            if tripped:
                self._halt = BreakerDecision(
                    action="HALT", trigger=trigger, threshold=threshold, observed=observed,
                    node=node or self.last_node, iteration=self.iteration,
                    total_tokens=self.total_tokens, failure_count=self.consecutive_failures,
                    reason=reason, timestamp=datetime.now(timezone.utc).isoformat(),
                )
                return self._halt
        return BreakerDecision(
            action="ALLOW", node=node or self.last_node, iteration=self.iteration,
            total_tokens=self.total_tokens, failure_count=self.consecutive_failures,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


_active_breaker: ContextVar[Optional[CircuitBreaker]] = ContextVar("active_circuit_breaker", default=None)


def bind_circuit_breaker(breaker: Optional[CircuitBreaker]) -> Token:
    return _active_breaker.set(breaker)


def get_active_circuit_breaker() -> Optional[CircuitBreaker]:
    return _active_breaker.get()


def reset_circuit_breaker_binding(token: Token) -> None:
    _active_breaker.reset(token)
