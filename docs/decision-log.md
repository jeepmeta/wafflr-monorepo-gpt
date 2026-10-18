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

## Confirmed group flow

- Guests can join via shared link or QR code.
- Participants can submit one or more choices.
- Voting uses a card-deck interaction concept.
- Swipe right means yes/keep; swipe left means no/reject.
- Ties may trigger another voting round.

## Confirmed UX decisions

Decisions 19–32 are detailed in the [UX decision catalog](./ux-decision-catalog.md). Key cross-cutting rules include:

- Home and empty-room states use distinct treatments; expired rooms explain what happened and offer a route Home.
- Room-creation failure preserves local card drafts and provides Retry.
- Resuming a room restores the exact phase, controls, and progress, with nonblocking catch-up.
- Guests receive editable random nicknames; duplicate names receive suffixes, and a persistent anonymous device token supports continuity on that device.
- Room Setup uses selectable cards and a guest quota of one, two, or three submissions, defaulting to three.
- Host card entry supports up to twenty-five cards in a five-by-five grid; additions stop at capacity.
- A guest's submission action is “Add to Deck”; guests can edit/delete their submissions until voting begins.
- A deck needs at least three cards before Build Deck is enabled. The host can reorder cards before voting.
- Guests can choose “I’m Done” with unused slots; unused slots are skipped.
- Host final review uses a responsive grid with edit/remove controls and the shared editor's Save/Cancel behavior.
- Submissions and edits remain live during review. Starting voting locks the deck at the authoritative state layer.

The current source context did not contain the exact selections for Decisions 1–18. Do not infer or invent them; recover their original records and append them to the catalog.

## High-priority open questions

### Voting and results

- What exact tally determines the winner? Swipe meanings are known; final scoring is not.
- Does everyone vote on every option? Can participants skip, undo, or change votes?
- Are votes anonymous? Can anyone see individual responses?
- What is the exact tie condition and tie-break procedure?
- What happens if every option is rejected, none receives approval, or participation is incomplete?
- Must all participants finish before results are revealed?

### Room and participant model

- What is the disconnect grace-period duration?
- What are the privacy, reset, and cross-device rules for anonymous device tokens?
- Can the host remove participants or close a room?
- Are links revocable or time-limited? How long are rooms retained?

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
