# Biome Rule

## Purpose

Document biome-selection rules for `zoneBiome`, `contentBiome`, and `metaObjectsBiome`.

## Source-of-Truth Types/Files

- `BiomeRule.cs`
- `BiomeRuleType.cs`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type` | biome rule | enum string | `MatchZone` | optional | `FromList`, `MatchZone`, `MatchMainObject` | parsed by builder | depends on type | parse/log error | `"MatchMainObject"` |
| `args[]` | biome rule | array | none | conditional | strings | interpreted by rule type | biomes, zone names, main-object indices | unresolved/circular refs | `["0"]` |

## Defaults

- type defaults to `MatchZone`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `FromList`
- `MatchZone`
- `MatchMainObject`

## Resolution/Derivation Behavior

- rules are resolved after main-object factions are resolved
- builder supports dependency chains and cycle detection
- some forms support `differentFrom:` constraints

## External References Used

- zone names
- main-object indices
- biome ids from content database

## Validation Rules

- referenced zones/main objects must exist
- cycle detection should be treated as blocking

## Common Failure Modes

- invalid zone name in `MatchZone`
- invalid main-object index in `MatchMainObject`
- circular dependency across zones

## Example Snippets From Shipped Templates

```json
{ "type": "MatchZone", "args": ["Spawn-A"] }
```

## Editor Implications

- use a rule builder with zone and main-object pickers
- show resolved biome previews, not only raw rules
