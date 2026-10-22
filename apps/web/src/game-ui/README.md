# Artwork-first game UI

Use the exported components in this folder to keep raster artwork separate from interaction and live content.

- `ImageButton`: individual WebP button art with optional pressed/disabled variants. The native button remains the click/focus target.
- `SpriteSheet`: a regular-grid sprite sheet, optionally advanced frame by frame. Supply exact `columns`, `rows`, `frameCount`, and `frameDurationMs` values for the art.
- `game-ui.css`: shared baseline styles for these primitives.

Import the stylesheet once from the web app's global stylesheet. Do not add inline CSS for individual assets. Add assets under `public/assets` and reference them by root-relative path, such as `/assets/ui/buttons/create-room.webp`.

Keep changing information in React/HTML: room titles, room counts, text inputs, room lists, card names, vote tallies, and statuses. Put a transparent image frame behind or around these elements, then position live content in a separate layout layer. Fixed artwork labels can be baked into WebP; variable labels must remain live text.

Avoid scaling an asset non-uniformly. Preserve its aspect ratio and use intentional contain/cover behavior per asset. Responsive layouts may reposition and uniformly scale a composition, but should not reflow the artwork or wrap baked-in labels.
