# Wafflr UI artwork

Store production-ready transparent WebP artwork here. Keep the original/source artwork outside the app or in the agreed source-art location; this directory contains assets the browser can serve directly.

## Conventions

- Use descriptive, lowercase kebab-case names: `create-room.webp`, `primary-pressed.webp`.
- Keep reusable assets organized by role, not by screen.
- Use individual images for buttons, wordmarks, header pills, panels, card frames, badges, and other static UI art.
- Put state variants beside each other, for example `create-room.webp`, `create-room-pressed.webp`, and `create-room-disabled.webp`.
- Use a sprite sheet when the frames are a single animation or tightly related icon set. Keep every frame the same size and use a regular grid. Record its columns, rows, frame count, and frame duration in the asset manifest.
- Keep live text, user-entered text, room titles, room counts, and card data as HTML/React text layered over the artwork. Do not bake content that changes into the image.
- Use `object-fit: contain` for image elements whose silhouette must not stretch. Define an explicit aspect ratio when the asset has a known composition.
- Preserve transparency. Do not add a background matte to assets intended to sit over the app background.
- Optimize files before committing them; avoid oversized exports. Prefer WebP for shipped raster artwork.

## Planned folders

```text
assets/
  ui/
    wordmark/
    header/
    buttons/
      primary/
      secondary/
      icon/
    panels/
    cards/
    badges/
    icons/
  characters/
    butters/
      idle/
      dance/
    hugh-blueberry/
    strawberry-sue/
    barry-bacon/
    oj/
    eggin-targaryen/
  backgrounds/
  effects/
```

Folders will appear in Git once they contain actual artwork. No fake/placeholder binary images are committed by this scaffold.
