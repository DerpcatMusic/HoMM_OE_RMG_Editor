# Harmony

## Source Files

- `external/map_templates/Harmony.rmg.json`
- `RandomMapTemplate.cs`

## Inventory

- size: `128x128`
- game mode: `SingleHero`
- variants: `1`
- zones: `8`
- connections: `11`
- main objects: `10`
- players/spawns: `Player1`, `Player2`

## Archetype

Single-hero scenario with mirrored center, spawn, back, and side roles.

## Special Semantics

- strong use of `MandatoryContent` road targets
- `lostStartHero` enabled
- match-zone biome semantics

## Observed In Shipped Templates

- multiple roads target named mandatory content

## Unique Risks

- multiple mandatory-content names become road endpoints
- scenario semantics depend on both player and portal-like content positioning
