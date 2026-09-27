-- Supabase PostgreSQL Schema for FinResolve (Challenge 1 & Challenge 2)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Grievance Master Table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT UNIQUE NOT NULL,
    citizen_name TEXT NOT NULL,
    citizen_contact TEXT NOT NULL,
    complaint_text TEXT NOT NULL,
    domain TEXT DEFAULT 'UNCLASSIFIED',
    status TEXT DEFAULT 'INGESTED',
    confidence_score NUMERIC(3, 2) DEFAULT 0.00,
    claimed_amount NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Evidence Files
CREATE TABLE IF NOT EXISTS dispute_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    extracted_ocr_data JSONB DEFAULT '{}'::jsonb,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Live Agent Reasoning & Step Traces (OpenTelemetry Mirrored)
CREATE TABLE IF NOT EXISTS agent_execution_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    node_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Cross-System Ledger Records
CREATE TABLE IF NOT EXISTS system_ledger_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
    institution_type TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    external_txn_id TEXT NOT NULL,
    status TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Human-in-the-Loop Approval Queue (Challenge 2 State Preservation)
CREATE TABLE IF NOT EXISTS human_escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id TEXT NOT NULL,
    run_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    proposed_parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    generated_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'PENDING',
    suggested_action TEXT,
    human_verdict TEXT,
    modified_parameters JSONB,
    officer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Disable Row Level Security or allow full access for Hackathon demo testing
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_execution_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_ledger_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write disputes" ON disputes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write dispute_evidence" ON dispute_evidence FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write agent_execution_traces" ON agent_execution_traces FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write system_ledger_records" ON system_ledger_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write human_escalations" ON human_escalations FOR ALL USING (true) WITH CHECK (true);
