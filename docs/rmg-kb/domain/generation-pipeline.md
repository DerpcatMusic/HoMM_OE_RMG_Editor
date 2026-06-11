# Generation Pipeline

## Purpose

Document the actual order of operations during map generation. This is the sequence of steps the generator executes to turn a template into a playable map.

## Source-of-Truth Types/Files

- `MapDescriptionBuilder.cs` — orchestrator
- Individual step classes in `MapGenerator/`

## Pipeline Order

| Step | Class | Inputs | Outputs | Template Fields Used |
| --- | --- | --- | --- | --- |
| 1. **Zone Mapping** | `ZoneMapper` | zone graph, map size, orientation | zone positions/sizes on hex grid | `orientation`, `sizeX`/`sizeZ`, zone `size`/`sizeRange` |
| 2. **Border Shaping** | `Border` | map size, border config | obstacle/water ring on hex grid | `border.obstaclesWidth`, `border.waterWidth`, `border.cornerRadius`, `border.obstaclesNoise[]`, `border.waterNoise[]`, `border.waterType` |
| 3. **Elevation** | `Elevation` | zone map, elevation config | `sbyte[]` elevation map | `zoneLayout.elevationClusterScale`, `zoneLayout.elevationModes[]` |
| 4. **Cliffs** | (part of Elevation) | elevation map | `Cliff` obstacle states | derived from elevation transitions |
| 5. **Lakes** | `Lakes` | elevation map, zone map | lake water tiles | `zoneLayout.lakesFill`, `zoneLayout.minLakeArea` |
| 6. **Rivers** | `Rivers` | elevation map, obstacle states | river water tiles | `river.createRiverSystem`, `river.tributarySpacing` |
| 7. **Obstacles** | (part of layout) | zone layout config | terrain obstacle tiles | `zoneLayout.obstaclesFill`, `zoneLayout.obstaclesFillVoid` |
| 8. **Roads** | `Roads` | connections, zone map | road tiles | `zone.roads[]`, `zoneLayout.roadClusterArea` |
| 9. **Guarded Encounters** | `ContentPlacer` | zone guards, connection guards | guard squads | `zone.guardValue`, `zone.guardCutoffValue`, `zone.guardMultiplier`, `zone.guardWeeklyIncrement`, `zone.guardRandomization`, connection guard fields |
| 10. **Encounter Holes** | `ContentPlacer` | encounter positions | walkable gaps around encounters | `gameRules.encounterHoles`, `zone.encounterHolesSettings.affectedEncounters`, `zone.encounterHolesSettings.twoHoleEncounters` |
| 11. **Main Objects** | `ContentPlacer` | main object configs | cities, outposts, buildings | `mainObjects[]` (all fields) |
| 12. **Ambient Pickups** | `ContentPlacer` | zone layout, free tiles | scattered pickups | `zoneLayout.ambientPickupDistribution` (repulsion, noise, roadAttraction, obstacleAttraction, groupSizeWeights) |
| 13. **Tilesets** | `EnvironmentAssets` | biome configs | visual tile assignment | `GeneratorSettings.waterForBiome[]`, biome tileset configs |

## ObstacleState Values

The generator marks every hex cell with an `ObstacleState` that controls what can be placed there:

| Value | Meaning | Set By |
| --- | --- | --- |
| `Free` (0) | Walkable, available for content | Default |
| `Border` (1) | Map border obstacle | Border shaping |
| `Cliff` (2) | Elevation cliff edge | Elevation |
| `Water` (3) | Water tile | Lakes, Rivers |
| `Obstacle` (4) | Terrain obstacle (rocks, trees) | Obstacle fill |
| `AlwaysFree` (5) | Forced walkable, ignores other rules | Manual override |
| `AlwaysObstacle` (6) | Forced obstacle, ignores other rules | Manual override |
| `Reserved` (7) | Reserved for object placement | ContentPlacer |
| `ReservedWalkable` (8) | Reserved but walkable | Roads, paths |
| `NoEncounters` (9) | Walkable but no encounters | Encounter holes |
| `ReservedRoadTarget` (10) | Reserved for road endpoints | Road generation |

## Key Relationships

- **Elevation → Cliffs → Obstacles**: Elevation creates height transitions, which become cliff obstacle states, which affect obstacle fill density.
- **Lakes → Rivers**: Lakes fill low-elevation areas first. Rivers follow elevation downhill and can't cross cliffs.
- **Roads → Encounter Holes → Ambient Pickups**: Roads are placed first, then encounter holes create gaps, then ambient pickups use road proximity for attraction scoring.
- **Border → All**: The border defines the playable area. Everything else operates within it.

## Template Fields NOT Used By Generator

These fields exist in the template JSON but are consumed by the game runtime, not the generator:
- `gameRules` (most fields) — game session settings
- `winConditions` — win/loss logic
- `displayWinCondition` — UI display
- `globalBans` — hero/faction banning (consumed by content selection, not terrain)
- `valueOverrides` — value modifications (consumed by content selection)
