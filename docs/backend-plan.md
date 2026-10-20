# Backend Plan: Supabase

**Status: Chosen direction; implementation not connected yet.**

Supabase is the planned backend for Wafflr. The current app is a local prototype; this document is a security and implementation baseline, not a claim that production persistence or realtime behavior exists.

## Planned responsibilities
- PostgreSQL stores rooms, room-scoped participants, cards, contribution status, voting rounds, ballots, and result metadata.
- Realtime broadcasts or database change subscriptions keep room views synchronized.
- Database functions/RPCs enforce state transitions and atomic operations.
- Row Level Security (RLS) limits access by room membership and participant role.
- Scheduled server-side cleanup removes closed-room operational data after the product's retention window, while retaining only approved anonymous aggregate analytics if implemented.

## Security requirements
- Treat all browser input as untrusted.
- Never ship service-role keys to the browser. Only the project URL and public publishable/anon key may be exposed to the client.
- A room code is a locator, not a secret authorization credential. Normalize it, generate it with sufficient entropy, rate-limit join attempts, and avoid leaking room data before joining.
- Model host authority explicitly and verify it server-side. Host-only actions include the documented veto, early end of voting, and final selection after a persistent tie; do not silently grant broad administrator powers.
- Enforce deck limits, participant contribution limits, voting phase, complete ballots, immutable submitted ballots, one tie-breaker round, and eligible winner selection on the server.
- Lock the deck atomically when voting begins. Use database transactions/functions for operations where concurrent clients could otherwise produce inconsistent results.
- Enable RLS on all tables exposed through the Data API and test both allowed and denied cases.
- Minimize stored identity data. Do not collect exact venue/location or persistent personal identifiers unless a confirmed product requirement needs them.

## Proposed data model
These entities are conceptual until migrations are authored and reviewed:
- `rooms`: stable ID, normalized join code, category, phase, contribution mode, creator participant ID, timestamps, expiry, and round state.
- `participants`: room-scoped ID, role, guest completion state, and minimal session metadata.
- `cards`: room ID, submitter ID, category-specific fields, sort order, and timestamps.
- `voting_rounds`: room ID, round number, frozen eligible card IDs, status, and timestamps.
- `ballots`: room/round/participant IDs and submission timestamp.
- `ballot_responses`: ballot/card IDs and Yup/Nah response, with uniqueness constraints preventing duplicate responses.
- Optional `room_events`: only if a documented recovery/audit need justifies the added retention and privacy cost.

## Lifecycle and retention
The current product direction is to retain completed room data for 24 hours, then delete operational room data and retain only anonymous aggregate analytics that are explicitly approved. The eventual implementation must define what counts as anonymous, ensure analytics cannot be linked back to a room or person, and test the cleanup job. Do not implement permanent vote or participant history by default.

## Delivery sequence
1. Finalize identity/session and room-code threat model.
2. Author versioned SQL migrations, indexes, constraints, and RLS policies.
3. Implement database functions for joins, contribution edits, deck lock, ballot submission, tally, tie-breaker, and expiry.
4. Generate and commit typed database definitions.
5. Connect web clients using the public key and server-authoritative operations.
6. Test multi-client realtime behavior, authorization failures, concurrency, and cleanup.
7. Configure production secrets and deployment only after the security review.

## Official references
See [official documentation links](./references/README.md). Re-check current Supabase documentation before implementation because APIs and recommended key terminology can evolve.
