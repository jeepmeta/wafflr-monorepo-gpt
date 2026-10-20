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

## Shared room and permissions

All participants operate on the same room and authoritative phase. If the creator enables guest card creation, the creator contributes cards under the same rules as guests. The creator is not a general administrator. Their extra powers are limited to pre-vote card veto, early end of voting, and final selection after a persistent tie. The creator does not edit other contributors' cards.

## Deck creation and review

- The creator may build all cards themselves or enable guest contributions.
- The room-wide maximum is 100 cards across creator and guests. At 100/100, disable further submissions and show “Room full — 100/100 cards.”
- Contributors can edit or delete their own cards until voting starts. The creator can veto/remove cards from the shared deck during final review, but does not edit other contributors' cards.
- New submissions and edits remain live during review until voting starts.
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

## Concurrency and integrity

- Enforce permissions and phase boundaries in the authoritative state layer, not just by hiding UI controls.
- Starting voting must atomically freeze the deck and close submissions.
- Reject stale post-lock edits/submissions.
- Keep all clients aligned to the same phase and deck after reconnect or refresh.
- Ensure repeat taps, duplicate deliveries, simultaneous phase changes, and reconnects cannot create inconsistent ballots or multiple winners.

## Test cases

Cover minimum deck size, the 100-card cap, live review edits/submissions, card veto, deck lock, complete/changeable-until-submitted ballots, Yup tally, early end with submitted ballots, zero-ballot creator selection, one tie-breaker, persistent-tie creator selection, creator disconnect/reconnect, 10-minute automatic resolution, and consistent winner state across clients.
