# AI agent guide

## Instruction hierarchy
Start with root `AGENTS.md`, then read this guide and the relevant product/architecture references. Focused workflows are in `.agents/skills/*/SKILL.md`. GitHub Copilot also receives a short summary from `.github/copilot-instructions.md`.

## Reference map
- Product scope and audience: `product-vision.md`
- Confirmed decisions and open questions: `decision-log.md`
- Screen inventory: `screen-catalog.md`
- UX behavior details: `ux-decision-catalog.md`
- User and room journeys: `user-journeys.md`
- Domain rules: `decision-engine.md`
- Package boundaries and backend architecture: `architecture.md`
- Brand and character use: `brand-and-characters.md`
- Security and retention: `security-and-data.md`
- Local development: `development-setup.md`

## Working protocol
1. Inspect the current implementation and tests before proposing a rewrite.
2. Identify confirmed requirements and any conflict with the requested change.
3. Make the smallest coherent change; preserve unrelated work.
4. Put shared domain rules in `packages/core`, shared design tokens in `packages/config`, and web-specific presentation in `apps/web`.
5. Add tests and update the relevant reference docs.
6. Run applicable checks and report exact outcomes, including any commands that could not run.

## Skills
- `wafflr-screen`: screen, modal, and responsive UI work
- `wafflr-design-system`: design tokens and shared styling
- `wafflr-domain-logic`: room lifecycle and voting rules
- `wafflr-supabase-change`: schema, RLS, realtime, and server-side rules

## Guardrails
Do not invent product decisions when the decision log is silent. Mark proposals as proposals and ask for clarification when an unresolved choice materially affects architecture or behavior. Never claim tests, deployments, migrations, or live services were verified unless they were actually run or inspected.
