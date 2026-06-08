# Memory Lane

## Source Files

- `external/map_templates/Memory Lane.rmg.json`
- `RandomMapTemplate.cs`

## Inventory

- size: `192x192`
- game mode: `SingleHero`
- variants: `1`
- zones: `25`
- connections: `50`
- main objects: `16`
- players/spawns: `Player1`, `Player2`

## Archetype

Portal-network and connector-heavy scenario map.

## Special Semantics

- many portal/default/direct connections
- explicit `road: true/false` on many connections in shipped data
- many connector and treasure sub-roles

## Observed In Shipped Templates

- the largest zone and connection counts in the current shipped set

## Unique Risks

- large graph with many edge names
- strong dependence on connection-level data that is not fully represented in the currently inspected primary authoring type
