# Wafflr Docs

## Product contract

- Product: **Wafflr**, a playful group decision tool.
- MVP categories: `eat` (Where to Eat), `watch` (What to Watch), `do` (What to Do), `custom`.
- Shared engine: one room, card deck, contribution, voting, tally, and result model for every category.
- Delivery: responsive React web app/PWA first. Expo/React Native is a future client; `apps/mobile` remains a placeholder.
- Backend: Supabase is selected but not connected. Do not imply persistence, realtime, or production security is already implemented.

## Source-of-truth documents

| File | Contract |
|---|---|
| [Development setup](./development-setup.md) | Local environment, commands, safe configuration, working agreements |
| [Backend plan](./backend-plan.md) | Supabase responsibilities, security, conceptual data, retention, sequence |
| [Official technical references](./references/README.md) | Official stack documentation |
| [User journeys](./user-journeys.md) | Host/guest flow, lifecycle, re-entry, synchronization |
| [Screen catalog](./screen-catalog.md) | Screen responsibilities, controls, states |
| [Decision engine](./decision-engine.md) | Category-neutral domain and voting rules |
| [Brand and characters](./brand-and-characters.md) | Voice, Butters, food characters, asset guidance |
| [Architecture](./architecture.md) | Workspace boundaries, tokens, platforms, sync |

## Change rules

- Keep these documents concise and consistent. Update the relevant document when confirmed behavior changes.
- Distinguish **confirmed**, **planned**, and **open** decisions; do not silently invent product behavior.
- Code may be incomplete even when a behavior is specified. Check implementation and tests before claiming a feature works.
- `AGENTS.md` and skills under `.agents/skills/` provide agent workflow instructions; this directory contains the product/technical contract.
