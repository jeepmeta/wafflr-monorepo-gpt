# Wafflr

Wafflr is a gamified group decision-making experience. This repository is a pnpm + Turborepo monorepo for the web/PWA first, with a future Expo React Native app.

## Start here

- [Product and UX documentation](./docs/README.md)
- [Development setup](./docs/development-setup.md)
- [AI agent guide](./docs/ai-agent-guide.md)
- [Security and data handling](./docs/security-and-data.md)
- [Repository agent instructions](./AGENTS.md)

## Stack

- pnpm workspaces + Turborepo
- TypeScript, React, and Vite
- Tailwind CSS v4 using the official Vite plugin
- Vite PWA plugin
- Supabase selected for the backend; project connection and schema are not yet configured
- Shared design tokens in `packages/config/tokens.json`, with generated CSS and TypeScript exports
- Reusable web UI primitives in `packages/ui`
- Platform-neutral room state machine and voting rules in `packages/core`
- Expo / React Native placeholder in `apps/mobile`

## Requirements

- Node.js 22 or newer
- pnpm 10 or newer

## Getting started

```sh
corepack enable
pnpm install
pnpm dev
```

The web app runs at http://localhost:5173.

## Useful commands

```sh
pnpm dev          # Run workspace dev tasks
pnpm build        # Check generated tokens and build the workspace
pnpm lint         # Run workspace lint tasks
pnpm typecheck    # Run TypeScript checks
pnpm format       # Format repository files
pnpm format:check # Check formatting without writing
pnpm tokens:build # Regenerate CSS and TypeScript token outputs
pnpm tokens:check # Verify generated token outputs are current
```

## Workspace layout

- `apps/web`: responsive website and installable PWA
- `apps/mobile`: future Expo / React Native app placeholder
- `packages/core`: platform-agnostic room model, phase transitions, card permissions, ballot validation, vote tally, tie-breaker, and expiry logic
- `packages/ui`: reusable React primitives and Butters mascot component, with shared web stylesheet
- `packages/config`: single-source design tokens and Tailwind CSS v4 semantic aliases

The current room flow is a local prototype. Multi-device synchronization, QR generation/scanning, persistence, and server-authoritative voting are not connected yet. See [the Supabase setup notes](./supabase/README.md) before implementing backend changes.

Keep domain logic platform-neutral. Keep web-specific code in `apps/web`. Do not commit credentials.
