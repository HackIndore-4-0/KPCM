# Risks, decisions, and research notes

## 1. Failure and edge-case policy

| Condition | Expected behavior |
|---|---|
| Missing transaction ID | Triage records the gap; ask for it if it blocks safe lookup. Do not invent one. Allow a non-blocking intake state when other identifiers suffice. |
| Conflicting transaction details | Preserve each source assertion and timestamp; do not overwrite. Create a conflict and reduce confidence; route to review if material facts cannot be reconciled. |
| External system unavailable / timeout | Bound retries; record source unavailable and retryability; continue only if the remaining evidence suffices, otherwise ask for information or review. |
| Invalid/malformed LLM output | Validate structured output; retry with constrained repair once; then use deterministic safe fallback or human review. Never execute malformed content. |
| Invalid plan / missing dependency | Reject before execution; provide validator errors for one bounded planner repair; then human review. |
| Cyclic dependencies | Detect with deterministic topological sort/DFS; reject whole plan; execute nothing from it. |
| Low confidence | Apply explicit threshold plus high-risk gates; request missing information or pause for review. Do not resolve based only on model confidence. |
| Insufficient evidence | Keep case open/awaiting information or escalate; clearly list facts still unknown. |
| New evidence after planning | Append evidence, invalidate stale assumptions, create plan version, revalidate before continuing. |
| Human escalation | Persist review reason and evidence links; interrupt graph; support approve/reject/request-information with actor and timestamp; only resume approved scope. |
| API timeout / repeated execution | Idempotency key per task; query outcome before retrying potentially non-idempotent operations; mark outcome unknown when safe retry cannot be established. |
| Contradictory new evidence | Do not automatically mark resolved; create conflict and return to skeptic/review path. |
| Replan loop does not converge | Cap cycles and task count; escalate with plan history and unresolved uncertainty. |
| Database write fails | Do not claim success; preserve a failed run state where possible and return retryable error; side effect and audit ordering needs careful transactional design. |

## 2. Key design decisions and judge answers

| Decision | Why | Judge-ready answer |
|---|---|---|
| LangGraph state graph, not one prompt | Need conditional paths, checkpoints, interruption, and re-entry | “The workflow must observe system responses and change its next action. A state graph makes those transitions explicit and auditable.” |
| LLM proposes; deterministic services execute | Model outputs can be uncertain and should not hold credentials or unrestricted tool authority | “The model interprets and proposes; typed policy checks and allowlisted code decide what can run.” |
| Evidence linked to claims and outcomes | Reconciliation must be explainable and reviewable | “Every conclusion points back to source records and timestamps so a person can challenge or verify it.” |
| Human review on ambiguity/high risk | Some cases cannot be safely resolved with available data | “Automation handles bounded, well-supported steps and routes unresolved or sensitive decisions to a person.” |
| Synthetic mock systems | Protect financial data and make a reliable hackathon demo | “We demonstrate orchestration without connecting to or changing real accounts.” |
| PostgreSQL relational records plus bounded JSONB | Cases and relationships need consistency; flexible external payloads vary by connector | “Core entities and audit relations stay queryable; bounded source payload details remain adaptable.” |
| One end-to-end payment scenario first | Demonstrates core orchestration within two days | “A complete changing-evidence loop proves more than shallow coverage of many domains; the connector boundary supports later expansion.” |
| No chain-of-thought persistence | It is unnecessary for audit and can expose unreliable/private reasoning traces | “We record concise decision summaries, uncertainty, evidence references, and actions, which are reviewable.” |

## 3. P0 concepts to understand before implementation

- LangGraph `StateGraph`, state reducers, conditional edges, checkpoints, interrupt/resume, and bounded loops.
- Pydantic models and structured output parsing; schema validation and safe failure behavior.
- Directed acyclic graphs, dependency ordering, cycle detection, and task readiness.
- FastAPI request/response validation, async calls, timeout handling, and idempotency.
- PostgreSQL foreign keys, transactions, indexes, and Supabase server-side credentials/RLS boundaries.
- Tool boundary design: allowlists, input validation, case scoping, audit records, and no arbitrary model-controlled execution.
- Evidence provenance, confidence versus certainty, and human-review conditions.

## 4. P1 useful concepts

- Graph checkpoint storage and resuming runs after process restart.
- Server-sent events or WebSockets for live status; polling is acceptable for the first demo.
- Retry/backoff policy and distinguishing retryable from terminal errors.
- Evaluation set design for multiple synthetic complaint variants and malformed model responses.
- Basic prompt injection awareness: treat complaint text and external payloads as untrusted data, not instructions.

## 5. P2 optional for the hackathon

- Production-grade multi-tenant RLS, identity federation, advanced observability, model calibration, distributed task queues, and real institution integration. These require separate threat modeling and stakeholder approval before production use.

## 6. Open decisions to resolve during approved implementation

1. Which structured-output LLM/provider and model are available to the team, and what fallback should run offline?
2. Does the demo use local PostgreSQL or Supabase hosted project? Keep secrets out of frontend and source control.
3. Is the mock scenario transition automatic on the second poll, triggered from an operator control, or both?
4. Which task is permitted to change a mock record: reconciliation request, or demo-only fixture transition? The fixture transition must be labeled and separate from a real financial action.
5. Is customer notification represented only in the UI, or does time permit a simulated notification event?
6. Which terminal outcomes count as resolved versus escalated? Define evidence prerequisites before building the resolution screen.
