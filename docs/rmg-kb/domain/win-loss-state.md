# Win Loss State

## Entity Card

- Name: `Win/Loss State`
- Category: map-wide gameplay outcome semantics exposed through RMG
- Source Types: `WinConditions`, `ContentPlacer`
- Authoring Representation: `gameRules.winConditions`
- Runtime Representation: `MapWinCondition[]` in final map settings
- References Out: players, start city, start hero, special modes
- References In: game rules and map mode
- Critical Invariants: start-city/start-hero semantics must match intended player structure
- Editor Risks: treating these as generic booleans without player context

## Code Fact

RMG directly controls loss conditions such as:

- lose on start city
- lose on start hero
- gladiator arena mode

## Observed In Shipped Templates

- single-hero templates usually rely on `lostStartHero`
- some classic templates use `lostStartCity`

## Inference

The editor should present win/loss conditions in a player-structure context, not as disconnected raw flags.
