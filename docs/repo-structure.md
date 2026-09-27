# FinResolve repository structure

This is the recommended project layout for the FinResolve prototype. The `docs/` files exist now; the application directories below are proposed for the implementation phase.

```text
FinResolve/
├── README.md
├── .env.example
├── .gitignore
├── docs/
│   ├── README.md
│   ├── architecture.md
│   ├── requirements.md
│   ├── contracts.md
│   ├── delivery-plan.md
│   ├── risks-and-research.md
│   └── repo-structure.md
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
│       ├── app/
│       │   ├── App.tsx
│       │   └── routes.tsx
│       ├── components/
│       │   ├── CaseHeader.tsx
│       │   ├── EvidencePanel.tsx
│       │   ├── ConflictCard.tsx
│       │   ├── TaskGraph.tsx
│       │   ├── AgentTimeline.tsx
│       │   └── ReviewPanel.tsx
│       ├── pages/
│       │   ├── SubmitGrievance.tsx
│       │   └── CaseDetails.tsx
│       ├── services/
│       │   └── api.ts
│       └── types/
│           └── case.ts
├── backend/
│   ├── pyproject.toml
│   └── app/
│       ├── main.py
│       ├── api/
│       │   ├── routes/
│       │   │   ├── cases.py
│       │   │   ├── reviews.py
│       │   │   └── health.py
│       │   └── dependencies.py
│       ├── schemas/
│       │   ├── case.py
│       │   ├── evidence.py
│       │   ├── plan.py
│       │   └── review.py
│       ├── graph/
│       │   ├── state.py
│       │   ├── builder.py
│       │   ├── routing.py
│       │   └── nodes/
│       │       ├── intake.py
│       │       ├── triage.py
│       │       ├── evidence.py
│       │       ├── skeptic.py
│       │       ├── planner.py
│       │       ├── validator.py
│       │       ├── executor.py
│       │       ├── monitor.py
│       │       └── human_review.py
│       ├── services/
│       │   ├── case_service.py
│       │   ├── audit_service.py
│       │   └── plan_service.py
│       ├── tools/
│       │   ├── registry.py
│       │   └── financial_connectors/
│       │       ├── bank.py
│       │       ├── merchant.py
│       │       └── settlement.py
│       ├── mocks/
│       │   ├── bank_api.py
│       │   ├── merchant_api.py
│       │   ├── settlement_api.py
│       │   └── fixtures/
│       │       └── disputed_payment.json
│       ├── database/
│       │   ├── session.py
│       │   ├── models.py
│       │   └── repositories/
│       └── core/
│           ├── config.py
│           ├── security.py
│           └── logging.py
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
└── tests/
    ├── unit/
    ├── integration/
    └── fixtures/
```

## Component boundaries

- **`frontend/`** contains the citizen and operator experience: grievance intake, case overview, evidence and conflict panels, task dependency graph, workflow timeline, review controls, and resolution display.
- **`backend/app/api/`** exposes the FastAPI REST contract and validates incoming requests.
- **`backend/app/graph/`** defines LangGraph state, nodes, transitions, and conditional routing. Agent nodes interpret and propose; they do not directly perform unrestricted external actions.
- **`backend/app/tools/`** contains allowlisted, deterministic connector operations. These are the only path for workflow tasks to invoke mock financial systems.
- **`backend/app/mocks/`** provides synthetic bank, merchant, and settlement records, including controlled state changes for the adaptive-replanning demo.
- **`backend/app/database/` and `supabase/`** handle durable case data, evidence metadata, plans, task results, human decisions, and audit events.
- **`tests/`** is the planned home for focused unit and integration checks once implementation begins.

## Workflow boundary

```text
React UI → FastAPI → LangGraph workflow
                      ├── PostgreSQL / Supabase
                      └── allowlisted tools → mock bank / merchant / settlement APIs
```

The LLM is used for bounded language understanding, conflict interpretation, plan proposals, and explanations. Deterministic code validates plans, checks scope and dependencies, performs API calls and database operations, controls state transitions, and writes audit events.

All data used in the prototype should be synthetic or anonymized. Real institution integrations and production authentication are outside this initial repository scope.
