---
name: supabase-feature
description: Design or implement Wafflr persistence, realtime synchronization, room authorization, database migrations, or Supabase Edge Functions.
---

# Supabase feature work

## Read first
Read `/AGENTS.md`, `docs/backend-plan.md`, `docs/architecture.md`, and `docs/decision-engine.md`. Use the official references linked from `docs/references/README.md`.

## Security invariants
- The browser is untrusted. Do not authorize a host action solely because the UI says the participant is the host.
- Use server/database-side authorization for room membership, host-only actions, phase transitions, deck locking, ballot validation, tie resolution, and expiry.
- Enable and test Row Level Security for every exposed table. Policies must scope access to the specific room and role; avoid broad read/write policies.
- Never expose the Supabase service-role secret in a browser bundle or `VITE_*` variable.
- Treat room codes as join identifiers, not authorization. Use adequate randomness, normalization, rate limits, and abuse controls.
- Keep guest identity room-scoped and privacy-conscious. Do not store unnecessary profile data.
- Use transactions or database functions for operations that must be atomic, especially locking the deck, submitting ballots, tallying, and selecting winners.
- Validate and constrain input at the trust boundary. Do not accept client-computed tallies or winner state as authoritative.

## Migration discipline
- Use versioned SQL migrations; do not make undocumented dashboard-only schema changes.
- Include RLS policies and indexes with the schema change that needs them.
- Keep local setup instructions and generated database types in sync.
- Add tests for allowed and denied access, not just successful operations.
- Do not connect to or mutate a production Supabase project without explicit authorization.

## Handoff
Summarize migrations/functions/policies changed, threat assumptions, verification performed, and any manual Supabase setup still required. Never claim live synchronization works until it has been tested across separate clients.
