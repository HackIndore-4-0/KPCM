"""OpenTelemetry Observability Foundation for FinResolve Agentic Engine.

Provides TracerProvider, MeterProvider, Context Managers, Context Variables,
Metrics definitions, and In-Memory Span Inspection for real-time monitoring.
"""

import time
import uuid
import contextvars
from typing import Optional, Dict, Any, Generator
from contextlib import contextmanager

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import InMemoryMetricReader
from opentelemetry.trace import Status, StatusCode, Span

# Context variables for case, run, node, iteration & tool failure tracking
cv_case_id: contextvars.ContextVar[str] = contextvars.ContextVar("cv_case_id", default="")
cv_run_id: contextvars.ContextVar[str] = contextvars.ContextVar("cv_run_id", default="")
cv_node_name: contextvars.ContextVar[str] = contextvars.ContextVar("cv_node_name", default="unknown")
cv_agent_name: contextvars.ContextVar[str] = contextvars.ContextVar("cv_agent_name", default="finresolve_agent")
cv_iteration: contextvars.ContextVar[int] = contextvars.ContextVar("cv_iteration", default=0)
cv_consecutive_tool_failures: contextvars.ContextVar[int] = contextvars.ContextVar("cv_consecutive_tool_failures", default=0)

# Global Telemetry Initialization
_tracer_provider: Optional[TracerProvider] = None
_meter_provider: Optional[MeterProvider] = None
_span_exporter: Optional[InMemorySpanExporter] = None
_metric_reader: Optional[InMemoryMetricReader] = None

# Metrics Counters & Instruments
m_agent_runs = None
m_workflow_iterations = None
m_llm_calls = None
m_llm_tokens = None
m_tool_calls = None
m_tool_failures = None
m_consecutive_failures = None
m_breaker_trips = None
m_completions_success = None
m_escalations_human = None

def init_telemetry(service_name: str = "finresolve-engine") -> None:
    global _tracer_provider, _meter_provider, _span_exporter, _metric_reader
    global m_agent_runs, m_workflow_iterations, m_llm_calls, m_llm_tokens
    global m_tool_calls, m_tool_failures, m_consecutive_failures, m_breaker_trips
    global m_completions_success, m_escalations_human

    if _tracer_provider is not None:
        return  # Already initialized

    # Set up TracerProvider with In-Memory Exporter for API & Test inspection
    _span_exporter = InMemorySpanExporter()
    _tracer_provider = TracerProvider()
    _tracer_provider.add_span_processor(SimpleSpanProcessor(_span_exporter))
    trace.set_tracer_provider(_tracer_provider)

    # Set up MeterProvider
    _metric_reader = InMemoryMetricReader()
    _meter_provider = MeterProvider(metric_readers=[_metric_reader])
    metrics.set_meter_provider(_meter_provider)

    tracer = trace.get_tracer(service_name)
    meter = metrics.get_meter(service_name)

    # Register OTel Metrics
    m_agent_runs = meter.create_counter("finresolve.agent.runs", description="Total agent run executions")
    m_workflow_iterations = meter.create_counter("finresolve.workflow.iterations", description="Total workflow iterations")
    m_llm_calls = meter.create_counter("finresolve.llm.calls", description="Total LLM calls executed")
    m_llm_tokens = meter.create_counter("finresolve.llm.tokens", description="Total tokens consumed")
    m_tool_calls = meter.create_counter("finresolve.tool.calls", description="Total tool calls executed")
    m_tool_failures = meter.create_counter("finresolve.tool.failures", description="Total tool call failures")
    m_consecutive_failures = meter.create_up_down_counter("finresolve.tool.consecutive_failures", description="Current consecutive tool failures")
    m_breaker_trips = meter.create_counter("finresolve.circuit_breaker.trips", description="Circuit breaker trips count by trigger")
    m_completions_success = meter.create_counter("finresolve.completions.success", description="Successful resolutions")
    m_escalations_human = meter.create_counter("finresolve.escalations.human", description="Human escalations")

# Auto-initialize
init_telemetry()

def get_tracer():
    return trace.get_tracer("finresolve-engine")

def get_meter():
    return metrics.get_meter("finresolve-engine")

def get_span_exporter() -> InMemorySpanExporter:
    global _span_exporter
    if _span_exporter is None:
        init_telemetry()
    return _span_exporter

def clear_recorded_spans():
    if _span_exporter:
        _span_exporter.clear()

def get_consecutive_tool_failures() -> int:
    return cv_consecutive_tool_failures.get()

def reset_consecutive_tool_failures():
    cv_consecutive_tool_failures.set(0)

def set_execution_context(case_id: str, run_id: str, node: str = "ingestion", agent: str = "triage", iteration: int = 0):
    cv_case_id.set(case_id)
    cv_run_id.set(run_id)
    cv_node_name.set(node)
    cv_agent_name.set(agent)
    cv_iteration.set(iteration)

def get_execution_context() -> Dict[str, Any]:
    return {
        "case_id": cv_case_id.get(),
        "run_id": cv_run_id.get(),
        "node": cv_node_name.get(),
        "agent": cv_agent_name.get(),
        "iteration": cv_iteration.get(),
        "consecutive_tool_failures": cv_consecutive_tool_failures.get()
    }

def add_standard_attributes(span: Span, extra: Optional[Dict[str, Any]] = None):
    ctx = get_execution_context()
    span.set_attribute("case_id", ctx["case_id"])
    span.set_attribute("run_id", ctx["run_id"])
    span.set_attribute("node", ctx["node"])
    span.set_attribute("agent", ctx["agent"])
    span.set_attribute("iteration", ctx["iteration"])
    span.set_attribute("timestamp", time.time())
    if extra:
        for k, v in extra.items():
            if v is not None:
                span.set_attribute(k, str(v) if isinstance(v, (dict, list)) else v)

@contextmanager
def agent_run_span(case_id: str, run_id: Optional[str] = None) -> Generator[Span, None, None]:
    """Root span for an entire agent resolution run."""
    if not run_id:
        run_id = f"run-{str(uuid.uuid4())[:8]}"
    set_execution_context(case_id=case_id, run_id=run_id, node="root", agent="orchestrator", iteration=0)
    reset_consecutive_tool_failures()
    tracer = get_tracer()
    
    if m_agent_runs:
        m_agent_runs.add(1, {"case_id": case_id})

    with tracer.start_as_current_span("agent_run") as span:
        add_standard_attributes(span, {"status": "IN_PROGRESS"})
        try:
            yield span
            span.set_attribute("status", "COMPLETED")
            span.set_status(Status(StatusCode.OK))
        except Exception as e:
            span.set_attribute("status", "FAILED")
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise

@contextmanager
def node_execution_span(node_name: str, agent_name: str = "", iteration: int = 0) -> Generator[Span, None, None]:
    """Span for individual LangGraph node execution."""
    ctx = get_execution_context()
    set_execution_context(
        case_id=ctx["case_id"],
        run_id=ctx["run_id"],
        node=node_name,
        agent=agent_name or node_name,
        iteration=iteration
    )
    tracer = get_tracer()
    
    if m_workflow_iterations:
        m_workflow_iterations.add(1, {"node": node_name, "case_id": ctx["case_id"]})

    with tracer.start_as_current_span(f"node.{node_name}") as span:
        add_standard_attributes(span, {"status": "EXECUTING"})
        try:
            yield span
            span.set_attribute("status", "SUCCESS")
            span.set_status(Status(StatusCode.OK))
        except Exception as e:
            span.set_attribute("status", "FAILED")
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise

@contextmanager
def tool_execution_span(
    tool_name: str,
    is_irreversible: bool = False,
    requires_hitl: bool = False
) -> Generator[Span, None, None]:
    """Span for instrumenting tool / API execution with failure tracking and Challenge 2 irreversible mutation tagging."""
    ctx = get_execution_context()
    tracer = get_tracer()
    start_time = time.time()
    
    with tracer.start_as_current_span(f"tool.{tool_name}") as span:
        add_standard_attributes(span, {
            "tool_name": tool_name,
            "is_irreversible": is_irreversible,
            "requires_hitl": requires_hitl,
            "status": "EXECUTING"
        })
        try:
            yield span
            latency = round(time.time() - start_time, 4)
            span.set_attribute("latency", latency)
            
            # Check if span was explicitly flagged failed
            is_failed = span.attributes.get("status") == "FAILED" or span.attributes.get("success") is False
            if is_failed:
                current_fail = cv_consecutive_tool_failures.get() + 1
                cv_consecutive_tool_failures.set(current_fail)
                span.set_attribute("success", False)
                span.set_attribute("consecutive_failures", current_fail)
                span.set_status(Status(StatusCode.ERROR, "Tool returned error status"))
                if m_tool_calls:
                    m_tool_calls.add(1, {"tool_name": tool_name, "status": "FAILED", "node": ctx["node"]})
                if m_tool_failures:
                    m_tool_failures.add(1, {"tool_name": tool_name, "error_type": span.attributes.get("error_type", "ToolError")})
                if m_consecutive_failures:
                    m_consecutive_failures.add(1, {"tool_name": tool_name})
            else:
                # SUCCESS resets consecutive failures counter (Challenge 1 policy)
                cv_consecutive_tool_failures.set(0)
                span.set_attribute("success", True)
                span.set_attribute("status", "SUCCESS")
                span.set_attribute("consecutive_failures", 0)
                span.set_status(Status(StatusCode.OK))
                if m_tool_calls:
                    m_tool_calls.add(1, {"tool_name": tool_name, "status": "SUCCESS", "node": ctx["node"]})

        except Exception as e:
            latency = round(time.time() - start_time, 4)
            current_fail = cv_consecutive_tool_failures.get() + 1
            cv_consecutive_tool_failures.set(current_fail)
            
            span.set_attribute("latency", latency)
            span.set_attribute("success", False)
            span.set_attribute("status", "FAILED")
            span.set_attribute("error_type", type(e).__name__)
            span.set_attribute("consecutive_failures", current_fail)
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            
            if m_tool_calls:
                m_tool_calls.add(1, {"tool_name": tool_name, "status": "FAILED", "node": ctx["node"]})
            if m_tool_failures:
                m_tool_failures.add(1, {"tool_name": tool_name, "error_type": type(e).__name__})
            if m_consecutive_failures:
                m_consecutive_failures.add(1, {"tool_name": tool_name})
            raise
