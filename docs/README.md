# FinResolve team document pack

This pack is for architecture review and hackathon preparation. It does not start implementation.

## Source hierarchy

1. **HackIndore_4.0_Kpcm_ppt.pdf** is authoritative for the proposed solution, differentiators, impact claims, responsible automation, and long-term direction.
2. The user-provided project brief is supplemental engineering direction for a two-day prototype (React/Tailwind, FastAPI, LangGraph, Pydantic, PostgreSQL/Supabase, synthetic data, and mock bank/merchant/payment systems).
3. Design choices in these documents are recommendations to make the proposal demonstrable; they are not claims made by the deck.

## Documents

- [Architecture blueprint](architecture.md) — system boundaries, nodes, state, safety, deployment shape.
- [Requirements and traceability](requirements.md) — deck claims mapped to prototype requirements and evidence.
- [Data and API contracts](contracts.md) — case schema outline, persistence, endpoints, mock APIs.
- [MVP, demo, and team plan](delivery-plan.md) — two-day scope, three-minute demo, work split, acceptance checks.
- [Risks and research notes](risks-and-research.md) — edge cases, decisions, concepts to learn, judge answers.

## Prototype framing

The first prototype demonstrates one disputed digital-payment grievance end to end. It simulates external financial institutions and does not claim production integration, regulatory approval, or a real 7–10 day resolution outcome. The deck's scale and time-saving figures remain presentation claims unless independently validated.
