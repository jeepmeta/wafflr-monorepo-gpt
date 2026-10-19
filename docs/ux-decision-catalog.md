# UX Decision Catalog

This catalog records explicit UX selections made during the pre-implementation design sessions. It is intentionally separate from implementation status: a confirmed decision describes intended behavior, not a claim that the behavior is already coded.

## Scope and recordkeeping

Decisions 19–32 are reproduced here from the available project record. The source context available for this documentation pass did not contain the exact selections for Decisions 1–18, so those are not reconstructed or guessed. Recover and append them when their original records are available.

## Decision 19 — Empty and expired-room states

- **Home with no rooms:** keep the page minimal, with branding and primary buttons.
- **Your Rooms with no rooms:** show a playful Butters illustration, explanatory copy, and useful actions.
- **Expired room:** explain that the room has expired and its data will be deleted, then provide a path back Home.

## Decision 20 — Room-creation failure

When room creation fails, show a friendly error and keep the user on Room Setup with a Retry action. Preserve local card drafts and retry syncing rather than discarding the user's work.

## Decision 21 — Resume an existing room

When a host resumes a room, restore the exact current phase, host controls, and progress. Show any catch-up/synchronization state briefly and non-blockingly; do not force the host through the flow from the beginning.

## Decision 22 — Participant presence

Show aggregate participant counts rather than exposing unnecessary participant-level connection detail. Use a disconnect grace period so a brief network interruption does not immediately treat a participant as gone. The exact duration remains to be specified.

## Decision 23 — Invalid room codes and join preview

- For an invalid or expired code, explain the problem in friendly language and offer Retry and Home.
- Show a branded room preview before asking the guest for a nickname.
- Do not impose a fixed product-level participant limit. Operational capacity and abuse controls still need technical design.

## Decision 24 — Anonymous participant identity

Provide an editable, randomly generated nickname. If a nickname is duplicated, add a suffix to distinguish it. Use a persistent anonymous device token to help recognize the same guest on that device. Privacy, token reset, and cross-device behavior need explicit design before production.

## Decision 25 — Room Setup layout and submission quota

Use a vertical Room Setup layout. Deck/category choices are selectable cards. Let the host choose a guest submission quota of one, two, or three cards, defaulting to three.

## Decision 26 — Creation form feedback

Use the category's default title. Validate fields inline. During room creation, show the loading label “Creating room…” so the host knows the action is in progress and can avoid accidental repeat submissions.

## Decision 27 — Host card-entry layout

Show all twenty-five card slots in a five-by-five grid. Keep the card-entry form fixed at the bottom. Clear the form after a successful add so the host can quickly enter another card.

## Decision 28 — Host card editing and capacity

Tap a card to edit it. Confirm before deleting a card. Images are optional. At twenty-five out of twenty-five cards, disable further additions and make the capacity state clear.

## Decision 29 — Minimum deck and final review

- Require at least three cards before the host can build the deck; disable Build Deck below three.
- Build Deck opens a final review containing all cards, with Edit Deck and Confirm & Build actions.
- Allow the host to drag cards to reorder them before voting.

## Decision 30 — Guest card submission

- The submission action is labeled “Add to Deck.”
- After submitting a card, the guest can add another while their quota remains.
- Show one to three quota slots, each marked as empty, draft, or submitted.
- Guests may edit or delete their submitted cards until the host starts voting.

## Decision 31 — Guest completion and waiting

- Provide an “I’m Done” button.
- Guests can finish even if they have unused submission slots; unused slots are skipped and do not become blank cards.
- Provide a dedicated guest waiting screen.

## Decision 32 — Final deck review and live changes (clarified by the shared-room principle)

- Use a responsive card grid for final review.
- Contributors can edit or remove their own cards before voting starts. The creator can edit their own cards and veto/remove any card from the shared deck, but cannot edit other contributors' cards.
- Continue accepting new submissions and edits in real time during review.
- Lock the deck when voting starts. The lock must be enforced by the authoritative state layer, not only by hiding UI controls.
- The creator's only additional powers beyond normal participation are pre-vote veto, ending voting early, and final winner selection if the tie-breaker remains tied.

## Decisions 33–79 — Shared-room and voting rules

The following decisions were confirmed after Decision 32. They supersede earlier conflicting descriptions in this catalog and related documents.

### Product principle and creator role

- One room is one shared game for one decision. Everyone sees the same cards and current phase.
- The creator may create all cards or invite guests to contribute. When guest contributions are enabled, the creator participates as a card contributor under the same contribution rules as guests.
- The creator has exactly three additional powers: veto cards before voting starts, end voting early if the game is stuck or someone is taking too long, and choose the winner if the tie-breaker round remains tied. Do not expand this into general host administration.

### Card contribution and review

- The creator selects a per-guest contribution quota of one, two, or three cards.
- The room-wide maximum is 100 cards across everyone. At 100/100, disable new submissions and show “Room full — 100/100 cards.” The creator can still review and veto/remove cards, and start voting if at least two remain.
- Guests can edit/delete their own cards until voting starts. The creator can veto/remove cards from the shared deck during final review. When guest contribution is enabled, the creator does not edit other contributors' cards; their extra power is veto only.
- Guests can press “I’m Done” with unused slots; unused slots are skipped. This does not prevent the creator from starting voting.
- New submissions and edits are accepted live during review. The creator can start voting at any time once at least two cards exist, even if guests have not finished contributing. Starting voting locks the deck and closes submissions.
- If fewer than two cards remain, voting stays disabled until another card is added.

### Shared voting and outcome

- Voting starts with a brief synchronized countdown.
- Swipe right or tap “Yup” approves; swipe left or tap “Nah” rejects. Every card requires a Yup/Nah response before a ballot can be submitted. Responses can be changed until “Submit Votes”; then the ballot is final.
- Highest submitted Yup count wins; Nah votes do not subtract. Only submitted ballots count.
- The creator can end voting at any time, including before submitting their own ballot. If no ballots have been submitted, the creator selects a winner from the available cards.
- A tie triggers one tie-breaker round with only tied cards. If the tie persists, the creator selects a winner from the tied cards displayed side by side.
- After submitting, show Butters dancing and “Votes submitted! Waiting for everyone else…” without participant identities or activity.
- Winner screen shows only the winning card, Butters celebrating, and confetti. Do not show vote totals or losing-card details. After a short celebration, close the room; keep the Winner screen available for 24 hours after closure, then permanently delete room and decision data.

### Late joins and creator disconnect

- Guests who join after voting starts are view-only and see the current game state, or the Winner screen if the game has finished.
- If the creator disconnects, the room continues and the original creator role remains. Guests can continue voting/submitting; creator-only phase controls become available when the creator returns. Guests see no disconnect notice or countdown.
- Reconnection within 10 minutes restores creator control immediately.
- If the creator stays disconnected for 10 minutes during voting or a tie-breaker, automatically resolve using submitted ballots. If no ballots have been submitted, randomly select a winner from the relevant available cards.

### Room privacy and lifecycle

- No nicknames or participant list. Show guest count only; no one, including the creator, can identify individual participants.
- Guests join by entering a room code or scanning a QR code from Home; no joining links.
- Each room represents one decision only.
- The room closes automatically after the winner celebration and expires 24 hours after closure. Then room, cards, and individual decision data are permanently deleted.
- An anonymous account ID is created in the background on first use, with no signup or email. Each device has its own ID and independent counters; no recovery or linking across devices. The participation counter increments on successful room join, even if the user leaves before voting.

## Cross-document consequences

Keep product vision, journeys, screen catalog, decision engine, and architecture aligned with this shared-room principle. Older entries above that describe host-only card creation, a three-card minimum, twenty-five total host cards as the room cap, participant nicknames, joining links, general host editing of guests' cards, or a general host-admin role are superseded by the decisions in this section. The creator's three additional powers are exhaustive; avoid adding management mechanics or asking the user to decide routine edge cases.

## Future decision entry template

**Decision ID and date:**  
**Question:**  
**Decision:**  
**Reason / trade-off:**  
**Affected docs and screens:**  
**Tests or acceptance criteria:**  
**Status:** Confirmed / Proposed / Superseded
