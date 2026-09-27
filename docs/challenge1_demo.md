# FinResolve — Challenge 1: Execution Circuit Breaker & OpenTelemetry

## 1. One-Paragraph Pitch for Judges (Verbatim)

> *"In financial services, runaway agent loops and unilateral hallucinated actions are critical liabilities. FinResolve solves this by decoupling observability from safety: OpenTelemetry captures real-time spans, provider-reported token consumption, and tool latencies into an immutable audit trail, while an independent deterministic Python Circuit Breaker continuously evaluates execution bounds. When an agent experiences four consecutive tool failures, exhausts its token budget, or breaches loop thresholds, the breaker deterministically halts LangGraph execution, intercepts downstream mutation, emits a structured `CIRCUIT_BREAKER_TRIPPED` event attributing the exact failing node, and transitions the case safely into an Ombudsman Human Review queue without crashing the host application."*

---

## 2. Architecture & Separation of Concerns

| Layer | Responsibility | Implementation |
|---|---|---|
| **OpenTelemetry** | Observability only — Spans, metrics, traces, context propagation | `TracerProvider`, `MeterProvider`, `InMemorySpanExporter`, `InMemoryMetricReader` in `backend/core/telemetry.py` |
| **Circuit Breaker** | Safety/policy decisions only — Deterministic Python, zero business logic | `CircuitBreaker` class in `backend/safety/circuit_breaker.py` |
| **LangGraph** | Workflow execution, node dispatch, conditional routing | `build_workflow` & `build_grievance_graph` in `backend/graph/` |
| **Action Layer** | Allowlisted financial operations; the only code path writing mutations | `backend/actions/registry.py` & `backend/actions/executor.py` |

---

## 3. Circuit Breaker Policies & Thresholds

| Trigger | Default Threshold | Behavior |
|---|---|---|
| `CONSECUTIVE_TOOL_FAILURES` | 4 failures | Resets to 0 upon any successful tool call. Trips if 4 consecutive failures occur. |
| `TOKEN_BUDGET` | 10,000 tokens (configurable) | Consumes actual provider-reported token usage across all LLM nodes. Trips if cumulative usage exceeds budget. |
| `MAX_ITERATIONS` | 10 iterations (configurable) | Monitored across workflow loops. Trips if agent exceeds iteration limit. |

---

## 4. Structured Halt Event Specification

When any threshold is breached, execution halts immediately and emits:
```json
{
  "event": "CIRCUIT_BREAKER_TRIPPED",
  "case_id": "CASE-DEMO-TRIP",
  "run_id": "c1f7b031-6b83-4a37-b952-4a5f4c540da1",
  "trigger": "CONSECUTIVE_TOOL_FAILURES",
  "threshold": 4,
  "observed": 4,
  "node": "merchant_verification",
  "tool": "merchant_api",
  "iteration": 1,
  "total_tokens": 120,
  "reason": "4 consecutive tool calls failed; further retries are blocked by the execution safety policy.",
  "action": "HALT_AND_ESCALATE",
  "timestamp": "2026-09-27T10:30:00Z"
}
```

---

## 5. Visual Execution Timeline (UI & Demo)

```
Triage                 ✓ SUCCESS
Skeptic                ✓ SUCCESS
Planner                ✓ SUCCESS
Validator              ✓ SUCCESS
Merchant PG (Att. 1)   ✕ FAILURE
Merchant PG (Att. 2)   ✕ FAILURE
Merchant PG (Att. 3)   ✕ FAILURE
Merchant PG (Att. 4)   ✕ FAILURE
                         ↑
             🛑 BREAKER TRIPPED (CONSECUTIVE_TOOL_FAILURES)
                         ↓
                Safe Halt → Human Review
```

---

## 6. How to Run the Demo & Verify

### Running the automated verification suite (10 required scenarios):
```bash
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/test_challenge1_verification.py -v
```

### Running the command-line demo:
```bash
source .venv/bin/activate
PYTHONPATH=backend python backend/demo_scenario.py
```

### Interactive Web Dashboard:
Start the server:
```bash
source .venv/bin/activate
PYTHONPATH=backend uvicorn main:app --reload --port 8000
```
Open in browser:
```
http://localhost:8000/dashboard
```
Features available in the dashboard:
- Live trigger buttons for all failure modes
- Real-time counters for failures, token budgets, and loop iterations
- Color-coded node-by-node execution timeline with checkmarks/crosses
- Formatted structured halt trace view
