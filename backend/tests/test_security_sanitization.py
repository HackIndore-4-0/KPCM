import pytest
from app.core.sanitizer import (
    mask_card_numbers,
    mask_cvv,
    mask_aadhaar,
    mask_account_number,
    sanitize_financial_complaint
)
from app.core.config import settings
from app.agents.nodes.ingestion import ingestion_node
from app.safety.hitl_store import HITLStore, HITLActionProposal

def test_pci_dss_card_masking():
    text = "Citizen paid using Visa 4111-2222-3333-4444 and RuPay 6081234567890123."
    sanitized = mask_card_numbers(text)
    assert "4111-2222-3333-4444" not in sanitized
    assert "6081234567890123" not in sanitized
    assert "XXXX-XXXX-XXXX-4444" in sanitized
    assert "XXXX-XXXX-XXXX-0123" in sanitized

def test_cvv_redaction():
    text = "Security CVV: 891 and my backup card cvv is 123 and cid=4567."
    sanitized = mask_cvv(text)
    assert "891" not in sanitized
    assert "123" not in sanitized
    assert "[REDACTED_CVV]" in sanitized

def test_aadhaar_masking():
    text = "Attached Aadhaar card: 1234-5678-9012 for citizen KYC verification."
    sanitized = mask_aadhaar(text)
    assert "1234-5678-9012" not in sanitized
    assert "XXXX-XXXX-9012" in sanitized

def test_account_number_masking():
    assert mask_account_number("ACC_SBI_9981") == "ACC_SBI_****9981"
    assert mask_account_number("123456789012") == "********9012"
    assert mask_account_number("9981") == "9981"
    assert mask_account_number("") == ""

def test_financial_complaint_sanitization_preserves_utr_and_amounts():
    raw = (
        "My payment failed! Card 4532-1111-2222-3333, CVV: 789, Aadhaar 9999-8888-7777. "
        "Dispute UTR is UTR9832482348, amount ₹25,000.00 debited from SBI account."
    )
    sanitized = sanitize_financial_complaint(raw)
    
    # Sensitive credentials redacted
    assert "4532-1111-2222-3333" not in sanitized
    assert "XXXX-XXXX-XXXX-3333" in sanitized
    assert "789" not in sanitized
    assert "[REDACTED_CVV]" in sanitized
    assert "9999-8888-7777" not in sanitized
    assert "XXXX-XXXX-7777" in sanitized
    
    # Financial reconciliation anchors strictly preserved
    assert "UTR9832482348" in sanitized
    assert "25,000.00" in sanitized
    assert "SBI" in sanitized

@pytest.mark.asyncio
async def test_ingestion_node_applies_pci_filter():
    state = {
        "raw_complaint": "Accidentally entered card 4123-4567-8901-2345 with cvv: 999.",
        "evidence_urls": [],
        "agent_traces": []
    }
    result = await ingestion_node(state)
    
    # Check that sanitized complaint is stored in state
    assert "4123-4567-8901-2345" not in result["raw_complaint"]
    assert "XXXX-XXXX-XXXX-2345" in result["raw_complaint"]
    assert "[REDACTED_CVV]" in result["raw_complaint"]
    
    # Check that PII_REDACTION audit trace was generated
    trace_actions = [t["action_type"] for t in result["agent_traces"]]
    assert "PII_REDACTION" in trace_actions

def test_tls_endpoint_validation():
    # Valid HTTPS endpoints pass
    assert settings.validate_tls_endpoint("https://cbs.internal.bank.in/api/v1") is True
    
    # Insecure plaintext HTTP endpoints are blocked
    with pytest.raises(ValueError, match="SECURITY VIOLATION"):
        settings.validate_tls_endpoint("http://insecure-bank.internal/api/v1")

def test_hitl_store_cache_bounding_and_eviction():
    store = HITLStore()
    store.MAX_CACHE_SIZE = 5  # Set low limit for testing
    
    # Add 5 items
    for i in range(5):
        store.pause_and_persist(HITLActionProposal(
            id=f"act-{i}",
            dispute_id=f"disp-{i}",
            run_id="run-1",
            tool_name="execute_bank_reversal"
        ))
    assert len(store._memory_store) == 5
    
    # Mark first 2 as resolved
    store._memory_store["act-0"]["status"] = "APPROVED"
    store._memory_store["act-1"]["status"] = "REJECTED"
    
    # Adding a 6th item should trigger cache eviction of resolved items
    store.pause_and_persist(HITLActionProposal(
        id="act-5",
        dispute_id="disp-5",
        run_id="run-1",
        tool_name="execute_bank_reversal"
    ))
    
    # Resolved act-0 should have been purged
    assert "act-0" not in store._memory_store
    assert "act-5" in store._memory_store
