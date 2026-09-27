from core.telemetry import clear_in_memory_telemetry, get_in_memory_spans, set_execution_context
from mocks import query_bank_cbs, query_merchant_pg
from tools.base import ToolExecutionTracker


def setup_function():
    clear_in_memory_telemetry()
    ToolExecutionTracker.reset()
    set_execution_context("case-tool", "run-tool", node="evidence_gatherer", iteration=2)


def test_tool_failure_is_instrumented_and_recovery_resets_streak():
    failed = query_merchant_pg("txn-redacted", force_fail=True)
    assert not failed.success
    assert failed.error_type == "ConnectionResetError"
    assert ToolExecutionTracker.get_consecutive_failures() == 1

    succeeded = query_bank_cbs("txn-redacted")
    assert succeeded.success
    assert ToolExecutionTracker.get_consecutive_failures() == 0

    spans = get_in_memory_spans()
    assert len(spans) == 2
    failure = next(span for span in spans if span.attributes["status"] == "FAILURE")
    assert failure.attributes["tool_name"] == "merchant_pg"
    assert failure.attributes["node"] == "evidence_gatherer"
    assert failure.attributes["iteration"] == 2
    assert failure.attributes["case_id"] == "case-tool"
    assert failure.attributes["error_type"] == "ConnectionResetError"
    assert "txn-redacted" not in str(failure.attributes)


def test_four_invocations_are_all_counted():
    results = [query_merchant_pg(f"txn-{i}", force_fail=True) for i in range(4)]
    assert all(not result.success for result in results)
    assert ToolExecutionTracker.get_consecutive_failures() == 4
    assert len(get_in_memory_spans()) == 4
