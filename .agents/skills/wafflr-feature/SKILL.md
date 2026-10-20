---
name: wafflr-feature
description: Implement or change a Wafflr product feature, screen, user flow, or domain behavior while preserving the MVP decisions and architecture.
---

# Wafflr feature implementation

## Before coding
1. Read `/AGENTS.md`.
2. Read `docs/README.md`, then the relevant user journey, screen catalog, decision engine, and architecture sections.
3. Identify which behavior is Confirmed, Proposed, or Open. If an open decision materially blocks implementation, ask instead of silently inventing a rule.
4. Decide whether the work belongs in `packages/core`, `packages/ui`, or `apps/web`.

## Implementation
- Use the shared room and voting engine for all four MVP categories.
- Keep domain logic pure and independent of React and browser APIs.
- Make user states explicit: loading, empty, error, success, and disabled where relevant.
- Prefer existing shared components and semantic tokens.
- Keep guest participation low-friction; do not add mandatory accounts without a product decision.
- For backend-backed behavior, consult the Supabase skill before trusting any client state.

## Verification
- Add/update unit tests for domain behavior and interaction tests for meaningful user flows.
- Run formatting, lint/typecheck, build, and relevant tests where the environment permits.
- Update the relevant approved docs in the same change if behavior or architecture changed.
- In the handoff, summarize behavior changed, files affected, tests run, and any unresolved assumptions.
