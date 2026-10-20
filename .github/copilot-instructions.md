# GitHub Copilot instructions for Wafflr

Follow the repository-wide instructions in `/AGENTS.md` and the product/technical references linked from `/docs/README.md`.

Wafflr's MVP categories are Where to Eat (`eat`), What to Watch (`watch`), What to Do (`do`), and Custom (`custom`). They share one decision engine. Do not create category-specific copies of room or voting logic.

Keep domain logic in `packages/core`, web-only UI in `apps/web`, reusable web primitives in `packages/ui`, and shared design values in `packages/config`. Use semantic design tokens instead of hard-coded color values. Never commit secrets. Supabase is planned; enforce permissions at the database/server boundary rather than trusting the browser.

Before changing a flow, read the relevant docs and preserve Confirmed/Proposed/Open labels. Update docs and tests alongside meaningful behavior changes. Report only checks you actually ran.
