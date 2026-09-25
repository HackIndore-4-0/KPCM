import pytest
from app.agents.nodes.conflict_arbiter import conflict_arbiter_node
from app.agents.state import LedgerRecord

@pytest.mark.asyncio
async def test_conflict_detection_logic():
    records = [
        LedgerRecord(source="BANK_CBS", txn_id="TXN1", amount=25000, status="SUCCESS", timestamp=""),
        LedgerRecord(source="NPCI_SWITCH", txn_id="UTR1", amount=25000, status="TIMEOUT", timestamp=""),
        LedgerRecord(source="MERCHANT_PG", txn_id="ORD1", amount=0, status="PAYMENT_NOT_CREDITED", timestamp="")
    ]
    state = {
        "ledger_records": records,
        "agent_traces": []
    }
    output = await conflict_arbiter_node(state)
    assert output["conflict_detected"] is True
    assert "Discrepancy Confirmed" in output["conflict_details"]
