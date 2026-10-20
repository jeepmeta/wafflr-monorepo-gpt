# Screen Catalog

Screen names below describe intended product surfaces, not final route paths. Confirmed behavior is identified explicitly; unresolved behavior remains open. These screens are specifications, not claims that the features are implemented.

## Home

**Purpose:** explain Wafflr quickly and help users create or join a decision room.

**Confirmed empty state:** minimal branding and primary buttons. Keep the first-use path obvious rather than filling the screen with an empty-room dashboard.

**Other states:** loading, returning user, room creation failure, and navigation to Your Rooms. Exact route structure and whether Home itself lists recent rooms remain open.

## Your Rooms

**Purpose:** let a user find active rooms they created or joined.

**Confirmed list behavior:** show all active, unexpired rooms the user created or joined; count those rooms in the header pill; sort by most recently active. Each room card shows title, category, the user's role, current status, and time remaining.

**Confirmed empty state:** playful Butters illustration, friendly explanatory copy, and useful actions. This differs intentionally from the minimal Home empty state.

**Expired room:** explain that the room expired and its data will be deleted, then provide a route back Home. Exact retention duration and deletion timing remain open.

## Room Setup

**Purpose:** create one shared decision room and choose how cards will be contributed.

**Confirmed behavior:** the creator selects the category and chooses either to create all cards themselves or invite guests to contribute. When guest contributions are enabled, the creator contributes cards under the same rules as guests. The creator is a participant with only three additional powers: veto cards before voting, end voting early, and select the winner if a tie persists after the tie-breaker round.

If guest contributions are enabled, the creator chooses a quota of one, two, or three cards per guest. The room-wide maximum is 100 cards across everyone. The initial category is restaurants / where to eat. Validate inline and show “Creating room…” during room creation.

**Failure behavior:** show a friendly error, stay on Room Setup, offer Retry, preserve local card drafts, and retry syncing rather than discarding work.

**Open:** exact fields, title-editing rules, location/filter inputs, category roster, and whether setup includes other room preferences.

## Card contribution and final review

**Purpose:** let the creator and, when enabled, guests contribute options to the same shared deck.

**Confirmed behavior:** the creator may create all cards or invite guests to contribute. Guest contributors can edit/delete their own cards until voting starts. The creator can review the shared deck in a responsive grid, edit/remove cards, and veto cards before voting. Reuse the card editor/form with Save and Cancel.

The room-wide maximum is 100 cards across everyone. At 100/100, disable further submissions and show “Room full — 100/100 cards.” Voting requires at least two cards; keep Start Voting disabled below two. New submissions and edits are accepted in real time during review, and the creator may start voting without waiting for every guest to finish.

**Open:** precise empty-slot artwork, keyboard/drag accessibility details, validation fields, duplicate handling, and whether the host can save an incomplete draft between sessions.

## Build Deck / final host review

**Purpose:** let the host inspect the exact candidate set and ordering before voting.

**Confirmed transition:** the creator reviews the shared deck before voting in a responsive card grid.

**Permissions:** contributors can edit or remove their own cards during review. The creator can edit their own contributions and veto/remove any card from the shared deck, but cannot edit another contributor's card. Keep review actions simple; do not add broader room-management controls.

**Live behavior:** accept new submissions and edits in real time during review. The deck is not final until voting starts. Handle remote changes without silently overwriting unsaved edits.

**Voting boundary:** when the host starts voting, lock the active deck. The authoritative state layer must enforce the lock.

## Room lobby / invitation

**Purpose:** let the host invite people and see room status.

**Confirmed invitation paths:** share the room code and QR code together; guests join by entering the code or scanning the QR from Home. Do not use joining links. Show only the aggregate guest count, not participant identities or a participant list.

**Presence:** use a disconnect grace period so brief network interruptions do not immediately mark a participant as gone. The duration is open.

**Open:** exact lobby layout, whether collection activity is embedded here or shown separately, participant readiness indicators. Do not add participant moderation controls.

## Guest join and room preview

**Purpose:** get a guest into the correct room with minimal friction.

**Confirmed join flow:** have guests choose Join Room from Home, then enter the room code or scan its QR code. For an invalid or expired code, explain the problem in friendly language and offer Retry and Home.

**Identity:** do not ask for or display nicknames, and do not show a participant list. Only guest count is visible; no one, including the creator, can identify individual guests. An anonymous account ID is created in the background on first use, with independent counters per device and no signup/email or cross-device recovery.

**Capacity:** do not impose a fixed product-level participant limit. Operational safeguards may still be needed.

## Guest option submission

**Purpose:** allow guests to contribute candidate options within the host's quota.

**Confirmed controls:** the submission action is labeled “Add to Deck.” After submitting a card, a guest may add another while quota remains. Show one to three quota slots, marked empty, draft, or submitted.

**Editing:** contributors may edit or delete their own cards until voting starts. The creator may veto/remove cards from the shared deck before voting but does not edit other contributors' cards.

**Completion:** show “I’m Done.” Guests may finish with unused slots; unused slots are skipped and never converted into blank cards.

**Open:** exact required fields, duplicate detection, and whether a guest can reopen their submission step after choosing “I’m Done” but before voting starts.

## Guest waiting screen

**Purpose:** communicate that the guest has finished their current step and the room is waiting for the next phase.

**Confirmed:** this is a dedicated screen, not merely an inert or unexplained loading state.

**Open:** exact progress counts, participant-level visibility, Butters pose/animation, and whether guests can return to review their own submissions.

## Resume / re-entry

**Purpose:** restore an existing room without forcing the user to restart the flow.

**Confirmed host behavior:** restore the exact current phase, available controls, and progress. The creator's available controls are limited to pre-vote card veto, ending voting early, and final winner selection if the tie-breaker remains tied. Show brief, nonblocking catch-up while current shared state is synchronized.

**Recovery states:** loading, stale room, expired room, disconnected, and synchronization failure. Explain the next action instead of exposing technical stack traces.

## Voting deck

**Purpose:** provide the core card-based voting interaction for every participant.

**Confirmed interactions:** swipe right or tap Yup to approve; swipe left or tap Nah to reject. Participants must choose Yup or Nah for every card before submitting. They may revisit cards and change responses until Submit Votes; submitted ballots are final. After submitting, show “Votes submitted! Waiting for everyone else…” with Butters dancing and no participant identity/activity details.

**Integrity:** voters use the locked deck for the round. A late joiner after voting starts is view-only. The creator can end voting early at any time; only submitted ballots count.

## Vote-complete / waiting state

This is a recommended state, not yet a confirmed separate screen. It could tell a participant their ballot is complete while waiting for the group. Whether all voters must finish before results appear remains open.

## Results

**Purpose:** show the group outcome clearly without exposing private vote details.

**Confirmed behavior:** the highest submitted Yup count wins; Nah votes do not subtract. If voting ends with zero submitted ballots, the creator selects a winner from the available cards. A tie triggers one tie-breaker round with only the tied cards; if the tie persists, the creator selects the final winner from the tied cards displayed side by side.

The Winner screen displays only the winning card, Butters celebrating, and confetti. Do not show vote totals or losing-card details. The room closes after a short celebration; the Winner screen remains accessible for 24 hours after closure, then room and decision data are deleted.

## Tie-break round

One tie-breaker round contains only the cards tied for the highest Yup count. If the tie persists, the creator selects one of the tied cards displayed side by side. If the creator disconnects during the tie-breaker, the 10-minute timeout applies: resolve using submitted ballots, or randomly select from the tied cards if no tie-breaker ballots were submitted.

## Shared loading, error, and recovery states

Cover invalid/expired room codes, join failures, room-creation failure, connection loss, failed submissions, rejected edits, phase changes elsewhere, and attempts to vote on a stale deck. Explain what happened and the next available action. Preserve user-entered work whenever possible.

## Responsive design and accessibility

Use a mobile-first responsive layout. The host review grid must adapt to screen width. Provide visible focus, semantic labels, keyboard operation on web, readable contrast, and accessible alternatives to swipe and drag interactions. Do not rely on color, animation, or gestures alone. Respect reduced-motion preferences.

## State and navigation invariants

- Re-entry restores the room's authoritative current phase.
- Unused guest quota slots are not blank options.
- Contributor edit/delete permissions for their own cards end when voting starts.
- The creator may veto/remove cards before voting, but has no general administrator role.
- Host review may change in real time until voting starts.
- The voting deck is locked at the phase transition.
- A loading or catch-up indicator should not unnecessarily block an otherwise usable screen.
