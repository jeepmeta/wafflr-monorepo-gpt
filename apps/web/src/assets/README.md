# Wafflr asset registry and layout notes

The canonical asset inventory is [public/assets/README.md](../../../public/assets/README.md). The typed registry in `src/assets/registry.ts` is generated from that inventory and exposes stable keys, public URLs, source dimensions, aspect ratios, and notes. Keep the README as the source of truth; regenerate or update the registry when filenames or dimensions change.

## Public path rule

Vite serves files in `apps/web/public` from the root URL. An asset at `public/assets/ui/cards/card-frame.webp` is referenced as `/assets/ui/cards/card-frame.webp`, not imported as a module. The registry contains these URLs; the actual WebP files must still be exported into the matching folders.

## Layout rules

- Use CSS Grid and Flexbox for screen layout. Use breakpoints to change columns, direction, spacing, and component sizing—not to swap in a separate screenshot of a whole screen.
- Use `object-fit: contain` for icons, characters, and artwork that must stay intact. Use `cover` for intentional full-bleed backgrounds. Use `fill` only for skins designed to stretch without visible distortion.
- Keep artwork positioned as a decorative image layer and put changing copy, labels, inputs, and numbers in semantic HTML above it. Avoid baking variable text into images.
- Give each layered component a stable content-safe area. The component owns internal text spacing; the screen owns its outer placement and responsive grid.
- Don't scale raster borders indiscriminately. For panels with ornate corners, prefer CSS border-image/nine-slice or a frame asset designed for the target aspect ratio. Use separate wide/tall frame variants when the corners cannot stretch cleanly.
- Keep hit targets at least 44 CSS pixels, preserve visible focus, and respect reduced-motion preferences.
- Test at narrow phones (~320 px), common phones (~390 px), tablet widths (~768 px), and desktop widths (~1024 px and above), including long card titles and large counters.

## Component responsibilities

- `ArtworkImage`: one standalone image, with intrinsic source dimensions and fit behavior.
- `ArtworkSurface`: a layered visual container for pills and compact decorative surfaces.
- `ArtworkButton`: interactive image-backed button; label remains live HTML.
- `ArtworkPanel` / `ArtworkCard`: image-backed layout containers with responsive content padding.
- `CounterPill`: reusable label/value pill with a live numeric value.

Use the component that fits the behavior, not a new component for every file. Pass a registry entry's `.src` and its dimensions to the relevant component. Missing images during asset production will appear as missing until the WebP file is added; the registry intentionally does not fabricate placeholder artwork.
