# Elevation Modes

## Purpose

Control how elevated terrain patches are generated within a zone. Elevation creates cliffs (impassable terrain transitions) and visual height variation.

## Source-of-Truth Types/Files

- `ZoneElevationMode.cs`
- `Elevation.cs`
- All shipped templates via `zoneLayouts[].elevationModes[]`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `weight` | elevation mode | float | `1` | optional | positive float | used as selection weight when sampling a mode per zone | none | all modes equally likely | `2` |
| `minElevatedFraction` | elevation mode | float | `0` | optional | 0.0–1.0 | lower bound of elevated fraction for this mode | none | too much/little elevation | `0.2` |
| `maxElevatedFraction` | elevation mode | float | `1` | optional | 0.0–1.0 | upper bound of elevated fraction for this mode | none | too much/little elevation | `0.4` |

## How It Works

1. The elevation generator selects one mode per zone using weighted random (`weight` field).
2. It rolls a random fraction between `minElevatedFraction` and `maxElevatedFraction`.
3. That fraction of the zone's area becomes elevated terrain.
4. Elevated patches are created using **cellular automata** (Burst-compiled for performance).
5. The zone is split into sub-zones based on `elevationClusterScale` (from `ZoneLayoutConfig`).
6. Elevation is smoothed, then small patches below `minLakeArea` are cleaned up.
7. Elevation transitions become `Cliff` obstacle states — impassable terrain edges.

## Shipped Template Patterns

Two main patterns are used across all 32 templates:

**Standard pattern** (most common — ~20 templates):
```json
"elevationModes": [
  { "weight": 2, "minElevatedFraction": 0.2, "maxElevatedFraction": 0.4 },
  { "weight": 1, "minElevatedFraction": 0.6, "maxElevatedFraction": 0.8 }
]
```
Creates moderate elevation with a bias toward 20-40% coverage. The second mode (60-80%) is less likely (weight 1 vs 2).

**Extreme pattern** (Blitz, Chosen One, Sprint, etc.):
```json
"elevationModes": [
  { "weight": 1, "minElevatedFraction": 0.0, "maxElevatedFraction": 0.0 },
  { "weight": 1, "minElevatedFraction": 1.0, "maxElevatedFraction": 1.0 }
]
```
All-or-nothing: each zone is either flat or fully elevated. Creates dramatic terrain.

**Flat pattern** (Fair'n Square, Symmetry):
```json
"elevationModes": [
  { "weight": 1, "minElevatedFraction": 0.0, "maxElevatedFraction": 0.0 }
]
```
No elevation at all — flat terrain for competitive fairness.

## Current Editor State

Typed as `UnknownFields[]` in `rmgTypes.ts`. Round-trips correctly but is invisible in the UI.

## Editor Integration

- **Impact**: HIGHEST — affects every template, every zone
- **Effort**: LOW — 3 simple numeric fields per mode
- **Risk**: NONE — data already exists in JSON, just needs typed UI
- Show as a repeatable list of modes with weight/min/max inputs
- Use percentage display for min/max fractions (like guard fields)
- Show the two common patterns as presets

## Validation Rules

- `minElevatedFraction` ≤ `maxElevatedFraction`
- All values should be 0.0–1.0
- At least one mode should exist (empty array = no elevation)
- `weight` should be positive

## Source References

- `ZoneElevationMode.cs` — type definition
- `Elevation.cs:108` — `MapElevation()` entry point
- `Elevation.cs:113` — `CalculateSplitData()` sub-zone splitting
- `Elevation.cs:118` — `CreateElevation()` cellular automata
- `Elevation.cs:127` — `Smoothe()` elevation smoothing
- `Elevation.cs:131` — `CleanupSmallPatches()` dead zone removal
