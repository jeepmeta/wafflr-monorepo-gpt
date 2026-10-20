# Architecture

## Stack and delivery

- Package management: pnpm workspaces.
- Task orchestration: Turborepo.
- Language: TypeScript.
- Web: React + Vite, Tailwind CSS v4, Vite PWA support.
- Backend: Supabase (Postgres, Realtime, trusted database/server operations); selected, not yet connected.
- Mobile: future Expo + React Native, with NativeWind to be evaluated at implementation time. `apps/mobile` is currently a placeholder.
- Hosting/domain: not selected.

## Workspace boundaries

| Path | Responsibility | Constraints |
|---|---|---|
| `apps/web` | Browser UI, routes, PWA, browser integrations | No authoritative domain rules in components |
| `apps/mobile` | Future native client | Do not build until explicitly scheduled; reuse domain rules |
| `packages/core` | Room phases, permissions, cards, ballots, tally/tie rules | Platform-neutral; no React/DOM/browser/native imports |
| `packages/ui` | Reusable React UI primitives and mascot component/styles | Keep primitives genuinely reusable; don't put domain policy here |
| `packages/config` | Design-token source, generated CSS/TypeScript, shared tooling | Edit source only; regenerate outputs |

## Design tokens

- Canonical source: `packages/config/tokens.source.json`.
- Generated outputs: `packages/config/src/tokens.css` and `packages/config/src/tokens.ts`.
- Run `pnpm tokens:generate` after source edits and `pnpm tokens:check` in verification.
- Tailwind v4 semantic aliases are generated in CSS. Prefer tokens by meaning (page, surface, primary action/text) over raw values.
- A single canonical token change must update every consumer of that semantic role. Do not maintain duplicate values in component styles.
- NativeWind compatibility is a future validation task; shared token values do not mean browser CSS works unchanged in React Native.

## Domain and synchronization

- One category-neutral engine handles `eat`, `watch`, `do`, and `custom`.
- Supabase is intended to become the authoritative shared-state layer. Realtime distributes changes; trusted operations enforce permissions, phase changes, atomic deck lock, ballots, ties, and expiry.
- During collection/review, accepted edits/submissions appear live. Starting voting freezes the eligible deck. All clients must restore the current phase after refresh/rejoin.
- Room codes locate rooms; they do not authorize mutations. RLS and trusted operations enforce access.
- Do not implement security-sensitive rules solely in the client.

## Conceptual domain

`Room`, `Participant`, `Card`, `Contribution`, `VotingRound`, `Ballot`, `BallotResponse`, `RoundResult`, `RoomExpiry`.

Exact database schema, hosting, category field schemas, and NativeWind version strategy remain open. See [backend plan](./backend-plan.md).
