# Wafflr Documentation

This directory is the maintained product and technical reference for Wafflr. It records decisions before implementation so the product can be built consistently and the docs can evolve alongside it.

## Documents

- [Development setup](./development-setup.md): local prerequisites, common commands, environment-variable safety, and working agreements.
- [Backend plan](./backend-plan.md): planned Supabase responsibilities, security invariants, conceptual data model, retention, and implementation sequence.
- [Official technical references](./references/README.md): official documentation links for the stack.
- [Product vision and scope](./product-vision.md): purpose, users, principles, initial release, and future direction.
- [User journeys and lifecycle](./user-journeys.md): host and guest journeys, room phases, resuming rooms, and live-review behavior.
- [Screen catalog](./screen-catalog.md): intended screens, responsibilities, controls, and states.
- [UX decision catalog](./ux-decision-catalog.md): explicit UX selections recorded for Decisions 19–32, including room recovery, identity, card limits, guest submissions, review, and deck locking. Decisions 1–18 need to be recovered from their original record rather than guessed.
- [Decision engine](./decision-engine.md): deck construction, voting semantics, tallying, ties, and rules needing decisions.
- [Brand and characters](./brand-and-characters.md): Wafflr voice, Butters, food-character direction, and asset guidance.
- [Architecture](./architecture.md): monorepo boundaries, domain concepts, synchronization, and platform strategy.
- [Decision log](./decision-log.md): consolidated confirmed decisions, open questions, and a template for future changes.

## How to use these docs

Treat statements as Confirmed, Proposed, or Open. Do not silently turn a proposal into product behavior. When implementation reveals a mismatch, update the relevant doc in the same change as the code. When a product decision changes behavior, record it in the decision log and update affected flows, screens, and engine rules. Use the UX decision catalog for the detailed rationale/selection record and the decision log for the current concise state.

For coding-agent instructions, start with the repository root `AGENTS.md` and use the relevant skill under `.agents/skills/`. Skills guide a workflow; product decisions in these docs remain authoritative.
