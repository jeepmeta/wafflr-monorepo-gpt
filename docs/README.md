# Wafflr Documentation

This directory is the maintained product and technical reference for Wafflr. It records decisions before implementation so the product can be built consistently and the docs can evolve alongside it.

## Documents
- [Product vision and scope](./product-vision.md): purpose, users, principles, initial release, and future direction.
- [User journeys and lifecycle](./user-journeys.md): host and guest journeys, room phases, and live-review behavior.
- [Screen catalog](./screen-catalog.md): intended screens, responsibilities, controls, and states.
- [Decision engine](./decision-engine.md): deck construction, voting semantics, tallying, ties, and rules needing decisions.
- [Brand and characters](./brand-and-characters.md): Wafflr voice, Butters, food-character direction, and asset guidance.
- [Architecture](./architecture.md): monorepo boundaries, domain concepts, synchronization, and platform strategy.
- [Decision log](./decision-log.md): confirmed decisions, open questions, and a template for future changes.

## How to use these docs
Treat statements as Confirmed, Proposed, or Open. Do not silently turn a proposal into product behavior. When implementation reveals a mismatch, update the relevant doc in the same change as the code. When a product decision changes behavior, record it in the decision log and update affected flows, screens, and engine rules.

These docs describe intended behavior; they do not claim every feature already exists. The repository is a starter monorepo, and local install/build verification is separate work.

## Product at a glance
Wafflr is a playful, mobile-first group decision-making experience. A host creates a decision room, participants contribute options, and the group votes through a shared card-deck experience. Restaurants and “where should we eat?” are the initial use case. The reusable deck-and-vote model is intended to support other categories later.