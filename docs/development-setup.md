# Development Setup

## Prerequisites
- Node.js 22 or newer.
- pnpm 10 or newer. The repository pins its package manager version in the root `package.json`.
- Git and access to the GitHub repository.

## First run
```bash
corepack enable
pnpm install
pnpm dev
```

The web app is expected at `http://localhost:5173`. The mobile workspace is intentionally a placeholder; do not expect an Expo app to launch yet.

## Common checks
```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Use `pnpm format` to apply Prettier. Run the token generation/check command documented in `packages/config/README.md` when changing design tokens.

## Environment variables
Copy `.env.example` to a local environment file only when a feature needs those values. Keep local environment files untracked. The current web prototype does not require Supabase credentials; the example variables are reserved for the planned integration.

Only public Supabase project URL and publishable/anon key may be used by browser code. Never put a service-role key, database password, access token, or other secret in a `VITE_*` variable.

## Working agreements
- Read `AGENTS.md` and the relevant skill under `.agents/skills/`.
- Product requirements live under `docs/`; update them alongside meaningful behavior changes.
- Prefer small feature branches and pull requests. CI currently runs typecheck and build; do not treat that as a substitute for feature-specific tests.
- Use `pnpm-lock.yaml` as the reproducible dependency record. If package manifests change, regenerate and commit the lockfile using pnpm instead of bypassing it.
