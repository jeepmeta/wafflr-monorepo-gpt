---
name: design-tokens
description: Add or change Wafflr design tokens, Tailwind theme mappings, or shared styling primitives.
---

# Design tokens and styling

## Before coding
1. Read `/AGENTS.md` and `docs/architecture.md`.
2. Inspect `packages/config` to identify the canonical token source and generated outputs.
3. Confirm whether the requested change is global or specific to a component/state.

## Rules
- Prefer semantic names such as page background, card surface, primary text, primary action, positive response, and destructive action.
- A semantic token represents a visual role, not a particular component or literal hue.
- Update the canonical token source only, then run the token generation/check command. Never edit generated CSS or TypeScript token files directly.
- Keep existing legacy aliases until their references have been migrated; do not silently remove variables used by existing screens.
- Tailwind CSS v4 configuration belongs in CSS using `@theme`; avoid introducing a parallel JavaScript Tailwind config unless a specific integration requires it.
- Keep platform-specific styling separate. Web CSS is not automatically usable by React Native; share token values and domain concepts, then adapt the native implementation when Expo work begins.
- Preserve reduced-motion behavior, focus-visible styling, responsive behavior, and contrast.

## Verification
Run the token check/generation command, format check, typecheck, and web build. If token output is generated, include all changed generated files in the same commit.
