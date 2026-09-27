import pytest
from app.core.telemetry import (
    agent_run_span,
    node_execution_span,
    get_span_exporter,
    clear_recorded_spans,
    get_consecutive_tool_failures,
    reset_consecutive_tool_failures
)
from app.agents.tools.bank_cbs_tool import query_bank_cbs
from app.agents.tools.merchant_pg_tool import query_merchant_pg
from app.agents.tools.npci_switch_tool import query_npci_switch
from app.agents.tools.bank_reversal_tool import execute_bank_reversal

@pytest.mark.asyncio
async def test_tool_telemetry_and_consecutive_failure_reset():
    clear_recorded_spans()
    reset_consecutive_tool_failures()
    
    with agent_run_span(case_id="GRV-TOOL-001", run_id="RUN-TOOL-001"):
        with node_execution_span(node_name="probing_agents", iteration=1):
            # 2 failures
            await query_merchant_pg("FAIL_01")
            await query_merchant_pg("FAIL_02")
            assert get_consecutive_tool_failures() == 2
            
            # 1 success -> MUST reset consecutive failures counter to 0!
            await query_bank_cbs("TXN25000")
            assert get_consecutive_tool_failures() == 0
            
            # 1 failure -> counter is now 1
            await query_npci_switch("FAIL_03")
            assert get_consecutive_tool_failures() == 1

    spans = get_span_exporter().get_finished_spans()
    tool_spans = [s for s in spans if s.name.startswith("tool.")]
    assert len(tool_spans) == 4
    
    # Check attributes of first failed tool span
    fail_span = tool_spans[0]
    assert fail_span.attributes["tool_name"] == "merchant_pg_api"
    assert fail_span.attributes["success"] is False
    assert "latency" in fail_span.attributes
    assert fail_span.attributes["consecutive_failures"] == 1
    
    # Check attributes of successful tool span
    success_span = tool_spans[2]
    assert success_span.attributes["tool_name"] == "bank_cbs_api"
    assert success_span.attributes["success"] is True
    assert success_span.attributes["consecutive_failures"] == 0

@pytest.mark.asyncio
async def test_four_consecutive_tool_failures_count():
    clear_recorded_spans()
    reset_consecutive_tool_failures()
    
    with agent_run_span(case_id="GRV-TOOL-002", run_id="RUN-TOOL-002"):
        with node_execution_span(node_name="probing_agents", iteration=1):
            await query_merchant_pg("FAIL_1")
            await query_merchant_pg("FAIL_2")
            await query_merchant_pg("FAIL_3")
            await query_merchant_pg("FAIL_4")
            
    assert get_consecutive_tool_failures() == 4

@pytest.mark.asyncio
async def test_irreversible_mutation_action_tagging_challenge_2():
    clear_recorded_spans()
    reset_consecutive_tool_failures()
    
    with agent_run_span(case_id="GRV-MUT-001", run_id="RUN-MUT-001"):
        with node_execution_span(node_name="synthesizer", iteration=1):
            res = await execute_bank_reversal(
                dispute_id="GRV-MUT-001",
                account_no="SBI-9912003",
                amount=25000.0,
                utr="UTR9832482348"
            )
            assert res["status"] == "EXECUTED"
            assert res["amount_credited"] == 25000.0

    spans = get_span_exporter().get_finished_spans()
    mut_spans = [s for s in spans if s.name == "tool.execute_bank_reversal"]
    assert len(mut_spans) == 1
    
    span = mut_spans[0]
    assert span.attributes["is_irreversible"] is True
    assert span.attributes["requires_hitl"] is True
    assert span.attributes["amount"] == 25000.0
