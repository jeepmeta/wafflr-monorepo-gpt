# Backend Plan

**Status:** Supabase selected; integration and production schema are not yet connected.

## Responsibilities

- **Postgres:** room state, room-scoped participants, cards, contribution status, voting rounds, submitted ballots, result metadata, lifecycle timestamps.
- **Realtime:** synchronize room phase, card edits, review, voting progress, and results.
- **Trusted operations:** enforce phase changes, host permissions, deck lock, ballot submission, tie resolution, and expiry atomically.
- **Cleanup:** delete operational room data 24 hours after closure. Retain only approved anonymous aggregate analytics, if implemented.

## Security invariants

- Treat every client request as untrusted. UI restrictions are not authorization.
- Room code is a locator, not an authorization credential. Normalize it, use adequate randomness, rate-limit attempts, and avoid revealing room data before authorized join.
- Use anonymous, room-scoped participant identity. No signup, email, nickname, or participant-name list in the MVP.
- Verify creator permissions in trusted database/server operations.
- Enable and test RLS on every table exposed through the Data API. Test allowed and denied access paths.
- Use transactions/functions for concurrent or multi-step mutations, especially start-voting/deck lock, ballot submission, tie resolution, and cleanup.
- Never expose a Supabase service-role key to the browser or mobile client.
- Minimize personal data. Do not persist exact venue/location or cross-room identity unless a confirmed requirement needs it.

## Conceptual data model

| Entity | Purpose |
| --- | --- |
| `rooms` | Code, category, phase, contribution mode, creator reference, timestamps, expiry |
| `participants` | Anonymous room-scoped identity, role, contribution/voting completion |
| `cards` | Room, submitter, category-specific fields, order, timestamps |
| `voting_rounds` | Round number, eligible/frozen card IDs, status, timestamps |
| `ballots` | One final submission per participant per round |
| `ballot_responses` | One Yep/Nah response per eligible card in a ballot |
| `aggregate_events` (optional) | Anonymous metrics only, with no room/person re-identification path |

This is conceptual, not a migration or promise that the schema exists. A room code/QR contains the code only; no join URL or deep link is required.

## Retention

- A room closes after its final result.
- Closed room and decision data remain accessible for 24 hours, then are permanently deleted.
- Retained analytics must be genuinely anonymous and unlinkable to room, participant, card, or vote. If that cannot be guaranteed, retain nothing.
- No persistent vote history or participant history by default.

## Implementation order

1. Define room-scoped anonymous identity, code entropy/rate limits, and threat model.
2. Add versioned migrations, constraints, indexes, and RLS policies.
3. Implement trusted functions for joining, contribution edits, deck lock, ballot submit, tally/tie resolution, and expiry.
4. Generate typed database definitions.
5. Connect web clients with public keys and server-authoritative operations.
6. Test multi-client realtime, RLS denials, concurrency, reconnects, idempotency, and deletion.
7. Configure production project/secrets only after security review.

See [official Supabase references](./references/README.md).
