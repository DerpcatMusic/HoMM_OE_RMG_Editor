# Template Context And External Dependencies

## Purpose

Document what a template can define locally and what it still depends on externally.

## Source Files

- `TemplateContext.cs`
- `GeneratorConfig.cs`
- `ContentPool.cs`
- `ContentDatabase.cs`
- `extracted/Core/DB/data.json`

## Code Fact

`TemplateContext` merges:

- template-local `zoneLayouts`
- template-local `contentPools`
- template-local `contentLists`
- template-local `mandatoryContent`
- template-local `contentCountLimits`

with global generator configuration loaded through `GeneratorConfig`.

Merge behavior is asymmetric:

- `zoneLayouts`, `contentPools`, and `contentLists` can be template-local and then fall through to global Core generator configs.
- `mandatoryContent` and `contentCountLimits` are template-local collections only; zones reference local preset names.
- `valueOverrides` and `globalBans` are template-level modifiers applied while building content databases and pools.
- The runtime `TemplateContext.GetContentPool(...)` caches resolved pools by id, so identical pool references in multiple zones share the parsed pool object for that generation.

## External Dependencies

Even a fully populated template still depends on:

- global zone layout configs when a local override is missing
- global content pool configs
- global content lists
- encounter templates
- content database / map object definitions
- available factions and heroes
- water-for-biome mappings
- meta object config

## Important Consequence

An `.rmg.json` file is not self-validating in isolation.

Validation needs:

- the template file
- the generator config context
- the available game data for factions, heroes, objects, and encounters
- the current Core generator folders: `generator/content_pools`, `generator/content_lists`, and `generator/zone_layouts`
- the current Core DB object/faction/hero data when validating content SIDs and picker catalogs

## Observed In Shipped Templates

- all shipped templates define local `zoneLayouts`
- all shipped templates define local `mandatoryContent`
- all shipped templates define local `contentCountLimits`
- most shipped templates reference global Core content pools instead of embedding large local `contentPools` payloads
- official templates use some legacy/ignored JSON shapes; preserve unknown fields for round-trip compatibility even when the inspected C# model ignores them

## Inference

Future tooling should always expose:

- local definitions
- resolved definition source
- whether a referenced definition is local or inherited from global config
- unresolved references with enough context to distinguish broken template-local preset names from missing Core data
- compatibility normalization when official JSON uses a scalar string where the C# model expects a `string[]`
