# Content Count Limit Entry

## Purpose

Document one content cap entry inside a count-limit preset.

## Source-of-Truth Types/Files

- `ContentCountLimit.cs`
- `MapDescription.ContentCountLimit`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `includeLists[]` | limit entry | array | empty | optional | content-list ids | expanded into content ids if `sid` absent | content-list defs | unresolved list ids | `["list_spawn"]` |
| `content[]` | limit entry | array | empty | optional | content ids | copied/expanded | content ids | empty/no-op limit | `[{ "sid": "prison" }]` |
| `sid` | limit entry | string | none | optional | object id | copied into runtime limit | object id | bad object sid | `"prison"` |
| `variant` | limit entry | int | `-1` | optional | int | copied into runtime | object variant | wrong target variant | `-1` |
| `biome` | limit entry | string | none | optional | biome sid | copied into runtime limit | biome ids | mismatch if unsupported | `"Sand"` |
| `maxCount` | limit entry | int | `1` | optional | non-negative int | copied into runtime | none | no cap / impossible cap | `1` |

## Defaults

- `variant = -1`
- `maxCount = 1`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- direct `sid` limits
- list-expanded limits

## Resolution/Derivation Behavior

- if `sid` is null, included content lists are expanded into content ids

## Validation Rules

- each entry must identify some target content
- `maxCount` should be non-negative

## Common Failure Modes

- list expansion silently changing the real capped set
- using content not present in current config context

## Example Snippets From Shipped Templates

```json
{ "sid": "prison", "maxCount": 1 }
```

## Editor Implications

- preview the expanded capped set, not only the raw entry
