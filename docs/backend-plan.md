# Backend Plan

**Status:** Initial versioned schema drafted in `supabase/migrations/20261020190000_initial_room_schema.sql`. Supabase project connection, trusted operations, usable room-scoped policies, and production deployment are not configured. The migration intentionally denies direct browser access until authorization is implemented.

## Responsibilities

- **Postgres:** room state, room-scoped participants, cards, contribution status, voting rounds, submitted ballots, response rows, result metadata, lifecycle timestamps.
- **Realtime:** synchronize room phase, card edits, review, voting progress, and results after trusted access is in place.
- **Trusted operations:** enforce phase changes, host permissions, deck lock, ballot submission, tie resolution, and expiry atomically.
- **Cleanup:** delete operational room data 24 hours after closure. Retain only approved anonymous aggregate analytics, if implemented.

## Security invariants

- Treat every client request as untrusted. UI restrictions are not authorization.
- Room code is a locator, not an authorization credential. Normalize it, use adequate randomness, rate-limit attempts, and avoid revealing room data before authorized join.
- Use anonymous, room-scoped participant identity. No signup, email, nickname, or participant-name list in the MVP.
- Persist only a digest of a random participant identity secret; never persist the raw secret.
- Verify creator permissions in trusted database/server operations.
- Enable and test RLS on every table exposed through the Data API. Test allowed and denied access paths.
- Use transactions/functions for concurrent or multi-step mutations, especially start-voting/deck lock, ballot submission, tie resolution, and cleanup.
- Never expose a Supabase service-role key to the browser or mobile client.
- Minimize personal data. Do not persist exact venue/location or cross-room identity unless a confirmed requirement needs it.

## Schema foundation

The first migration defines `rooms`, `participants`, `cards`, `voting_rounds`, `ballots`, and `ballot_responses`, with foreign keys, uniqueness constraints, checks, indexes, and timestamps. All six tables have RLS enabled and direct `anon`/`authenticated` table privileges revoked.

**Important:** this migration is intentionally fail-closed, not a usable backend by itself. No room-scoped policies or callable room RPCs exist yet, so browser clients cannot read or mutate these tables. Do not connect the web UI to these tables directly. The next migration must add narrowly scoped trusted operations and test authorization before enabling any client flow.

The schema keeps category-specific card content in a constrained JSON object pending final category field definitions. Room code length/alphabet and abuse-control thresholds remain open product/technical decisions; the schema only requires a normalized uppercase alphanumeric code.

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

1. Define room-scoped anonymous identity, code entropy/rate limits, and threat model.
2. Add versioned migrations, constraints, indexes, and fail-closed RLS (initial migration drafted).
3. Implement trusted functions for room creation/joining, contribution edits, deck lock, ballot submission, tally/tie resolution, and expiry.
4. Add and test narrow authorization rules, including denied access and concurrent/idempotent requests.
5. Generate typed database definitions.
6. Connect web clients with public keys and server-authoritative operations.
7. Test multi-client realtime, RLS denials, concurrency, reconnects, idempotency, and deletion.
8. Configure production project/secrets only after security review and explicit project authorization.

See [official Supabase references](./references/README.md).
