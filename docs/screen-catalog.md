# Screen Catalog

Screen names below are descriptive; route paths and final layouts are not yet fixed. These are intended screens and states, not a claim that they are implemented.

## Home / landing
Purpose: explain Wafflr quickly and provide a clear create/start action. A join-existing-room path may be useful if manual room entry is supported. Exact sections and navigation remain open.

## Create decision
Purpose: let the host configure a group choice. Restaurants / where to eat is the initial category. Only approved fields should be included. Room title, location, radius, cuisine/budget filters, participant limits, and category selection timing remain open.

## Invitation / room lobby
Purpose: help the host invite participants. Show a shareable link and QR code, room status, and useful instructions. Participant names, moderation controls, and readiness indicators remain open.

## Guest join
Purpose: enter the correct room with minimal friction. Show room context and any required join fields. Name/account requirements and invalid, expired, or closed-link behavior remain open.

## Guest option submission
Purpose: let guests contribute one or more candidate choices. Use a category-aware form and distinguish filled slots from unused slots. Confirmed: “I’m Done” allows a guest to finish with unused slots, and unused slots are skipped. Slot count, validation, duplicate detection, and editing rights remain open.

## Guest waiting screen
Purpose: keep guests informed while waiting for the room to advance. Confirmed: this screen exists. It should communicate the current status and feel intentional rather than frozen. Progress counts, character animation, and participant-level visibility remain open.

## Host collection / activity view
Purpose: show incoming options and room readiness before final review. It may be a separate screen or a mode of the lobby/review view; that is undecided.

## Host final deck review
Purpose: curate the exact set to be voted on. Confirmed layout: responsive card grid. Confirmed controls: edit and remove. Confirmed editing: reuse the existing card editor/form with Save and Cancel. Confirmed live behavior: accept submissions and edits in real time until voting starts. Confirmed boundary: starting voting locks the deck.

States should cover empty/partial deck, incoming updates, active edit, removal confirmation if one is chosen, and transition to voting. Remote updates must not silently overwrite unsaved host changes.

## Shared card editor / option form
Purpose: consistently create and edit options. Host review reuses this form with Save and Cancel. Guest submission can reuse fields and validation where appropriate. Category-specific fields, image support, and concurrent-edit handling remain open.

## Voting deck
Purpose: provide the core card-based vote. Swipe right means yes/keep; swipe left means no/reject. Show clear progress and readable card content, and provide accessible buttons as alternatives. Whether every participant sees every option, order/randomization, undo/change-vote behavior, and ballot completion rules remain open.

## Vote-complete / waiting state
Recommended state, not yet a confirmed separate screen. It would tell a participant their ballot is complete while waiting for the group or host. Whether all voters must finish before results are revealed remains open.

## Results
Purpose: show the winning option or tied finalists and explain the outcome. Ties may trigger another round. Exact tally visibility, individual vote visibility, celebration, and post-result actions remain open.

## Tie-break round
A further round may be used to resolve a tie. Whether only tied options are shown, whether all participants vote again, how many rounds are allowed, and how persistent ties are resolved are open.

## Shared error, loading, and recovery states
Cover invalid/expired links, join failures, connection loss, failed submissions, rejected edits, phase changes elsewhere, and attempts to vote on a stale deck. Explain what happened and the next available action; do not show stack traces.

## Responsive and accessibility expectations
Mobile-first layout; responsive host review grid; visible focus and semantic labels; keyboard operation on web; readable contrast; do not rely on color, animation, or swipes alone; respect reduced-motion preferences.