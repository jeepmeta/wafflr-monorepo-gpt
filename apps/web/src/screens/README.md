# Screen map

Screens are grouped by the user journey they belong to. Keep screen-level UI in these folders; reusable controls and dialogs belong in `../components`.

1. `home/` — landing screen
2. `setup/` — create-room setup and join-room entry
3. `room/` — room setup, shared deck, host review, room-stage overlays
4. `voting/` — voting and ballot review
5. `results/` — winner and tie resolution
6. `history/` — Your Rooms

The legacy/local prototype and Supabase-backed app share the same journey folders. Keep screen filenames descriptive and import screens from their journey folder rather than placing new screen files at `src/` root.
