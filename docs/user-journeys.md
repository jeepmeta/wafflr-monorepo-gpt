# User Journeys and Room Lifecycle

## High-level flow
Create decision → invite/join → collect options → host reviews deck → vote → results.

The room is shared state, not a set of unrelated local screens. Every participant should see the current phase, including after refresh or rejoining. Persistence and reconnection details remain to be designed.

## Host journey
**Create:** The host starts a decision and selects the category. Restaurants / where to eat is the initial use case. Exact creation fields are not all finalized.

**Invite:** The host gets a shareable room link and QR code.

**Collect:** The host monitors the room while guests join and submit candidate options.

**Review:** The host sees a responsive card grid with edit and remove controls. Editing reuses the existing card editor/form and offers Save or Cancel. New submissions and edits are accepted in real time throughout review.

**Start voting:** Starting voting locks the deck. The active set must not change underneath voters.

**Results:** The host sees the group outcome. A tie may trigger another round; exact tally and tie mechanics remain open.

## Guest journey
**Join:** A guest opens the link or scans the QR code. Whether a name or account is required is undecided.

**Contribute:** Guests submit one or more options through a category-aware form.

**Finish:** Guests have an “I’m Done” button. They may finish with unused submission slots; unused slots are skipped, not converted into blank options.

**Wait:** A guest waiting screen communicates that the room is waiting for the next phase.

**Vote:** The card-deck interaction uses swipe right = yes/keep and swipe left = no/reject. Accessible non-swipe controls should produce the same response.

**Results:** Guests should understand the outcome. Replay and post-result actions remain open.

## Live review and lock boundary
During collection and review, new submissions and edits are accepted and reflected in real time. The host can edit or remove options. When voting starts, the deck is locked. The authoritative state layer must enforce this rule; hiding controls in the UI alone is insufficient.

The implementation must decide how concurrent changes are ordered and how clients learn that the phase changed. If a remote update affects a card currently being edited, do not silently overwrite unsaved edits; conflict behavior needs a product/technical decision.

## Conceptual phases
These labels are suggested vocabulary, not finalized API contracts:
- Setup: host configures the decision.
- Collecting: guests join and submit options.
- Reviewing: host curates the deck while incoming contributions remain accepted.
- Voting: the active deck is locked.
- Results: tally and outcome are displayed.
- Closed: optional terminal state; existence is undecided.

## Navigation and recovery
Back, refresh, and rejoin should not create duplicate rooms or bypass the current phase. Include explicit loading, disconnected, stale-room, and error states. Errors should explain whether to retry, edit, or ask the host for help.