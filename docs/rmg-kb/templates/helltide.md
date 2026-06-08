# Helltide

## Source Files

- `external/map_templates/Helltide.rmg.json`
- `WinConditions.cs`
- `ConnectionType.cs`

## Inventory

- size: `128x128`
- game mode: `SingleHero`
- variants: `1`
- zones: `8`
- connections: `15`
- main objects: `14`
- players/spawns: `Player1`, `Player2`

## Archetype

Special rules scenario with win-condition zones and gladiator-arena behavior.

## Special Semantics

- `gladiatorArena` win-condition fields
- bonus targeting `start_hero`
- `GladiatorArena` connection type plus `Proximity`

## Observed In Shipped Templates

- win-condition-specific zones are explicit and role-like

## Unique Risks

- mode-specific fields are easy to miss in generic validators
- connection semantics go beyond plain direct/portal behavior
