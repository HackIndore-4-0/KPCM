import asyncio
from typing import Dict, Any, List
from app.agents.state import FinResolveState, LedgerRecord
from app.agents.tools.bank_cbs_tool import query_bank_cbs
from app.agents.tools.npci_switch_tool import query_npci_switch
from app.agents.tools.merchant_pg_tool import query_merchant_pg

async def probing_agents_node(state: FinResolveState) -> Dict[str, Any]:
    """Parallel probing of external institutions to assemble the ledger truth."""
    traces = state.get("agent_traces", [])
    entities = state.get("extracted_entities", {})
    txn_id = entities.get("txn_id", "TXN25000")
    utr = entities.get("utr", "UTR9832482348")
    
    # Concurrently probe all three endpoints
    bank_res, npci_res, merchant_res = await asyncio.gather(
        query_bank_cbs(txn_id),
        query_npci_switch(utr),
        query_merchant_pg("ORD-9912")
    )
    
    records: List[LedgerRecord] = [
        LedgerRecord(
            source=bank_res["source"],
            txn_id=txn_id,
            amount=bank_res.get("amount", 0.0),
            status=bank_res.get("status", "UNKNOWN"),
            timestamp=bank_res.get("timestamp", ""),
            raw_payload=bank_res
        ),
        LedgerRecord(
            source=npci_res["source"],
            txn_id=utr,
            amount=25000.0,
            status=npci_res.get("switch_status", "UNKNOWN"),
            timestamp=npci_res.get("timestamp", ""),
            raw_payload=npci_res
        ),
        LedgerRecord(
            source=merchant_res["source"],
            txn_id="ORD-9912",
            amount=merchant_res.get("amount_received", 0.0),
            status=merchant_res.get("payment_status", "UNKNOWN"),
            timestamp=merchant_res.get("timestamp", ""),
            raw_payload=merchant_res
        )
    ]
    
    traces.append({
        "node_name": "probing_agents",
        "action_type": "PROBE_COMPLETE",
        "content": f"Parallel queries completed across 3 systems. Bank: {bank_res.get('status')}, Switch: {npci_res.get('switch_status')}, Merchant: {merchant_res.get('payment_status')}",
        "metadata": {"records_count": len(records)}
    })
    
    return {
        "ledger_records": records,
        "agent_traces": traces
    }
