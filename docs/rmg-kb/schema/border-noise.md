# Border Noise

## Purpose

Controls the Perlin-noise-based shaping of the map border. The border consists of two concentric rings — an obstacle ring and a water ring — each with independent noise parameters that make the border jagged or smooth.

## Source-of-Truth Types/Files

- `Border.cs` — `NoiseMode` struct
- All 32 shipped templates via `variants[].border`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `amp` | noise mode | float | `1` | optional | float | amplitude of Perlin noise displacement | none | border too smooth or too jagged | `1` |
| `freq` | noise mode | float | `12` | optional | float | frequency of Perlin noise (bumps per unit) | none | border too uniform or too chaotic | `6` |

## How It Works

1. The border is defined by `cornerRadius` (0 = sharp corners, 1 = fully rounded).
2. Two rings are generated around the map edge:
   - **Obstacle ring** (`obstaclesWidth` × `obstaclesNoise[]`): blocks movement
   - **Water ring** (`waterWidth` × `waterNoise[]`): water tiles
3. Each ring's edge is displaced by Perlin noise using the `amp` and `freq` parameters.
4. Higher `amp` = more displacement (jagged). Higher `freq` = more bumps (detailed).
5. Multiple noise modes can be layered (arrays allow compound noise).

## Shipped Template Patterns

**Smooth borders** (~18 templates — "Jebus" style):
```json
"obstaclesNoise": [{ "amp": 1, "freq": 12 }],
"waterNoise": [{ "amp": 1, "freq": 12 }]
```
High frequency = many small bumps = smooth-looking border.

**Jagged borders** (~10 templates — "Classic" style):
```json
"obstaclesNoise": [{ "amp": 1, "freq": 6 }],
"waterNoise": [{ "amp": 1, "freq": 1 }]
```
Low frequency = few large bumps = visibly jagged border.

**Very jagged** (Helltide):
```json
"obstaclesNoise": [{ "amp": 2, "freq": 6 }]
```
Double amplitude = extreme displacement.

**Smooth obstacles, jagged water** (Crossroads, Shamrock, Sprint):
```json
"obstaclesNoise": [{ "amp": 0.5, "freq": 6 }],
"waterNoise": [{ "amp": 1, "freq": 12 }]
```
Mixed: obstacle ring is smoother than water ring.

## Current Editor State

Already properly typed in `rmgTypes.ts`:
- `Border.obstaclesNoise` → `NoiseMode[]`
- `Border.waterNoise` → `NoiseMode[]`
- `NoiseMode` has `amp` and `freq` fields

**Missing**: No UI to edit these fields. They round-trip but are invisible.

## Editor Integration

- **Impact**: HIGH — affects the visual shape of every template
- **Effort**: LOW — just needs UI for existing typed fields
- **Risk**: NONE — data already typed and round-tripping
- Show as two noise mode editors in the variant border section
- Each noise mode has amp and freq inputs
- Show the common patterns as presets (Smooth/Jagged/Very Jagged)

## Validation Rules

- `amp` should be non-negative
- `freq` should be positive (zero = no noise = straight edge)

## Source References

- `Border.cs:9` — `NoiseMode` struct definition
- `Border.cs:20` — `obstaclesNoise` field
- `Border.cs:24` — `waterNoise` field
- `Elevation.cs` — border shaping uses these during layout
