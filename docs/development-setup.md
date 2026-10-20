# Development setup

## Required tools
- Node.js 22 or newer
- pnpm 10 (the repository pins its package-manager version in the root `package.json`)
- Git

Enable Corepack and install dependencies from the repository root:

```sh
corepack enable
pnpm install
pnpm dev
```

The web app is served by Vite at `http://localhost:5173`. The mobile app is a placeholder and is not part of the active development loop.

## Common commands
- `pnpm dev`: run persistent development tasks
- `pnpm build`: verify generated design-token files and build workspace packages/apps
- `pnpm lint`: run workspace lint tasks
- `pnpm typecheck`: run TypeScript checks
- `pnpm format`: format repository files
- `pnpm format:check`: check formatting without writing files
- `pnpm tokens:build`: regenerate CSS and TypeScript design-token outputs from the source JSON
- `pnpm tokens:check`: verify generated outputs are current

## Environment variables
Copy `apps/web/.env.example` to `apps/web/.env.local` when Supabase integration is implemented. Leave values blank until a project is provisioned. Vite exposes variables prefixed with `VITE_` to browser code; only public project configuration belongs there. Never put service-role keys or other secrets in a `VITE_` variable.

The current prototype uses local in-memory state. A Supabase project, migrations, realtime synchronization, QR scanning, and server-authoritative voting are not yet connected. Do not treat the example environment file as evidence of a configured backend.

## Pull request checklist
- Product behavior matches the decision log.
- Relevant tests and checks pass.
- Design tokens are changed at the source and generated outputs are refreshed.
- No credentials, user data, or local environment files are committed.
- Documentation is updated for architecture or behavior changes.
