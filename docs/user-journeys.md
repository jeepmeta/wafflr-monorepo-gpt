# User Journeys and Room Lifecycle

## Core rule: one shared game
A room is one shared decision workflow, not a live social space. Participants work independently and do not see who else has joined or finished. The creator is a participant first; creator powers are deliberately limited to three special game powers: veto cards before voting, end voting early if the game is stuck or delayed, and select a winner if a tie persists after the tie-breaker round. Advancing the collection workflow is a normal phase control, not participant moderation.

## High-level flow
Create room → choose whether to create all cards or invite contributions → collect and review cards → lock deck and vote → resolve any tie → show winner → close room.

The creator chooses one of two setup paths:
- **Create all cards:** the creator builds the deck and then opens voting.
- **Invite guests to create cards:** guests contribute under the same card-submission rules as the creator; the creator contributes cards too. The creator can veto cards during final review, but cannot otherwise manage participants.

## Shared room journey
**Create and join:** The creator creates a room. Guests join by entering the room code or scanning the QR code from the Home screen. Everyone shares one room state. The room represents one decision only.

**Collect cards:** The creator may choose to create the whole deck or allow guest submissions. When guest submissions are enabled, the creator is also a card contributor. Guests may join at different times and submit within the chosen per-person limit while collection remains open. Each person can submit their own cards, then sees a character waiting screen on their device; other people may still be working or may not have joined yet. No one sees individual progress. A room-wide cap of 100 cards applies across everyone. At 100/100, new submissions are disabled and the room shows “Room full — 100/100 cards.”

**Finish contributing:** Guests can press “I’m Done” even with unused slots; unused slots are skipped. After submitting or finishing, each person waits on their own device. The creator can advance to review at any time, even if invited guests have not joined or some joined guests have not submitted. Only successfully submitted cards enter the deck; unsent drafts are excluded. When the creator advances, collection closes.

**Review and veto:** The creator fetches the submitted deck and reviews it in a responsive grid. Contributors can edit or delete their own submitted cards while collection/review remains open; the creator does not edit other contributors' cards but can veto/remove cards. No live updates are needed; fetch the latest saved deck at review checkpoints. The creator can start voting at any time once at least two cards remain, even if guests have unused slots or have not pressed “I’m Done.”

**Start voting:** Starting voting locks the deck and closes submissions. The room announces the start, shows a brief synchronized countdown, and then all eligible participants enter the voting experience. A late joiner after voting starts is view-only.

**Vote:** Swipe right or tap “Yup” to approve; swipe left or tap “Nah” to reject. Participants must choose Yup or Nah for every card before submitting. They can revisit cards and change choices until pressing “Submit Votes.” After submission, the ballot is final. The waiting message is “Votes submitted! Waiting for everyone else…”

**Resolve results:** The card with the highest count of submitted Yup votes wins; Nah votes do not subtract from Yup votes. Only submitted ballots count. The creator may end voting at any time, including before submitting their own ballot. If zero ballots have been submitted, the creator selects a winner from the available cards. If multiple cards tie for the most Yup votes, run one tie-breaker round with only the tied cards. If the tie persists, the creator selects one of the tied cards side by side to declare the winner.

**Winner and closure:** Show only the winning card, Butters celebrating, and confetti; do not reveal vote totals or losing-card details. After a short celebration, the room closes automatically. The Winner screen remains available to anyone who opens the room for 24 hours after closure, then room and decision data are permanently deleted.

## Creator disconnect
The room continues with the original creator role retained. Guests can continue voting and submitting ballots, but only the creator can start or end phases when connected. Guests are not shown a creator-disconnect notice or countdown. If the creator reconnects within 10 minutes, control is restored immediately. After 10 minutes disconnected during voting or a tie-breaker, the phase ends automatically using submitted ballots; if none have been submitted, choose a random winner from the relevant available cards.

## Shared-state and integrity rules
- Every participant sees the same authoritative room phase and deck.
- The creator is not a general administrator; only the three powers listed above are special creator powers.
- Guests may join and submit cards until the creator advances from collection; advancing closes collection and excludes unsent drafts.
- Submissions are explicit and persisted; no real-time update stream is required.
- Starting voting atomically locks the active deck; stale clients cannot mutate it.
- There is no leave-room or delete-room action. Rooms close through the normal flow and are permanently deleted 24 hours after closure.
- Creator actions and participant submissions are persisted in the shared room record; clients fetch the latest data at workflow transitions.
- Re-entry restores the current phase, available controls, and progress rather than restarting the game.

## Conceptual phases
Setup → Collecting (if enabled) → Reviewing → Voting → Tie-breaker (only if needed) → Winner → Closed. A room is for one decision; there is no second decision in the same room.

## Navigation and recovery
Back, refresh, and rejoin must not create duplicate rooms or bypass the current phase. Show concise loading, disconnected, stale-room, and error states. Prefer preserving work and giving one clear recovery action over adding extra management steps.
