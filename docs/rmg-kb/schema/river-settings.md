# River Settings

## Purpose

Document optional river-system tuning.

## Source-of-Truth Types/Files

- `RiverSettings.cs`
- `Layout.cs`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `createRiverSystem` | `river` | bool | `true` | optional | bool | copied into runtime | none | unexpected rivers on/off | `true` |
| `tributarySpacing` | `river` | float | `25` | optional | float | copied into runtime | none | poor river density | `25` |

## Defaults

- rivers are enabled by default
- tributary spacing defaults to `25`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- no strong authored variety observed in the sampled files; this is primarily code-defined

## Resolution/Derivation Behavior

- copied into runtime variant data
- consumed by river creation during layout

## External References Used

- none directly

## Validation Rules

- `tributarySpacing` should be positive

## Common Failure Modes

- assuming omitted river settings mean no rivers

## Example Snippets From Shipped Templates

```json
"river": {
  "createRiverSystem": true,
  "tributarySpacing": 25.0
}
```

## Editor Implications

- keep this advanced and collapsible
- preview toggles should show river effect independently from lakes/water
