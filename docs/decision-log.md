# Decision Log and Open Questions

Record new decisions here and update affected docs in the same change. Treat a detail as Confirmed only when explicitly established; otherwise label it Proposed or Open.

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

## Latest recorded UX decisions
**Decision 31 — Guest completion:** provide an “I’m Done” button. Guests may finish with unused slots; unused slots are skipped.
**Decision 31 — Guest waiting:** provide a guest waiting screen.
**Decision 32 — Host final deck review:** responsive card grid with edit and remove controls.
**Decision 32 — Review editing:** reuse the existing card editor/form with Save or Cancel.
**Decision 32 — Changes during review:** accept new submissions and edits in real time until voting starts; lock the deck when voting starts.

This log preserves the decisions available in the current project context. If earlier numbered decisions establish additional requirements, append or reconcile them rather than treating missing detail as rejection.

## High-priority open questions

### Voting and results
- What exact tally determines the winner? Swipe meanings are known; final scoring is not.
- Does everyone vote on every option? Can participants skip, undo, or change votes?
- Are votes anonymous? Can anyone see individual responses?
- What is the exact tie condition and tie-break procedure?
- What happens if every option is rejected, none receives approval, or participation is incomplete?
- Must all participants finish before results are revealed?

### Room and participant model
- Are accounts required or can guests be anonymous? Is a display name required?
- Can the host remove participants or close a room?
- Can guests edit/delete their own submissions?
- Are links revocable or time-limited? How long are rooms retained?

### Creation and option data
- Which fields are required for restaurant options?
- Does the host set location, radius, cuisine, budget, or other filters?
- Are places entered manually, discovered through a provider, or both?
- What counts as a duplicate? How many submission slots are offered?
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