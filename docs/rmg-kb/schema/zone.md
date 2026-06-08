# Zone

## Purpose

Document the authored macro-area node that holds budgets, content sources, anchors, and rules.

## Source-of-Truth Types/Files

- `RandomMapTemplate.Zone`
- `MapDescription.Zone`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | zone | string | none | required in practice | unique zone name | copied into runtime | many refs | broken graph if renamed unsafely | `"Spawn-A"` |
| `size` | zone | float | `1.0` | optional | positive float | drives graph relative size | none | distorted zone balance | `0.75` |
| `layout` | zone | string | `"zone_layout_default"` | optional | layout id | resolved through `TemplateContext` | zone-layout defs | hard failure if unresolved | `"zone_layout_spawn"` |
| `mainObjects[]` | zone | array | empty | optional | main-object objects | copied/resolved to runtime | internal indices | positional fragility | `[{ "type": "Spawn" }]` |
| `zoneBiome`, `contentBiome`, `metaObjectsBiome` | zone | rule object | default rule objects | optional | biome rules | resolved to runtime biome ids | zone/main-object refs | wrong biome/faction relations | `{ "type": "MatchMainObject", "args": ["0"] }` |
| `crossroadsPosition` | zone | int | `-1` | optional | main-object index or sentinel | copied into runtime | main-object positions | broken road hub semantics | `0` |
| `guardedContentPool[]` | zone | array | default pool id | optional | pool ids | one id sampled, resolved to `ContentPool` | local/global pool defs | unresolved pool | `["template_pool_..."]` |
| `unguardedContentPool[]` | zone | array | default pool id | optional | pool ids | same | pool defs | unresolved pool | `["content_pool_..."]` |
| `resourcesContentPool[]` | zone | array | default pool id | optional | pool ids | same | pool defs | unresolved pool | `["content_pool_..."]` |
| `contentCountLimits[]` | zone | array/string in data | empty | optional | preset ids | one preset id sampled, expanded | local preset defs | unresolved preset | `["content_limits_spawn"]` |
| `mandatoryContent[]` | zone | array | empty | optional | preset ids | one preset id sampled, expanded | local preset defs | unresolved preset | `["mandatory_content_spawn"]` |
| budget fields | zone | ints | `0` | optional | ints | copied into runtime | none | empty or overloaded zones | `guardedContentValue` |
| `guardCutoffValue` | zone | number | `0` | optional | numeric values | copied into runtime | none | mis-tuned guards | `500` |
| guard tuning fields | zone | numbers/array | defaults | optional | numeric values | copied into runtime | none | mis-tuned guards | `guardMultiplier` |
| `guardReactionDistribution` | zone | number[] | empty | optional | numeric values | copied into runtime | none | mis-tuned guards | `[0.5, 0.5]` |
| `encounterHolesSettings` | zone | object | none | optional | opaque fields (typed as `UnknownFields`) | copied into runtime | none | unrecognized encounter settings | `{...}` |
| `roads[]` | zone | array | empty | optional | road defs | parsed into runtime road endpoints | main objects/connections/content | road parse failure | `[{ "from": {...}, "to": {...} }]` |
| `randomHireEnableWeeklyUnitIncrement`, `randomHireInitialUnitIncrement` | zone | bool/int | `true`, `1` | optional | bool/int | copied into runtime | none | growth mismatch | `1` |
| `diplomacyModifier` | zone | float | `0` | optional | float | copied into runtime | none | diplomacy behavior drift | `-0.5` |

## Defaults

- `size = 1`
- `layout = zone_layout_default`
- crossroads disabled by `-1`
- default pool ids are built into the type

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- layouts observed: `zone_layout_back`, `zone_layout_center`, `zone_layout_second_spawn`, `zone_layout_sides`, `zone_layout_spawn`, `zone_layout_spawns`, `zone_layout_start_zone`, `zone_layout_treasure`, `zone_layout_treasure_zone`, `zone_layout_wincondition_zone`

## Resolution/Derivation Behavior

- one pool id is sampled from each pool-id array
- one mandatory-content preset id is sampled from the zone list
- one content-count-limit preset id is sampled from the zone list
- biome rules resolve after faction resolution

## External References Used

- layout ids
- pool ids
- preset ids
- zone names inside rules
- main-object indices inside rules

## Validation Rules

- `name` should be unique within the variant
- referenced layout/preset/pool ids must exist
- budget values should be non-negative
- sampled arrays should not be empty when the feature is expected

## Common Failure Modes

- string versus array inconsistency for `contentCountLimits` in shipped data
- renaming a zone without updating all rules and connections
- reordering `mainObjects[]` and silently changing rule semantics

## Example Snippets From Shipped Templates

```json
{
  "name": "Spawn-A",
  "size": 0.75,
  "layout": "zone_layout_spawn",
  "mandatoryContent": ["mandatory_content_spawn"],
  "contentCountLimits": ["content_limits_spawn"],
  "zoneBiome": { "type": "MatchMainObject", "args": ["0"] }
}
```

## Editor Implications

- this should be the primary inspector unit
- surface all inbound/outbound references to zone name and main-object indices
