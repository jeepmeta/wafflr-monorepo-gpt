# Product Vision and Scope

## What Wafflr is
Wafflr (spelled W-A-F-F-L-R) is a gamified group decision-making product designed to reduce decision fatigue and decision anxiety. It gives a group a shared, structured way to turn “What should we do?” into a decision everyone can participate in.

## Problem and promise
Groups often get stuck because people have different preferences, hesitate to suggest options, or keep cycling through possibilities without reaching a decision. Wafflr lowers the effort of suggesting choices, makes preferences actionable, and gives the group a clear path to an outcome.

The promise: create one room, optionally invite people to contribute choices, vote together, and get to a result—with a little personality and as little friction as possible.

## Principles
- Low friction: guests join by entering a room code or scanning a QR code.
- One shared game: everyone sees the same room, cards, phase, and outcome.
- Equal participation: the creator can build the full deck or invite guests to contribute; when guests contribute, the creator participates as a card contributor too.
- Minimal creator powers: the creator can veto cards before voting, end voting early if the game gets stuck, and choose the winner only if a tie remains after the tie-breaker round.
- Low decision friction: use sensible defaults and avoid extra settings, management mechanics, or decisions that do not materially improve the group experience.
- Clear progress: users can tell whether the room is collecting, reviewing, voting, waiting, or showing results.
- Understandable voting: the meaning of each action and how the winner is determined should be clear.
- Friendly tone: never shame people for their preferences or indecision.
- Reusable system: the deck and room lifecycle should work across categories.
- Mobile-first: responsive touch UX and an installable PWA first, with native mobile later.
- Documentation-led: product decisions are written down before implementation hardens them.

## Roles and permissions
Everyone participates in one shared room and sees the same authoritative game state. The creator chooses one of two setup paths:

- **Create all cards:** the creator prepares the deck and opens voting.
- **Invite guests to create cards:** the creator contributes cards under the same submission rules as guests. The creator can veto cards from the shared deck before voting, but does not get general editing or room-administration powers over other participants' contributions.

The creator has only three additional powers: veto cards during final review before voting starts, end voting early if the group is stuck or someone is taking too long, and select a winner if a tie remains after the tie-breaker round. These powers do not make the creator a general room administrator. All participants vote under the same rules. See `user-journeys.md`, `decision-engine.md`, and `ux-decision-catalog.md` for the detailed confirmed rules.

## Initial use case and future categories
The initial category is restaurants / where to eat. A group may use location-based options or have each participant submit one or more places they would consider. Guests join by entering a room code or scanning a QR code.

“What should we watch?” is an example of a possible later category. A category can define its own option fields and card template while reusing the room, deck, and voting model.

Restaurant-data providers, location permissions, radius controls, and recommendation integrations have not been selected here.

## Brand
The name is Wafflr. The primary mascot is Butters, a cute waffle character. Visual explorations include bright, playful food characters with character-matched limbs, distinctive sneakers, and transparent backgrounds for reusable assets. See brand-and-characters.md.

## Platform
The selected direction is a pnpm and Turborepo monorepo using TypeScript, React, Vite, Tailwind CSS v4, and PWA support. Expo / React Native is a future client. Platform-neutral decision logic belongs in a shared core package.

## Not yet a promise
Do not assume subscriptions, advertising, mandatory accounts, persistent profiles, AI recommendations, chat, calendar integrations, payments, exact participant limits, or a specific restaurant-data provider. These require explicit decisions.