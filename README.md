# FinResolve - Autonomous Resolution Agent for Complex Financial Grievances

Built for **HackIndore 4.0** | Software Track | Team **KPCM**

FinResolve is an AI-powered multi-agent financial grievance resolution system. Rather than acting as a simple conversational chatbot, it functions as an autonomous general contractor that queries banking core systems (CBS), the NPCI UPI switch, and merchant payment gateways to reconcile ledger discrepancies and issue deterministic resolution orders.

## Quick Start

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -e .
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Supabase Setup
Run the SQL migration in `supabase/migrations/20260927_init.sql` and insert mock disputes from `supabase/seed.sql`.
