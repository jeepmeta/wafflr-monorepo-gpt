# Shared Configuration and Design Tokens

## Source of truth

Edit `tokens.source.json` only. It is the canonical design-token source for Wafflr. It generates:
- `src/tokens.css` for CSS custom properties and Tailwind CSS v4 theme mappings.
- `src/tokens.ts` for typed TypeScript access, including the future native app.

Do not hand-edit generated files.

## Commands

From the repository root:

```bash
pnpm tokens:generate
pnpm tokens:check
```

The generator uses only Node.js built-ins. Run generation after editing the JSON and commit the source plus generated outputs together.

## Naming

Prefer semantic tokens such as `pageBackground`, `surface`, `textPrimary`, `actionPrimary`, and `positive`. Compatibility aliases remain for existing prototype styles and should be migrated gradually rather than removed in a broad sweep.

Tailwind v4 utilities are mapped in generated CSS under `@theme inline`. For example, `bg-page`, `bg-brand-primary`, `text-text-primary`, and `rounded-card` are available where Tailwind processes the stylesheet.

The mobile app is a placeholder. When Expo work begins, consume the generated TypeScript values or a version-compatible NativeWind integration; do not assume web CSS works natively.
