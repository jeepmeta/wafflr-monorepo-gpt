# Backend Plan

**Status:** Six versioned migrations are committed and have passed a clean local Supabase migration run in GitHub Actions. All 26 pgTAP assertions pass, and the web token/typecheck/build job passes. No hosted Supabase project is connected yet. Rate limiting, scheduled cleanup/fallback execution, realtime authorization, and web integration remain unimplemented.

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
- `20261020193000_result_resolution_rpcs.sql` adds early-end grace, server-derived tallies, winner/tie resolution, one tie-breaker round, host-selected winners, unresolved-tie closure, result retrieval, and room closure with a 24-hour expiry timestamp.
- `20261020194000_contribution_and_lifecycle_rpcs.sql` adds `finish_contribution`, participant heartbeat, and a batch expiry-deletion function callable only by `service_role`.
- `20261020195000_host_disconnect_fallback.sql` adds a `service_role`-only operation to resolve rooms whose host heartbeat is stale by more than ten minutes, using submitted ballots or a random eligible card if there are no ballots.
- `supabase/tests/room_entry_and_voting.test.sql` covers schema presence, function/table privileges, snapshot identity, deck lock, complete ballot submission, and duplicate ballot rejection. `supabase/tests/result_resolution.test.sql` covers tie detection, tie-breaker flow, winner retrieval, and room closure. `supabase/tests/host_disconnect_fallback.test.sql` covers the zero-ballot fallback.

The room code is currently 12 characters from a 32-symbol ambiguity-reduced alphabet (60 bits of entropy) and is case-normalized. This is a temporary concrete choice, not a final UX decision.

**Important limitations before public launch:**

- The migrations have been applied successfully to a disposable local Supabase stack in CI, and all current pgTAP tests pass. This validates the current test coverage, not production readiness; continue expanding authorization, concurrency, lifecycle, and abuse-control tests.
- Creation/join RPCs do not yet implement request rate limits, abuse controls, or a robust per-client creation throttle. Add those before public exposure; room codes are not secrets that replace rate limiting.
- `finish_contribution` and the trusted stale-host/cleanup functions exist, but they are not scheduled or connected to the web app. The client must call `heartbeat_participant` regularly before the ten-minute fallback is scheduled; otherwise an active host could appear disconnected. A trusted worker/cron job must call `resolve_stale_host_rooms` and `delete_expired_rooms`.
- There are no room-scoped realtime authorization policies yet. Direct table access remains revoked; do not connect the browser to the tables or assume realtime synchronization works.
- The snapshot returns the room's cards after participant-secret verification. It does not expose ballots or vote totals.
- Secrets are returned only once. Client-side persistence/recovery and token rotation/revocation still need a defined implementation.

## Local database verification

The repository now includes `supabase/config.toml` and a dedicated `database-tests` job in `.github/workflows/ci.yml`. On pushes to `main` and pull requests, CI starts a disposable local Supabase stack, applies the migrations from a clean database, and runs the pgTAP files under `supabase/tests/`.

To run the same checks locally, install Docker and the Supabase CLI, then run:

```sh
supabase start -x studio,inbucket,edge-runtime,logflare,vector
supabase db reset --local
supabase test db --local
supabase stop
```

The successful CI run is recorded at [GitHub Actions](https://github.com/jeepmeta/wafflr-monorepo-gpt/actions/runs/39488394549). The existing web build job and database job validate separate parts of the repository; neither implies that realtime or browser integration is complete.

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

1. Expand database tests for invalid identities, host-only operations, phase transitions, and denied access paths.
2. Implement and test rate limiting/abuse controls and participant secret lifecycle before public exposure.
3. Define the browser-side room credential persistence/recovery model and implement the typed RPC client using only the public URL and publishable/anon key.
4. Add narrowly scoped realtime access and tests for allowed/denied room access before enabling browser subscriptions.
5. Connect the web client to create/join/snapshot/card/vote/result RPCs, keeping the local prototype usable when backend configuration is absent.
6. Schedule host fallback and expired-room cleanup only after the client heartbeat flow is connected.
7. Test multi-client realtime, RLS denials, concurrency, reconnects, idempotency, and deletion; configure a hosted project only after security review and explicit project authorization.

See [official technical references](./references/README.md).
