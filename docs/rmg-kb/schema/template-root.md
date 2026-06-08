# Template Root

## Purpose

Document the top-level structure of one `.rmg.json` file.

## Source-of-Truth Types/Files

- `RandomMapTemplate.cs`
- all `external/map_templates/*.rmg.json`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | template root | string | `"Default"` | effectively required | template title | copied into runtime | none | weak metadata if missing | `"Crossroads"` |
| `description` | template root | string | `""` | optional | localization key/string | copied into meta/runtime | none | none | `"templates_description_crossroads"` |
| `displayWinCondition` | template root | string | none | optional | localization/display key | copied into meta/runtime | none | UI ambiguity if missing | `"win_condition_3"` |
| `gameMode` | template root | enum string | `Classic` | optional | game-mode enum string | parsed to runtime enum | none | config error on parse | `"SingleHero"` |
| `sizeX`, `sizeZ` | template root | int | `128`, `128` | optional but semantically required | positive ints | copied into runtime map size | none | bad generation geometry | `160` |
| `gameRules` | template root | object | `new GameRules()` | optional | see page | copied into runtime | none | behavior drift if omitted | `{...}` |
| `globalBans` | template root | object | empty lists | optional | see page | converted into `BanInfo` | content ids | bans not applied if wrong | `{ "heroes": [...] }` |
| `valueOverrides` | template root | array | empty | optional | override objects | converted into `ValueOverrides` | content ids | values/guards wrong | `[{ "sid": "..."}]` |
| `variants` | template root | array | single default variant | required in practice | variant objects | one sampled per generation | none | generation meaningless if empty | `[{...}]` |
| `zoneLayouts` | template root | array | empty | optional | local layout defs | merged into `TemplateContext` | local names | unresolved layout ids | `[{ "name": "..."}]` |
| `mandatoryContent` | template root | array | empty | optional | local preset defs | merged into `TemplateContext` | local names | unresolved preset ids | `[{ "name": "..."}]` |
| `contentCountLimits` | template root | array | empty | optional | local limit preset defs | merged into `TemplateContext` | local names | unresolved limit ids | `[{ "name": "..."}]` |
| `contentPools` | template root | array | empty | optional | local pool defs | merged into `TemplateContext` | local names | unresolved pool ids | `[{ "name": "..."}]` |
| `contentLists` | template root | array | empty | optional | local list defs | merged into `TemplateContext` | local names | unresolved list ids | `[{ "name": "..."}]` |

## Defaults

- `gameMode` defaults to `Classic`
- `sizeX` and `sizeZ` default to `128`
- `variants` defaults to one placeholder variant
- local definition arrays default to empty arrays

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `gameMode`: `Classic`, `SingleHero`

## Resolution/Derivation Behavior

- one variant is sampled per build attempt
- local defs are merged with global defs in `TemplateContext`
- `globalBans` become `BanInfo`
- `valueOverrides` become `ValueOverrides`

## External References Used

- global generator config
- content database
- available factions/heroes from `extracted/Core/DB/data.json`

## Validation Rules

- at least one meaningful variant must exist
- template-local definition names should be unique within their definition type
- root metadata should not be treated as semantic identity for internal references

## Common Failure Modes

- missing or empty `variants`
- root-level local definition present but never referenced
- assuming the template is self-contained when it is not

## Example Snippets From Shipped Templates

```json
{
  "name": "Shamrock",
  "gameMode": "Classic",
  "sizeX": 160,
  "sizeZ": 160,
  "variants": [ { "...": "..." } ],
  "zoneLayouts": [ { "name": "zone_layout_center" } ]
}
```

## Editor Implications

- treat the template root as a package boundary
- surface local definitions in a side catalog
- distinguish local definitions from inherited/global definitions
