# Zone Layouts And Terrain

Zone layouts are named local/global configs that control terrain density and some encounter/resource distribution behavior. A zone references one layout by string through `RandomMapTemplate.Zone.layout`; the builder resolves it through `TemplateContext.GetZoneLayoutConfig()`.

## Status

- `done`: layout lookup, field mapping, terrain-related references, and template-local layout add/update/remove/rename mutations.
- `partial`: layout authoring is available as data mutations, but there is no dedicated terrain-focused UI.
- `missing`: visual terrain preview and layout balance tools.

## Source References

- Zone layout reference field: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:38`
- Runtime resolution: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:214`
- Local-plus-global collection setup: `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:71`
- Missing layout throws: `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:107`
- Layout schema: `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:6`

## Fields

- `name`: layout ID used by zones.
- `obstaclesFill`: obstacle density, default `0.4`.
- `obstaclesFillVoid`: void obstacle density, default `0.5`.
- `lakesFill`: lake density, default `0`.
- `minLakeArea`: minimum lake area, default `20`.
- `elevationClusterScale`: scale for elevation clustering, default `0.15`.
- `elevationModes`: weighted elevation modes.
- `roadClusterArea`: road clustering area, default `70`.
- `guardedEncounterResourceFractions`: resource fraction distribution for guarded encounters.
- `ambientPickupDistribution`: ambient pickup spacing/attraction config.

Sources: `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:8`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:10`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:12`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:14`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:16`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:18`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:20`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:25`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:27`, `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs:29`.

## Elevation Modes

> **TypeScript note:** `ZoneLayoutConfig.elevationModes` is typed as `UnknownFields[]` in the TypeScript editor model (`src/core/rmg/rmgTypes.ts`). The subfields below are documented from the C# source, but the editor treats them as opaque for round-trip compatibility and passes them through unchanged.

`ZoneElevationMode` has:

- `weight`, default `1`
- `minElevatedFraction`
- `maxElevatedFraction`, default `1`

The elevation generator samples a weighted mode per selected zone and creates elevated patches from the min/max fraction. Sources: `GameEngineMapGenerator/MapGenerator/ZoneElevationMode.cs:6`, `GameEngineMapGenerator/MapGenerator/Elevation.cs:178`, `GameEngineMapGenerator/MapGenerator/Elevation.cs:184`.

## Ambient Pickups

> **TypeScript note:** `ZoneLayoutConfig.ambientPickupDistribution` is typed as `UnknownFields` in the TypeScript editor model (`src/core/rmg/rmgTypes.ts`). The subfields below are documented from the C# source, but the editor treats them as opaque for round-trip compatibility and passes them through unchanged.

`AmbientPickupDistribution` controls:

- `repulsion`, default `1`
- `noise`, default `0.2`
- `roadAttraction`, default `0.5`
- `obstacleAttraction`, default `0`
- `groupSizeWeights`, default `[4, 1, 1]`

Source: `GameEngineMapGenerator/MapGenerator/AmbientPickupDistribution.cs:6`.

## Resource Fraction Validation

`guardedEncounterResourceFractions` contains `countBounds` and `fractions`. The builder requires `countBounds.Length + 1 == fractions.Length` and ascending bounds.

Sources: `GameEngineMapGenerator/MapGenerator/ResourceFractionDistribution.cs:6`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:1103`.

## How Layouts Are Used

- `ZoneMapper` uses zone sizes and connection constraints to map zones into the generated map. Source: `GameEngineMapGenerator/MapGenerator/ZoneMapper.cs:14`.
- `ZoneGraph` embeds the graph into a unit square/circle using orientation settings. Source: `GameEngineMapGenerator/MapGenerator/ZoneGraph.cs:30`.
- Terrain generation uses layout fields for obstacles, lakes, elevation, roads, ambient pickups, and resource fractions.

## Shipped Template Observations

- All major shipped templates embed `zoneLayouts` at the template root.
- `bbolbval.rmg.json` (from the older `GameDB/RMGMAPS` sample) embeds a minimal `zone_layout_default` with only `name`, so all other fields use C# defaults. Source: `GameDB/RMGMAPS/bbolbval.rmg.json:316` (older sample).
- Other templates define role-specific layouts such as `zone_layout_spawn`, `zone_layout_center`, `zone_layout_treasure`, `zone_layout_sides`, and `zone_layout_wincondition_zone`.

## Editor Implications

- Show layout definitions as local reusable assets with usage counts.
- Warn when two templates use the same layout name with different values.
- Validate resource fraction bracket counts immediately.
- Treat omitted layout fields as meaningful defaults, not missing data.
- Do not let users delete or rename a layout while zones still reference it.
