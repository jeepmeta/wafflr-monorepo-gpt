# Decision Log and Open Questions

Record new decisions here and update affected docs in the same change. Treat a detail as Confirmed only when explicitly established; otherwise label it Proposed or Open. The [UX decision catalog](./ux-decision-catalog.md) preserves the detailed selections available from the design sessions.

## Confirmed product and brand

- Product name: Wafflr (W-A-F-F-L-R).
- Purpose: playful group decision-making to reduce decision fatigue and decision anxiety.
- Initial use case: deciding where to eat.
- Longer-term direction: reusable card-deck decision system that can expand to other categories, such as what to watch.
- Primary mascot: Butters, a cute waffle character.
- Visual exploration: bright playful food characters; character-matched arms/legs; unique tennis shoes; transparent backgrounds are useful for reusable assets.

## Confirmed stack and repository

- Web/PWA first; future Expo / React Native app.
- pnpm + Turborepo monorepo.
- TypeScript, React, Vite, Tailwind CSS v4, and PWA support.
- Platform-neutral decision logic belongs in a shared core package.

## Confirmed group flow and core principle

- A room is one shared game for one decision. Every participant sees the same cards and authoritative room phase.
- The creator chooses to build all cards or invite guests to contribute cards. When guest contribution is enabled, the creator contributes under the same rules as guests.
- The creator has only three additional powers: veto cards before voting, end voting early if the game is stuck or delayed, and select a winner if the tie-breaker round remains tied.
- Guests join by entering the room code or scanning the QR code from Home; no joining links.
- Room-wide limit: 100 cards across all contributors. New submissions stop at 100/100.
- Voting requires at least two cards. Starting voting locks the deck and closes submissions.
- Swipe right or tap Yup approves; swipe left or tap Nah rejects. Every card requires a response before ballot submission; choices can change until Submit Votes, after which the ballot is final.
- The highest submitted Yup count wins; Nah votes do not subtract. If the creator ends voting with no submitted ballots, they choose a winner.
- A tie triggers one tie-breaker round with tied cards only. If it remains tied, the creator selects the winner.
- The winner view shows only the winning card, Butters celebration, and confetti; no totals or losing-card details.
- After a short celebration, the room closes. The Winner screen remains accessible for 24 hours after closure, then room and decision data are deleted.

## Confirmed UX decisions

Decisions 19–32 are detailed in the [UX decision catalog](./ux-decision-catalog.md). Key cross-cutting rules include:

- Home and empty-room states use distinct treatments; expired rooms explain what happened and offer a route Home.
- Room-creation failure preserves local card drafts and provides Retry.
- Resuming a room restores the exact phase, controls, and progress, with nonblocking catch-up.
- No nicknames or participant list are shown. Only the guest count is visible, and no participant—including the creator—can identify individual guests.
- Room Setup lets the creator choose whether to create all cards or allow guest contributions; if guest contribution is enabled, the creator participates as a contributor.
- Guest quota is one, two, or three cards per guest, chosen during setup. Unused slots are skipped when a guest presses “I’m Done.”
- The 100-card room-wide cap applies to all contributors. At capacity, disable submissions and show “Room full — 100/100 cards.”
- Guests can edit/delete their own cards until voting starts; the creator reviews the shared deck in a responsive grid and can veto/remove cards. Contributors can edit their own cards; the creator does not edit other contributors' cards.
- New submissions and edits remain live during review. Starting voting locks the deck at the authoritative state layer and closes submissions.
- Voting requires at least two cards. The creator can start at any time once the minimum is met, even if guests have unused slots or have not pressed “I’m Done.”
- Creator powers are limited to pre-vote veto, ending voting early, and final winner selection if the tie-breaker remains tied.
- If the creator disconnects for 10 minutes during voting or a tie-breaker, automatically resolve using submitted ballots; if none exist, randomly select from the relevant cards.

The current source context did not contain the exact selections for Decisions 1–18. Do not infer or invent them; recover their original records and append them to the catalog.

## High-priority open questions

### Voting and results

- Vote tally, ballot completeness, vote changes, one tie-breaker round, persistent-tie selection, and zero-ballot behavior are confirmed in the UX catalog. Do not reopen them as questions.
- Individual votes and totals are not shown on the Winner screen. The broader ballot-privacy implementation must not reveal identities or individual responses.

### Room and participant model

- Anonymous account IDs are created in the background on first use; each device has independent counters, with no signup, email, recovery, or cross-device linking.
- Do not add general creator administration, participant removal, joining links, or extra room-management controls. Guests enter a room code or scan its QR code.
- Rooms expire 24 hours after closure, when room, card, and individual decision data are permanently deleted.

### Creation and option data

- Which fields are required for restaurant options?
- Does the host set location, radius, cuisine, budget, or other filters?
- Are places entered manually, discovered through a provider, or both?
- What counts as a duplicate?
- Can the host start review/voting while participants are still joining?

### Live collaboration

- What if a remote edit arrives while the host is editing the same card?
- How are live changes communicated?
- How should disconnected clients recover?
- What happens if two host actions race to start voting?
- Can a room be reopened or a round restarted?

### Design and platform

- What are the final route names and navigation structure?
- What colors, typography, logo lockup, mascot expressions, and animation rules are canonical?
- What backend, database, authentication, real-time transport, hosting, and analytics will be used?
- What does offline PWA behavior mean for a live shared room?
- When should Expo work begin, and which UI components should be shared?

## Suggested priority

Before implementing the tally, settle winner algorithm, ballot completeness, tie rules, and vote privacy. Before production collaboration, settle identity/access, authoritative persistence, live conflict handling, and room lifecycle. Styling can progress where it does not hard-code unresolved rules.

## New decision template

**Decision ID and date:**  
**Question:**  
**Decision:**  
**Reason / trade-off:**  
**Affected docs and screens:**  
**Tests or acceptance criteria:**  
**Status:** Confirmed / Proposed / Superseded

When superseded, preserve the old entry and link to the replacement. Never silently convert a proposal into a confirmed requirement.
