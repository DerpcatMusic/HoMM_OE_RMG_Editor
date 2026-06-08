# Preview And Debug Surfaces

## Purpose

Document the existing runtime debug data that should back editor preview and diagnostics.

## Source Files

- `Layout.cs`
- `ContentPlacer.cs`
- `Tests/BhMapgenDebugController.cs`
- `Tests/BhDebugMapDrawer.cs`

## Code Fact

`Generator.Generate(..., debugInfo: true)` returns a `GeneratorResult` whose `layout` and `contentPlacer` expose debug surfaces already used by the Unity debug tooling.

## Layout Debug Surface

`Layout.DebugInfo` contains:

- `zonePositions`
- `zoneSizeScale`
- `partitionDatas`
- `subzoneMap`
- `pathClusterMap`
- `pathGraphs`

`Layout` itself also exposes per-tile getters for:

- playable zone
- visual zone
- elevation
- obstacle state
- water
- river
- road

## Content Debug Surface

`ContentPlacer.DebugInfo` contains:

- `contentByTile`
- `encounterByTile`
- `guardByTile`
- `mainObjectByTile`
- `portalByTile`
- per-zone content summaries
- ambient pickup tiles
- updated obstacle map
- environment debug data

## Observed In Shipped Templates

Shipped templates use enough roads, mandatory content, ownership, connection types, and local presets that these debug surfaces are directly relevant to editor work.

## Inference

The minimum useful preview contract for an editor should include:

- resolved template metadata
- zone graph and sampled variant
- layout debug data
- content debug data
- generation warnings/errors
