---
name: wafflr-domain-logic
description: Implement or change Wafflr room lifecycle, contribution permissions, voting, tallying, tie resolution, or room expiry rules.
---

# Wafflr domain logic

Read `AGENTS.md`, `docs/decision-engine.md`, `docs/decision-log.md`, and `docs/architecture.md` before changing behavior.

- Implement domain policy in `packages/core`, independent of React, DOM, browser storage, and platform APIs.
- Treat confirmed decisions as binding. If a request conflicts with the decision log, surface the conflict instead of silently choosing.
- Keep category-specific fields and presentation separate from shared room, contribution, voting, tally, and tie-resolution mechanics.
- Validate phase transitions and permissions explicitly. Reject invalid transitions rather than silently coercing state.
- Preserve confirmed invariants: voting requires at least two cards; the deck locks at voting start; votes are finalized only after end-of-deck review confirmation; left/Nah is no and right/Yep is yes; only Yep votes count; preserve original totals when a host resolves a tie.
- Add deterministic tests for valid transitions, invalid transitions, boundaries, and edge cases.
- Update the decision engine and decision log when a confirmed domain contract changes.
