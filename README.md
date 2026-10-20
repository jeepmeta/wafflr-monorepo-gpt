# Wafflr

Wafflr is a gamified group decision-making experience. This repository is a pnpm + Turborepo monorepo for the web/PWA first, with a future Expo React Native app.

## Product documentation

Before implementation, review the [Wafflr documentation hub](./docs/README.md). It links the product vision, host and guest journeys, screen catalog, decision engine, brand and character guide, architecture, and decision log. These docs distinguish confirmed decisions from proposals and open questions.

## Stack

- pnpm workspaces + Turborepo
- TypeScript
- React + Vite
- Tailwind CSS v4 via @tailwindcss/vite
- Vite PWA plugin
- Supabase is the selected backend direction; it is not connected yet
- Shared design tokens and React UI primitives in packages/config and packages/ui
- Platform-neutral room state machine and voting rules in packages/core
- Expo app placeholder for a future iOS/Android client

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer

## Getting started

```bash
corepack enable
pnpm install
pnpm dev
```

The web app runs at http://localhost:5173.

See [development setup](./docs/development-setup.md) for environment guidance and checks.

## Useful commands

```bash
pnpm dev             # Run workspace dev tasks
pnpm build           # Build all configured apps/packages
pnpm lint            # Run lint tasks
pnpm typecheck       # Run TypeScript checks
pnpm format          # Format files with Prettier
pnpm format:check    # Check formatting
pnpm tokens:generate # Regenerate CSS and TypeScript design tokens
pnpm tokens:check    # Check generated token files are current
```

## Workspace layout

- apps/web: React website and installable PWA
- apps/mobile: future Expo / React Native app placeholder
- packages/core: platform-agnostic room model, phase transitions, card permissions, ballot validation, vote tally, tie-breaker and expiry logic
- packages/ui: reusable React primitives and Butters mascot component, with shared stylesheet
- packages/config: canonical design-token source plus generated CSS and TypeScript tokens

Edit `packages/config/tokens.source.json` to change design values, then run `pnpm tokens:generate`. Do not edit generated token files directly. Semantic tokens and Tailwind v4 mappings are defined in the generated CSS; old token aliases remain while existing prototype styles are migrated.

Keep domain logic in packages/core free of browser and React Native APIs. Keep web-specific code in apps/web. The current room flow is a local prototype; multi-device room synchronization, QR generation/scanning, persistence, and server-authoritative voting are not connected yet. Supabase is the planned backend; see [backend plan](./docs/backend-plan.md). When mobile development begins, initialize Expo in apps/mobile and share only platform-neutral logic and components that are genuinely cross-platform.

## AI coding agents

Start with [AGENTS.md](./AGENTS.md). Task-specific agent skills live in `.agents/skills/`, GitHub Copilot guidance lives in `.github/copilot-instructions.md`, and the product/technical reference hub is [docs/README.md](./docs/README.md). Update documentation with meaningful behavior or architecture changes. Never commit credentials.
