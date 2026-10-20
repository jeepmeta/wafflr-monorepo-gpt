# Backend Plan

**Status:** Three versioned migrations and a pgTAP test script are committed. The schema and initial trusted room/card/voting operations are drafted, but have not been applied to a Supabase project. Tally/result resolution, rate limiting, cleanup scheduling, and web integration remain unimplemented.

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
- `20261020191000_room_entry_rpcs.sql` adds `create_room`, `join_room`, and `get_room_snapshot`. It normalizes the pgcrypto extension schema, uses a fixed empty search path, grants execution explicitly, returns a room-scoped random participant secret only at creation/join, stores only its SHA-256 digest, and verifies that secret before returning a snapshot.
- `20261020192000_card_and_voting_rpcs.sql` adds `add_card`, `edit_card`, `remove_card`, `start_voting`, and `submit_ballot`. These lock the room row for serialized changes, enforce own-card edits and host-only deck lock, enforce card/quota/ballot completeness limits, freeze eligible card IDs at voting start, and reject duplicate ballots.
- `supabase/tests/room_entry_and_voting.test.sql` adds pgTAP coverage for schema presence, function/table privileges, snapshot identity, deck lock, complete ballot submission, and duplicate ballot rejection.

The room code is currently 12 characters from a 32-symbol ambiguity-reduced alphabet (60 bits of entropy) and is case-normalized. This is a temporary concrete choice, not a final UX decision.

**Important limitations before public launch:**

- These SQL migrations have not been run against PostgreSQL/Supabase. Verify extension/function availability and migration execution in a disposable local Supabase stack first.
- Creation/join RPCs do not yet implement request rate limits, abuse controls, or a robust per-client creation throttle. Add those before public exposure; room codes are not secrets that replace rate limiting.
- Result tallying, tie resolution, host disconnect fallback, room closure, expiry cleanup, and trusted contribution-completion operations are not implemented yet.
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

1. Run migrations and pgTAP tests in a disposable local Supabase environment; fix any SQL/runtime failures before proceeding.
2. Implement and test rate limiting/abuse controls and participant secret lifecycle.
3. Implement trusted RPCs for tally/tie resolution, host disconnect fallback, contribution completion, room closure, and expiry.
4. Add narrowly scoped realtime access and tests for allowed/denied room access.
5. Generate typed database definitions and wire the web client to public URL/publishable key only.
6. Test multi-client realtime, RLS denials, concurrency, reconnects, idempotency, and deletion.
7. Configure production project/secrets only after security review and explicit project authorization.

See [official technical references](./references/README.md).
