"""Central LLM Call Wrapper for FinResolve.

Instruments all LLM calls with OpenTelemetry, capturing model, input_tokens,
output_tokens, total_tokens, latency, node, case_id, run_id, iteration.
Uses provider-reported token usage.
"""

import os
import time
import contextvars
from typing import Optional, Dict, Any, Type
from pydantic import BaseModel

from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
from app.core.config import settings
from app.core.telemetry import (
    get_tracer,
    get_execution_context,
    add_standard_attributes,
    m_llm_calls,
    m_llm_tokens
)

# ContextVar for cumulative token budget tracking in current async execution
cv_accumulated_tokens: contextvars.ContextVar[int] = contextvars.ContextVar("cv_accumulated_tokens", default=0)

def reset_accumulated_tokens():
    cv_accumulated_tokens.set(0)

def get_accumulated_tokens() -> int:
    return cv_accumulated_tokens.get()

def add_tokens_to_budget(tokens: int):
    current = cv_accumulated_tokens.get()
    cv_accumulated_tokens.set(current + tokens)

async def llm_call(
    prompt: str,
    system_instruction: Optional[str] = None,
    model: str = "gemini-2.5-flash",
    temperature: float = 0.2,
    response_schema: Optional[Type[BaseModel]] = None,
    mock_response: Optional[str] = None
) -> Dict[str, Any]:
    """Centralized LLM call wrapper with OpenTelemetry instrumentation & token tracking."""
    tracer = get_tracer()
    ctx = get_execution_context()
    start_time = time.time()

    with tracer.start_as_current_span(f"llm.{model}") as span:
        add_standard_attributes(span, {
            "model": model,
            "temperature": temperature,
        })
        
        raw_text = ""
        input_tokens = 0
        output_tokens = 0
        total_tokens = 0
        status_str = "SUCCESS"

        try:
            # Check if Gemini API key is configured and not in forced mock mode
            api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
            
            if mock_response is not None or not api_key or api_key == "mock":
                # Simulated / Mock LLM response for local testing & fallback
                await time_sleep_simulated(0.1)
                raw_text = mock_response or "Simulated LLM decision & reasoning."
                # Realistic token simulation based on prompt and response length
                input_tokens = max(15, len(prompt.split()) * 2)
                output_tokens = max(10, len(raw_text.split()) * 2)
                total_tokens = input_tokens + output_tokens
            else:
                from google import genai
                from google.genai import types
                
                client = genai.Client(api_key=api_key)
                config = types.GenerateContentConfig(
                    temperature=temperature,
                    system_instruction=system_instruction,
                )
                if response_schema:
                    config.response_mime_type = "application/json"
                    config.response_schema = response_schema

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config
                )
                raw_text = response.text or ""
                
                # Extract provider-reported token usage
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    usage = response.usage_metadata
                    input_tokens = getattr(usage, "prompt_token_count", 0) or 0
                    output_tokens = getattr(usage, "candidates_token_count", 0) or 0
                    total_tokens = getattr(usage, "total_token_count", 0) or (input_tokens + output_tokens)
                else:
                    input_tokens = max(10, len(prompt.split()) * 2)
                    output_tokens = max(10, len(raw_text.split()) * 2)
                    total_tokens = input_tokens + output_tokens

            latency = round(time.time() - start_time, 4)

            # Update accumulated token budget context
            add_tokens_to_budget(total_tokens)

            # Set telemetry attributes on OTel span
            span.set_attribute("input_tokens", input_tokens)
            span.set_attribute("output_tokens", output_tokens)
            span.set_attribute("total_tokens", total_tokens)
            span.set_attribute("latency", latency)
            span.set_attribute("status", status_str)
            span.set_status(Status(StatusCode.OK))

            # Record metrics
            if m_llm_calls:
                m_llm_calls.add(1, {"model": model, "status": status_str, "node": ctx["node"]})
            if m_llm_tokens:
                m_llm_tokens.add(total_tokens, {"model": model, "node": ctx["node"]})

            return {
                "text": raw_text,
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "total_tokens": total_tokens,
                "latency": latency,
                "node": ctx["node"],
                "case_id": ctx["case_id"],
                "run_id": ctx["run_id"],
                "iteration": ctx["iteration"]
            }

        except Exception as e:
            latency = round(time.time() - start_time, 4)
            span.set_attribute("status", "FAILED")
            span.set_attribute("error", str(e))
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            if m_llm_calls:
                m_llm_calls.add(1, {"model": model, "status": "FAILED", "node": ctx["node"]})
            raise

async def time_sleep_simulated(seconds: float):
    import asyncio
    await asyncio.sleep(seconds)
