# Fair'n Square

## Source Files

- `external/map_templates/Fair'n Square.rmg.json`
- `RandomMapTemplate.cs`

## Inventory

- size: `128x128`
- game mode: `Classic`
- variants: `1`
- zones: `12`
- connections: `16`
- main objects: `20`
- players/spawns: `Player1` through `Player4`

## Archetype

Symmetric FFA hub with many spawn and treasure spokes.

## Special Semantics

- heavy use of `placement = Connection`
- explicit owned cities for each player
- portal and direct connection mix

## Observed In Shipped Templates

- four explicit player-owned cities

## Unique Risks

- many connection names are central to anchor placement
- main-object order and connection refs are especially dense
