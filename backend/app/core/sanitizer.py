"""PII, PCI-DSS, and Financial Data Sanitization & Masking Module.

Enforces:
1. PCI-DSS v4.0 Requirement 3: Automated masking of Primary Account Numbers (PANs) and redaction of CVVs.
2. RBI DPDP & Cybersecurity Framework: Masking of Aadhaar numbers and bank account numbers.
3. Financial Data Minimization: Stripping sensitive credentials before passing to LLM context or persistence.
"""

import re
from typing import Optional

def mask_card_numbers(text: str) -> str:
    """Masks 13 to 19 digit card numbers (Visa, Mastercard, RuPay, Amex) to XXXX-XXXX-XXXX-1234."""
    if not text:
        return ""
    
    # Matches sequences of 13-19 digits, possibly partitioned by spaces or dashes
    pattern = r'\b(?:\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{1,7}|\d{13,19})\b'
    
    def repl(m: re.Match) -> str:
        raw = m.group(0)
        digits = re.sub(r'\D', '', raw)
        if 13 <= len(digits) <= 19:
            return f"XXXX-XXXX-XXXX-{digits[-4:]}"
        return raw

    return re.sub(pattern, repl, text)

def mask_cvv(text: str) -> str:
    """Redacts 3 or 4 digit CVV/CVC codes following security keywords."""
    if not text:
        return ""
    pattern = r'(?i)\b(cvv\d?|cvc|security\s*code|cid)(?:(?:\s+is|\s*[:=])?\s*)(\d{3,4})\b'
    return re.sub(pattern, r'\1: [REDACTED_CVV]', text)

def mask_aadhaar(text: str) -> str:
    """Masks 12-digit Indian Aadhaar numbers formatted with spaces or dashes to XXXX-XXXX-1234."""
    if not text:
        return ""
    pattern = r'\b(\d{4})[ -](\d{4})[ -](\d{4})\b'
    return re.sub(pattern, r'XXXX-XXXX-\3', text)

def mask_account_number(account_no: Optional[str]) -> str:
    """Masks bank account numbers to preserve privacy at rest and in logs (e.g. ACC_SBI_****9981)."""
    if not account_no:
        return ""
    clean = str(account_no).strip()
    if len(clean) <= 4:
        return clean
    if "_" in clean:
        parts = clean.split("_")
        prefix = "_".join(parts[:-1])
        last = parts[-1]
        return f"{prefix}_****{last[-4:]}"
    return f"{'*' * min(8, max(0, len(clean) - 4))}{clean[-4:]}"

def sanitize_financial_complaint(text: str) -> str:
    """Applies complete sanitization pipeline to citizen complaints and OCR text."""
    if not text:
        return ""
    text = mask_card_numbers(text)
    text = mask_cvv(text)
    text = mask_aadhaar(text)
    return text
