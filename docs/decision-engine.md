# Decision Engine

## Responsibility
The engine turns candidate options and participant responses into an understandable outcome. It should be platform-neutral and live in the shared core package, not inside React components or browser-only modules. For a given locked deck and vote set, its result should be deterministic.

## Concepts
- Decision room: shared activity and lifecycle phase.
- Category: defines option fields and card presentation.
- Option/card: candidate choice; for restaurants, a place to eat.
- Deck: active set and order of options for a round.
- Participant: host or guest; exact identity model remains open.
- Vote/response: a participant’s answer to an option.
- Round: one pass of voting; a tie may cause another round.

## Deck creation and curation
Options can come from participant submissions and potentially category-specific discovery sources. Integrations are not selected. Before voting, the host reviews a responsive grid and can edit or remove options. New submissions and edits remain accepted during review. Starting voting locks the active deck.

The authoritative domain/server layer must enforce the phase boundary. Once voting begins, edits and submissions must not silently change the active deck. Any future correction flow should deliberately restart or amend a round instead of mutating it behind voters.

## Confirmed interaction rules
- Swipe right = yes / keep this option.
- Swipe left = no / reject this option.
- Guests can press “I’m Done” with unused submission slots; unused slots are skipped.
- Host review uses a responsive grid with edit and remove controls.
- Editing reuses the existing card editor/form with Save or Cancel.
- New submissions and edits are accepted in real time until voting starts.
- Starting voting locks the deck.
- Ties may trigger another round.

## Winner algorithm is still open
The meaning of each swipe is known, but the precise winner algorithm is not. Do not assume “most right swipes wins” is final until explicitly decided. Approval tally, elimination, pairwise preference, and other methods can produce different results. The chosen rule must be easy to explain and must match the result screen.

Decide before implementing final tally: whether everyone votes on every option; whether skipping is allowed; whether one response per participant/option is enforced; whether a vote can change; whether votes are private; how incomplete ballots affect eligibility; what happens if every option is rejected or none gets a yes; whether option order is shuffled; and what counts as a completed ballot.

## Tie policy
A tie may trigger another round. Define the tie condition, whether only tied options return, whether everyone votes again, maximum additional rounds, and what happens if a tie persists. Until decided, represent a tie honestly rather than selecting a winner arbitrarily.

## Suggested domain operations
These are design concepts, not finalized function names: validate an option for a category; add/update/remove an option while editable; freeze a deck snapshot; validate and record a response; determine ballot completion; tally a round under the selected policy; detect ties; return an explainable result object.

Keep domain rules separate from persistence, real-time transport, identity, and UI. Use stable option and participant identifiers, not array position.

## Concurrency and integrity
Starting voting should atomically freeze the active deck and change the room phase. A late submission or edit must be rejected or handled only by a future explicitly defined flow. Account for duplicate submissions, repeated taps, reconnects, duplicate vote delivery, simultaneous host actions, and clients that have stale room state.

## Test cases
Prepare tests for empty and one-option decks, duplicate options, pre-lock edits/removals, rejected post-lock changes, unused submission slots, repeated “I’m Done”, incomplete ballots, duplicate votes, reconnects, ties, all-negative ballots, and concurrent phase changes. Exact expected outcomes depend on unresolved policy choices.