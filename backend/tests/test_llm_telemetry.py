import pytest
from app.core.telemetry import agent_run_span, node_execution_span, get_span_exporter, clear_recorded_spans
from app.core.llm import llm_call, reset_accumulated_tokens, get_accumulated_tokens

@pytest.mark.asyncio
async def test_llm_call_telemetry_and_token_tracking():
    clear_recorded_spans()
    reset_accumulated_tokens()
    
    with agent_run_span(case_id="GRV-TEST01", run_id="RUN-TEST01"):
        with node_execution_span(node_name="domain_router", agent_name="router_agent", iteration=1):
            res1 = await llm_call(
                prompt="Classify this grievance: UPI debit timeout",
                model="gemini-2.5-flash",
                mock_response="Category: DIGITAL_PAYMENTS_UPI"
            )
            
            res2 = await llm_call(
                prompt="Suggest resolution steps for stranded UPI funds",
                model="gemini-2.5-flash",
                mock_response="Refund ₹25,000 as per RBI T+1 turnaround guideline."
            )
            
    # Verify return attributes
    assert res1["node"] == "domain_router"
    assert res1["case_id"] == "GRV-TEST01"
    assert res1["input_tokens"] > 0
    assert res1["output_tokens"] > 0
    assert res1["total_tokens"] == res1["input_tokens"] + res1["output_tokens"]
    
    # Verify accumulated token tracking
    accumulated = get_accumulated_tokens()
    assert accumulated == res1["total_tokens"] + res2["total_tokens"]
    
    # Verify OTel Spans
    spans = get_span_exporter().get_finished_spans()
    llm_spans = [s for s in spans if s.name.startswith("llm.")]
    assert len(llm_spans) == 2
    
    first_llm_span = llm_spans[0]
    assert first_llm_span.attributes["model"] == "gemini-2.5-flash"
    assert first_llm_span.attributes["case_id"] == "GRV-TEST01"
    assert first_llm_span.attributes["node"] == "domain_router"
    assert "total_tokens" in first_llm_span.attributes
    assert "latency" in first_llm_span.attributes
