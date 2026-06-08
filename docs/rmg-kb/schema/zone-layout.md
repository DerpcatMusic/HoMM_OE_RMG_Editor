# Zone Layout

## Purpose

Document reusable zone-layout configuration for obstacle fill, elevation, lakes, and resource fractions.

## Source-of-Truth Types/Files

- `ZoneLayoutConfig.cs`
- shipped templates
- `MapDescriptionBuilder.cs`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | zone layout | string | none | required | layout id | stored in local/global layout collection | zone refs | unresolved layout id | `"zone_layout_spawn"` |
| `obstaclesFill` | zone layout | float | `0.4` | optional | float | copied to runtime layout config | none | obstacle density drift | `0.3` |
| `obstaclesFillVoid` | zone layout | float | `0.5` | optional | float | copied to runtime | none | obstacle density drift | `0.6` |
| `lakesFill` | zone layout | float | `0` | optional | float | copied to runtime | none | wrong lake density | `0.1` |
| `minLakeArea` | zone layout | int | `20` | optional | int | copied to runtime | none | wrong lake size floor | `20` |
| `elevationClusterScale` | zone layout | float | `0.15` | optional | float | copied to runtime | none | wrong elevation pattern | `0.2` |
| `elevationModes[]` | zone layout | array | one default mode | optional | zone-elevation mode objects | copied to runtime | none | broken elevation behavior | `[{...}]` |
| `roadClusterArea` | zone layout | int | `70` | optional | int | copied to runtime | none | road clustering drift | `70` |
| `guardedEncounterResourceFractions` | zone layout | object | default object | optional | resource fraction config | validated by builder | none | bracket validation failure | `{ "fractions": [0.5] }` |
| `ambientPickupDistribution` | zone layout | object | default object | optional | ambient distribution config | copied to runtime | none | pickup behavior drift | `{...}` |

## Defaults

- obstacle and elevation defaults come from the type, not from data omission semantics

## Resolution/Derivation Behavior

- layout id on a zone resolves through `TemplateContext`
- resource-fraction bracket counts are validated in `MapDescriptionBuilder.CheckResourceFractions`

## Validation Rules

- layout id must exist
- resource-fraction brackets must be internally consistent

## Common Failure Modes

- broken resource fraction bracket counts
- assuming same-named layout across templates has same semantics

## Example Snippets From Shipped Templates

```json
{
  "name": "zone_layout_center",
  "obstaclesFill": 0.4,
  "roadClusterArea": 70
}
```

## Editor Implications

- treat layout definitions as local assets with usage counts
