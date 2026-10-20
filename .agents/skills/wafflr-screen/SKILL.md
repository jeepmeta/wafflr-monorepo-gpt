---
name: wafflr-screen
description: Implement or revise a Wafflr web/PWA screen, modal, responsive layout, or reusable UI component while preserving product UX decisions and shared styling.
---

# Wafflr screen implementation

Before editing, read `AGENTS.md`, `docs/screen-catalog.md`, `docs/user-journeys.md`, and the relevant entries in `docs/ux-decision-catalog.md`.

1. Identify the user role, room phase, valid actions, loading/empty/error states, and mobile behavior before coding.
2. Reuse `packages/ui` primitives and semantic tokens. Add a primitive only when it is reusable or materially simplifies the screen.
3. Keep screen-specific layout in `apps/web`; do not move domain policy into components.
4. Preserve accessible names, keyboard operation, focus visibility, reduced-motion support, and clear disabled/error states.
5. Keep the four MVP categories on the same shared decision flow.
6. Add or update tests for behavior, and update screen or journey documentation if the flow changes.
7. Run the relevant lint, typecheck, and build commands. Report any checks not run.
