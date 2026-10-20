# Official Technical References

These links are starting points for implementation. Prefer official documentation, verify version-specific instructions, and update this page when the selected stack changes.

## Monorepo and package management
- [Turborepo: Structuring a repository](https://turbo.build/repo/docs/crafting-your-repository/structuring-a-repository)
- [Turborepo: Configuring tasks](https://turbo.build/repo/docs/crafting-your-repository/configuring-tasks)
- [pnpm workspaces](https://pnpm.io/workspaces)

## Web and styling
- [Vite guide](https://vite.dev/guide/)
- [Tailwind CSS v4 theme variables](https://tailwindcss.com/docs/theme)
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite)
- [Vite PWA plugin](https://vite-pwa-org.netlify.app/)

## React Native later
- [Expo documentation](https://docs.expo.dev/)
- [NativeWind documentation](https://www.nativewind.dev/)
- Do not assume browser CSS or every Tailwind v4 feature works in React Native; confirm the integration against the exact NativeWind/Expo versions selected when mobile work begins.

## Supabase
- [Supabase documentation](https://supabase.com/docs)
- [Database and Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Realtime](https://supabase.com/docs/guides/realtime)
- [Database functions](https://supabase.com/docs/guides/database/functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Repository practice
- Prefer versioned migrations and checked-in configuration over undocumented manual dashboard edits.
- Never commit secrets or real environment files.
- Official docs are reference material, not a substitute for the Wafflr product rules in `docs/`.
