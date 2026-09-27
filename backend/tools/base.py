import time
from contextvars import ContextVar
from typing import Any, Callable, Dict, Optional
from pydantic import BaseModel
from opentelemetry.trace import Status, StatusCode

from core.telemetry import (
    get_tracer,
    get_current_context,
    get_standard_attributes,
    tool_calls_counter,
    tool_failures_counter,
    consecutive_failures_gauge,
)


class ToolResult(BaseModel):
    tool_name: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    latency: float
    node: str
    iteration: int
    case_id: str
    run_id: str


class ToolExecutionTracker:
    """Tracks failures in the current async task/run context."""
    _count: ContextVar[int] = ContextVar("tool_consecutive_failures", default=0)

    @classmethod
    def record_result(cls, success: bool) -> int:
        count = 0 if success else cls._count.get() + 1
        cls._count.set(count)
        return count

    @classmethod
    def get_consecutive_failures(cls) -> int:
        return cls._count.get()

    @classmethod
    def reset(cls):
        cls._count.set(0)


def execute_instrumented_tool(
    tool_name: str,
    fn: Callable[..., Dict[str, Any]],
    *args,
    node: Optional[str] = None,
    iteration: Optional[int] = None,
    **kwargs,
) -> ToolResult:
    """
    Executes a financial connector / mock tool with full OpenTelemetry instrumentation.
    Captures: tool_name, node, iteration, success/failure, latency, error_type, case_id, run_id.
    Updates OpenTelemetry metrics including consecutive-failure counters.
    """
    tracer = get_tracer()
    ctx = get_current_context()

    eff_node = node if node is not None else ctx["node"]
    eff_iteration = iteration if iteration is not None else ctx["iteration"]
    case_id = ctx["case_id"]
    run_id = ctx["run_id"]

    start_time = time.perf_counter()

    with tracer.start_as_current_span(f"tool_call:{tool_name}") as span:
        try:
            result_data = fn(*args, **kwargs)
            latency = round(time.perf_counter() - start_time, 4)

            consecutive_failures = ToolExecutionTracker.record_result(success=True)

            span.set_attributes(
                get_standard_attributes(
                    node=eff_node,
                    iteration=eff_iteration,
                    status="SUCCESS",
                    additional={
                        "tool_name": tool_name,
                        "success/failure": "success",
                        "latency": latency,
                        "consecutive_failures": consecutive_failures,
                    },
                )
            )
            span.set_status(Status(StatusCode.OK))

            tool_calls_counter.add(
                1,
                {"tool_name": tool_name, "node": eff_node or "unknown", "status": "SUCCESS"},
            )

            return ToolResult(
                tool_name=tool_name,
                success=True,
                data=result_data,
                latency=latency,
                node=eff_node,
                iteration=eff_iteration,
                case_id=case_id,
                run_id=run_id,
            )

        except Exception as exc:
            latency = round(time.perf_counter() - start_time, 4)
            err_type = type(exc).__name__
            err_msg = str(exc)

            consecutive_failures = ToolExecutionTracker.record_result(success=False)

            span.set_attributes(
                get_standard_attributes(
                    node=eff_node,
                    iteration=eff_iteration,
                    status="FAILURE",
                    additional={
                        "tool_name": tool_name,
                        "success/failure": "failure",
                        "latency": latency,
                        "error_type": err_type,
                        "consecutive_failures": consecutive_failures,
                    },
                )
            )
            # Exception text can contain transaction identifiers or response bodies.
            # Preserve the type for diagnosis without copying the payload to telemetry.
            span.record_exception(RuntimeError(err_type))
            span.set_status(Status(StatusCode.ERROR, err_type))

            tool_calls_counter.add(
                1,
                {"tool_name": tool_name, "node": eff_node or "unknown", "status": "FAILURE"},
            )
            tool_failures_counter.add(
                1,
                {"tool_name": tool_name, "node": eff_node or "unknown", "error_type": err_type},
            )
            consecutive_failures_gauge.add(1, {"tool_name": tool_name})

            return ToolResult(
                tool_name=tool_name,
                success=False,
                error_type=err_type,
                error_message=err_msg,
                latency=latency,
                node=eff_node,
                iteration=eff_iteration,
                case_id=case_id,
                run_id=run_id,
            )
