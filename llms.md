# Olden Era RMG Editor Knowledge Router

This repository is being mapped for a Heroes of Might and Magic: Olden Era random map generator editor.

Use this file as the first stop for future agents. It delegates the investigation into focused markdown files and points back to the source-of-truth code/data.

## Source Of Truth

- Full installed RMG templates: `external/map_templates/*.rmg.json`
- Extracted installed core data: `extracted/Core`
- Extracted content pools: `extracted/Core/generator/content_pools`
- Extracted content lists: `extracted/Core/generator/content_lists`
- Extracted zone layouts: `extracted/Core/generator/zone_layouts`
- RMG C# model and generator logic: `GameEngineMapGenerator/MapGenerator/*.cs`
- Fixed-map editor/decompiled UI source: `GameEngineMapGenerator/MapEditor/*.cs`
- Reproducible local scanner: `tools/rmg_scan.py`
- Headless editor core: `src/core`
- Headless graph adapter: `src/core/graph`
- UI-ready headless editor model: `src/core/editor-model`
- UI field/schema contract: `src/core/editor-schema`
- UI command/action bridge: `src/core/editor-actions`
- Safe immutable template mutations: `src/core/mutations`
- Browser UI shell: `src/ui`
- Partial older template sample: `GameDB/RMGMAPS/*.rmg.json`
- Partial older global data sample: `GameDB/data.json`, `GameDB/biomes_info.json`, `GameDB/heroes/*/*.json`

## Current Documentation Sets

- `docs/rmg/`: fresh, source-grounded topic notes for this repository.
- `docs/rmg-kb/`: imported prior knowledge base from `/home/derpcat/projects/OE_RMG/docs/rmg-kb/`; useful as a broader seed, but verify against this repository before treating as final.

## Read Order

1. `docs/rmg/game-data-locations.md`
2. `docs/rmg/live-template-inventory.md`
3. `docs/rmg-kb/domain/conditional-generation-semantics.md`
4. `docs/rmg-kb/invariants/official-template-anomalies.md`
5. `docs/rmg/schema-source-references.md`
6. `docs/rmg-kb/schema/misc-settings-compatibility.md`
7. `docs/rmg/template-inventory.md`
8. `docs/rmg/map-editor-source.md`
9. `docs/rmg/core-architecture.md`
10. `docs/rmg/graph-model.md`
11. `docs/rmg/editor-model.md`
12. `docs/rmg/editor-schema.md`
13. `docs/rmg/editor-actions.md`
14. `docs/rmg/ui-shell.md`
15. `docs/rmg/mutations.md`
16. `docs/rmg/zones.md`
17. `docs/rmg/connections.md`
18. `docs/rmg/content-pools.md`
19. `docs/rmg/mandatory-content.md`
20. `docs/rmg/players-factions-heroes.md`
21. `docs/rmg/rules-and-references.md`
22. `docs/rmg/zone-layouts-terrain.md`
23. `docs/rmg/treasure-economy.md`
24. `docs/rmg/validation-and-gaps.md`

If a topic file is missing or thin, use the matching `docs/rmg-kb/` schema/domain/invariant page as a seed, then re-check against `GameEngineMapGenerator/MapGenerator` and `GameDB/RMGMAPS`.

## Topic Delegation

- Zones: `docs/rmg/zones.md`
- Live RMG template inventory: `docs/rmg/live-template-inventory.md`
- Map editor source: `docs/rmg/map-editor-source.md`
- Core architecture: `docs/rmg/core-architecture.md`
- Graph model: `docs/rmg/graph-model.md`
- Editor model: `docs/rmg/editor-model.md`
- Editor schema registry: `docs/rmg/editor-schema.md`
- Editor action bridge: `docs/rmg/editor-actions.md`
- UI shell: `docs/rmg/ui-shell.md`
- Safe mutations: `docs/rmg/mutations.md`
- Connections, gates, portals: `docs/rmg/connections.md`
- Content pools, content lists, weighted rolls: `docs/rmg/content-pools.md`
- Mandatory content presets and entries: `docs/rmg/mandatory-content.md`
- Players, spawns, owners, factions, heroes: `docs/rmg/players-factions-heroes.md`
- Biome, faction, placement, road rules: `docs/rmg/rules-and-references.md`
- Zone layouts, terrain, roads, ambient pickups: `docs/rmg/zone-layouts-terrain.md`
- Treasure, value budgets, guards, content limits: `docs/rmg/treasure-economy.md`
- Broken/unknown fields and editor validation: `docs/rmg/validation-and-gaps.md`
- Conditional/sampled/optional runtime semantics: `docs/rmg-kb/domain/conditional-generation-semantics.md`
- Official scanner anomaly baseline: `docs/rmg-kb/invariants/official-template-anomalies.md`
- Misc settings compatibility and source-proof table: `docs/rmg-kb/schema/misc-settings-compatibility.md`

## Hard Facts Established So Far

- The template root is `RandomMapTemplate` in `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`.
- A template randomly selects one variant in `MapDescriptionBuilder.Build`.
- A zone chooses one ID from each pool-reference array: `guardedContentPool`, `unguardedContentPool`, and `resourcesContentPool`.
- A zone chooses one mandatory-content preset ID from its `mandatoryContent` string array.
- A zone chooses one content-count-limit preset ID from its `contentCountLimits` string array when non-empty.
- Root `mandatoryContent` is preset definitions; zone `mandatoryContent` is preset references.
- Root `contentCountLimits` is local preset definitions; zone `contentCountLimits` is preset references.
- Pool/list/layout definitions can be local or inherited from Core generator config; mandatory-content and count-limit presets are template-local only.
- Connection type values are `Default`, `Direct`, `GladiatorArena`, `Portal`, and `Proximity`.
- `Default` connections become effective `Direct` if a gate is placed and effective `Portal` otherwise; `Direct` can fall back to `Portal` if no valid gate is placed.
- `Proximity` affects adjacency but cannot be targeted by road or placement-rule connection targets.
- Road `type` falls back to `Dirt` when omitted or invalid because `EnumParser` returns the first enum value.
- `src/core/editor-schema` exposes a source-backed UI schema registry with 121 fields, 9 sections, edit-level classifications, picker hints, validation hints, mutation routes, sampled-alternative flags, and compatibility/preserve-only status.
- `src/core/editor-actions` exposes `applyEditorAction` and `resolveEditorPicker`, routing UI field/entity commands to safe mutations and optional transaction history.
- `src/ui` contains the first tokenized responsive browser shell; build with `npm run ui:build` and preview with `npm run ui:preview`.
- Declared misc game-rule fields such as `factionLawsExpModifier`, `astrologyExpModifier`, and `bonuses` are valid `.rmg.json`; connection-level `road`, `simTurnSquad`, and `guardRandomization` are official compatibility fields absent from inspected `RandomMapTemplate.Connection`.
- `uniqueMagicCostModifiers` is source-mismatched in this snapshot: referenced by `ContentPlacer`, not declared by inspected `GameRules.cs`, and unused by official templates. Preserve if encountered, but do not create by default.
- The checked-in templates rely heavily on external/shared content pools not present in this repository.
- The installed game data is now linked/extracted locally: 56 live templates in `external/map_templates` and 532 extracted content pool definitions under `extracted/Core/generator/content_pools`.
- `tools/rmg_scan.py` reproduces live template/pool counts and unresolved-reference checks.
- `bbolbval.rmg.json` looks experimental and has invalid local `valueDistribution` bracket/weight counts under the current C# validator.
- Current TypeScript scanner baseline against official live data is 41 errors and 94 warnings; see `docs/rmg-kb/invariants/official-template-anomalies.md` before treating these as editor bugs.

## Editor Rule Of Thumb

Do not model `.rmg.json` as plain JSON only. The editor needs a resolved-reference layer:

- name references: zone names, connection names, mandatory content names, preset names, pool names, content list names
- index references: main object indexes within a zone
- random alternatives: arrays that are sampled, not always included
- external dependencies: mod generator folders loaded by `GeneratorConfig`
- ignored/unknown fields: Unity `JsonUtility` silently ignores fields that are not represented in C# public fields
