# Crossroads

## Source Files

- `external/map_templates/Crossroads.rmg.json`
- `RandomMapTemplate.cs`

## Inventory

- size: `96x96`
- game mode: `Classic`
- variants: `1`
- zones: `9`
- connections: `11`
- main objects: `6`
- players/spawns: `Player1`, `Player2`
- local defs: `3` zone layouts, `4` mandatory presets, `4` count-limit presets

## Archetype

Compact duel / small classic with spawn, side, treasure, and connector structure.

## Special Semantics

- includes both `Portal` and `Proximity` connection types
- one connection is explicitly `road: false` in shipped data

## Observed In Shipped Templates

- `contentCountLimits` appears in both array and string style forms

## Unique Risks

- connector naming matters because roads target connection names heavily
- one zone uses string-style `contentCountLimits` form rather than array form
