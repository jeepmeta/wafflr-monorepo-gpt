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
- Shared packages designed for web and mobile reuse
- Shared design tokens and React UI primitives in `packages/config` and `packages/ui`
- Platform-neutral room state machine and voting rules in `packages/core`
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

## Useful commands

```bash
pnpm dev       # Run workspace dev tasks
pnpm build     # Build all configured apps/packages
pnpm lint      # Run lint tasks
pnpm typecheck # Run TypeScript checks
pnpm format    # Format files with Prettier
```

## Workspace layout

- apps/web: React website and installable PWA
- apps/mobile: future Expo / React Native app placeholder
- packages/core: platform-agnostic room model, phase transitions, card permissions, ballot validation, vote tally, tie-breaker and expiry logic
- packages/ui: reusable React primitives and Butters mascot component, with shared stylesheet
- packages/config: shared color, spacing, radius, motion and typography tokens

Keep domain logic in packages/core free of browser and React Native APIs. Keep web-specific code in apps/web. The current room flow is a local prototype; multi-device room synchronization, QR generation/scanning, persistence, and server-authoritative voting are not connected yet. When mobile development begins, initialize Expo in apps/mobile and share only platform-neutral logic and components that are genuinely cross-platform.

Add secrets to local environment files only; never commit credentials.
