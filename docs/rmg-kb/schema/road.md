# Road

## Purpose

Document authored road instructions inside zones.

## Source-of-Truth Types/Files

- `RoadConfig.cs`
- `MapDescriptionBuilder.cs`
- `Roads.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type` | road | enum string | `Dirt` through enum fallback | optional | `Stone`, `Dirt` | parsed to `RoadType` | none | invalid/missing values fall back to `Dirt` | `"Stone"` |
| `from` | road | object | required | required | road target object | parsed to runtime road target | target refs | road dropped on parse failure | `{ "type": "MainObject", "args": ["0"] }` |
| `to` | road | object | required | required | road target object | parsed to runtime road target | target refs | road dropped on parse failure | `{ "type": "Connection", "args": ["Spawn-A-Treasure-1"] }` |

## Defaults

- `type` defaults to `Dirt` if omitted or invalid because `EnumParser.TryParceEnum<RoadType>` returns the first enum value on parse failure and `RoadType` is ordered `Dirt`, then `Stone`.
- Most authored official roads explicitly set `"type": "Stone"`, so do not infer author intent from omitted type.

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `Stone`
- `Dirt`

## Resolution/Derivation Behavior

- both endpoints are parsed through road-target resolution
- if either endpoint fails to parse, the road is skipped
- roads can mark mandatory content entries as designated encounters

## External References Used

- main-object indices
- connection names
- mandatory-content names

## Validation Rules

- road endpoints must be meaningful inside the current zone context
- target indices/names must resolve

## Common Failure Modes

- missing `type` and assuming the official-common `Stone` surface is implicit
- using a connection target that is not connected to the current zone

## Example Snippets From Shipped Templates

```json
{
  "type": "Stone",
  "from": { "type": "MainObject", "args": ["0"] },
  "to": { "type": "Connection", "args": ["Spawn-A-Treasure-1"] }
}
```

## Editor Implications

- road authoring needs target pickers, not free-text only
- display effective `Dirt` when type is omitted, and offer explicit `Stone` because it is the official-template norm
