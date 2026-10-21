# User Journeys and Lifecycle

This document defines the creator and guest journeys by naming the Screen Catalog surfaces used at each step. A screen can appear in more than one step when its state or role differs. Conditional steps are included so secondary screens and recovery paths are not lost behind the happy path.

## Room contract

- One room represents one group decision.
- Categories: eat (Where to Eat), watch (What to Watch), do (What to Do), and custom.
- The creator is also a participant and may contribute cards and vote.
- Guests join with a room code or QR scan; no signup, email, nickname, or app install is required.
- Do not reveal participant identities or individual ballots. Show aggregate progress and tallies only.
- The deck remains live during collection and host review. Starting voting locks the deck atomically.
- A room needs 2–100 cards to start voting. Guest quota mode permits 1, 2, or 3 cards per guest; unused slots are skipped, never represented as blank cards.

## Creator journey

| Step | Screen(s) | Creator action and expected outcome |
|---|---|---|
| 1. Start | **S01 Home** | Choose Create Room. If returning to an existing room, use **S20 Your Rooms** to reopen an active or completed room instead. |
| 2. Choose decision | **S02 Category picker** | Select Where to Eat, What to Watch, What to Do, or Custom. |
| 3. Name the room | **S03 Room title/icon** | Set the room title and review the preset icon; for Custom, choose a title and icon. Validation errors stay on this screen and preserve entered values. |
| 4. Choose contributions | **S04 Contribution mode** | Choose Host creates all cards or Guests contribute. In guest-contribution mode, set a quota of 1, 2, or 3 cards per guest. |
| 5. Build the host's cards | **S05 Host card builder** | Add, edit, and remove the creator's cards. Show draft/validation feedback, quota or room-cap feedback, and a clear next action. The creator may continue building or invite guests. |
| 6. Invite participants | **S22 Share Room** | Share or copy the room code and display the QR code for guests to scan. If sharing/copying fails, retain the code and offer a retry or manual-copy fallback. |
| 7. Collect submissions | **S09 Host waiting** | See aggregate contribution progress and whether contributors are unfinished. In host-only mode, continue adding cards in **S05 Host card builder**. In guest-contribution mode, wait for submissions while retaining the ability to return to the room's host controls. |
| 8. Handle unfinished contributions (conditional) | **S11 Contribution cutoff**, then **S09 Host waiting** | If the creator initiates a cutoff while contributors are unfinished, announce the one-minute grace period. Keep contribution open during grace; then refresh aggregate progress. Unused slots are skipped. |
| 9. Review the live deck | **S10 Host final review** | Review the shared responsive card grid, edit cards through the existing card editor, and remove unwanted cards. Submissions and edits remain live until voting starts. If fewer than two cards remain, return to **S05 Host card builder** or continue review; voting cannot start yet. Respect the 100-card limit. |
| 10. Lock and start voting | **S10 Host final review** → **S12 Voting deck** | Start voting after confirmation. Lock the current deck atomically, reject stale edits/submissions, announce the synchronized start, and show a brief countdown before voting. |
| 11. Cast creator ballot | **S12 Voting deck** → **S13 Ballot review** → **S14 Vote progress** | Mark every eligible card Yep or Nah, review the complete ballot, change choices if needed, and confirm once. Submission is final for that round. |
| 12. Wait for resolution | **S14 Vote progress** | Show submitted/waiting status using aggregate counts only. The creator may end voting early if allowed; display the one-minute grace countdown and explain when ballots stop being accepted. |
| 13. Resolve a tie (conditional) | **S18 Tie result/resolution** → **S15 Tie-break intro** → **S16 Tie-break voting** → **S13 Ballot review** → **S14 Vote progress** | If the round ties, choose another round among tied cards or use an available host resolution option. A new tie-break round has its own intro and ballot. If the tie is left unresolved, show **S18 Tie result/resolution** as the final state. |
| 14. See the outcome | **S17 Winner result** or **S18 Tie result/resolution**; optionally **S19 All tallies** | Show the winning card and celebration, or the unresolved tie state. The creator may open the ranked aggregate Yep totals in All tallies. Never expose individual ballots. |
| 15. Close and revisit | **S17 Winner result** or **S18 Tie result/resolution** → **S20 Your Rooms** | Close the room when ready. Closed-room data is retained for 24 hours, then operational data is deleted. Reopening a completed room is read-only. |

## Guest journey

| Step | Screen(s) | Guest action and expected outcome |
|---|---|---|
| 1. Start | **S01 Home** | Choose Join Room. A guest returning to a room may use **S20 Your Rooms** to reopen it if the room is still available. |
| 2. Join by code | **S21 Join Room** | Enter the room code and submit. Show validation, loading, expired-room, and retry states without losing the entered code. |
| 3. Join by QR (conditional) | **S23 QR scanner** → **S21 Join Room** | Grant camera permission and scan a room QR code. On success, fill the join field and continue joining; on denied permission or scan failure, offer manual code entry in Join Room. |
| 4. Handle join failure (conditional) | **S24 Shared error/recovery** → **S21 Join Room** | For invalid/expired code, offline state, denied action, or stale state, explain the problem and offer one clear next action. Preserve safe drafts and allow retry where appropriate. |
| 5. Enter the room | **S07 Room intro** | Show a brief branded transition after joining, then route to the current authoritative room phase. If the room cannot be loaded, use **S24 Shared error/recovery**. |
| 6. Contribute cards (conditional) | **S06 Guest contribution** | When guests contribute, add cards within the room's 1–3 card quota. Edit or delete only the guest's own cards while the deck is open. Show empty, draft, submitted, quota-full, and room-full states. |
| 7. Finish contributing | **S06 Guest contribution** → **S08 Guest waiting** | Use I'm Done at any time. Skip unused quota slots rather than creating blank cards. Wait for the host to review/start voting. If no guest contributions are enabled, go directly to Guest waiting. |
| 8. Wait through collection/review | **S08 Guest waiting** | See a clear explanation of the current phase without host-only controls. The deck may still change during host review. If the host starts a cutoff, show **S11 Contribution cutoff** with the grace countdown and return to waiting when it ends. |
| 9. Vote | **S12 Voting deck** → **S13 Ballot review** → **S14 Vote progress** | Vote Yep or Nah on every eligible card, using swipe or accessible buttons. Review the full ballot and confirm submission. If the guest leaves before confirmation, preserve safe progress; after submission, the ballot is final for that round. |
| 10. Wait for group completion | **S14 Vote progress** | Show whether the guest's ballot is submitted and whether the group is still waiting. Do not expose who has or has not voted. If the host ends voting early, show the grace countdown and deadline clearly. |
| 11. Handle tie-break (conditional) | **S15 Tie-break intro** → **S16 Tie-break voting** → **S13 Ballot review** → **S14 Vote progress** | If the first round ties and the host starts another round, vote only on the tied cards. If the host leaves the tie unresolved, continue to the tie result instead. |
| 12. See outcome | **S17 Winner result** or **S18 Tie result/resolution**; optionally **S19 All tallies** | View the winner or unresolved tie. Open All tallies to inspect ranked aggregate Yep totals, never individual ballots. |
| 13. Share or revisit (optional) | **S22 Share Room** or **S20 Your Rooms** | A guest may share the room code/QR with another participant where joining is still allowed, or return to the room through Your Rooms while it remains available. Completed rooms are read-only. |

## Cross-journey lifecycle and recovery

| Situation | Screen(s) | Required behavior |
|---|---|---|
| Creator returns to an existing room | **S20 Your Rooms** → phase-appropriate screen | Show one recency-sorted list of created/joined rooms with active/completed styling. Restore the authoritative phase and safe participant progress; do not create a duplicate room or ballot. |
| Guest arrives after voting starts | **S07 Room intro** → **S08 Guest waiting** or **S14 Vote progress** | Do not add the late joiner to the active round's eligible voters. Explain that they must wait for the next round or results. |
| Room updates while host reviews | **S10 Host final review**; **S08 Guest waiting** | Apply new submissions and edits live until voting starts. The host's grid reflects the same shared deck. |
| Voting starts or the deck locks | **S10 Host final review** → **S12 Voting deck**; **S08 Guest waiting** → **S12 Voting deck** | Synchronize phase change and countdown. Reject stale card changes and keep eligible cards fixed for the round. |
| Creator disconnects during voting/tie-break | **S14 Vote progress** or **S16 Tie-break voting**; then **S24 Shared error/recovery** if needed | Preserve room state. Reconnection within 10 minutes restores control. After 10 minutes, apply the documented automatic resolution using submitted ballots; if no ballots exist, use the active-round fallback. |
| Network loss, stale room, denied action, or retry | **S24 Shared error/recovery** | Explain the failure in plain language, offer one next action, and preserve safe local progress. Retry must not duplicate a room, card, or ballot. |
| Camera access is unavailable | **S23 QR scanner** → **S21 Join Room** | Explain the camera issue and provide manual code entry as the fallback. |
| Share/copy fails | **S22 Share Room** | Keep the room code visible and provide retry/manual-copy fallback. Do not block room participation on native share support. |
| Room is closed or expired | **S20 Your Rooms**, **S21 Join Room**, or **S24 Shared error/recovery** | Explain that the room is no longer active. Expired/removed room data must not be presented as recoverable. |

## Room phases

The domain lifecycle is:

**setup** → **collecting** (optional) → **reviewing** → **voting** → **tie-breaker** (if needed) → **winner** or **tie-result** → **closed**.

Phase names are domain concepts, not a one-to-one list of screens. Use the screen appropriate to the participant's role and current phase; show loading, offline, stale-room, expired-room, denied-action, and retry states through **S24 Shared error/recovery** when a dedicated screen does not apply.

## Screen coverage checklist

Every Screen Catalog entry is named in the journeys above.

| Catalog ID | Screen name | Journey coverage |
|---|---|---|
| S01 | Home | Creator 1; Guest 1 |
| S02 | Category picker | Creator 2 |
| S03 | Room title/icon | Creator 3 |
| S04 | Contribution mode | Creator 4 |
| S05 | Host card builder | Creator 5, 7, 9 |
| S06 | Guest contribution | Guest 6–7 |
| S07 | Room intro | Guest 5; lifecycle late join |
| S08 | Guest waiting | Guest 7–8; lifecycle late join |
| S09 | Host waiting | Creator 7–8 |
| S10 | Host final review | Creator 9–10; live-review lifecycle |
| S11 | Contribution cutoff | Creator 8; Guest 8 |
| S12 | Voting deck | Creator 10–11; Guest 9 |
| S13 | Ballot review | Creator 11; Guest 9, 11 |
| S14 | Vote progress | Creator 11–12; Guest 9–10; lifecycle |
| S15 | Tie-break intro | Creator 13; Guest 11 |
| S16 | Tie-break voting | Creator 13; Guest 11; lifecycle |
| S17 | Winner result | Creator 14–15; Guest 12 |
| S18 | Tie result/resolution | Creator 13–15; Guest 11–12 |
| S19 | All tallies | Creator 14; Guest 12 |
| S20 | Your Rooms | Creator 1, 15; Guest 1, 13; lifecycle |
| S21 | Join Room | Guest 2–4; lifecycle |
| S22 | Share Room | Creator 6; Guest 13; lifecycle |
| S23 | QR scanner | Guest 3; lifecycle |
| S24 | Shared error/recovery | Guest 4; lifecycle |
