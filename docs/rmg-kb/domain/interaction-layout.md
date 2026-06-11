# InteractionLayout Enum

## Purpose

Controls where the interaction panel (combat UI, pickup UI, dialog UI) appears on screen relative to the hex cell the player is interacting with.

## Source-of-Truth Types/Files

- `InteractionLayout.cs`

## Values

| Value | Int | Meaning |
| --- | --- | --- |
| `CornerRight` | 0 | Panel appears in the bottom-right corner |
| `CornerLeft` | 1 | Panel appears in the bottom-left corner |
| `Bottom` | 2 | Panel appears centered at the bottom |
| `All` | 3 | Panel uses the full screen width |

## Current Editor State

Not present in the editor model. Not documented in any schema.

## Editor Integration

- **Impact**: LOW — cosmetic UI positioning, not map generation
- **Effort**: LOW — simple enum field
- **Relevance**: May be set per map object or per encounter type. Needs further investigation to determine where in the template JSON this appears.

## Source References

- `InteractionLayout.cs` — enum definition (4 values)
