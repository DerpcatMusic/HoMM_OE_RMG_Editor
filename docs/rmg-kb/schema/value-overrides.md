# Value Overrides

## Purpose

Document object value/guard override entries.

## Source-of-Truth Types/Files

- `ContentValueOverride.cs`
- `ValueOverrides.cs`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `sid` | override entry | string | none | required | object id | key into override map | object id | override never applied | `"prison"` |
| `variant` | override entry | int | `-1` | optional | int | part of override key | object variant | wrong override target | `-1` |
| `goodsValue` | override entry | int | `0` | optional | int | used when positive | none | value unchanged if zero | `1000` |
| `guardValue` | override entry | int | `0` | optional | int | used when positive | none | guard unchanged if zero | `2000` |
| `aiValue` | override entry | int | `0` | optional | int | present in authoring type | none | unsupported assumptions if overused | `500` |

## Defaults

- numeric fields default to `0`
- non-positive values do not override in the currently inspected runtime methods

## Resolution/Derivation Behavior

- runtime override lookup keys on `(sid, variant)`
- `goodsValue` and `guardValue` override only when positive

## Validation Rules

- `sid` should exist
- be explicit when intending “no override” versus “zero override”

## Common Failure Modes

- assuming `0` is a meaningful override instead of “not applied”

## Example Snippets From Shipped Templates

```json
{ "sid": "prison", "variant": -1, "goodsValue": 1000, "guardValue": 2000 }
```

## Editor Implications

- preview the effective final values after overrides
