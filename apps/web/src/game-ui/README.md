# Artwork-first game UI

The web app's artwork primitives live here. Import from `./game-ui` or the folder's `index.ts` barrel.

## Registry

- `assets.ts` is the central registry for the full inventory in `apps/web/public/assets/README.md`.
- Use `wafflrAssets.ui...` paths instead of typing asset paths directly in screen components.
- `wafflrAssetManifest` records the planned path, source dimensions, aspect ratio, and intended use for every inventory item.
- The inventory is a plan, not proof that a binary exists. Add the WebP file at the documented path before using it at runtime.
- Vite serves files under `public/assets` from `/assets/...`; do not import public files as JavaScript modules.

## Components

- `SocialIcon`: one reusable, accessible link for X, YouTube, Instagram, and Discord; supply the platform and destination URL.
- `ImageButton`: accessible native button with normal, pressed, and disabled artwork variants.
- `GamePanel`: nine-slice frame so panel corners stay intact as the content area grows.
- `GameCard`: standard decision card; category icons and frame states come from the registry, while titles/descriptions stay live text.
- `CounterPill`: artwork-backed label and changing count.
- `GameBadge`: artwork-backed short label.
- `ArtworkFrame`: fixed-proportion image frame with a live React content layer.
- `ArtworkInput`: real input field that can be styled over input artwork.
- `AssetImage`: helper for registry-backed images.
- `SpriteSheet`: frame-based sprite sheet animation.

## Layout rules

Keep artwork and content separate. Images provide the visual shell; HTML/React supplies changing text, numbers, form controls, and accessible names. Use the Wafflr display font and shared design tokens for live text, not images of individual letters.

Use CSS Grid and Flexbox for page and card layouts. Set explicit aspect ratios for fixed artwork; use `object-fit: contain` for artwork that must remain whole. Use `cover` only for intentional full-bleed backgrounds. Use `GamePanel` or another nine-slice frame for panels that must grow with text; do not stretch a whole panel image and distort its corners.

Responsive behavior is mobile-first. Let text wrap inside a defined content-safe area, use `min-width: 0` and `overflow-wrap: anywhere` where long content could overflow, and use `clamp()` for fluid sizes. At breakpoints, rearrange the surrounding layout rather than changing the proportions of the artwork. Test narrow phones, larger phones, tablets, and desktop widths.

Avoid adding inline style rules for individual assets. All web-app styles live in `apps/web/src/styles.css`. Keep it as the single app-level stylesheet; do not add screen-specific CSS files. Prefer reusable artwork components for visual surfaces, and use the shared stylesheet for layout, responsive behavior, accessibility, and live text.

## Adding assets

Add the file using the exact path and dimensions documented in `public/assets/README.md`. If the filename or purpose changes, update that README and `assets.ts` together. Keep changing content out of the image. Keep normal, pressed, selected, and disabled variants aligned on identical canvases.
