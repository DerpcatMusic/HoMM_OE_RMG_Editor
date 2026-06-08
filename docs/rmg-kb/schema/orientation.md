# Orientation

## Purpose

Document graph-orientation settings that drive zone embedding.

## Source-of-Truth Types/Files

- `Orientation.cs`
- `GraphOrientationMode.cs`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `mode` | `orientation` | enum string | `BoundingCircle` | optional | `BoundingCircle`, `MinimalBoundingSquare` | parsed to `modeEnum` | none | config error on parse | `"MinimalBoundingSquare"` |
| `zeroAngleZone` | `orientation` | string | none | optional | zone name | resolved to `zeroAngleZoneIndex` | zone name | bad anchor if missing/broken | `"Spawn-A"` |
| `baseAngleMin` | `orientation` | float | `0` | optional | float | used by graph embedder | none | orientation drift | `45` |
| `baseAngleMax` | `orientation` | float | `0` | optional | float | used by graph embedder | none | orientation drift | `360` |
| `randomAngleAmplitude` | `orientation` | float | `0` | optional | float | used by graph embedder | none | orientation drift | `45` |
| `randomAngleStep` | `orientation` | float | `0` | optional | float | used by graph embedder | none | orientation drift | `90` |

## Defaults

- `mode` defaults to `BoundingCircle`
- all numeric values default to zero

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `BoundingCircle`
- `MinimalBoundingSquare`

## Resolution/Derivation Behavior

- `mode` is parsed during template parsing
- `zeroAngleZone` is resolved after zones are created

## External References Used

- zone name in `zeroAngleZone`

## Validation Rules

- if `zeroAngleZone` is set, it must exist in the selected variant
- `baseAngleMin <= baseAngleMax` is a sensible advisory check

## Common Failure Modes

- omitting `mode` and assuming a different engine default
- pointing `zeroAngleZone` at a renamed or deleted zone

## Example Snippets From Shipped Templates

```json
"orientation": {
  "mode": "BoundingCircle",
  "zeroAngleZone": "Spawn-B",
  "baseAngleMin": 45,
  "baseAngleMax": 45,
  "randomAngleAmplitude": 360,
  "randomAngleStep": 90
}
```

## Editor Implications

- expose the implicit default for `mode`
- validate `zeroAngleZone` like any other name reference
