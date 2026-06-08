# Generation Pipeline

## Purpose

Document the end-to-end flow from template JSON to generated map and debug surfaces.

## Source Files

- `Generator.cs`
- `MapDescriptionBuilder.cs`
- `Layout.cs`
- `ContentPlacer.cs`

## Code Fact

High-level pipeline:

1. Parse template JSON into `RandomMapTemplate`
2. Build `TemplateContext`
3. Sample one template variant
4. Build `MapDescription`
5. Generate `Layout`
6. Create `MapData`
7. Run `ContentPlacer`
8. Retry on certain failures

## Detailed Build Stage

`MapDescriptionBuilder.Build(...)` does:

1. `Parse(templateJson)`
2. `new TemplateContext(template, generatorConfig)`
3. `variant = random.Next(template.variants.Length)`
4. `FillTemplateParams(...)`
5. `CreateZones(...)`
6. `CreateConnections(...)`
7. `ParseRoads(...)`
8. `ParseRules(...)`
9. `ResolveMainObjectFactions(...)`
10. `ResolveBiomes(...)`
11. `CheckResourceFractions(...)`

## Detailed Layout Stage

`Layout.Generate(...)` runs:

1. `ZoneMapper.MapZones`
2. `MapShape.CreateNullZoneMapBorder`
3. `Elevation.MapElevation`
4. `Borders.PlaceBorders`
5. `Gates.PlaceGates`
6. `ZonePartition.ComputePartitions`
7. `WalkablePaths.DrawWalkablePaths`
8. `Roads.AllocateRoadsData`
9. `Roads.MapMainRoads`
10. `ContentTask.Create`
11. `Encounters.PlaceEncounters`
12. `Roads.MapEncounterRoads`
13. `Obstacles.Fill`
14. `Lakes.CreateLakes`
15. `Obstacles.FillUnreachable`
16. `Rivers.CreateRivers`
17. `AmbientPickups.CreateAmbientPickupSlots`

## Retry Behavior

`Generator.Generate(...)` retries when:

- layout/content placement throws `GeneratorException`
- mandatory content is missing after placement

This means:

- a template can be structurally valid but still fail some attempts
- preview and validation should distinguish syntax errors from generation failures

## Editor Implication

The editor should not reimplement this pipeline in UI code.
It should call into the authoritative generator core and visualize outputs.
