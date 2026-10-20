# User Journeys and Lifecycle

## Room contract

- One room represents one decision.
- Categories: `eat`, `watch`, `do`, `custom`.
- Creator and guests share the same deck and room phase.
- Joining requires a room code or QR scan from Home. QR encodes the code only; no deep links.
- Joining requires no signup, email, nickname, or app install. Do not show participant identities; show aggregate counts only.

## Host journey

1. Home → Create Room.
2. Select category; preset categories use a fixed icon. Custom lets the host set a title and choose an icon.
3. Set room title and contribution mode: host creates all cards, or guests contribute.
4. In guest-contribution mode, choose 1, 2, or 3 cards per guest. The host is also a contributor.
5. Build cards or wait for submissions. At least two cards are required to vote; maximum 100 cards per room.
6. Review the shared responsive card grid. Use the existing card editor for edits; remove/veto unwanted cards. Review remains live until voting starts.
7. Start voting. Freeze the deck atomically, announce the start, and use a brief synchronized countdown.
8. End voting normally or end early with a one-minute grace countdown. Resolve the result and any tie.
9. Show winner or tie result, then close the room. Retain the closed room for 24 hours, then delete its operational data.

## Guest journey

1. Home → Join Room → enter code or scan QR.
2. Show a short branded room intro, then open the current phase. Do not reveal the host's identity.
3. If contributions are enabled, submit up to the room's 1–3 card quota. Contributors can edit/delete their own cards until voting starts.
4. Use **I'm Done** at any time. Unused slots are skipped; they never become blank cards.
5. Wait while the host reviews or starts voting. New submissions/edits are accepted live through review until voting starts.
6. During voting, choose Yep or Nah for every eligible card, review the ballot, and confirm submission.
7. Wait for the outcome. A participant who joins after a round has started cannot vote in that round; wait for the next round or result.

## Live review and cutoff

- Accept submissions and edits in real time during host review until voting begins.
- Host review uses a responsive grid with edit/remove controls and the existing card editor with Save/Cancel.
- The host can start even if a contributor has unused slots or has not pressed I'm Done.
- If the host begins the cutoff while contributors are unfinished, show a one-minute grace countdown and notify them. Keep contribution open during the grace period; preserve the current deck and never create blank cards from unused slots.
- At voting start, atomically lock the deck and reject stale edits/submissions.

## Voting, reconnect, and resuming

- Voting start is synchronized across clients with a brief countdown.
- Voters can revisit cards and change responses before final confirmation. Submission is final for that round.
- Refresh/rejoin restores the authoritative room phase and the participant's current progress; do not create duplicate rooms or ballots.
- Late joiners wait until the next round or results and cannot change the active round's eligible deck.
- If the creator disconnects during voting or a tie-breaker, retain the room state. Reconnection within 10 minutes restores control. After 10 minutes, automatically resolve from submitted ballots; if no ballots were submitted, use the documented fallback for the active round.
- Show clear loading, offline, stale-room, expired-room, and retry states. Preserve drafts where safe.

## Phases

`setup` → `collecting` (optional) → `reviewing` → `voting` → `tie-breaker` (if needed) → `winner` or `tie-result` → `closed`.

Phase names are domain concepts; UI screens need not map one-to-one to phases.
