# Supabase backend

Supabase is the selected backend direction for Wafflr. This directory is reserved for version-controlled database migrations and backend configuration.

## Current status
No project credentials, database schema, or production migration has been provisioned in this repository yet. The web app currently runs as a local prototype. Do not create a migration based on assumptions where the identity and authorization design is still unresolved.

## Before the first migration
1. Finalize a room-scoped participant identity and host authorization strategy that works without requiring guest accounts.
2. Model rooms, participants, options, contribution state, voting rounds, ballots, and results around the confirmed decision log.
3. Define RLS policies and trusted database functions before exposing tables to the browser.
4. Enforce deck locking, vote confirmation, tie resolution, and room expiry in trusted code.
5. Add tests for authorization boundaries and scheduled cleanup.
6. Document how to apply migrations to local, preview, and production environments.

Never commit service-role credentials. Keep schema changes in ordered files under `supabase/migrations/`, not as undocumented dashboard-only edits.
