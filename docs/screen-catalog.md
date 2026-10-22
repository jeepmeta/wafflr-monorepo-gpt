# Screen Catalog

Screen names are product surfaces, not prescribed route paths. All screens are specifications; check code/tests before claiming implementation.

| ID | Screen/surface | Responsibility and key controls | Important states |
| --- | --- | --- | --- |
| S01 | Home | Brand, Create Room, Join Room, Your Rooms entry | First use, loading, create/join error |
| S02 | Category picker | Where to Eat, What to Watch, What to Do, Custom | Selected category |
| S03 | Room title/icon | Title input; preset icon or Custom icon picker | Validation, save/cancel |
| S04 | Contribution mode | Host creates all / guests contribute | Mode selected |
| S05 | Host card builder | Add/edit/remove own cards; card grid; quota/cap feedback | Empty, draft, full, invalid |
| S06 | Guest contribution | Add to Deck; 1–3 quota slots; I'm Done | Empty, draft, submitted, quota full, room full |
| S07 | Room intro | Brief branded transition after join | Loading, joined, invalid/expired code |
| S08 | Guest waiting | Explain next step; no host controls | Collecting, review, voting, disconnected |
| S09 | Host waiting | Room progress and host next action | Waiting, all done, unfinished contributors |
| S10 | Host final review | Responsive shared card grid; edit/remove; start voting | Live changes, fewer than 2 cards, 100-card cap |
| S11 | Contribution cutoff | Toast + one-minute grace countdown | Grace active, cutoff ended |
| S12 | Voting deck | One card at a time; next-card peek; swipe or Yep/Nah buttons | Current card, last card, reconnect |
| S13 | Ballot review | Review all choices; replay same order to change choices; confirm | Unconfirmed, confirmed |
| S14 | Vote progress | Butters/animated progress; submitted/waiting status | Partial group completion, all done, host early-end countdown |
| S15 | Tie-break intro | Eggin Targaryen intro, about 3 seconds | Reduced-motion alternative |
| S16 | Tie-break voting | Same voting mechanics, tied cards only | Active, ballot review, submitted |
| S17 | Winner result | Winning card, Butters celebration, confetti | Final, closed-room revisit |
| S18 | Tie result/resolution | Host resolution controls; non-host waiting state | Choose tied winner, another round, leave tied |
| S19 | All tallies | Scrollable ranked list of cards and Yep totals | Open/close modal; final result |
| S20 | Your Rooms | One recency-sorted list of created/joined rooms; active/completed styling | Empty, active, completed, expired |
| S21 | Join Room | Room code input; Scan QR Code | Invalid, loading, expired, retry |
| S22 | Share Room | Room code and QR; no URL/deep link | Copy/share, failure |
| S23 | QR scanner | Scan code and fill join field | Camera permission denied, scan success/failure |
| S24 | Shared error/recovery | Plain-language error and one next action | Offline, stale state, denied action, retry |

## Global requirements

- Persistent Wafflr header stays above modal overlays where the layout uses it.
- Mobile-first responsive layout; host review grid adapts to viewport.
- Web controls support keyboard use, visible focus, accessible labels, and alternatives to swipe/drag.
- Respect readable contrast and reduced-motion preferences.
- Do not expose host/guest names, individual activity, or private ballots.
- Modal close/cancel must not silently discard unsaved work.
