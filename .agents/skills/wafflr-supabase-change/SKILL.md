---
name: wafflr-supabase-change
description: Design or implement Supabase schema, migrations, RLS policies, database functions, realtime subscriptions, or server-authoritative Wafflr room behavior.
---

# Wafflr Supabase changes

Read `AGENTS.md`, `docs/architecture.md`, `docs/security-and-data.md`, and `supabase/README.md` before editing database or backend code.

- Keep migrations in `supabase/migrations/`, ordered and reversible where practical. Never make undocumented dashboard-only schema changes.
- Enable and test Row Level Security for every exposed table. Write explicit policies for each role and operation; default to denying access.
- Do not rely on room codes, hidden UI controls, or client-side checks as authorization.
- Never expose the Supabase service-role key in the browser. Only publish the project URL and anon/publishable key to client apps.
- Enforce host-only actions, phase transitions, contribution cutoffs, vote submission, deck locking, and room cleanup on a trusted server/database boundary.
- Avoid storing real names or unnecessary personal data. Ensure closed-room deletion and anonymous aggregate retention follow the documented privacy policy.
- Treat Realtime as a delivery mechanism, not as authorization or the source of truth for validation.
- Add migration/policy tests or a clear manual verification plan. Do not claim a live Supabase project is configured unless credentials and project state have actually been verified.
