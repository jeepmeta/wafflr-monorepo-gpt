# Decision Engine

## Responsibility
The engine turns one shared room, a locked deck, and submitted ballots into a clear outcome. Keep it platform-neutral in the shared core package. UI components should display domain state, not independently decide permissions or winners.

## Concepts
- **Room:** the shared state for one decision.
- **Card:** one candidate choice.
- **Deck:** the shared collection of cards for the decision.
- **Participant:** anyone in the room, including its creator.
- **Creator:** the participant who opened the room, with three extra powers only: veto cards before voting, end voting early, and choose a winner if the tie-breaker round remains tied.
- **Ballot:** one participant’s final set of Yup/Nah responses.
- **Round:** the initial vote or the single tie-breaker round.

## Room workflow and permissions
A room is created only after the creator confirms creation. It receives a room code and QR code and persists until its lifecycle ends. The creator chooses exactly one card-creation mode: creator-only, or guest contributions. In guest-contribution mode, the creator contributes under the same card quota as guests.

This is not a multiplayer or social room. There is no chat, participant activity feed, visible participant identity, or presence. Contributors work independently and submit cards; the creator fetches the submitted deck for review. Participants submit ballots independently after voting begins. Data is shared through persisted room records and explicit API operations, not continuous real-time synchronization.

The creator is not a general administrator. Their extra powers are limited to pre-vote card veto, early end of voting, and final selection after a persistent tie. The creator does not edit other contributors' cards.

## Deck creation and review
- The creator may build all cards themselves or enable guest contributions.
- The room-wide maximum is 100 cards across creator and guests. At 100/100, disable further submissions and show “Room full — 100/100 cards.”
- Contributors can edit or delete their own cards until voting starts. The creator can veto/remove cards from the shared deck during final review, but does not edit other contributors' cards.
- Submissions and edits are persisted when contributors explicitly save them. The creator refreshes or fetches the deck to review the latest submitted version; no live update stream is required.
- Collection remains open to late joiners until the creator advances the room. Each contributor's submitted/done state and waiting animation are local to their own client; other participants cannot see who has joined, submitted, or is still working.
- The creator can advance to review even if invited guests have not joined or some joined guests have not submitted. Unsubmitted drafts are excluded from the deck; only successfully submitted cards are eligible for review.
- Once the creator advances out of collection, new card contributions are closed. Anyone who joins after voting begins is view-only under the existing late-join rule.
- There is no leave-room or delete-room action. Rooms close through the normal decision flow and their data is deleted after the 24-hour post-closure retention period.
- At least two cards are required to start voting. If fewer than two remain, keep Start Voting disabled until another card is added.
- Starting voting atomically locks the deck and closes submissions.

## Confirmed voting and winner rules
- Swipe right or tap **Yup** to approve; swipe left or tap **Nah** to reject.
- Participants must choose Yup or Nah for every card before submitting; no card-level skipping.
- Participants can revisit cards and change responses until they press **Submit Votes**. A submitted ballot is final.
- The highest count of submitted Yup votes wins. Nah votes do not subtract from Yup votes. Only submitted ballots count.
- The creator may end voting at any time, including before submitting their own ballot.
- If voting ends with zero submitted ballots, the creator chooses a winner from the available cards.
- If multiple cards tie for the most Yup votes, run one tie-breaker round with only those tied cards. If they remain tied, the creator selects the final winner from the tied cards.
- If the creator disconnects during voting or a tie-breaker, the room continues. After 10 minutes disconnected, automatically resolve using submitted ballots; if none have been submitted, randomly choose a winner from the relevant available cards. Reconnection before timeout restores creator control immediately.

## Outcome and privacy
The Winner screen displays only the winning card, Butters celebrating, and confetti. Do not display vote totals or losing-card details. The room closes after the short celebration; its Winner screen remains accessible for 24 hours after closure, then room and decision data are deleted.

## Domain operations
Implement platform-neutral operations for adding/updating/removing cards while the deck is editable, freezing the deck at voting start, validating ballots, tallying submitted Yup responses, detecting ties, managing the one tie-breaker round, applying creator actions, and resolving creator-disconnect timeout. Keep persistence and real-time transport separate from domain rules.

## Persistence and integrity
- Enforce permissions and phase boundaries in the authoritative state layer, not just by hiding UI controls.
- Starting voting must atomically freeze the deck and close submissions.
- Reject post-lock edits and submissions.
- Each client loads persisted state when entering a workflow step or returning to a room; clients do not need to remain connected to each other.
- Make submissions safe to retry and prevent duplicate ballots, invalid phase transitions, and multiple winners.

## Test cases
Cover minimum deck size, the 100-card cap, live review edits/submissions, card veto, deck lock, complete/changeable-until-submitted ballots, Yup tally, early end with submitted ballots, zero-ballot creator selection, one tie-breaker, persistent-tie creator selection, creator disconnect/reconnect, 10-minute automatic resolution, and consistent winner state across clients.

## Minimal card schema and deduplication

The user-facing card form has exactly two fields: `title` and `type`. For “Where to eat?”, an example is `title: "Bob’s Pizza"` and `type: "Pizza"`. The room-level decision category selects the client template and type options. Templates own presentation; the backend stores choice data and necessary system metadata, not visual layout or animation state.

When the creator closes collection, fetch the submitted deck and present it alphabetically in a quick carousel/review flow. The creator can remove duplicates and joke or unsuitable entries before voting. Keep duplicate submissions separate by default; do not automatically merge them. This manual review prevents identical choices from needlessly producing a tie-breaker while preserving the ability to distinguish similarly named places. Collection closes when the creator advances, not when every invitee finishes.

