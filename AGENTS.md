# Wafflr agent instructions

Read this file before making repository changes. For product behavior, start at [docs/README.md](docs/README.md). For implementation-specific workflows, use the relevant skill in `.agents/skills/`.

## Product boundaries
- Wafflr is a group decision-making product. MVP categories are `eat`, `watch`, `do`, and `custom`.
- All categories use one room, card/deck, contribution, voting, tally, and tie-resolution engine. Category differences belong in data/configuration and presentation, not duplicated voting logic.
- Treat product documentation as the source of truth. Preserve the distinction between Confirmed, Proposed, and Open decisions; do not invent behavior to fill gaps.
- The creator has only the extra permissions documented in `docs/decision-engine.md`. Enforce important permissions and state transitions in the authoritative backend once connected.

## Architecture
- `apps/web`: browser UI, routes, PWA and browser-only integrations.
- `apps/mobile`: reserved for the future Expo / React Native client. Do not implement the mobile app unless explicitly requested.
- `packages/core`: platform-neutral domain rules. No React, DOM, browser storage, or React Native imports.
- `packages/ui`: reusable web UI primitives and their styles. Keep browser-specific UI out of the domain package.
- `packages/config`: shared design tokens and tooling configuration.
- Supabase is the planned backend. Never commit credentials, service-role keys, or real environment files. Client-side configuration may only contain public project URL and publishable/anon key; authorization must be enforced server-side/database-side.

## Design system
- Use semantic design tokens for intent (page background, card surface, primary action, primary text) rather than hard-coded colors in components.
- When changing tokens, update the canonical source and regenerate all derived files using the documented command. Never hand-edit generated token outputs.
- Keep token changes global and intentional. Use component-specific tokens only when the visual role genuinely differs.
- Use shared UI primitives before introducing near-duplicate components. Keep the Wafflr visual identity warm, playful, accessible, and responsive.
- Respect reduced-motion preferences, keyboard access, focus visibility, and readable contrast.

## Engineering rules
- TypeScript strictness stays enabled. Avoid `any`; if unavoidable, isolate and explain it.
- Keep dependencies in the package that imports them. Use `workspace:*` for internal packages.
- Keep product logic pure and testable in `packages/core`; avoid duplicating domain rules in components.
- Validate all external input at trust boundaries. Do not trust client-supplied roles, tallies, room phases, ownership, or deadlines.
- Keep guest flows account-free unless product decisions explicitly change. Minimize personally identifying data.
- Use accessible labels, semantic HTML, explicit loading/empty/error states, and mobile-first layouts.
- Do not add a dependency for a small utility without explaining the tradeoff.

## Required workflow
1. Read relevant docs and skill instructions before changing behavior.
2. Make the smallest coherent change; update docs and decision log when product behavior or architecture changes.
3. Add or update tests for logic and important user flows.
4. Run the applicable checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and relevant tests.
5. Report checks actually run and any checks blocked by missing dependencies or secrets. Never claim a build/test passed if it was not run.
6. Keep secrets out of logs, examples, screenshots, and commits.

## Before adding backend functionality
Read `docs/backend-plan.md` and the Supabase skill. Do not connect production credentials or create a production database without explicit authorization. Database policies and server-side functions must be designed before relying on client-side role checks.
