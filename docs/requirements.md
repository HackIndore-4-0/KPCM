# Requirements and traceability

The PDF deck is the source of truth for proposed product claims. The table translates each claim into a demonstrable requirement without treating slide estimates as verified prototype outcomes.

| Deck source | Claim / capability | Prototype requirement | Component / evidence |
|---|---|---|---|
| Slide 1 | Autonomous resolution agent for complex financial grievances | Demonstrate a stateful workflow that can gather evidence, decide, plan, act, monitor, and adapt | LangGraph run history and case UI; frame as decision support with controlled simulated actions |
| Slide 2 | Multi-stakeholder, missing information, conflicting records, coordinated actions | Represent stakeholders, missing fields, conflicts, dependencies, and task results explicitly | Case state, evidence panel, task DAG, seeded disputed-payment scenario |
| Slide 2 | 7M+, 90-day wait, 5–7 visits, staff burden; AI-ready / digital-volume context | Keep these as deck context only; do not present as measured prototype performance | Demo narration must distinguish context claims from prototype measurements |
| Slide 3 | LangGraph multi-agent autonomous routing | Use specialized graph nodes and conditional edges, not a linear prompt chain | Workflow trace shows node transitions and re-entry |
| Slide 3 | Smart domain detection and involved agencies | Classify financial domain and map parties to responsible mock connectors | Triage output and stakeholder list |
| Slide 3 | Cross-system conflict reconciliation | Retrieve and compare bank, merchant, and settlement states; link conflicts to evidence | Seed bank `SUCCESS`, merchant `NOT_RECEIVED`, settlement `PENDING` |
| Slide 3 | 90 days to 7–10 days | Treat as an intended impact claim, not a prototype result | Label clearly as proposal target/context; no fabricated measurement |
| Slide 3 | One complaint, one interface, multiple departments coordinated | Single citizen-facing case submission and tracking view with multiple connector statuses | React case journey and system status cards |
| Slide 4 | Citizen complaint → decomposition → interaction/core logic/data flow | Make complaint intake, decomposition, interaction, logic, and data movement visible | Intake form, workflow view, graph trace, API/database boundaries |
| Slide 5 | Parallel execution across agencies | Model independent ready tasks as parallelizable; MVP may execute sequentially while showing readiness/dependencies | Plan graph states prerequisites; describe parallelism as extensibility if not implemented |
| Slide 5 | Automatic DB inconsistency flags | Compare evidence deterministically and label conflict sources; LLM can explain | Conflict panel includes source, status, freshness, and evidence IDs |
| Slide 5 | Explainable reasoning logs for every action | Store concise rationale and append-only action events; do not store chain-of-thought | Audit timeline and structured rationale |
| Slide 5 | LangGraph cycles revisit decisions under ambiguity | Implement bounded monitor → replan → validate → execute cycle | Demo changes mock settlement state between checks and shows new plan version |
| Slide 5 | Pluggable tax, bank, pension agents | Define connector/node boundaries for extension; only implement relevant bank/payment paths in MVP | Adapter interfaces; tax/pension remain roadmap, not fake features |
| Slide 5 | Pydantic enforces structured outputs | Validate model response, task graph, identifiers, and state transitions | Schema validation and failure route |
| Slide 5 | Natural language citizen interface | Accept a free-text complaint with optional transaction ID | Submission screen |
| Slide 5 | Real-time multi-agency updates and proactive communication | Show progress events/status changes; proactive notification can be simulated or deferred | Timeline / polling or stream; avoid claiming external messaging if absent |
| Slide 6 | LangGraph + FastAPI + PostgreSQL and simulated financial APIs | Use these as the proposed prototype stack | Architecture diagram and API contract |
| Slide 6 | Synthetic/anonymized controlled data | Seed synthetic-only cases; label mock data | Mock fixture metadata and visible demo label |
| Slide 6 | Confidence checks and human escalation | Confidence thresholds and hard gates route to a human-review state | Review queue, pause/resume, reviewer action |
| Slide 6 | Modular financial connectors | Keep connector contracts separate from orchestration | Bank, merchant, payment adapter interfaces |
| Slide 6 | Better experience and operational efficiency | Demonstrate one submission, visible progress, automated evidence/planning | Usability and event evidence; do not claim measured productivity gain |
| Slide 6 | Extend across payments, banking, loans, cards, credit reporting | Keep domain and connector mapping extensible; prove only the payment path now | Roadmap section |
| Slide 6 | Traceable resolution supported by evidence | Require terminal outcome references to evidence and recorded actions | Resolution summary references evidence IDs and audit events |
| Slide 7 | Validate against diverse scenarios; strengthen controls; expand workflows | Define post-MVP validation plan and additional scenarios | Risks/research document |
| Slide 7 | Multiple financial domains and responsible decision-support layer | Preserve modular architecture and human oversight | Roadmap; no claim that all domains exist in MVP |

## Requirements by system area

### Backend

Case lifecycle; request validation; graph invocation/checkpointing; conditional routing; task policy and idempotency; connector adapters; confidence and escalation gates; audit events; plan versioning; API status and errors.

### Agents and deterministic nodes

LLM-assisted triage, evidence interpretation/conflict explanation, plan proposal, and citizen-facing explanation. Deterministic evidence retrieval, stakeholder mapping, DAG validation, permissions, tool execution, status transitions, confidence gates, and audit persistence.

### Database

Cases, evidence metadata, stakeholders, conflicts, plan versions, tasks/dependencies/results, review decisions, graph execution references, and append-only audit events. Avoid storing unnecessary hidden reasoning.

### Frontend

Natural-language complaint intake; clear case status; source-by-source evidence; conflict explanation; dependency graph; agent/node timeline; task execution results; adaptive plan change; confidence and review state; resolution/escalation packet; audit history.

### Mock external APIs

Bank transaction lookup/status; merchant order/receipt lookup; payment/settlement lookup/status; deterministic scenario controls to reveal a changed result on a later read; synthetic transaction seed; observable errors/timeouts.

## Acceptance evidence for a credible MVP

1. A case can be submitted and its status retrieved.
2. The graph emits a trace with conditional branches and at least one loop-capable path.
3. Conflicting records are visible and tied to evidence sources.
4. The generated plan has explicit dependencies and passes deterministic cycle/reference/scope checks.
5. Only allowlisted ready tasks execute through mock APIs.
6. A changed mock result is detected and causes a new plan version.
7. A low-confidence or blocked case pauses for human review.
8. Resolution/escalation references evidence and audit events.
