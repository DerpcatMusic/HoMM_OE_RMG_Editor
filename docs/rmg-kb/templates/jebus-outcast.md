# Jebus Outcast

## Source Files

- `external/map_templates/Jebus Outcast.rmg.json`
- `RandomMapTemplate.cs`

## Inventory

- size: `160x160`
- game mode: `SingleHero`
- variants: `3`
- zones per variant: `5`
- connections per variant: `22`
- main objects per variant: `21`
- players/spawns: `Player1`, `Player2`

## Archetype

Multi-variant single-hero Jebus-style map with heavy center and side structure.

## Special Semantics

- three variants
- explicit owned cities in starts
- many repeated uniform placements

## Observed In Shipped Templates

- three full variants of the same broad archetype

## Unique Risks

- variant drift between near-duplicate structures
- rename/refactor work must be variant-aware
