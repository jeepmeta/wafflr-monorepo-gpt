# Copilot instructions for Wafflr

Read the root `AGENTS.md` first, then the relevant docs under `docs/`. Follow package boundaries and confirmed product decisions. Keep the MVP to Where to Eat, What to Watch, What to Do, and Custom. Use `packages/config/tokens.json` as the design-token source of truth and run `pnpm tokens:build` after editing it. Keep domain rules platform-neutral in `packages/core`; never treat client-side validation as a security boundary. Do not add secrets or Supabase service-role credentials to client code. Test critical changes and report checks truthfully.
