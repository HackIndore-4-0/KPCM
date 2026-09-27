# Data and API contracts

These are implementation-ready contract proposals, not code. Exact naming can be adjusted during approved implementation while preserving the boundaries.

## 1. Case state (Pydantic model outline)

```text
CaseState
  case_id: UUID
  run_id: UUID
  status: CaseStatus
  created_at: datetime
  updated_at: datetime
  complaint: Complaint
  transaction: TransactionContext | None
  evidence: list[EvidenceRecord]
  stakeholders: list[Stakeholder]
  conflicts: list[Conflict]
  missing_information: list[MissingInformation]
  classification: Classification | None
  confidence: ConfidenceAssessment | None
  plan_versions: list[PlanVersion]
  active_plan_id: UUID | None
  tasks: list[Task]
  task_results: list[TaskResult]
  human_review: HumanReview | None
  resolution: Resolution | None
  audit_events: list[AuditEventRef]
  agent_summaries: list[AgentSummary]
  loop_count: int
  limits: WorkflowLimits
```

Supporting records:

- `Complaint`: original text, normalized summary, optional channel, submitted timestamp.
- `TransactionContext`: optional transaction ID, amount/currency, claimed date, masked synthetic account reference.
- `EvidenceRecord`: evidence ID, source system, record type, synthetic source reference, observed status, payload summary, observed-at/fresh-until, confidence, raw payload hash or fixture reference.
- `Stakeholder`: stable key, category/agency, responsibility, implicated evidence IDs.
- `Conflict`: field, competing values, evidence IDs, severity, status, explanation, unresolved flag.
- `MissingInformation`: field, why required, blocking flag, safe user prompt.
- `Classification`: domain, issue type, urgency, candidate responsible systems, confidence, explanation.
- `ConfidenceAssessment`: score or calibrated band, factors, threshold policy version, explanation; never use a number alone for a high-risk decision.
- `PlanVersion`: ID, version, created-at, reason, planner summary, validation outcome, task IDs.
- `Task`: ID, allowlisted action type, target connector, parameters constrained by schema, dependency IDs, acceptance criteria, status, required approval flag, idempotency key.
- `TaskResult`: task ID, outcome, output evidence IDs, error category, started/completed timestamps.
- `HumanReview`: reason, requested decision, status, assigned reviewer, reviewer note, decision, timestamps.
- `Resolution`: outcome category, citizen-facing summary, supporting evidence IDs, unresolved caveats, closed-at.
- `AuditEventRef`: durable event ID, event type, actor type/ID, timestamp.
- `AgentSummary`: node, concise rationale, input evidence IDs, output references, confidence/uncertainty; no hidden chain-of-thought.

Enums: `CaseStatus = received | triaging | evidence_gathering | planning | awaiting_execution | monitoring | awaiting_customer | human_review | resolved | escalated | failed`; `TaskStatus = proposed | validated | blocked | ready | running | succeeded | failed | skipped | awaiting_approval`; `ReviewStatus = pending | approved | rejected | information_requested | completed`.

## 2. Task plan validation rules

Before execution, deterministically require: every dependency ID exists; the graph is acyclic; task types and connector names are allowlisted; required parameters are present and typed; task scope is limited to this case and synthetic records; no task executes before dependencies succeed; required human approval is present; idempotency key is stable for retries; task count and replan count stay under configured caps. Invalid plans do not partially execute.

## 3. PostgreSQL/Supabase logical schema

All tables use UUID primary keys and UTC timestamps. Use `case_id` foreign keys and indexes on case/status/time. Store JSONB only for bounded, versioned payloads; keep searchable fields normalized.

| Table | Core columns and relationships |
|---|---|
| `cases` | `id PK`, `status`, `complaint_text`, `normalized_summary`, `domain`, `issue_type`, `urgency`, `confidence_band`, `transaction_id NULL`, `amount_minor NULL`, `currency NULL`, `created_at`, `updated_at`, `closed_at NULL` |
| `evidence` | `id PK`, `case_id FK`, `source_system`, `record_type`, `source_ref`, `observed_status`, `summary`, `payload JSONB`, `observed_at`, `fresh_until NULL`, `created_at`; index `(case_id, observed_at)` |
| `stakeholders` | `id PK`, `case_id FK`, `stakeholder_key`, `category`, `display_name`, `responsibility`, `created_at`; unique `(case_id, stakeholder_key)` |
| `conflicts` | `id PK`, `case_id FK`, `field`, `severity`, `status`, `explanation`, `evidence_ids UUID[]` or join table, `created_at`, `resolved_at NULL` |
| `plans` | `id PK`, `case_id FK`, `version`, `reason`, `planner_summary`, `validation_status`, `validation_errors JSONB`, `created_at`; unique `(case_id, version)` |
| `tasks` | `id PK`, `plan_id FK`, `case_id FK`, `action_type`, `connector`, `parameters JSONB`, `acceptance_criteria JSONB`, `status`, `requires_approval`, `idempotency_key`, `created_at`, `updated_at`; unique `(plan_id, idempotency_key)` |
| `task_dependencies` | `task_id FK`, `depends_on_task_id FK`, composite PK; reject cycles in service validation |
| `task_results` | `id PK`, `task_id FK`, `outcome`, `result JSONB`, `error_category NULL`, `started_at`, `completed_at NULL` |
| `human_reviews` | `id PK`, `case_id FK`, `plan_id NULL FK`, `reason`, `status`, `decision NULL`, `reviewer_ref NULL`, `reviewer_note NULL`, timestamps |
| `audit_events` | `id PK`, `case_id FK`, `sequence_no`, `event_type`, `actor_type`, `actor_ref NULL`, `summary`, `refs JSONB`, `created_at`; unique `(case_id, sequence_no)` and index `(case_id, created_at)` |
| `graph_runs` | `id PK`, `case_id FK`, `graph_thread_id`, `status`, `started_at`, `ended_at NULL`, `checkpoint_ref NULL`, `error_category NULL` |

For evidence-conflict links, prefer an `evidence_conflicts(conflict_id FK, evidence_id FK, role)` join table if the implementation needs reliable relational queries. Supabase RLS should be configured before exposing project data beyond a local demo; service credentials stay server-side.

Durable in database: user-visible case data, source evidence summaries, plans and task outcomes, reviewer decisions, audit history. Transient/checkpoint state: current node working context, temporary prompts, bounded in-flight tool data. Do not persist raw model chain-of-thought or duplicate unbounded payloads.

## 4. FastAPI contracts

Prototype auth can use a local demo identity or short-lived signed token; never trust a caller-supplied role. Keep service keys server-side. Validate all IDs and scopes. These endpoints are a recommended minimum.

| Method/path | Request | Response | Purpose |
|---|---|---|---|
| `POST /api/v1/cases` | `{ complaint_text, transaction_id?, amount?, currency?, transaction_date? }` | `{ case_id, status, created_at }` | Create case and start intake/triage workflow |
| `GET /api/v1/cases/{case_id}` | — | `CaseSummary` with classification, status, confidence, review state, resolution | Case overview |
| `GET /api/v1/cases/{case_id}/events` | `?after=cursor` | `{ events: AuditEvent[], next_cursor }` | Poll/stream workflow and audit changes |
| `GET /api/v1/cases/{case_id}/evidence` | — | `{ evidence: EvidenceRecord[], conflicts: Conflict[] }` | Explain source records and inconsistencies |
| `GET /api/v1/cases/{case_id}/plan` | — | `{ versions: PlanVersion[], active_plan }` | Show DAG and replanning history |
| `POST /api/v1/cases/{case_id}/run` | `{ mode: start|resume, idempotency_key }` | `{ run_id, status }` | Start or continue a graph run safely |
| `POST /api/v1/cases/{case_id}/review` | `{ review_id, decision, note? }` | `{ status, case_status }` | Approve/reject/request information and resume interrupt |
| `POST /api/v1/cases/{case_id}/demo/scenario` | `{ scenario_key }` | `{ scenario_key, changed_fields }` | Demo-only control to change mock fixture; disabled outside demo mode |
| `GET /api/v1/health` | — | `{ api, database, graph, mocks }` | Readiness for local demonstration |

All errors return `{ error: { code, message, details?, retryable } }`. Use 400 for malformed input, 404 unknown case, 409 invalid transition/idempotency conflict, 422 schema/business validation, 503 unavailable dependency. Do not return secrets or internal prompt content.

## 5. Mock financial API contracts

Use synthetic transaction `TXN123`, amount ₹25,000 (store as integer minor units plus `INR`), and scenario state controlled by fixture version. Require a case/request correlation ID and return source timestamp plus synthetic marker.

| System | Endpoint | Example response |
|---|---|---|
| Bank | `GET /mock/bank/transactions/{transaction_id}` | `{ transaction_id, bank_status: SUCCESS, amount_minor, currency: INR, authorized_at, reference, synthetic: true }` |
| Merchant | `GET /mock/merchant/orders/by-transaction/{transaction_id}` | `{ transaction_id, order_status: NOT_RECEIVED, merchant_ref, last_updated, synthetic: true }` |
| Payment/settlement | `GET /mock/payments/transactions/{transaction_id}` | `{ transaction_id, settlement_status: PENDING, expected_settlement_at?, rail_ref, last_updated, synthetic: true }` |
| Payment/settlement | `POST /mock/payments/transactions/{transaction_id}/reconcile` | `{ transaction_id, reconciliation_status, settlement_status, action_ref, synthetic: true }` |

Demo progression: initial bank `SUCCESS`, merchant `NOT_RECEIVED`, settlement `PENDING`; after a monitor wait/controlled scenario transition, settlement becomes `SETTLED` and merchant becomes `RECEIVED` (or remains inconsistent to exercise human review). Clearly label mock APIs and make reads repeatable. No real payments or refunds are executed.
