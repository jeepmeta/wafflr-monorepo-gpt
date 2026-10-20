# Backend Plan

**Status:** Two versioned migrations are committed. The schema and trusted room-entry RPCs are drafted, but have not been applied to a Supabase project. Card mutation, voting, result resolution, rate limiting, cleanup scheduling, and web integration remain unimplemented.

## Responsibilities

- **Postgres:** room state, room-scoped participants, cards, contribution status, voting rounds, submitted ballots, response rows, result metadata, lifecycle timestamps.
- **Realtime:** synchronize room phase, card edits, review, voting progress, and results after trusted access is in place.
- **Trusted operations:** enforce phase changes, host permissions, deck lock, ballot submission, tie resolution, and expiry atomically.
- **Cleanup:** delete operational room data 24 hours after closure. Retain only approved anonymous aggregate analytics, if implemented.

## Security invariants

- Treat every client request as untrusted. UI restrictions are not authorization.
- Room code is a locator, not an authorization credential. Normalize it, use adequate randomness, rate-limit attempts, and avoid revealing room data before authorized join.
- Use anonymous, room-scoped participant identity. No signup, email, nickname, or participant-name list in the MVP.
- Persist only a digest of a random participant identity secret; the raw secret is returned once by trusted entry RPCs and must be retained by the client only for that room.
- Verify creator permissions in trusted database/server operations.
- Enable and test RLS on every table exposed through the Data API. Test allowed and denied access paths.
- Use transactions/functions for concurrent or multi-step mutations, especially start-voting/deck lock, ballot submission, tie resolution, and cleanup.
- Never expose a Supabase service-role key to the browser or mobile client.
- Minimize personal data. Do not persist exact venue/location or cross-room identity unless a confirmed requirement needs it.

## Committed schema and RPCs

Migrations live in `supabase/migrations/`:

- `20261020190000_initial_room_schema.sql` creates `rooms`, `participants`, `cards`, `voting_rounds`, `ballots`, and `ballot_responses`; adds constraints, indexes, timestamps, same-room foreign keys; enables RLS; and revokes direct table access from `anon` and `authenticated`.
- `20261020191000_room_entry_rpcs.sql` adds `create_room`, `join_room`, and `get_room_snapshot`. They run with a fixed empty search path, have explicit execute grants, return a room-scoped random participant secret only at creation/join, store only its SHA-256 digest, and verify that secret before returning a snapshot.

The room code is currently 12 hexadecimal characters (48 bits of entropy) and is case-normalized. This is a temporary concrete choice, not a final UX decision.

**Important limitations before public launch:**

- These SQL migrations have not been run against PostgreSQL/Supabase. Verify extension/function availability and migration execution in a disposable local Supabase stack first.
- Creation/join RPCs do not yet implement request rate limits, abuse controls, or a robust per-client creation throttle. Add those before public exposure; room codes are not secrets that replace rate limiting.
- No RPCs currently mutate cards, lock a deck, submit ballots, calculate results, resolve ties, or close/expire rooms.
- There are no room-scoped realtime authorization policies yet. Direct table access remains revoked; do not connect the browser to the tables or assume realtime synchronization works.
- The snapshot returns the room's cards after participant-secret verification. It does not expose ballots or vote totals.
- Secrets are returned only once. Client-side persistence/recovery and token rotation/revocation still need a defined implementation.

## Conceptual data model

| Entity | Purpose |
| --- | --- |
| `rooms` | Code, title, category, phase, contribution mode, creator reference, timestamps, expiry |
| `participants` | Anonymous room-scoped identity, role, contribution status, disconnect/last-seen timestamps |
| `cards` | Room, submitter, category-specific fields, order, timestamps |
| `voting_rounds` | Round number, eligible/frozen card IDs, status, timestamps, result metadata |
| `ballots` | One final submission per participant per round |
| `ballot_responses` | One Yep/Nah response per card in a submitted ballot |
| `aggregate_events` (optional) | Anonymous metrics only, with no room/person re-identification path |

A room code/QR contains the code only; no join URL or deep link is required.

## Retention

- A room closes after its final result.
- Closed room and decision data remain accessible for 24 hours, then are permanently deleted.
- Retained analytics must be genuinely anonymous and unlinkable to room, participant, card, or vote. If that cannot be guaranteed, retain nothing.
- No persistent vote history or participant history by default.

## Implementation order

1. Add and run migrations in a disposable local Supabase environment; verify constraints and RPC behavior.
2. Implement and test rate limiting/abuse controls and participant secret lifecycle.
3. Implement trusted RPCs for contribution edits, host veto, deck lock, ballot submit, tally/tie resolution, host disconnect fallback, and expiry.
4. Add narrowly scoped realtime access and tests for allowed/denied room access.
5. Generate typed database definitions and wire the web client to public URL/publishable key only.
6. Test multi-client realtime, RLS denials, concurrency, reconnects, idempotency, and deletion.
7. Configure production project/secrets only after security review and explicit project authorization.

See [official technical references](./references/README.md).
