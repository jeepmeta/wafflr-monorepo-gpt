# Development Setup

## Requirements

- Node.js 22+
- pnpm 10+ (the package manager version is pinned in root `package.json`)
- Git and repository access

## Start

```bash
corepack enable
pnpm install
pnpm dev
```

Web dev server: `http://localhost:5173`. The mobile app is a placeholder, not a runnable Expo client.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start configured workspace dev tasks |
| `pnpm build` | Build configured apps/packages |
| `pnpm lint` | Run configured lint tasks |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |
| `pnpm tokens:generate` | Generate token CSS and TypeScript |
| `pnpm tokens:check` | Verify generated token outputs are current |

No root test command is currently defined. Use existing package-specific tests if present; add tests with new domain behavior.

## Environment safety

- The current prototype does not require Supabase credentials.
- Keep local `.env*` files untracked; commit only clearly fake `.env.example` templates when needed.
- Browser-exposed variables (typically `VITE_*`) are public. Only the Supabase project URL and publishable/anon key may be exposed.
- Never commit service-role keys, database passwords, access tokens, production data, or real secrets. Do not put secrets in client code.
- Do not create or connect production Supabase resources until migrations, RLS, and authorization have been reviewed.

## Working agreements

- Read [the docs index](./README.md), root `AGENTS.md`, and the relevant skill before changing behavior.
- Use small branches and pull requests; let CI run and report checks accurately.
- Keep business rules in `packages/core`, design tokens in `packages/config/tokens.source.json`, and browser-specific behavior in `apps/web`.
- Regenerate token outputs with `pnpm tokens:generate`; never edit generated token files by hand.
- Update the relevant document and tests when a confirmed contract changes. Do not add documentation files outside the approved docs list without explicit approval.
