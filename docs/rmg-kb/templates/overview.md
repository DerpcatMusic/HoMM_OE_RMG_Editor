# Shipped Templates Overview

## Source Files

- all `external/map_templates/*.rmg.json`
- `RandomMapTemplate.cs`

## Inventory

| Template | Size | Variants | Zones | Connections | Main Objects | Spawns | Distinctive Traits |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- |
| Crossroads | 96x96 | 1 | 9 | 11 | 6 | P1,P2 | compact duel, connectors, portal/proximity mix |
| Fair'n Square | 128x128 | 1 | 12 | 16 | 20 | P1,P2,P3,P4 | symmetric FFA hub with many connection-placed anchors |
| Harmony | 128x128 | 1 | 8 | 11 | 10 | P1,P2 | single-hero scenario, mandatory-content road targets |
| Helltide | 128x128 | 1 | 8 | 15 | 14 | P1,P2 | gladiator arena mode, win-condition zones |
| Jebus Cross | 160x160 | 1 | 5 | 24 | 17 | P1,P2 | large center jackpot, many count-limit presets |
| Jebus Outcast | 160x160 | 3 | 5 per variant | 22 per variant | 21 per variant | P1,P2 | multi-variant single-hero jebus-style map |
| Memory Lane | 192x192 | 1 | 25 | 50 | 16 | P1,P2 | portal network and road=false/true connection flags |
| Shamrock | 160x160 | 1 | 16 | 21 | 16 | P1,P2,P3 | 3-player classic, second-spawn roles, city-hold fields |

## Common Patterns

- graph-first design
- heavy local preset use
- dense reference structure
- strong dependence on zone roles and road authoring

## Observed In Shipped Templates

- 8 shipped templates
- sizes from `96x96` to `192x192`
- variants count from `1` to `3`

## Common Risks

- unnamed connections in some templates
- string-vs-array inconsistencies
- fields present in data but absent from currently inspected primary types
