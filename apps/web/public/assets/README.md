# Wafflr artwork library

Canonical inventory and production rules for raster artwork served by the web app. This is a planned asset manifest: a filename listed here is a specification, **not confirmation that the binary file already exists**.

## Art direction

Wafflr should feel like a bright, tactile, playful cartoon game: candy colors, warm waffle/syrup tones, confident outlines, glossy highlights used selectively, soft dimensional shadows, and friendly food characters. Keep the art consistent across all assets. Do not bake words, room names, counters, codes, card titles, progress values, or other changing content into images; render those as accessible HTML/React content.

## File and export rules

- Ship transparent UI elements and characters as **WebP with alpha**. Use opaque WebP for full-bleed backgrounds where transparency is not needed.
- The dimensions below are **source pixel dimensions**, not CSS display sizes. CSS scales them responsively.
- Transparent padding is measured from the canvas edge to the visible artwork. Keep normal, pressed, selected, and disabled states on identical canvases and aligned to avoid visual jumps.
- For round controls, leave roughly 4–6% of the canvas transparent on each edge. For buttons, leave about 3–5%. For characters, leave about 3% or enough space to avoid clipping limbs, props, or shadows.
- For panels, protect the border/corners and keep a clear live-content safe area. Prefer CSS/nine-slice framing when the panel must stretch; do not stretch the whole raster and distort its corners.
- Use individual images for static elements. Use sprite sheets only for real frame-based animation or a closely related set of frames. Sprite frames must use equal-sized cells, consistent alignment, and a documented frame count and duration.
- Use `object-fit: contain` for artwork that must not distort. Use `cover` only for intended full-bleed backgrounds.
- Optimize files before committing. Avoid baking a background matte into transparent assets.
- A file should be added to this manifest only when the name, dimensions, padding/safe area, and intended use are agreed. Update the status as assets are produced if you later add a tracking column.

## Asset inventory

Padding means transparent margin unless described as a content-safe area. Sprite sheet dimensions are the whole sheet; frame layout is specified in the notes.

| Image filename (relative to `public/assets/`) | Resolution (px) | Padding / safe area | Purpose / notes |
|---|---:|---|---|
| **Brand and persistent header** | | | |
| `ui/wordmark/wafflr-wordmark.webp` | 1000 × 320 | 30 px | Main wordmark; transparent background |
| `ui/wordmark/wafflr-mark.webp` | 512 × 512 | 24 px | Standalone brand mark |
| `ui/header/header-pill.webp` | 1024 × 256 | 24 px; center clear | Header container artwork |
| `ui/header/your-rooms-pill.webp` | 640 × 192 | 16 px; label/count safe area | Your Rooms control |
| `ui/header/room-code-plaque.webp` | 768 × 256 | 20 px; center clear | Live room code overlay |
| `ui/header/room-status-badge.webp` | 512 × 192 | 16 px; live label | Room status |
| **Buttons and controls** | | | |
| `ui/buttons/round/back.webp` | 256 × 256 | 10–14 px | Back button |
| `ui/buttons/round/back-pressed.webp` | 256 × 256 | Match normal state | Pressed back button |
| `ui/buttons/round/close.webp` | 256 × 256 | 10–14 px | Close button |
| `ui/buttons/round/close-pressed.webp` | 256 × 256 | Match normal state | Pressed close button |
| `ui/buttons/round/settings.webp` | 256 × 256 | 10–14 px | Settings icon button |
| `ui/buttons/round/qr-scan.webp` | 256 × 256 | 10–14 px | QR scan icon button |
| `ui/buttons/primary/button-primary.webp` | 768 × 256 | 16–24 px; label safe area | Shared primary button |
| `ui/buttons/primary/button-primary-pressed.webp` | 768 × 256 | Match normal state | Pressed primary state |
| `ui/buttons/primary/button-primary-disabled.webp` | 768 × 256 | Match normal state | Disabled primary state |
| `ui/buttons/secondary/button-secondary.webp` | 768 × 256 | 16–24 px; label safe area | Shared secondary button |
| `ui/buttons/secondary/button-secondary-pressed.webp` | 768 × 256 | Match normal state | Pressed secondary state |
| `ui/buttons/secondary/button-secondary-disabled.webp` | 768 × 256 | Match normal state | Disabled secondary state |
| `ui/buttons/secondary/button-danger.webp` | 768 × 256 | 16–24 px; label safe area | Destructive action |
| `ui/buttons/icon/button-icon.webp` | 256 × 256 | 10–14 px | Reusable icon-button base, if needed |
| `ui/buttons/voting/yep-button.webp` | 512 × 512 | 16–24 px | Yep vote |
| `ui/buttons/voting/yep-button-pressed.webp` | 512 × 512 | Match normal state | Pressed Yep vote |
| `ui/buttons/voting/nah-button.webp` | 512 × 512 | 16–24 px | Nah vote |
| `ui/buttons/voting/nah-button-pressed.webp` | 512 × 512 | Match normal state | Pressed Nah vote |
| `ui/buttons/voting/veto-button.webp` | 512 × 256 | 16–20 px; label safe area | Creator veto action |
| `ui/buttons/voting/edit-button.webp` | 256 × 256 | 10–14 px | Edit action |
| `ui/buttons/voting/remove-button.webp` | 256 × 256 | 10–14 px | Remove action |
| `ui/buttons/voting/skip-button.webp` | 512 × 256 | 16–20 px; label safe area | Skip/finish action |
| `ui/buttons/voting/submit-votes-button.webp` | 768 × 256 | 16–24 px; label safe area | Submit ballot |
| **Panels, dialogs, and layout frames** | | | |
| `ui/panels/panel-standard.webp` | 1024 × 768 | 24 px outer; clear center | Standard panel |
| `ui/panels/panel-tall.webp` | 768 × 1024 | 24 px outer; clear center | Portrait panel |
| `ui/panels/panel-wide.webp` | 1536 × 768 | 32 px outer; clear center | Wide desktop panel |
| `ui/panels/modal-frame.webp` | 1024 × 1024 | 32 px outer; content-safe center | Square modal |
| `ui/panels/modal-frame-tall.webp` | 768 × 1024 | 24 px outer; content-safe center | Tall modal |
| `ui/panels/bottom-sheet-frame.webp` | 1024 × 768 | 24 px outer; preserve top corners | Mobile bottom sheet |
| `ui/panels/section-frame.webp` | 1024 × 512 | 24 px outer | Section container |
| `ui/panels/empty-state-frame.webp` | 768 × 768 | 24 px outer; clear center | Empty state frame |
| `ui/panels/tooltip-frame.webp` | 512 × 256 | 16 px outer | Tooltip frame |
| `ui/panels/countdown-frame.webp` | 512 × 512 | 20 px outer; center clear | Countdown backing |
| **Home and room setup** | | | |
| `ui/tiles/template-eat.webp` | 512 × 512 | 16 px | Where to Eat tile illustration |
| `ui/tiles/template-watch.webp` | 512 × 512 | 16 px | What to Watch tile illustration |
| `ui/tiles/template-do.webp` | 512 × 512 | 16 px | What to Do tile illustration |
| `ui/tiles/template-custom.webp` | 512 × 512 | 16 px | Custom tile illustration |
| `ui/tiles/template-selected.webp` | 512 × 512 | 16 px | Optional selected treatment; prefer CSS if sufficient |
| `ui/tiles/mode-creator-builds.webp` | 768 × 512 | 20 px; live label safe area | Creator supplies all cards |
| `ui/tiles/mode-guests-contribute.webp` | 768 × 512 | 20 px; live label safe area | Guests contribute cards |
| `ui/controls/stepper-minus.webp` | 256 × 256 | 10–14 px | Decrement control |
| `ui/controls/stepper-plus.webp` | 256 × 256 | 10–14 px | Increment control |
| `ui/controls/selection-check.webp` | 256 × 256 | 10–14 px | Selected/check state |
| **Cards and deck building** | | | |
| `ui/cards/card-frame.webp` | 768 × 1024 | 24 px outer; title-safe center | Standard card frame |
| `ui/cards/card-frame-selected.webp` | 768 × 1024 | Match normal state | Selected card frame |
| `ui/cards/card-frame-disabled.webp` | 768 × 1024 | Match normal state | Disabled/locked card frame |
| `ui/cards/card-slot-empty.webp` | 512 × 512 | 16 px; center clear | Empty card slot |
| `ui/cards/card-slot-filled.webp` | 512 × 512 | 16 px; live title safe area | Filled card slot |
| `ui/cards/card-category-eat.webp` | 256 × 256 | 10–14 px | Eat category icon |
| `ui/cards/card-category-watch.webp` | 256 × 256 | 10–14 px | Watch category icon |
| `ui/cards/card-category-do.webp` | 256 × 256 | 10–14 px | Do category icon |
| `ui/cards/card-category-custom.webp` | 256 × 256 | 10–14 px | Custom category icon |
| `ui/cards/card-number-badge.webp` | 256 × 256 | 10–14 px; number remains live | Card number backing |
| `ui/cards/card-count-meter.webp` | 768 × 192 | 16 px; live count safe area | Card limit meter, e.g. 12 / 100 |
| `ui/cards/card-edit-overlay.webp` | 512 × 512 | 16 px; clear center | Optional edit overlay |
| `ui/cards/card-remove-overlay.webp` | 512 × 512 | 16 px; clear center | Optional remove overlay |
| **Joining and QR** | | | |
| `ui/join/code-entry-frame.webp` | 1024 × 256 | 24 px; input-safe center | Room-code input backing |
| `ui/join/code-digit-cell.webp` | 256 × 320 | 12 px; character-safe center | One live code character |
| `ui/join/qr-scanner-frame.webp` | 768 × 768 | 24 px; scanner window clear | QR scanner border/frame |
| `ui/join/qr-scan-guide.webp` | 512 × 512 | 16 px; transparent center | Scanner guide overlay |
| `ui/join/qr-placeholder-frame.webp` | 768 × 768 | 24 px; QR generated separately | QR container, not the QR itself |
| **Voting and results** | | | |
| `ui/voting/swipe-hint-left.webp` | 512 × 256 | 16 px | Left-swipe hint |
| `ui/voting/swipe-hint-right.webp` | 512 × 256 | 16 px | Right-swipe hint |
| `ui/voting/vote-progress-track.webp` | 1024 × 128 | 12 px | Decorative track; fill is live CSS |
| `ui/voting/vote-progress-cap.webp` | 128 × 128 | 8 px | Optional progress end cap |
| `ui/voting/submitted-state-badge.webp` | 512 × 256 | 16 px | Ballot submitted indicator |
| `ui/results/winner-card-frame.webp` | 1024 × 1024 | 32 px; live winner title safe area | Winner presentation frame |
| `ui/results/tally-row-frame.webp` | 1024 × 192 | 16 px; live title/count safe area | Tallies list row |
| `ui/results/tally-yep-icon.webp` | 256 × 256 | 10–14 px | Yep tally indicator |
| `ui/results/tally-nah-icon.webp` | 256 × 256 | 10–14 px | Nah tally indicator |
| `ui/results/tie-badge.webp` | 512 × 256 | 16 px | Tie state |
| `ui/results/final-choice-frame.webp` | 768 × 512 | 20 px; live winner safe area | Creator's final tie choice |
| **Your Rooms and room states** | | | |
| `ui/history/room-list-row.webp` | 1024 × 256 | 16 px; live details safe area | Room list row |
| `ui/history/created-counter-badge.webp` | 512 × 192 | 16 px; count remains live | Created lifetime counter |
| `ui/history/joined-counter-badge.webp` | 512 × 192 | 16 px; count remains live | Joined lifetime counter |
| `ui/history/room-active-badge.webp` | 384 × 128 | 12 px | Active room state |
| `ui/history/room-completed-badge.webp` | 384 × 128 | 12 px | Completed room state |
| `ui/history/room-expired-badge.webp` | 384 × 128 | 12 px | Expired room state, if shown |
| `ui/history/no-rooms-illustration.webp` | 768 × 768 | 24 px | No-room illustration |
| **Notifications, loading, and errors** | | | |
| `ui/feedback/toast-success.webp` | 1024 × 256 | 20 px; message remains live | Success toast frame |
| `ui/feedback/toast-warning.webp` | 1024 × 256 | 20 px; message remains live | Warning toast frame |
| `ui/feedback/toast-error.webp` | 1024 × 256 | 20 px; message remains live | Error toast frame |
| `ui/feedback/toast-info.webp` | 1024 × 256 | 20 px; message remains live | Info toast frame |
| `ui/feedback/error-panel.webp` | 768 × 768 | 24 px; error details live | Error state panel |
| `ui/feedback/connection-lost.webp` | 512 × 512 | 16 px | Connection-lost illustration |
| `ui/feedback/loading-spinner.webp` | 512 × 512 | Sprite: 4 × 4 cells, 16 frames | Equal 128 × 128 px cells; transparent background |
| `ui/feedback/empty-search.webp` | 512 × 512 | 16 px | Empty search/result illustration if needed |
| **Decorative effects and backgrounds** | | | |
| `ui/effects/confetti-burst.webp` | 1024 × 1024 | Transparent around particles | Single celebration effect |
| `ui/effects/sparkle-burst.webp` | 512 × 512 | Transparent around sparkles | Single sparkle effect |
| `ui/effects/sparkle-loop.webp` | 1024 × 1024 | Sprite: 4 × 4 cells, 16 frames | Equal 256 × 256 px cells |
| `ui/effects/celebration-stars.webp` | 1024 × 512 | Sprite: 4 × 2 cells, 8 frames | Equal 256 × 256 px cells |
| `backgrounds/home-background.webp` | 1920 × 1080 | Full bleed; none | Home background; keep important detail away from edges |
| `backgrounds/room-background.webp` | 1920 × 1080 | Full bleed; none | Room background |
| `backgrounds/celebration-background.webp` | 1920 × 1080 | Full bleed; none | Results/celebration background |
| **Butters the Waffle** | | | |
| `characters/butters/portraits/butters-portrait.webp` | 768 × 768 | 24 px | Character portrait |
| `characters/butters/poses/butters-welcome.webp` | 1024 × 1024 | 32 px | Home/welcome pose |
| `characters/butters/poses/butters-thinking.webp` | 1024 × 1024 | 32 px | Thinking pose |
| `characters/butters/poses/butters-waiting.webp` | 1024 × 1024 | 32 px | Waiting pose |
| `characters/butters/poses/butters-excited.webp` | 1024 × 1024 | 32 px | Excited pose |
| `characters/butters/poses/butters-tie.webp` | 1024 × 1024 | 32 px | Tie-breaker pose |
| `characters/butters/poses/butters-celebrating.webp` | 1024 × 1024 | 32 px | Winner celebration pose |
| `characters/butters/poses/butters-sad.webp` | 1024 × 1024 | 32 px | Disappointed pose; keep tone light |
| `characters/butters/animations/butters-idle-sheet.webp` | 2048 × 1024 | Sprite: 8 × 1 cells, 8 frames | Eight 256 × 1024 px frames; consistent baseline |
| `characters/butters/animations/butters-dance-sheet.webp` | 2048 × 1024 | Sprite: 8 × 1 cells, 8 frames | Eight 256 × 1024 px frames; consistent baseline |
| `characters/butters/animations/butters-bounce-sheet.webp` | 2048 × 1024 | Sprite: 8 × 1 cells, 8 frames | Eight 256 × 1024 px frames; consistent baseline |
| **Hugh Blueberry** | | | |
| `characters/hugh-blueberry/hugh-portrait.webp` | 768 × 768 | 24 px | Portrait |
| `characters/hugh-blueberry/hugh-waiting.webp` | 1024 × 1024 | 32 px | Waiting pose |
| `characters/hugh-blueberry/hugh-celebrating.webp` | 1024 × 1024 | 32 px | Celebration pose |
| **Strawberry Sue** | | | |
| `characters/strawberry-sue/sue-portrait.webp` | 768 × 768 | 24 px | Portrait |
| `characters/strawberry-sue/sue-waiting.webp` | 1024 × 1024 | 32 px | Waiting pose |
| `characters/strawberry-sue/sue-celebrating.webp` | 1024 × 1024 | 32 px | Celebration pose |
| **Barry Bacon** | | | |
| `characters/barry-bacon/barry-portrait.webp` | 768 × 768 | 24 px | Portrait |
| `characters/barry-bacon/barry-waiting.webp` | 1024 × 1024 | 32 px | Waiting pose |
| `characters/barry-bacon/barry-celebrating.webp` | 1024 × 1024 | 32 px | Celebration pose |
| **O.J.** | | | |
| `characters/oj/oj-portrait.webp` | 768 × 768 | 24 px | Portrait |
| `characters/oj/oj-waiting.webp` | 1024 × 1024 | 32 px | Waiting pose |
| `characters/oj/oj-celebrating.webp` | 1024 × 1024 | 32 px | Celebration pose |
| **Eggin Targaryen** | | | |
| `characters/eggin-targaryen/eggin-portrait.webp` | 768 × 768 | 24 px | Portrait |
| `characters/eggin-targaryen/eggin-tiebreaker.webp` | 1024 × 1024 | 32 px | Tie-breaker pose |
| `characters/eggin-targaryen/eggin-celebrating.webp` | 1024 × 1024 | 32 px | Celebration pose |

## Folder tree

```text
apps/web/public/assets/
├── README.md
├── backgrounds/
│   ├── home-background.webp
│   ├── room-background.webp
│   └── celebration-background.webp
├── ui/
│   ├── wordmark/
│   ├── header/
│   ├── buttons/
│   │   ├── round/
│   │   ├── primary/
│   │   ├── secondary/
│   │   ├── icon/
│   │   └── voting/
│   ├── panels/
│   ├── tiles/
│   ├── controls/
│   ├── cards/
│   ├── join/
│   ├── voting/
│   ├── results/
│   ├── history/
│   ├── feedback/
│   └── effects/
└── characters/
    ├── butters/
    │   ├── portraits/
    │   ├── poses/
    │   └── animations/
    ├── hugh-blueberry/
    ├── strawberry-sue/
    ├── barry-bacon/
    ├── oj/
    └── eggin-targaryen/
```

## What should remain live UI, not artwork

Keep all variable or accessible content in React/HTML: room titles, room codes, form inputs, template names, card titles, guest quotas, card counts, vote totals, progress fills, countdown values, toast copy, room-history metadata, and button labels. The artwork should provide the frame, texture, illustration, silhouette, and visual state only.

## Scope and reuse

This inventory is intentionally comprehensive, but not every proposed file needs to be generated if CSS or an existing shared asset achieves the same result. In particular, use CSS for simple selected/disabled states, progress fills, and basic icons when it is cleaner. Avoid making one unique asset for every screen when a shared frame works. Add actual files to Git only after they have been generated, reviewed, optimized, and checked against this manifest.
