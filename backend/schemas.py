"""
FinResolve Database & Pydantic Schemas
---------------------------------------
Contains:
1. RAW PostgreSQL / Supabase DDL string (SCHEMA_SQL) for easy execution/migration.
2. Complete Pydantic v2 domain models for all entities (Disputes, Traces, Ledgers, Escalations).
3. Database helper utilities to export or apply the schema directly to Supabase.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum
import sys
from pydantic import BaseModel, Field


# ============================================================================
# 1. SUPABASE / POSTGRESQL DDL (SCHEMA_SQL)
# ============================================================================
# You can copy-paste this into Supabase SQL Editor or execute it via python.

SCHEMA_SQL = """-- ============================================================================
-- FINRESOLVE: AUTONOMOUS FINANCIAL GRIEVANCE RESOLUTION ENGINE SCHEMA
-- Target: Supabase (PostgreSQL 15+)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Grievance / Disputes Master Table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT UNIQUE NOT NULL,
    citizen_name TEXT NOT NULL,
    citizen_contact TEXT NOT NULL,
    complaint_text TEXT NOT NULL,
    domain TEXT DEFAULT 'UPI_P2M',
    status TEXT DEFAULT 'INGESTED',
    confidence_score NUMERIC(4, 2) DEFAULT 0.00,
    claimed_amount NUMERIC(12, 2) DEFAULT 0.00,
    extracted_entities JSONB DEFAULT '{}'::jsonb,
    final_resolution JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by public dispute_id and status
CREATE INDEX IF NOT EXISTS idx_disputes_dispute_id ON disputes(dispute_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON disputes(created_at DESC);

-- 2. Evidence Files (Screenshots, PDFs, SMS Receipts)
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT REFERENCES disputes(dispute_id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    extracted_ocr_data JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_dispute_id ON dispute_evidence(dispute_id);

-- 3. Live Agent Reasoning & Step Traces (Streamed to UI via SSE)
CREATE TABLE IF NOT EXISTS agent_execution_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT REFERENCES disputes(dispute_id) ON DELETE CASCADE,
    node_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    content TEXT NOT NULL,
    latency_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'SUCCESS',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traces_dispute_id ON agent_execution_traces(dispute_id);
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON agent_execution_traces(created_at ASC);

-- 4. Cross-System Ledger Records (Bank CBS, NPCI Switch, Merchant PG)
CREATE TABLE IF NOT EXISTS system_ledger_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT REFERENCES disputes(dispute_id) ON DELETE CASCADE,
    institution_type TEXT NOT NULL, -- 'BANK_CBS', 'NPCI_SWITCH', 'MERCHANT_PG'
    institution_name TEXT NOT NULL,
    external_txn_id TEXT NOT NULL,
    status TEXT NOT NULL,           -- 'SUCCESS', 'PENDING', 'FAILED', 'TIMEOUT', 'NOT_FOUND'
    amount NUMERIC(12, 2) NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_dispute_id ON system_ledger_records(dispute_id);
CREATE INDEX IF NOT EXISTS idx_ledger_external_txn ON system_ledger_records(external_txn_id);

-- 5. Human-in-the-Loop (HITL) Escalations / Ombudsman Cockpit
CREATE TABLE IF NOT EXISTS human_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT REFERENCES disputes(dispute_id) ON DELETE CASCADE,
    escalation_reason TEXT NOT NULL,
    assigned_role TEXT DEFAULT 'OMBUDSMAN_OFFICER',
    suggested_action TEXT,
    confidence_score NUMERIC(4, 2) DEFAULT 0.00,
    conflict_summary TEXT,
    human_verdict TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED_REFUND', 'REJECTED_FRAUD', 'MANUAL_INVESTIGATION'
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_escalations_dispute_id ON human_escalations(dispute_id);
CREATE INDEX IF NOT EXISTS idx_escalations_verdict ON human_escalations(human_verdict);

-- 6. Trigger for updated_at auto-refresh
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_disputes_updated_at ON disputes;
CREATE TRIGGER trg_disputes_updated_at
BEFORE UPDATE ON disputes
FOR EACH ROW
EXECUTE FUNCTION update_disputes_updated_at();
"""


# ============================================================================
# 2. ENUMS & CONSTANTS
# ============================================================================

class DisputeStatus(str, Enum):
    INGESTED = "INGESTED"
    INVESTIGATING = "INVESTIGATING"
    CONFLICT_DETECTED = "CONFLICT_DETECTED"
    REPLANNING = "REPLANNING"
    RESOLVED = "RESOLVED"
    ESCALATED_HITL = "ESCALATED_HITL"
    CLOSED = "CLOSED"


class InstitutionType(str, Enum):
    BANK_CBS = "BANK_CBS"
    NPCI_SWITCH = "NPCI_SWITCH"
    MERCHANT_PG = "MERCHANT_PG"


class TransactionStatus(str, Enum):
    SUCCESS = "SUCCESS"
    PENDING = "PENDING"
    FAILED = "FAILED"
    TIMEOUT = "TIMEOUT"
    NOT_FOUND = "NOT_FOUND"


class EscalationVerdict(str, Enum):
    PENDING = "PENDING"
    APPROVED_REFUND = "APPROVED_REFUND"
    REJECTED_FRAUD = "REJECTED_FRAUD"
    MANUAL_INVESTIGATION = "MANUAL_INVESTIGATION"


# ============================================================================
# 3. PYDANTIC DOMAIN MODELS
# ============================================================================

# --- Grievance / Dispute Models ---
class DisputeCreateRequest(BaseModel):
    citizen_name: str
    citizen_contact: str
    complaint_text: str
    evidence_urls: List[str] = Field(default_factory=list)


class DisputeResponse(BaseModel):
    dispute_id: str
    citizen_name: str
    citizen_contact: str
    complaint_text: str
    domain: Optional[str] = "UPI_P2M"
    status: DisputeStatus = DisputeStatus.INGESTED
    confidence_score: float = 0.0
    claimed_amount: Optional[float] = 0.0
    extracted_entities: Dict[str, Any] = Field(default_factory=dict)
    final_resolution: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Evidence Models ---
class EvidenceRecord(BaseModel):
    id: Optional[str] = None
    dispute_id: str
    file_name: str
    file_url: str
    extracted_ocr_data: Dict[str, Any] = Field(default_factory=dict)
    uploaded_at: Optional[datetime] = None


# --- Execution Trace Models (Real-time Stream) ---
class AgentTraceCreate(BaseModel):
    dispute_id: str
    node_name: str
    action_type: str
    content: str
    latency_ms: int = 0
    status: str = "SUCCESS"  # 'SUCCESS', 'WARNING', 'ERROR'
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AgentTraceRecord(AgentTraceCreate):
    id: Optional[str] = None
    created_at: Optional[datetime] = None


# --- Cross-System Ledger Models ---
class LedgerRecord(BaseModel):
    id: Optional[str] = None
    dispute_id: str
    institution_type: InstitutionType
    institution_name: str
    external_txn_id: str
    status: TransactionStatus
    amount: float
    raw_payload: Dict[str, Any] = Field(default_factory=dict)
    fetched_at: Optional[datetime] = None


# --- Human-in-the-Loop Escalation Models ---
class HumanEscalationCreate(BaseModel):
    dispute_id: str
    escalation_reason: str
    assigned_role: str = "OMBUDSMAN_OFFICER"
    suggested_action: Optional[str] = None
    confidence_score: float = 0.0
    conflict_summary: Optional[str] = None


class HumanEscalationRecord(HumanEscalationCreate):
    id: Optional[str] = None
    human_verdict: EscalationVerdict = EscalationVerdict.PENDING
    officer_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class EscalationDecisionRequest(BaseModel):
    verdict: EscalationVerdict
    officer_notes: str


# ============================================================================
# 4. SUPABASE / SQL UTILITIES
# ============================================================================

def get_schema_sql() -> str:
    """Returns the raw Supabase SQL schema DDL."""
    return SCHEMA_SQL.strip()


def export_sql_file(target_path: str = "schema.sql") -> None:
    """Exports the schema to a target SQL file."""
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(get_schema_sql() + "\n")
    print(f"[OK] Exported Supabase schema to: {target_path}")


def apply_schema_to_supabase(client=None) -> bool:
    """
    Applies the schema SQL directly to Supabase via RPC or postgrest if configured.
    Falls back to printing instructions if no active direct SQL connection exists.
    """
    if client is None:
        try:
            from app.core.supabase_client import get_supabase_client
            client = get_supabase_client()
        except ImportError:
            try:
                from core.supabase_client import get_supabase_client
                client = get_supabase_client()
            except ImportError:
                client = None

    if not client:
        print("[INFO] No active Supabase client configured. You can copy-paste SCHEMA_SQL into Supabase SQL Editor.")
        return False

    try:
        # Note: Executing raw multi-statement DDL usually requires Supabase SQL Editor
        # or psycopg/asyncpg direct PostgreSQL connection string.
        print("[INFO] Applying schema via client...")
        # If client has rpc for sql exec:
        res = client.rpc("exec_sql", {"query": SCHEMA_SQL}).execute()
        print("[SUCCESS] Schema applied to Supabase successfully.")
        return True
    except Exception as e:
        print(f"[NOTE] Supabase API does not allow arbitrary multi-statement DDL via REST client directly without an RPC function: {e}")
        print("[ACTION] Please paste the SQL output of `python schemas.py --print` into the Supabase Web Dashboard SQL Editor.")
        return False


if __name__ == "__main__":
    if "--print" in sys.argv or "-p" in sys.argv:
        print(get_schema_sql())
    elif "--export" in sys.argv:
        path = sys.argv[sys.argv.index("--export") + 1] if len(sys.argv) > sys.argv.index("--export") + 1 else "schema.sql"
        export_sql_file(path)
    else:
        print("FinResolve Schemas Module Loaded.")
        print("Usage:")
        print("  python schemas.py --print     # Print raw SQL to copy to Supabase SQL Editor")
        print("  python schemas.py --export    # Export raw SQL to schema.sql")
