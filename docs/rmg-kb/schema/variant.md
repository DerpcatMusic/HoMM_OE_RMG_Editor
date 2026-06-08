# Variant

## Purpose

Document one sampled template body inside `variants[]`.

## Source-of-Truth Types/Files

- `RandomMapTemplate.Variant`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `orientation` | variant | object | `new Orientation()` | optional | orientation object | copied into runtime variant | zone names | bad graph embedding | `{ "mode": "BoundingCircle" }` |
| `border` | variant | object | `new Border()` | optional | border object | copied into runtime variant | water/biome semantics | wrong border/water behavior | `{ "cornerRadius": 0.7 }` |
| `river` | variant | object | `new RiverSettings()` | optional | river settings | copied into runtime variant | none | river behavior drift | `{ "createRiverSystem": true }` |
| `zones` | variant | array | one placeholder zone | required in practice | zone objects | created into runtime zones | many local refs | generation meaningless if empty | `[{ "name": "Spawn-A" }]` |
| `connections` | variant | array | empty | optional | connection objects | created into runtime connections | zone names | broken graph if bad refs | `[{ "from": "A", "to": "B" }]` |

## Defaults

- one default orientation object
- one default border object
- one default river object
- one placeholder zone
- empty connections

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- variants count observed: `1` and `3`

## Resolution/Derivation Behavior

- one variant is sampled randomly per build attempt
- all zone and connection references are interpreted within the selected variant

## External References Used

- zero-angle zone names
- zone names in connections and rules

## Validation Rules

- zone names should be unique within a variant
- every connection endpoint must refer to a zone in the same variant

## Common Failure Modes

- assuming the template as a whole has one stable resolved graph
- authoring references that point across variants

## Example Snippets From Shipped Templates

```json
"variants": [
  {
    "orientation": { "mode": "MinimalBoundingSquare" },
    "zones": [ { "name": "Spawn-A" } ],
    "connections": [ { "from": "Spawn-A", "to": "Center" } ]
  }
]
```

## Editor Implications

- preview must always show which variant was sampled
- validation must operate both per-variant and across root-level local definitions
