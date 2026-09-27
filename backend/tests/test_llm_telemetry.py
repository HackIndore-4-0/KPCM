import pytest
from pydantic import BaseModel

from core.telemetry import (
    set_execution_context,
    get_in_memory_spans,
    clear_in_memory_telemetry,
)
from llm.client import llm_call, LLMResponse


class SampleStructuredOutput(BaseModel):
    summary: str
    confidence: float = 0.95


@pytest.fixture(autouse=True)
def clean_spans():
    clear_in_memory_telemetry()
    yield
    clear_in_memory_telemetry()


def test_llm_call_telemetry_attributes():
    set_execution_context(
        case_id="case-llm-1",
        run_id="run-llm-1",
        node="triage",
        agent="triage_agent",
        iteration=2,
    )

    response = llm_call(
        prompt="Analyze banking grievance UTR 9876543210",
        model="gemini-1.5-flash",
        node="triage",
        iteration=2,
        simulated_tokens={"input_tokens": 120, "output_tokens": 45, "total_tokens": 165},
    )

    assert isinstance(response, LLMResponse)
    assert response.input_tokens == 120
    assert response.output_tokens == 45
    assert response.total_tokens == 165
    assert response.model == "gemini-1.5-flash"
    assert response.node == "triage"
    assert response.iteration == 2
    assert response.case_id == "case-llm-1"
    assert response.run_id == "run-llm-1"

    spans = get_in_memory_spans()
    assert len(spans) == 1
    span = spans[0]

    assert span.name == "llm_call"
    attrs = span.attributes
    assert attrs["model"] == "gemini-1.5-flash"
    assert attrs["input_tokens"] == 120
    assert attrs["output_tokens"] == 45
    assert attrs["total_tokens"] == 165
    assert "latency" in attrs
    assert attrs["node"] == "triage"
    assert attrs["case_id"] == "case-llm-1"
    assert attrs["run_id"] == "run-llm-1"
    assert attrs["iteration"] == 2
    assert attrs["status"] == "SUCCESS"
    assert "timestamp" in attrs


def test_provider_usage_is_used_without_estimation():
    set_execution_context(case_id="case-provider", run_id="run-provider", node="planner", iteration=3)
    response = llm_call(
        "private grievance text",
        invoke=lambda prompt, model: {
            "content": "structured result",
            "model": "provider-model-v2",
            "usage": {"prompt_tokens": 31, "completion_tokens": 12, "total_tokens": 43},
        },
    )
    assert (response.input_tokens, response.output_tokens, response.total_tokens) == (31, 12, 43)
    assert response.model == "provider-model-v2"
    assert get_in_memory_spans()[0].attributes["total_tokens"] == 43


def test_missing_provider_usage_is_not_estimated():
    response = llm_call("text", invoke=lambda prompt, model: {"content": "reply"})
    assert response.total_tokens == 0


def test_llm_call_structured_output():
    set_execution_context(case_id="case-2", run_id="run-2", node="planner")
    json_mock = '{"summary": "Auto-reversal candidate identified", "confidence": 0.98}'

    response = llm_call(
        prompt="Create resolution plan",
        response_schema=SampleStructuredOutput,
        mock_content=json_mock,
    )

    assert response.structured_output is not None
    assert response.structured_output.summary == "Auto-reversal candidate identified"
    assert response.structured_output.confidence == 0.98


def test_llm_call_error_recording():
    set_execution_context(case_id="case-err", run_id="run-err", node="validator")

    with pytest.raises(RuntimeError) as exc_info:
        from unittest.mock import patch
        with patch("llm.client.get_current_context", side_effect=RuntimeError("Provider Failure")):
            llm_call("prompt test")

    spans = get_in_memory_spans()
    # If get_current_context failed before span opened, let's test exception inside the span:
    assert "Provider Failure" in str(exc_info.value)


def test_llm_call_exception_inside_span():
    set_execution_context(case_id="case-err2", run_id="run-err2", node="validator")

    with pytest.raises(RuntimeError):
        llm_call(
            prompt="prompt test",
            node="validator",
            mock_exception=RuntimeError("LLM Provider Timeout"),
        )

    spans = get_in_memory_spans()
    assert len(spans) == 1
    span = spans[0]
    assert span.attributes.get("status") == "ERROR"
    assert span.attributes.get("error_type") == "RuntimeError"
    assert span.attributes.get("node") == "validator"
    assert span.attributes.get("case_id") == "case-err2"
