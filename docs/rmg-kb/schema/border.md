# Border

## Purpose

Document border and water-ring settings around the playable map shape.

## Source-of-Truth Types/Files

- `Border.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `cornerRadius` | `border` | float | `0` | optional | float | used by border shaping | none | bad shape tuning | `0.7` |
| `obstaclesWidth` | `border` | int | `3` | optional | int | used by border shaping | none | border too thin/thick | `3` |
| `obstaclesNoise[]` | `border` | array | empty | optional | `{ amp, freq }` pairs | used by border shaping | none | noisy/unreadable edges | `[{ "amp": 1, "freq": 12 }]` |
| `waterWidth` | `border` | int | `0` | optional | int | used by border water ring | none | wrong water ring | `6` |
| `waterNoise[]` | `border` | array | one default element | optional | `{ amp, freq }` pairs | used by border shaping | none | wrong water shape | `[{ "amp": 1, "freq": 12 }]` |
| `waterType` | `border` | string | `"water grass"` | optional | water config name | resolved through content/tileset config | water type id | wrong or missing water visuals | `"water grass"` |

## Defaults

- `obstaclesWidth = 3`
- `waterWidth = 0`
- `waterType = "water grass"`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- observed `waterType`: `"water grass"`

## Resolution/Derivation Behavior

- copied into runtime `MapDescription.border`
- consumed during layout border and lake/water steps

## External References Used

- `waterType` indirectly depends on configured water/biome data

## Validation Rules

- widths should be non-negative
- noise arrays should contain usable amplitudes/frequencies

## Common Failure Modes

- authoring a water type not supported by config
- assuming border omission means “no border” rather than “default border object”

## Example Snippets From Shipped Templates

```json
"border": {
  "cornerRadius": 0.7,
  "obstaclesWidth": 3,
  "waterWidth": 6,
  "waterType": "water grass"
}
```

## Editor Implications

- preview border and water separately
- show defaults explicitly when the object is omitted
