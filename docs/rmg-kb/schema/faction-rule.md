# Faction Rule

## Purpose

Document faction-selection rules on main objects.

## Source-of-Truth Types/Files

- `FactionRule.cs`
- `FactionRuleType.cs`
- `MapDescriptionBuilder.cs`
- `ContentDatabase.cs`
- `extracted/Core/DB/data.json`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type` | faction rule | enum string | `FromList` | optional | `FromList`, `Match` | parsed by builder | depends on type | parse/log error | `"Match"` |
| `args[]` | faction rule | array | none | conditional | strings | interpreted by rule type | factions, main-object indices, zone names | unresolved/circular refs | `["0", "Spawn-B"]` |

## Defaults

- type defaults to `FromList`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `FromList`
- `Match`

## Resolution/Derivation Behavior

- `FromList` filters against available factions
- if filtered list is empty, available factions may be used as fallback
- rules can exclude via `differentFrom: <index> <zone>`
- `Match` can reference another main object in current or named zone
- builder detects circular dependency chains

## External References Used

- available factions from `extracted/Core/DB/data.json`
- zone names
- main-object indices

## Validation Rules

- referenced zones/main objects must exist
- cycle detection should be blocking

## Common Failure Modes

- relying on a faction not available in current data
- bad `differentFrom:` target
- reorder breaking implicit index-based matches

## Example Snippets From Shipped Templates

```json
{ "type": "FromList", "args": ["differentFrom: 0 Spawn-A", "differentFrom: 0 Spawn-B"] }
```

## Editor Implications

- do not expose this as raw string args only
- show resolved faction candidates and dependency chain
