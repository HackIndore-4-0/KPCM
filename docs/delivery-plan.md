# MVP, demo, and team plan

## 1. Scope for the two-day prototype

### Must build

- One polished grievance submission and case tracking experience.
- One synthetic disputed-payment scenario across bank, merchant, and payment/settlement mocks.
- FastAPI case and graph run endpoints; LangGraph checkpointed workflow.
- Typed state and structured LLM outputs for triage, conflict interpretation, and planning.
- Deterministic evidence retrieval, DAG validation, allowlisted task execution, state transitions, and audit events.
- Monitor and bounded adaptive replan path demonstrated by a changed mock-system result.
- Human review interrupt for low confidence, failed validation, missing critical information, or unresolved conflict.
- Evidence/conflict view, task dependency visualization, execution statuses, audit timeline, and evidence-backed resolution/escalation.
- Seeded synthetic data and visible mock/simulation labeling.

### Should build

- Parallel execution of independent read-only evidence lookups/tasks.
- Reviewer approve/reject/request-information controls and graph resume.
- Streaming or short-polling progress events.
- A second scenario fixture for low-confidence or external-system timeout behavior.
- Database checkpoint/persistence and a simple operator review queue.

### Nice to have / defer

- Tax, pension, loans, cards, insurance, credit reporting agents or real connectors.
- Real external institution integration, outbound email/SMS, real customer identity, or real financial actions.
- Complex authentication, multi-tenant production deployment, analytics, calibration, and regulatory workflow claims.
- Fancy graph animation beyond a readable dependency visualization.

## 2. Three-minute judge demo

**Scenario:** Citizen disputes a ₹25,000 digital payment. The bank reports `SUCCESS`; merchant reports `NOT_RECEIVED`; settlement shows `PENDING`.

1. **0:00–0:20 — Intake.** Submit natural-language complaint and `TXN123`. Point out the single citizen interface and synthetic-data label.
2. **0:20–0:45 — Triage and evidence.** Show issue/domain classification, involved bank/merchant/payment systems, and records retrieved with timestamps.
3. **0:45–1:10 — Skeptic detects conflict.** Highlight the mismatched bank/merchant states and pending settlement, with evidence references and uncertainty summary.
4. **1:10–1:35 — Plan.** Show tasks and prerequisite arrows: inspect settlement → reconcile transaction → recheck merchant receipt. Explain why an action waits for a prerequisite.
5. **1:35–1:50 — Validate.** Show validator approving the DAG and scope before any action executes.
6. **1:50–2:15 — Execute and observe.** Run only allowlisted mock tools. Use the scenario transition so the settlement changes to `SETTLED` (or show a deliberate unresolved result).
7. **2:15–2:40 — Adapt.** Monitor detects new evidence, planner creates a new plan version, validator rechecks it, and the graph resumes. This is the key agentic proof.
8. **2:40–3:00 — Resolve or escalate.** Show a concise evidence-backed resolution if systems agree; otherwise pause for human review with the disputed facts and next safe action. End on audit timeline.

Never claim actual recovery, real bank access, measured 7–10 day turnaround, or production readiness unless those facts become true and have evidence.

## 3. Four-person work split

| Role | Owns | Integration contract |
|---|---|---|
| Agent/workflow lead | State schemas, LangGraph nodes/edges, structured model calls, plan validation gates | Agrees graph input/output schemas early; does not own API persistence |
| Backend/data lead | FastAPI, PostgreSQL schema, persistence/audit, graph service, review resume | Publishes endpoint and model contracts to frontend and agent lead |
| Mock/tooling lead | Bank/merchant/payment fixtures, connector adapters, scenario transitions, deterministic execution/idempotency | Publishes stable mock schemas and seed case before graph integration |
| Frontend/demo lead | Intake, case journey, conflict/evidence panel, task graph, progress/review/resolution screens | Uses agreed endpoint types; prepares demo sequence and fallback screenshots/state |

Everyone should agree on a single transaction fixture and Pydantic/API shapes before parallel work. Reserve integration time; do not let the UI depend on unstated workflow states.

## 4. Suggested two-day sequence

**Day 1:** lock contracts and case scenario; scaffold approved repository structure; implement typed state and mock APIs; implement graph skeleton and deterministic validator; create UI shell and API integration. Integrate a complete happy path by end of day.

**Day 2:** add conflict reasoning, human interrupt/resume, monitor and replan scenario; persist audit and plan versions; polish visuals; rehearse demo; verify fallback path. Keep one stable end-to-end scenario as the priority.

These are sequencing recommendations, not authorization to start work now.

## 5. Demo acceptance checklist

- The same case can be opened after reload and shows meaningful progress.
- Each source record has source/system, status, timestamp, and synthetic label.
- The task graph shows prerequisite edges and validation status.
- A mock state change is detected as new evidence; a distinct plan version is visible.
- Human review can pause and resume the workflow, or the demo clearly shows the review interrupt.
- Final status is consistent with the source evidence and includes evidence references.
- Audit events explain what happened without exposing hidden chain-of-thought.
- Failure fallback is rehearsed if LLM call or mock service is unavailable.
