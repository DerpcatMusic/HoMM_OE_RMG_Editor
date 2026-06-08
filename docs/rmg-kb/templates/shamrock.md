# Shamrock

## Source Files

- `external/map_templates/Shamrock.rmg.json`
- `WinConditions.cs`

## Inventory

- size: `160x160`
- game mode: `Classic`
- variants: `1`
- zones: `16`
- connections: `21`
- main objects: `16`
- players/spawns: `Player1`, `Player2`, `Player3`

## Archetype

Three-player classic map with center, side, treasure, and second-spawn roles.

## Special Semantics

- `BoundingCircle` orientation
- second-spawn layouts
- observed `cityHold`/`cityHoldDays`
- unnamed connections present in shipped data

## Observed In Shipped Templates

- three players with explicit second-spawn role modeling

## Unique Risks

- unnamed connections combined with rich road/graph semantics
- second-spawn role needs explicit editor support to avoid flattening it into generic spawn logic
