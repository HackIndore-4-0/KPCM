import re
from typing import Dict, Any

def scrub_pii(text: str) -> str:
    """
    Scrubs sensitive Indian financial PII (Aadhaar 12-digits, PAN 10-char, Card numbers)
    before sending payloads to LLM reasoning nodes.
    """
    # Scrub 12-digit Aadhaar
    text = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[REDACTED_AADHAAR]', text)
    # Scrub 16-digit Card numbers
    text = re.sub(r'\b(?:\d{4}[-\s]?){3}\d{4}\b', '[REDACTED_CARD_NUMBER]', text)
    # Scrub 10-character PAN
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', '[REDACTED_PAN]', text)
    return text

def sanitize_citizen_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    sanitized = payload.copy()
    if "complaint_text" in sanitized:
        sanitized["complaint_text"] = scrub_pii(sanitized["complaint_text"])
    return sanitized
