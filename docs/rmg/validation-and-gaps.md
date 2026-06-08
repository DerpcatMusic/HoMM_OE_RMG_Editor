# Validation And Gaps

This file tracks checks an editor should enforce and places where checked-in data/source disagree or depend on missing external assets.

## Status

- `done`: we have a practical validation checklist and a catalog of known mismatches from source/data scans.
- `partial`: some validation rules are hard constraints in core, while others are advisory because the shipped data is inconsistent.
- `missing`: automatic repair flows, import-time normalization, and user-facing remediation helpers.

## Validation Coverage Matrix

| Check | Where Enforced | Status |
|---|---|---|
| Template must parse as JSON | JSON parse | Blocking |
| Enum strings match C# enum names | `validateTemplateShape` | Blocking |
| `variants` contains at least one selectable variant | `resolveTemplate` | Blocking |
| Zone names unique inside a variant | `resolveTemplate` | Blocking |
| Connection `from`/`to` names a zone in the same variant | `resolveTemplate` | Blocking |
| Zone `layout` resolves to a local or global `ZoneLayoutConfig` | `resolveTemplate` | Blocking |
| Zone content-pool references resolve | `resolveTemplate` | Blocking |
| Zone mandatory-content references resolve | `resolveTemplate` | Blocking |
| Zone content-count-limit references resolve | `resolveTemplate` | Blocking |
| `gameRules.heroCountIncrement` is a non-negative integer | `validateTemplateShape` | Blocking |
| `valueDistribution` bracket count (`weights.Length == priceBounds.Length + 1`) | `validateTemplateShape` | Blocking |
| Road target names and indices resolve in current zone context | `validateSemanticPlayability` | Blocking |
| Placement rules resolve their typed references | `validateTemplateShape` | Blocking |
| Duplicate connection `name` | `addConnection`, `updateConnectionSettings`, `renameConnection` mutations | Mutation-time only |
| Spawn main objects have a parseable `spawn` | `addMainObject`, `updateMainObject` mutations | Mutation-time only |
| `owner` fields parse when present | `addMainObject`, `updateMainObject` mutations | Mutation-time only |
| Faction/biome rule dependency graphs must not cycle | Not implemented | Aspirational |
| `guardReactionDistribution` arrays not length `6` | Not implemented | Aspirational |
| Unnamed connections warning | Not implemented | Aspirational |
| Same preset name with different meanings across templates | Not implemented | Aspirational |
| Reference graph: encounters, environment assets, value-override references | Not implemented | Aspirational |

## Blocking Validation

- Template must parse as JSON.
- Enum strings must match C# enum names exactly.
- `variants` must contain at least one selectable variant.
- Zone names must be unique inside a variant.
- Every connection `from` and `to` must name a zone in the same variant.
- Every zone `layout` must resolve to a local or global `ZoneLayoutConfig`.
- Every zone content-pool reference must resolve to a local or global `ContentPoolConfig`.
- Every zone mandatory-content reference must resolve to a root `MandatoryContentPreset`.
- Every zone content-count-limit reference must resolve to a root `ContentCountLimitPreset`.
- `gameRules.heroCountIncrement` must be a non-negative integer. Official fixed-count templates can use `0`.
- `valueDistribution.weights.Length` must equal `valueDistribution.priceBounds.Length + 1`.
- Road target names and indices must resolve in the current zone context.
- Placement rules must resolve their typed references.

Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:78`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:135`, `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:107`, `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:116`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:271`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:487`, `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs:216`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:672`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:805`.

## Advisory Validation

- Unknown JSON fields that Unity `JsonUtility` will ignore.
- Fields with scalar values where the C# model expects arrays.
- References to external content pools/lists not present in this checkout.
- Connection-level `road`, `simTurnSquad`, and `guardRandomization` fields are present in official templates but not declared on the inspected `RandomMapTemplate.Connection` C# type.
- `guardZone` values that do not name one endpoint zone are discarded by the generator.

Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:56`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1160`, `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:39`.

## Mutation-Time Checks

The following checks are enforced by the core mutation API (`src/core/mutations/`) but are **not** emitted by `validateTemplateShape` or `validateSemanticPlayability`. Templates that violate these rules can still be loaded and resolved; the constraints only block new edits.

- **Duplicate connection names** — `addConnection.ts`, `updateConnectionSettings.ts`, and `renameConnection.ts` reject duplicate names at insert/update time. `roadHelpers.ts` warns when a road target resolves a name that is duplicated in the variant.
- **Spawn parseability** — `addMainObject.ts` and `updateMainObject.ts` require `spawn` to be a valid `Player1`..`Player8` reference when `type === "Spawn"`.
- **Owner parseability** — `addMainObject.ts` and `updateMainObject.ts` require `owner` to be a valid player reference when present.
- **`guardReactionDistribution` element types** — `updateZoneSettings.ts` rejects non-numeric or negative entries, but does **not** check array length.

## Aspirational / Future Checks

These checks are described in the C# source or are desirable for editor safety, but are **not yet implemented** in the TypeScript core.

- **Faction and biome rule dependency graphs must not cycle.** The C# builder resolves faction/biome rules recursively; cycles would stack-overflow at generation time. The TypeScript validator does not build or check these graphs.
- **Duplicate connection name check in structural/semantic validation.** Currently only blocked at mutation time (see above). A full validator should surface duplicate connection names as errors on existing templates.
- **Spawn parseability in structural validation.** Currently only enforced in `addMainObject.ts` / `updateMainObject.ts`.
- **`owner` parseability in structural validation.** Currently only enforced in `addMainObject.ts` / `updateMainObject.ts`.
- **`guardReactionDistribution` length check.** The runtime expects six entries matching the `ESquadReactionType` enum (`Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, `Docile`). The current code only validates that entries are non-negative numbers; it never checks that the array is length `6`.
- **Unnamed connection warning.** Many official templates contain unnamed connections. The editor should warn that these cannot be referenced by name from roads or placement rules, but no validator currently emits this.
- **Same preset name with different meanings across templates.** A global index scan could detect when `contentPools`, `contentLists`, `mandatoryContent`, or `contentCountLimits` presets share a name but differ in content across templates.
- **Reference graph validation for encounters, environment assets, and value-override references.** The resolver (`resolveTemplate.ts`) validates pool, layout, and preset resolution. It does **not** validate `encounter_templates`, `generator_environment_assets`, or value-override references against external game data.

## Schema Shape Checks

The editor should validate against the inspected C# public fields, then preserve unknown fields for round-trip compatibility. Unity `JsonUtility` does not provide normal JSON-schema validation, so malformed field shapes can silently become defaults or partially ignored depending on type.

High-priority checks:

- Zone `contentCountLimits` is `string[]` in `RandomMapTemplate.Zone`, not a scalar string. Source: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:56`.
- Zone `mandatoryContent` is `string[]`, while root `mandatoryContent` is `MandatoryContentPreset[]`. Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:90`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:281`.
- Root `contentCountLimits` is preset definitions, while zone `contentCountLimits` is preset references. Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:56`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:232`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:283`.
- Main-object faction filtering uses singular `faction`, not `factions`, in the inspected model. Source: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:161`.
- `guardReactionDistribution` should have the same length as the runtime guard-reaction enum distribution. **Not yet implemented in TypeScript validation.** The code indexes by guard reaction and logs when the roll falls outside all weights. Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:84`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1160`.
- Runtime guard reactions are `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, and `Docile`; do not expose the `NUM` enum sentinel as an editor value. Source: `/mnt/Gaming/SteamLibrary/steamapps/common/Heroes of Might and Magic Olden Era/AssetRipper_export_20260505_154541/Scripts/Hex/Hex/Configs/ESquadReactionType.cs:6`.

## Reference Graph Checks

Build a resolved-reference graph for the selected variant before generation:

**Implemented:**

- Zone references: connection endpoints, `guardZone`, road targets, and placement-rule zone targets.
- Connection references: roads and placement rules that target named connections.
- Main-object references: roads and placement rules that target zone-local main object indexes.
- Preset references: mandatory content, content count limits, zone layouts, content pools, and content lists.

**Not yet implemented:**

- `gatePlacementArgs` for `NearZone` placement rules (zone target is validated at mutation time in `updateMainObject.ts`, but not in the resolver).
- External generator references: encounters and environment assets loaded by `GeneratorConfig`.
- Value-override references within presets or content pools.

Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:135`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:145`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:243`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:271`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:487`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:50`, `GameEngineMapGenerator/MapGenerator/GeneratorConfig.cs:63`.

## Known Data/Source Mismatches

- Some shipped main objects use `factions: []`, but the inspected C# model has `faction`, singular. Unknown fields are ignored by Unity `JsonUtility`; these entries effectively rely on the default `FactionRule`. Examples: `external/map_templates/Crossroads.rmg.json:130`, `external/map_templates/Memory Lane.rmg.json:56`.
- At least two shipped zones use scalar `contentCountLimits` even though C# expects `string[]`. Examples: `external/map_templates/Crossroads.rmg.json:64`, `external/map_templates/Memory Lane.rmg.json:404`.
- `Pyramid.rmg.json`, `Symphony.rmg.json`, and `Yin Yang.rmg.json` use `heroCountIncrement: 0` with fixed `heroCountMin == heroCountMax`; this is official data and should be accepted.
- `WinConditions.cs` declares `cityHold`, `cityHoldDays`, `tournament`, and tournament parameter fields, and official templates use them. However, the inspected `ContentPlacer.SetGameRules` only emits `classic`, `desertion`, `heroLighting`, `lostStartCity`, `lostStartHero`, and `gladiatorArena` into `MapWinCondition` entries.
- `ContentPlacer.SetGameRules` references `gameRules.uniqueMagicCostModifiers`, but the inspected `GameRules.cs` in this workspace does not declare that field and official templates do not appear to use it. Preserve it if encountered, but do not expose it as a normal setting until the defining model is found.
- `bbolbval.rmg.json` (from the older `GameDB/RMGMAPS` sample) local content pools have invalid value-distribution bracket counts under `ValueDistribution`. Sources: `GameDB/RMGMAPS/bbolbval.rmg.json:323` (older sample), `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:39`.
- Official `external/map_templates` use connection-level `road` 917 times, `simTurnSquad` 430 times, and connection-level `guardRandomization` 166 times, but these fields are absent from `RandomMapTemplate.Connection`.
- Official `external/map_templates` contain unnamed connections and duplicate connection names. Name-based references resolve by first match, so the editor must use connection indexes internally and warn on ambiguous names.
- Official `external/map_templates` often set `guardZone` to missing or non-endpoint zone names. The generator normalizes those to `-1`.
- Optional semantic road validation finds broken road references in official templates, including missing connection names, missing main-object indexes, and one connection target that does not touch the owning zone. Keep baseline source scans permissive, but keep editor-created road mutations strict.

## Missing External Assets In This Checkout

`GeneratorConfig` loads shared generator data from mod folders:

- `generator/generator_config.json`
- `generator/generator_stats_config.json`
- `generator/generator_environment_assets.json`
- `generator/encounter_templates`
- `generator/zone_layouts`
- `generator/content_lists`
- `generator/content_pools`

Source: `GameEngineMapGenerator/MapGenerator/GeneratorConfig.cs:63`.

Most templates reference content pools that are not embedded in their root `contentPools` arrays. With only the older partial sample previously in `GameDB/RMGMAPS`, these look unresolved. With the installed game data linked/extracted, they resolve from `extracted/Core/generator/content_pools`.

Current local resolver check: the 56 live templates in `external/map_templates` reference 399 unique content pool names, and all 399 resolve against the 532 pool definitions in `extracted/Core/generator/content_pools`.

## Runtime Failure Modes

- `Direct` can degrade to `Portal` in `Layout` if no valid gate is found. Source: `GameEngineMapGenerator/MapGenerator/Layout.cs:148`.
- `Default` resolves to `Direct` if it gets a gate, otherwise `Portal`. Source: `GameEngineMapGenerator/MapGenerator/Layout.cs:152`.
- Invalid placement rules are logged and dropped. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:456`.
- Invalid road endpoints skip that road. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:491`.
- Missing mandatory content slots are tracked at placement time, not just parse time. Source: `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:423`.
- A budget can under-fill if no valid content can be rolled for a value bracket, biome, pool, and current limits. Source: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:433`.
- Actual content value depends on generated playable area, not only authored zone `size`. Source: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:275`.
- `GladiatorArena` generation throws if no valid arena gate is found. Source: `GameEngineMapGenerator/MapGenerator/Gates.cs:584`.

## Editor Implications

- Provide two validators: structural JSON/schema validation and generator-context validation.
- Distinguish blocking errors from compatibility warnings.
- Preserve unknown fields for round-trip safety even if the current C# model ignores them.
- Make all sampled arrays visually explicit so users understand that alternatives are randomly selected.
- Add a reference graph view for zones, connections, main object indexes, presets, pools, and mandatory content names.
- Surface mutation-time constraints (duplicate connection names, spawn/owner parseability) as hard guards in the UI even though they are not currently part of load-time validation.
