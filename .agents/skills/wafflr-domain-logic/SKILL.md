---
name: wafflr-domain-logic
description: Implement or change room lifecycle, card permissions, contribution rules, voting, tallying, tie resolution, room expiry, or other Wafflr decision-engine behavior.
---

# Wafflr domain logic

Read `AGENTS.md`, `docs/decision-engine.md`, `docs/decision-log.md`, and `docs/architecture.md` first.

- Implement policy in `packages/core`, independent of React and runtime/platform APIs.
- Treat the decision log as the source of truth for confirmed UX rules. If a requirement conflicts with it, stop and document the conflict rather than silently choosing.
- Keep category-specific card fields separate from shared room and voting mechanics.
- Validate all phase transitions and permissions explicitly; invalid transitions should be rejected, not silently coerced.
- Preserve the rule that votes are finalized only after review confirmation, and preserve original tallies through host tie resolution.
- Add deterministic unit tests for valid transitions, invalid transitions, edge cases, and boundary counts.
- Update the decision-engine docs when the implemented domain contract changes.
