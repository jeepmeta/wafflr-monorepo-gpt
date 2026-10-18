# Product Vision and Scope

## What Wafflr is
Wafflr (spelled W-A-F-F-L-R) is a gamified group decision-making product designed to reduce decision fatigue and decision anxiety. It gives a group a shared, structured way to turn “What should we do?” into a decision everyone can participate in.

## Problem and promise
Groups often get stuck because people have different preferences, hesitate to suggest options, or keep cycling through possibilities without reaching a decision. Wafflr lowers the effort of suggesting choices, makes preferences actionable, and gives the group a clear path to an outcome.

The promise: create a room, invite people, collect choices, vote, and see the group result—with a little personality along the way.

## Principles
- Low friction: joining through a shared link or QR code should be simple.
- Shared ownership: participants can contribute options rather than relying only on a host-created list.
- Clear progress: users can tell whether the room is collecting, reviewing, voting, waiting, or showing results.
- Understandable voting: the meaning of each action and how the winner is determined should be clear.
- Friendly tone: never shame people for their preferences or indecision.
- Reusable system: the deck and room lifecycle should work across categories.
- Mobile-first: responsive touch UX and an installable PWA first, with native mobile later.
- Documentation-led: product decisions are written down before implementation hardens them.

## Roles
Host: creates/manages a room, shares invitations, monitors submissions, reviews the deck, and starts voting.
Guest/participant: joins, contributes choices when allowed, finishes their contribution step, waits when appropriate, and votes.

Account requirements, identity, guest limits, and exact permissions are still open.

## Initial use case and future categories
The initial category is restaurants / where to eat. A group may use location-based options or have each participant submit one or more places they would consider. Participants join through a shared link or QR code.

“What should we watch?” is an example of a possible later category. A category can define its own option fields and card template while reusing the room, deck, and voting model.

Restaurant-data providers, location permissions, radius controls, and recommendation integrations have not been selected here.

## Brand
The name is Wafflr. The primary mascot is Butters, a cute waffle character. Visual explorations include bright, playful food characters with character-matched limbs, distinctive sneakers, and transparent backgrounds for reusable assets. See brand-and-characters.md.

## Platform
The selected direction is a pnpm and Turborepo monorepo using TypeScript, React, Vite, Tailwind CSS v4, and PWA support. Expo / React Native is a future client. Platform-neutral decision logic belongs in a shared core package.

## Not yet a promise
Do not assume subscriptions, advertising, mandatory accounts, persistent profiles, AI recommendations, chat, calendar integrations, payments, exact participant limits, or a specific restaurant-data provider. These require explicit decisions.