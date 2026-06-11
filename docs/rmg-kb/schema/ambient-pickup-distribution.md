# Ambient Pickup Distribution

## Purpose

Controls how loose ambient pickups (gold, resources, minor treasures) are scattered within a zone. These are unguarded pickups placed by the generator to fill empty space and reward exploration.

## Source-of-Truth Types/Files

- `AmbientPickupDistribution.cs`
- All shipped templates via `zoneLayouts[].ambientPickupDistribution`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `repulsion` | ambient dist | float | `1` | optional | float | repulsion force between pickup groups | none | pickups too clustered or too spread | `1.0` |
| `noise` | ambient dist | float | `0.2` | optional | float | random noise added to placement scoring | none | too uniform or too random | `0.3` |
| `roadAttraction` | ambient dist | float | `0.5` | optional | float (can be negative) | attraction/repulsion toward road tiles | none | pickups away from or on roads | `0.5` |
| `obstacleAttraction` | ambient dist | float | `0` | optional | float (can be negative) | attraction/repulsion toward obstacle edges | none | pickups near/away from obstacles | `0.0` |
| `groupSizeWeights` | ambient dist | float[] | `[4, 1, 1]` | optional | float array | weights for group size selection | none | wrong group sizes | `[20, 2, 1]` |

## How It Works

1. The generator identifies free tiles in the zone (not obstacles, not reserved).
2. Candidate positions are scored based on:
   - **Repulsion**: distance from other already-placed pickup groups (higher = more spread out)
   - **Noise**: random factor added to each candidate's score
   - **Road attraction**: proximity to road tiles (positive = near roads, negative = away from roads)
   - **Obstacle attraction**: proximity to obstacle edges (positive = near obstacles, negative = away)
3. `groupSizeWeights` determines how many pickups appear in each group. Index 0 = solo pickup, index 1 = pair, index 2 = trio, etc. Higher weight = more likely.
4. Lower scores are tried first (placement prefers low-score positions).

## Shipped Template Patterns

**Competitive/road-oriented** (most templates — ~20):
```json
"ambientPickupDistribution": {
  "repulsion": 1.0,
  "noise": 0.3,
  "roadAttraction": 0.5,
  "obstacleAttraction": 0.0,
  "groupSizeWeights": [4, 1, 1]
}
```
Pickups cluster near roads for easy discovery. Moderate group sizes.

**Casual/exploration-oriented** (Hard Place, Staircase, Sworn, etc.):
```json
"ambientPickupDistribution": {
  "repulsion": 1.0,
  "noise": 0.3,
  "roadAttraction": -0.3,
  "obstacleAttraction": 0.0,
  "groupSizeWeights": [20, 2, 1]
}
```
Pickups avoid roads, encouraging off-path exploration. Mostly solo pickups.

**Road-hugging** (Fair'n Square, Symmetry):
```json
"ambientPickupDistribution": {
  "repulsion": 1.0,
  "noise": 0.3,
  "roadAttraction": 0.1,
  "obstacleAttraction": 0.0,
  "groupSizeWeights": [1, 0, 0]
}
```
Only solo pickups, slightly attracted to roads. Minimalist.

**Obstacle-adjacent** (Shamrock, Symphony):
```json
"ambientPickupDistribution": {
  "repulsion": 1.0,
  "noise": 0.3,
  "roadAttraction": -0.3,
  "obstacleAttraction": 0.05,
  "groupSizeWeights": [12, 1, 0]
}
```
Pickups slightly prefer obstacle edges — rewards navigating terrain.

## Current Editor State

Typed as `UnknownFields` in `rmgTypes.ts`. Round-trips correctly but is invisible in the UI.

## Editor Integration

- **Impact**: HIGH — affects every template, every zone
- **Effort**: LOW — 5 simple fields (4 floats + 1 float array)
- **Risk**: NONE — data already exists in JSON, just needs typed UI
- Show as a collapsible "Pickup Distribution" section in zone layout editor
- Use percentage hint for `groupSizeWeights` (relative weights)
- `roadAttraction` and `obstacleAttraction` can be negative — show sign clearly
- Consider showing the common patterns as presets

## Validation Rules

- `repulsion` should be positive
- `groupSizeWeights` should have at least one non-zero entry
- `noise` should be non-negative

## Source References

- `AmbientPickupDistribution.cs` — type definition (5 fields)
- `ZoneLayoutConfig.cs:26` — field on zone layout
- `ContentPlacer.cs` — consumes during ambient pickup placement
