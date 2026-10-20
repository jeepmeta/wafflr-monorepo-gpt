# Decision Engine

## Contract

Implement domain policy in `packages/core`, independent of React, DOM, browser APIs, and Supabase. UI displays domain state; it does not decide permissions or winners.

## Categories and cards

- Category enum: `eat`, `watch`, `do`, `custom`.
- Category changes card fields/presentation only; all categories use the same room, contribution, voting, tally, and result rules.
- One room = one decision.
- Deck limits: 2–100 cards to vote; 100-card room maximum.
- Guest contribution quota: 1, 2, or 3 cards per guest; host contributes under the same rules in guest-contribution mode.
- Unused slots are skipped, never blank cards.
- Contributors may edit/remove their own cards before voting. Host review is live; host may veto/remove cards before voting. Deck locks at voting start.

## Room phases

`setup` → `collecting` (optional) → `reviewing` → `voting` → `tie-breaker` (optional) → `winner` or `tie-result` → `closed`.

Reject invalid phase transitions. The authoritative layer must enforce the same rules as the UI.

## Voting semantics

- UI labels: **Yep** = approve; **Nah** = reject. Right swipe/Yep and left swipe/Nah must be equivalent.
- Every eligible card requires one Yep/Nah response; no skipping.
- A voter may revisit the deck and change choices before confirming submission. Only confirmation finalizes the ballot.
- One submitted ballot per participant per round. Repeated requests must be idempotent or rejected without duplicating votes.
- Tally only submitted ballots. Count Yep approvals; Nah does not subtract.
- Participants who join after a round starts cannot vote in that round.
- Host may end voting early. Use a one-minute grace countdown; resolve only from submitted ballots.
- If no ballots are submitted when voting ends, host chooses a winner from eligible cards.
- Otherwise, a unique highest Yep count wins. If tied, host may start one tie-breaker round with only the tied cards, choose a tied card, or leave the outcome tied.
- Tie-breaker uses the same voting rules. If it remains tied, host chooses the final winner or leaves it tied.
- Preserve actual round totals when a host-selected winner resolves a tie. Never rewrite the tally to imply a clear vote majority.

## Creator disconnect and retention

- Host-only powers: veto/remove cards before voting, start voting, end voting early, and resolve a tie as documented. The host is not a general participant administrator.
- If the host reconnects within 10 minutes, restore control. After 10 minutes disconnected during voting/tie-breaker, resolve from submitted ballots; if none exist, choose randomly from the eligible cards for that round.
- Winner view is available for 24 hours after closure; then operational room data is deleted.

## Required tests

Minimum/maximum deck; per-guest quota; unused slots; own-card permissions; host veto; live review; stale edits after lock; synchronized start; incomplete ballot; change-before-confirm and immutable-after-submit; duplicate submission; Yep tally; early end; zero-ballot fallback; ties; single tie-breaker; host tie resolution; disconnect timeout; rejoin; retention cleanup; concurrent requests.

## Open decisions

- Exact room-code alphabet/length and rate-limit thresholds.
- Final category-specific card fields and validation.
- Whether an initial tie always prompts host choice or presents tie-break/choose/leave options in a specific order.
- Exact cutoff timing for unfinished contributions, apart from the approved one-minute grace behavior.
- Exact fallback UX for expired rooms and unavailable host.
