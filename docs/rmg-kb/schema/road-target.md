# Road Target

## Purpose

Document one road endpoint inside a zone.

## Source-of-Truth Types/Files

- `RoadTargetConfig.cs`
- `RoadTargetType.cs`
- `MapDescriptionBuilder.cs`
- `RuleParseUtils.cs`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type` | road target | enum string | `Crossroads` | optional | `Crossroads`, `MainObject`, `Connection`, `MandatoryContent` | parsed to runtime target type | depends on type | parse failure | `"Connection"` |
| `args[]` | road target | array | none | conditional | strings | interpreted by target type | main-object index, connection name, mandatory-content name | target parse failure | `["Connector-A"]` |

## Defaults

- `type = Crossroads`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `Crossroads`
- `MainObject`
- `Connection`
- `MandatoryContent`

## Resolution/Derivation Behavior

- `Crossroads` uses index `-1`
- `MainObject` parses an index
- `Connection` parses a connection name constrained to current zone adjacency
- `MandatoryContent` parses a content name in the current zone

## External References Used

- main object positions
- connection names
- mandatory content names

## Validation Rules

- `args` must match the selected type
- connection targets cannot point to `Proximity` connections

## Common Failure Modes

- using connection names for an unrelated zone
- renaming mandatory content without updating road targets

## Example Snippets From Shipped Templates

```json
{ "type": "MandatoryContent", "args": ["name_portal_gate_center"] }
```

## Editor Implications

- always constrain the picker by current zone context
