# Source Of Truth

## Primary Code Sources

- `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescription.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `GameEngineMapGenerator/MapGenerator/TemplateContext.cs`
- `GameEngineMapGenerator/MapGenerator/Generator.cs`
- `GameEngineMapGenerator/MapGenerator/Layout.cs`
- `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs`
- `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs`
- `GameEngineMapGenerator/MapGenerator/GameRules.cs`
- `GameEngineMapGenerator/MapGenerator/WinConditions.cs`
- `GameEngineMapGenerator/MapGenerator/MapObjectsRegistry.cs`
- `GameEngineMapGenerator/MapGenerator/Content.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPool.cs`
- `GameEngineMapGenerator/MapGenerator/ContentDatabase.cs`
- `GameEngineMapGenerator/MapGenerator/RoadConfig.cs`
- `GameEngineMapGenerator/MapGenerator/RoadTargetConfig.cs`
- `GameEngineMapGenerator/MapGenerator/BiomeRule.cs`
- `GameEngineMapGenerator/MapGenerator/FactionRule.cs`
- `GameEngineMapGenerator/MapGenerator/PlacementRule.cs`
- `GameEngineMapGenerator/MapGenerator/ZoneLayoutConfig.cs`

## Primary Data Sources

- `external/map_templates/Crossroads.rmg.json`
- `external/map_templates/Fair'n Square.rmg.json`
- `external/map_templates/Harmony.rmg.json`
- `external/map_templates/Helltide.rmg.json`
- `external/map_templates/Jebus Cross.rmg.json`
- `external/map_templates/Jebus Outcast.rmg.json`
- `external/map_templates/Memory Lane.rmg.json`
- `external/map_templates/Shamrock.rmg.json`
- `extracted/Core/DB/data.json`

## Secondary Sources

Used only when needed to explain surrounding semantics:

- `GameEngineMapGenerator/MapGenerator/Tests/BhMapgenDebugController.cs`
- `GameEngineMapGenerator/MapGenerator/Tests/BhDebugMapDrawer.cs`
- `GameEngineMapGenerator/MapGenerator/ConnectionType.cs`
- `GameEngineMapGenerator/MapGenerator/MainObjectType.cs`
- `GameEngineMapGenerator/MapGenerator/MainObjectPlacement.cs`
- `GameEngineMapGenerator/MapGenerator/RoadTargetType.cs`
- `GameEngineMapGenerator/MapGenerator/RoadType.cs`
- `GameEngineMapGenerator/MapGenerator/BiomeRuleType.cs`
- `GameEngineMapGenerator/MapGenerator/FactionRuleType.cs`
- `GameEngineMapGenerator/MapGenerator/PlacementRuleType.cs`
- `GameEngineMapGenerator/MapGenerator/GraphOrientationMode.cs`
- `GameEngineMapGenerator/MapGenerator/GatePlacement.cs`

## Evidence Policy

- `Code Fact` requires direct backing from inspected code.
- `Observed In Shipped Templates` requires direct presence in `external/map_templates/*.rmg.json`.
- `Inference` is allowed only when it follows from inspected code/data and must be labeled.
