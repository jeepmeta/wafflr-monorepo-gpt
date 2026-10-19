# Architecture and Domain Model

## Repository direction
Repository: [jeepmeta/wafflr-monorepo-gpt](https://github.com/jeepmeta/wafflr-monorepo-gpt). The intent is web/PWA first with mobile later.

Chosen stack: pnpm workspaces, Turborepo, TypeScript, React + Vite, Tailwind CSS v4 via the Vite integration, Vite PWA support, and a future Expo / React Native client. The starter README describes apps/web, apps/mobile, packages/core, packages/ui, and packages/config. Mobile and some shared packages are placeholders until implemented.

## Package boundaries
**apps/web:** browser routes, responsive screens, PWA integration, browser-specific behavior.
**apps/mobile:** future Expo / React Native client; reuse core domain rules rather than copying them.
**packages/core:** platform-neutral domain types, validation, lifecycle rules, deck snapshots, voting policy, tallying, and tie detection once finalized. No React, DOM, browser storage, or React Native imports.
**packages/ui:** genuinely reusable UI where a cross-platform strategy makes sense. Do not force web-only components into it.
**packages/config:** shared tooling/configuration where it reduces duplication.

## Room model and creation
A room does not exist until the creator confirms creation. Creation establishes the room record, code, QR code, selected category, contribution mode, and initial lifecycle phase. From that point, the room can be shared or the creator can build the deck, depending on the chosen mode.

There are exactly two mutually exclusive card-creation modes: creator-only (the creator creates the deck) or guest-contribution (the creator and guests independently submit cards under the same contribution limits). Do not model these as simultaneous collaboration modes.

In guest-contribution mode, the room remains open to new guests until the creator advances the workflow. Guests may join late and submit their cards while collection is open. Each person’s submission progress is private to that device: after submitting their cards or pressing “I’m Done,” they see a character waiting screen while others may still be composing or may not have joined yet. The creator can advance to review without waiting for every invited person to join or finish; unfinished and unsubmitted drafts are not part of the deck.

## No multiplayer or live-presence architecture
A room is a persisted workflow and submission endpoint, not a social space. There is no chat, participant activity feed, visible identity list, presence, synchronized animation, or requirement for everyone to be online together. Clients do not need live room-state broadcasts or WebSocket connections. Participants can work independently and submit cards or ballots at explicit checkpoints.

Use ordinary request/response operations against persisted room data. The creator fetches submitted cards when reviewing the deck, freezes the deck when starting voting, and retrieves submitted ballots to resolve the outcome. Refresh/re-entry loads the latest persisted phase and data. Use transactional or otherwise atomic server-side operations for critical boundaries, especially deck lock and ballot submission; this is data integrity, not multiplayer synchronization.

## Suggested domain entities
- DecisionRoom: room ID/code, category, contribution mode, phase, creator reference, deck, round metadata, and lifecycle timestamps.
- DecisionCard: stable ID, category-specific fields, submitter reference, and edit state.
- Ballot: participant/device-scoped reference and complete Yup/Nah responses for a round.
- VotingRound: frozen deck/order, submitted ballots, and result.

Keep identity data minimal and anonymous. Do not add chat messages, presence records, participant activity events, live-connection state, leave-room actions, or immediate room-deletion controls. Participants do not need to leave: the room follows its lifecycle and its stored decision data is permanently deleted after the 24-hour post-closure retention window.

## Application and persistence boundaries
Keep domain policy (what is valid), application orchestration (which operation runs), persistence (what is stored), and presentation (what each screen renders) separate. The backend/database provider is not selected. A conventional API plus persisted storage is sufficient; realtime transport is not a product requirement. Clients may refresh or explicitly fetch the latest room data at workflow transitions.

## PWA and mobile
Build and validate responsive web/PWA first. Keep decision rules platform-neutral so Expo can reuse them. Share types and logic when stable; share UI only when platform differences permit a clean abstraction.

Define PWA installability, icons, offline fallback, and update behavior. Offline editing may be supported later, but submissions and phase-changing actions require a successful server response; the product does not depend on a live connection between participants.

## Security and privacy
Room codes and QR codes provide access to a persisted decision workflow. Never commit secrets. Validate important transitions at the authoritative layer. Decide code entropy, access controls, vote privacy, and data retention before production.

## Quality strategy
Unit-test core rules and tally outcomes; test independent card and ballot submissions, persisted reload/resume, review-to-voting lock, duplicate/retried requests, and outcome resolution; test responsive layout, keyboard and screen-reader operation; verify PWA install/update behavior; add mobile parity checks when Expo is initialized. Run pnpm install, pnpm typecheck, pnpm lint, and pnpm build in a real environment. Earlier starter setup did not yet have verified local install/build results.