import time
from contextvars import ContextVar
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import InMemoryMetricReader, PeriodicExportingMetricReader, ConsoleMetricExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.trace import Status, StatusCode, Span

from core.config import settings

# Context Variables for execution context propagation
current_case_id: ContextVar[str] = ContextVar("current_case_id", default="")
current_run_id: ContextVar[str] = ContextVar("current_run_id", default="")
current_node: ContextVar[str] = ContextVar("current_node", default="")
current_agent: ContextVar[str] = ContextVar("current_agent", default="finresolve_orchestrator")
current_iteration: ContextVar[int] = ContextVar("current_iteration", default=0)

# In-memory exporters for real-time querying, testing, and UI streaming
in_memory_span_exporter = InMemorySpanExporter()
in_memory_metric_reader = InMemoryMetricReader()

# Resource Definition
telemetry_resource = Resource.create({
    "service.name": settings.otel_service_name,
    "service.environment": settings.environment,
})

# Tracer Setup
tracer_provider = TracerProvider(resource=telemetry_resource)
tracer_provider.add_span_processor(SimpleSpanProcessor(in_memory_span_exporter))

if settings.enable_console_exporter:
    tracer_provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))

trace.set_tracer_provider(tracer_provider)
tracer = trace.get_tracer("finresolve.tracer")

# Meter Setup
metric_readers = [in_memory_metric_reader]
if settings.enable_console_exporter:
    metric_readers.append(PeriodicExportingMetricReader(ConsoleMetricExporter()))

meter_provider = MeterProvider(resource=telemetry_resource, metric_readers=metric_readers)
metrics.set_meter_provider(meter_provider)
meter = metrics.get_meter("finresolve.meter")

# Core Metric Instruments
agent_runs_counter = meter.create_counter(
    name="agent.runs",
    description="Total count of agent runs initiated",
    unit="1",
)

workflow_iterations_counter = meter.create_counter(
    name="agent.iterations",
    description="Total count of agent workflow iterations",
    unit="1",
)

llm_calls_counter = meter.create_counter(
    name="llm.calls",
    description="Total number of LLM invocations",
    unit="1",
)

llm_tokens_counter = meter.create_counter(
    name="llm.token_usage",
    description="Total token consumption by token type",
    unit="1",
)

tool_calls_counter = meter.create_counter(
    name="tool.calls",
    description="Total number of tool calls",
    unit="1",
)

tool_failures_counter = meter.create_counter(
    name="tool.failures",
    description="Total number of failed tool calls",
    unit="1",
)

consecutive_failures_gauge = meter.create_up_down_counter(
    name="circuit_breaker.consecutive_failures",
    description="Current consecutive tool failure count",
    unit="1",
)

circuit_breaker_trips_counter = meter.create_counter(
    name="circuit_breaker.trips",
    description="Total number of times circuit breaker tripped",
    unit="1",
)

workflow_completions_counter = meter.create_counter(
    name="workflow.completions",
    description="Total number of workflows completed successfully",
    unit="1",
)

human_escalations_counter = meter.create_counter(
    name="human.escalations",
    description="Total number of cases escalated to human review",
    unit="1",
)


def set_execution_context(
    case_id: str,
    run_id: str,
    node: str = "",
    agent: str = "finresolve_orchestrator",
    iteration: int = 0,
):
    """Sets ContextVars for current execution context."""
    current_case_id.set(case_id)
    current_run_id.set(run_id)
    current_node.set(node)
    current_agent.set(agent)
    current_iteration.set(iteration)


def get_current_context() -> Dict[str, Any]:
    """Retrieves current execution context values."""
    return {
        "case_id": current_case_id.get(),
        "run_id": current_run_id.get(),
        "node": current_node.get(),
        "agent": current_agent.get(),
        "iteration": current_iteration.get(),
    }


def get_standard_attributes(
    node: Optional[str] = None,
    iteration: Optional[int] = None,
    status: str = "RUNNING",
    additional: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Builds standard OpenTelemetry attributes mandated by Section 5."""
    ctx = get_current_context()
    attrs: Dict[str, Any] = {
        "case_id": ctx["case_id"],
        "run_id": ctx["run_id"],
        "node": node if node is not None else ctx["node"],
        "agent": ctx["agent"],
        "iteration": iteration if iteration is not None else ctx["iteration"],
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    if additional:
        attrs.update(additional)
    return attrs


def get_tracer():
    return tracer


def get_meter():
    return meter


def get_in_memory_spans():
    """Returns a list of captured spans."""
    return in_memory_span_exporter.get_finished_spans()


def clear_in_memory_telemetry():
    """Clears captured spans for test isolation."""
    in_memory_span_exporter.clear()


def start_agent_run_span(
    case_id: str,
    run_id: str,
    node: str = "agent_root",
    agent: str = "finresolve_orchestrator",
    iteration: int = 0,
) -> Span:
    """Starts the root OpenTelemetry span for an agent workflow run."""
    set_execution_context(
        case_id=case_id,
        run_id=run_id,
        node=node,
        agent=agent,
        iteration=iteration,
    )
    span = tracer.start_span(
        name="agent_run",
        attributes=get_standard_attributes(
            node=node,
            iteration=iteration,
            status="RUNNING",
            additional={"initial_phase": "root"},
        ),
    )
    agent_runs_counter.add(1, {"case_id": case_id, "agent": agent})
    return span
