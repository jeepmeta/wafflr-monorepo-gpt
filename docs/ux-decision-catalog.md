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

## Decision 32 — Host final deck review and live changes

- Use a responsive card grid for the host's final deck review, with edit and remove controls.
- Reuse the existing card editor/form for review edits, with Save and Cancel.
- Continue accepting new submissions and edits in real time during review.
- Lock the deck when voting starts. The lock must be enforced by the authoritative state layer, not only by hiding UI controls.

## Cross-document consequences

These decisions affect the user journeys, screen catalog, decision engine, and architecture documents. Keep those documents aligned when behavior changes. In particular, distinguish the host's twenty-five-card authoring grid from the guest's one-to-three-card quota, and distinguish the pre-vote editable phase from the immutable voting deck.

## Future decision entry template

**Decision ID and date:**  
**Question:**  
**Decision:**  
**Reason / trade-off:**  
**Affected docs and screens:**  
**Tests or acceptance criteria:**  
**Status:** Confirmed / Proposed / Superseded
