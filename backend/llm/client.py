import time
import json
from typing import Any, Callable, Dict, Optional, Type, TypeVar
from pydantic import BaseModel
from opentelemetry.trace import Status, StatusCode

from core.telemetry import (
    get_tracer,
    get_current_context,
    get_standard_attributes,
    llm_calls_counter,
    llm_tokens_counter,
)

T = TypeVar("T", bound=BaseModel)

class LLMResponse(BaseModel):
    content: str
    structured_output: Optional[Any] = None
    input_tokens: int
    output_tokens: int
    total_tokens: int
    model: str
    latency: float
    node: str
    iteration: int
    case_id: str
    run_id: str


def llm_call(
    prompt: str,
    model: str = "gemini-1.5-flash",
    node: Optional[str] = None,
    iteration: Optional[int] = None,
    response_schema: Optional[Type[T]] = None,
    simulated_tokens: Optional[Dict[str, int]] = None,
    mock_content: Optional[str] = None,
    mock_exception: Optional[Exception] = None,
    invoke: Optional[Callable[[str, str], Any]] = None,
) -> LLMResponse:
    """
    Central wrapper for LLM interactions instrumented with OpenTelemetry.
    Captures tokens, latency, model, node, iteration, and case context.
    Provides structured Pydantic parsing while ensuring no raw chain-of-thought is persisted.
    """
    tracer = get_tracer()
    ctx = get_current_context()

    eff_node = node if node is not None else ctx["node"]
    eff_iteration = iteration if iteration is not None else ctx["iteration"]
    case_id = ctx["case_id"]
    run_id = ctx["run_id"]
    agent = ctx["agent"]

    start_time = time.perf_counter()

    with tracer.start_as_current_span("llm_call") as span:
        try:
            if mock_exception is not None:
                raise mock_exception
            # Provider integrations plug into this one boundary. The local fallback is
            # intentionally explicit; it never masquerades as provider token usage.
            provider_result = invoke(prompt, model) if invoke is not None else None
            if mock_content is not None:
                content = mock_content
            elif provider_result is not None:
                content = _read(provider_result, "content", "")
                if not isinstance(content, str):
                    content = json.dumps(content, default=str)
            else:
                content = f"Synthesized response for prompt length {len(prompt)}"

            # Parse structured output if schema requested
            structured_data = None
            if response_schema is not None:
                if mock_content:
                    try:
                        structured_data = response_schema.model_validate_json(mock_content)
                    except Exception:
                        pass
                if structured_data is None:
                    # Provide minimal default instantiation if mock_content wasn't JSON
                    try:
                        structured_data = response_schema.model_validate({"summary": content})
                    except Exception:
                        structured_data = None

            usage = _read(provider_result, "usage", {}) if provider_result is not None else {}
            usage = usage or {}
            in_tokens = int(_read(usage, "input_tokens", _read(usage, "prompt_tokens", 0)))
            out_tokens = int(_read(usage, "output_tokens", _read(usage, "completion_tokens", 0)))
            tot_tokens = int(_read(usage, "total_tokens", in_tokens + out_tokens))
            # Deterministic token values are only available in explicit test/demo mode.
            # A real provider response with missing usage stays zero rather than using
            # a character-count estimate that could make safety decisions inaccurate.
            if simulated_tokens is not None:
                in_tokens = int(simulated_tokens.get("input_tokens", in_tokens))
                out_tokens = int(simulated_tokens.get("output_tokens", out_tokens))
                tot_tokens = int(simulated_tokens.get("total_tokens", in_tokens + out_tokens))

            latency = round(time.perf_counter() - start_time, 4)

            # OpenTelemetry Attributes
            span.set_attributes(
                get_standard_attributes(
                    node=eff_node,
                    iteration=eff_iteration,
                    status="SUCCESS",
                    additional={
                        "model": _read(provider_result, "model", model),
                        "input_tokens": in_tokens,
                        "output_tokens": out_tokens,
                        "total_tokens": tot_tokens,
                        "latency": latency,
                    },
                )
            )
            span.set_status(Status(StatusCode.OK))

            # Record OpenTelemetry Metrics
            metric_attrs = {
                "model": model,
                "node": eff_node or "unknown",
                "status": "SUCCESS",
            }
            llm_calls_counter.add(1, metric_attrs)
            llm_tokens_counter.add(in_tokens, {"token_type": "input", "model": model, "node": eff_node or "unknown"})
            llm_tokens_counter.add(out_tokens, {"token_type": "output", "model": model, "node": eff_node or "unknown"})
            llm_tokens_counter.add(tot_tokens, {"token_type": "total", "model": model, "node": eff_node or "unknown"})

            return LLMResponse(
                content=content,
                structured_output=structured_data,
                input_tokens=in_tokens,
                output_tokens=out_tokens,
                total_tokens=tot_tokens,
                model=_read(provider_result, "model", model),
                latency=latency,
                node=eff_node,
                iteration=eff_iteration,
                case_id=case_id,
                run_id=run_id,
            )

        except Exception as exc:
            try:
                latency = round(time.perf_counter() - start_time, 4)
            except Exception:
                latency = 0.0
            span.set_attributes(
                get_standard_attributes(
                    node=eff_node,
                    iteration=eff_iteration,
                    status="ERROR",
                    additional={
                        "model": model,
                        "latency": latency,
                        "error_type": type(exc).__name__,
                        "error_message": str(exc),
                    },
                )
            )
            span.record_exception(exc)
            span.set_status(Status(StatusCode.ERROR, str(exc)))

            llm_calls_counter.add(
                1,
                {"model": model, "node": eff_node or "unknown", "status": "ERROR"},
            )
            raise exc


def _read(value: Any, key: str, default: Any = None) -> Any:
    """Read fields from mapping- or SDK-style provider responses."""
    if value is None:
        return default
    if isinstance(value, dict):
        return value.get(key, default)
    return getattr(value, key, default)
