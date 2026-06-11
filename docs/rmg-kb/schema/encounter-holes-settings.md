# Encounter Holes Settings

## Purpose

Controls how many encounters get "holes" — walkable gaps around them that allow the player to slip past guards without fighting. This is a key difficulty tuning mechanism.

## Source-of-Truth Types/Files

- `EncounterHolesSettings.cs`
- `GameRules.encounterHoles` (global enable switch)
- 2 templates: Anarchy (79 zones), Maze (84 zones)

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `affectedEncounters` | encounter holes | float | none | optional | 0.0–1.0 | fraction of encounters that get holes | none | too many/few escape routes | `0.66` |
| `twoHoleEncounters` | encounter holes | float | none | optional | 0.0–1.0 | fraction of affected encounters that get TWO holes | none | too easy/hard to escape | `0.66` |

## How It Works

1. `gameRules.encounterHoles` must be `true` globally (otherwise all hole creation is skipped).
2. For each zone with `encounterHolesSettings`:
   - `affectedEncounters` determines what fraction of encounters get at least one walkable gap.
   - `twoHoleEncounters` determines what fraction of those get a second gap (making them easier to bypass).
3. Holes are created by marking adjacent tiles as `NoEncounters` obstacle state.
4. This creates strategic choices: fight the guard or find the gap.

## Shipped Template Usage

Only 2 templates use this (both with identical values):
```json
"encounterHolesSettings": {
  "affectedEncounters": 0.66,
  "twoHoleEncounters": 0.66
}
```

This means 66% of encounters get holes, and 66% of those get two holes. The remaining 34% of encounters are fully blocking.

## Current Editor State

- `gameRules.encounterHoles` — registered as a boolean field, editable
- `zone.encounterHolesSettings` — typed as `UnknownFields`, round-trips but invisible in UI
- Conditional: only shown when `gameRules.encounterHoles == true`

## Editor Integration

- **Impact**: MEDIUM — only 2 templates use it, but it's a powerful difficulty lever
- **Effort**: LOW — 2 simple float fields
- **Risk**: NONE — data already exists in JSON
- Show as a collapsible section in zone guard settings
- Gate behind `gameRules.encounterHoles` toggle (already done in field registry)
- Use percentage display (like guard fields)

## Validation Rules

- Both values should be 0.0–1.0
- `affectedEncounters` controls the total pool; `twoHoleEncounters` is a sub-fraction

## Source References

- `EncounterHolesSettings.cs` — type definition
- `GameRules.encounterHoles` — global switch
- `ContentPlacer.cs` — consumes during encounter placement
- `docs/rmg-kb/schema/game-rules.md` — global switch documentation
- `docs/rmg-kb/schema/misc-settings-compatibility.md` — field observations
