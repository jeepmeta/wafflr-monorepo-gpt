# Shared configuration and design tokens

Edit `tokens.json` to change Wafflr's design values. It is the single editable source of truth for colors, shadows, radii, spacing, fonts, motion, and layout dimensions.

Run `pnpm tokens:build` from the repository root to regenerate:
- `src/tokens.css`: CSS custom properties and shared base accessibility styles
- `src/tokens.ts`: typed TypeScript token values

Run `pnpm tokens:check` to detect stale generated files. Do not hand-edit generated outputs.

Tailwind CSS v4 aliases are defined in `src/tailwind.css`; they map semantic utility names to the generated custom properties. For example, `bg-canvas`, `bg-surface`, `text-ink-muted`, `bg-brand-primary`, and `rounded-card`.
