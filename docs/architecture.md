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

## Suggested domain entities
These are conceptual, not finalized TypeScript definitions:
- DecisionRoom: room ID, category, phase, host reference, options, participants, round metadata.
- DecisionCategory: category identity, labels, option schema, card presentation configuration.
- DecisionOption: stable ID, category-specific fields, submitter/reference, timestamps, and edit state as needed.
- Participant: stable room-scoped identity and role, with privacy-conscious profile fields.
- VotingRound: round ID, frozen deck/order, status, result.
- Vote: participant and option references, response, timestamps/idempotency metadata as needed.
- RoomEvent: conceptual changes such as joining, option submit/edit/remove, guest completion, phase transition, or vote recording.

Do not finalize structures before deciding identity, persistence, realtime transport, and voting policy.

## Shared state and synchronization
The host and guests need a consistent view of submissions and phase. During collection/review, changes are live. At voting start, the active deck is frozen. The authoritative state layer must enforce phase rules; client-side checks alone are not sufficient.

Backend, database, real-time mechanism, hosting, and offline behavior are not selected. Separate domain policy (what is valid), application orchestration (which operation runs), persistence/synchronization (how state is stored and delivered), and presentation (what each screen renders).

## Conceptual events
Room creation, participant join, option submit/update/remove, guest completion, review entry, vote start, and vote recording are useful event concepts. Vote start should establish the exact deck snapshot for that round. These are not committed event names and do not require event sourcing.

## PWA and mobile
Build and validate responsive web/PWA first. Keep decision rules platform-neutral so Expo can reuse them. Share types and logic when stable; share UI only when platform differences permit a clean abstraction.

Define PWA installability, icons, offline fallback, update behavior, and what happens when a room needs a live connection. Do not pretend shared live voting works offline if state cannot synchronize.

## Security and privacy
Room links may grant access to a live group activity; design their access model deliberately. Never commit secrets. Validate important transitions at the authoritative layer. Decide discoverability, link revocation/expiry, identity, vote privacy, and data retention before production.

## Quality strategy
Unit-test core rules and tally outcomes; test review-to-voting lock; test live changes across clients; test responsive layout, keyboard and screen-reader operation; verify PWA install/update behavior; add mobile parity checks when Expo is initialized. Run pnpm install, pnpm typecheck, pnpm lint, and pnpm build in a real environment. Earlier starter setup did not yet have verified local install/build results.