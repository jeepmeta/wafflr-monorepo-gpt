---
name: wafflr-design-system
description: Add or change Wafflr colors, semantic tokens, typography, spacing, shadows, radii, motion, Tailwind theme aliases, or reusable web styling.
---

# Wafflr design system

Read `AGENTS.md` and `docs/architecture.md` before making changes.

- The sole editable token source is `packages/config/tokens.json`.
- After editing token JSON, run `pnpm tokens:build`. The generated files are `packages/config/src/tokens.css` and `packages/config/src/tokens.ts`; do not hand-edit them.
- Tailwind CSS v4 semantic utility aliases live in `packages/config/src/tailwind.css`. Add aliases there only when they express a stable semantic concept.
- Prefer names such as `canvas`, `surface`, `text-muted`, `brand-primary`, and `action-positive` over names tied to a component or raw hue.
- Component-specific tokens are appropriate only when a real component needs a distinct value. Avoid duplicating a global token just to make a local override.
- Do not place Tailwind v4 browser CSS assumptions into the Expo placeholder. Native styling compatibility will be addressed when mobile work begins.
- Check that existing CSS custom-property references remain valid, and run `pnpm tokens:check`, lint, typecheck, and build.
