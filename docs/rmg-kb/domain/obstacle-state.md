# ObstacleState Enum

## Purpose

Marks every hex cell on the generated map with a state that controls what can be placed there. This is the fundamental state machine of the generation pipeline.

## Source-of-Truth Types/Files

- `ObstacleState.cs`

## Values

| Value | Int | Meaning | Set By | Consumed By |
| --- | --- | --- | --- | --- |
| `Free` | 0 | Walkable, available for content placement | Default state | ContentPlacer, Roads |
| `Border` | 1 | Map border obstacle | Border shaping | Blocks all placement |
| `Cliff` | 2 | Elevation cliff edge (impassable) | Elevation transitions | Blocks movement, blocks rivers |
| `Water` | 3 | Water tile | Lakes, Rivers | Blocks ground movement |
| `Obstacle` | 4 | Terrain obstacle (rocks, trees, etc.) | Obstacle fill | Blocks most placement |
| `AlwaysFree` | 5 | Forced walkable, overrides other rules | Manual/editor override | Ignored by obstacle rules |
| `AlwaysObstacle` | 6 | Forced obstacle, overrides other rules | Manual/editor override | Ignored by free rules |
| `Reserved` | 7 | Reserved for object placement | ContentPlacer | Prevents other content |
| `ReservedWalkable` | 8 | Reserved but walkable (roads, paths) | Road generation | Walkable but reserved |
| `NoEncounters` | 9 | Walkable but no encounters allowed | Encounter holes | Allows movement, blocks encounters |
| `ReservedRoadTarget` | 10 | Reserved for road endpoints | Road generation | Prevents content at road ends |

## How States Interact

```
Free ──(border shaping)──> Border
Free ──(elevation)──> Cliff
Free ──(lakes/rivers)──> Water
Free ──(obstacle fill)──> Obstacle
Free ──(content placer)──> Reserved
Free ──(road gen)──> ReservedWalkable
Free ──(encounter holes)──> NoEncounters
Free ──(road targets)──> ReservedRoadTarget
```

`AlwaysFree` and `AlwaysObstacle` are immune to state transitions — they override everything.

## Editor Implications

- The editor does NOT directly expose ObstacleState — it's an internal generator concept.
- The editor controls what the generator will do through template fields (obstaclesFill, elevationModes, etc.).
- Understanding ObstacleState is essential for predicting generator behavior from template settings.
