# Official Template Anomalies

## Scope

This page records diagnostics currently produced by the scanner against the official template set and Core data.

Current scan baseline:

- command: `npm run core:scan`
- templates: `56`
- variants: `66`
- zones: `902`
- connections: `1393`
- diagnostics: `41` errors, `94` warnings
- data source: `external/map_templates` and `external/Core.zip`, both symlinked to the Steam install

The goal is not to make official data look clean. The editor should distinguish game-breaking author errors from official legacy patterns that must round-trip safely.

## Engine Evidence

- `RandomMapTemplate.Zone` defines `guardedContentPool`, `unguardedContentPool`, `resourcesContentPool`, `contentCountLimits`, and `mandatoryContent` as `string[]` in `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`.
- `RandomMapTemplate.MainObject` defines singular `faction`, not plural `factions`, in `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`.
- `BiomeRuleType` only has `FromList`, `MatchZone`, and `MatchMainObject` in `GameEngineMapGenerator/MapGenerator/BiomeRuleType.cs`.
- `CreateZones` randomly samples one id from each zone pool array, then randomly samples one `contentCountLimits` preset and one `mandatoryContent` preset if those arrays are non-empty in `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`.
- `CreateConnections` resolves `guardZone` by name, but resets it to `-1` if it is not the `from` or `to` endpoint in `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`.
- `ParseRoads` runs after mandatory-content preset expansion, so `RoadTargetType.MandatoryContent` can only target content names created by the randomly selected preset in that generation attempt.
- `RuleParseUtils.TryParseConnectionIndex` rejects placement/road targets that point to a `Proximity` connection.

## Conditional RMG Behavior

Several fields are conditional because the runtime does not use all authored alternatives at once.

| Authored field | Runtime behavior | Editor implication |
| --- | --- | --- |
| `variants[]` | one variant is randomly selected | validate every variant statically; preview must pick or sample a variant |
| `zone.guardedContentPool[]` | one pool id is randomly selected | show as alternatives, not merged pools |
| `zone.unguardedContentPool[]` | one pool id is randomly selected | unresolved ids are blocking because any selected missing id can break generation |
| `zone.resourcesContentPool[]` | one pool id is randomly selected | same as above |
| `zone.contentCountLimits[]` | one local preset id is randomly selected | roads/content previews depend on chosen preset only indirectly through placement outcome |
| `zone.mandatoryContent[]` | one local preset id is randomly selected, then all entries in that preset are created | road targets and placement rules must be checked against each possible selected preset, not just the union |
| `ContentPoolConfig.groups[]` | weighted group choice contributes candidates through inline `content` plus `includeLists` | unresolved include lists are blocking unless a compatibility alias is explicitly configured |
| `MainObject.faction` | resolved after spawn faction selection; `Match` can depend on another main object | detect circular dependencies and index drift |
| `zoneBiome` | resolved after main-object factions | `MatchMainObject` depends on valid main-object index and faction-biome lookup |
| `contentBiome` / `metaObjectsBiome` | default to matching the zone if omitted or invalid parse returns default meta behavior in some paths | show effective behavior separately from authored JSON |
| `connection.guardZone` | only accepted if it is one endpoint; otherwise runtime guard zone becomes `-1` | warn, do not block official templates |
| road target `MandatoryContent` | resolved after selected mandatory preset expansion | target must exist in every selectable mandatory preset unless the editor models conditional roads |
| placement rule `Connection` | target connection must exist, be incident to the current zone, and not be `Proximity` | validate in zone context, not globally |

## Current Diagnostic Categories

| Diagnostic code | Count | Severity recommendation | True error or tolerated pattern | Likely cause | Safe auto-fix policy |
| --- | ---: | --- | --- | --- | --- |
| `contentPool.includeList.unresolved` | `29` | blocking for new/user-authored templates; official-data compatibility warning if an alias table is enabled | true missing Core reference | Core content pools reference content lists that are not present in the indexed Core content-list collection | do not silently rewrite; allow explicit user-approved alias or removal |
| `contentCountLimits.unresolved` | `8` | blocking | true missing local preset reference | official templates contain misspelled or mismatched local preset names | only auto-fix if exact same-template edit-distance alias is unambiguous and user confirms |
| `mandatoryContent.unresolved` | `3` | blocking | true missing local preset reference | official templates reference missing or differently named local mandatory presets | only auto-fix if exact same-template alias is unambiguous and user confirms |
| `biomeRule.type.invalid` | `1` | blocking | true invalid enum for current C# source | template uses `zoneBiome.type = "Match"` but C# biome rules do not define `Match` | suggest `MatchZone` when args are a zone name, but require confirmation |
| `mainObject.factions.unknown` | `90` | warning | tolerated legacy/unused field | shipped templates include plural `factions: []`, while C# uses singular `faction` | preserve on load/save; never generate new `factions`; optional cleanup only on explicit normalize |
| `connection.guardZone.nonEndpoint` | `4` | warning | tolerated official pattern with runtime fallback | official template sets guard zone to a real non-endpoint zone; runtime discards it by setting `-1` | preserve authored value; preview effective guard zone as `none`; optional cleanup only on explicit normalize |

## Details By Diagnostic

### `contentPool.includeList.unresolved`

Breakdown:

- `content_list_building_common_guarded_resource_banks`: `28` references across `generator_content_pools.json`, `template_anarchy_pools.json`, `template_christmas_tree_pools.json`, `template_crossroads_pools.json`, `template_diamond_pools.json`, `template_ikarus_pools.json`, `template_jebus_outcast_pools.json`, `template_kerberos_pools.json`, `template_madness_pools.json`, `template_miracle_pools.json`, `template_mlyn_pools.json`, `template_showdown_pools.json`, `template_wastelands_pools.json`, `template_zookeeper_pools.json`, and `templates_square_pools.json`.
- `template_pool_symphony_guarded_center_zone_pandora_box`: `1` reference in `template_symphony_pools.json`.

Source evidence:

- Core defines nearby names such as `content_list_building_common_guarded_resource_bank_fix`, `basic_content_list_building_guarded_resource_banks_tier_1`, `basic_content_list_building_guarded_resource_banks_tier_2`, and `basic_content_list_building_guarded_resource_banks_tier_3`.
- Core defines Symphony lists including `template_pool_symphony_guarded_start_zone_pandora_box`, `template_pool_symphony_guarded_side_zone_pandora_box`, and `template_pool_symphony_guarded_side2_zone_pandora_box`, but the pool references `template_pool_symphony_guarded_center_zone_pandora_box`.
- `TemplateContext.GetContentPool` builds a runtime `ContentPool` from the pool config and content-list collection. Missing include lists are logged as config errors during expansion.

Recommendation:

- Keep blocking for created or edited templates.
- For official imports, display as official Core anomaly. Do not mutate extracted Core data.
- Add a future compatibility-alias layer if game testing proves the intended replacements.

### `contentCountLimits.unresolved`

Breakdown:

- `content_limits_spaws`: `5` references in `All Around.rmg.json`, `Highway.rmg.json`, `Junction.rmg.json`, `Staircase.rmg.json`, and `Sworn.rmg.json`.
- `content_limits_supertreasures`: `3` references in `Staircase.rmg.json` and `Yin Yang.rmg.json`.

Source evidence:

- Many templates define `content_limits_spawn`, `content_limits_spawns`, or both.
- Many templates define singular `content_limits_supertreasure`, while the broken references use plural `content_limits_supertreasures`.
- `MapDescriptionBuilder.CreateZones` samples one content-limit preset id and logs `Couldn't find content count limits preset ...` when lookup fails.

Recommendation:

- Blocking because a selected missing preset means the intended limit preset is not applied.
- Suggest aliases in UI, but do not auto-commit without confirmation:
  - `content_limits_spaws` likely meant `content_limits_spawns` in the affected templates.
  - `content_limits_supertreasures` likely meant `content_limits_supertreasure` when that preset exists locally.

### `mandatoryContent.unresolved`

Breakdown:

- `mandatory_content_treasur_1`: `1` reference in `Fair'n Square.rmg.json`.
- `mandatory_content_yellow`: `2` references in `Trinity.rmg.json`.

Source evidence:

- `Fair'n Square.rmg.json` defines `mandatory_content_treasure_1`, but references `mandatory_content_treasur_1`.
- Other official templates define `mandatory_content_yellow`, but mandatory-content presets are template-local; `Trinity.rmg.json` does not define that preset.
- `MapDescriptionBuilder.CreateZones` samples one mandatory preset id and logs `Couldn't find mandatory content preset ...` when lookup fails.

Recommendation:

- Blocking for user-authored templates.
- Safe suggestion for `mandatory_content_treasur_1` -> `mandatory_content_treasure_1` in the same file.
- No safe automatic fix for Trinity unless a local preset is created or imported intentionally.

### `biomeRule.type.invalid`

Breakdown:

- `Match`: `1` use at `Sand Clover.rmg.json`, `$.variants[0].zones[3].zoneBiome.type`.

Source evidence:

- C# `BiomeRuleType` has no `Match`.
- `Sand Clover.rmg.json` uses `zoneBiome: { "type": "Match", "args": [ "Side-A" ] }`.
- Faction rules do support `Match`, which likely caused authoring confusion.

Recommendation:

- Blocking for edited templates because the generator cannot parse it as a biome rule.
- UI should offer `MatchZone` because the arg is a zone name, but require explicit confirmation.

### `mainObject.factions.unknown`

Breakdown:

- `90` occurrences across `Arcade`, `Christmas Tree`, `Crossroads`, `Expanse`, `Flashback`, `Full Hire`, `Hallway`, `Harmony`, `Madness`, `Maneuvers`, `Miracle`, `Overthrow`, `Spider`, `Sprint`, `Symphony`, `Trinity`, and `Zookeeper`.

Source evidence:

- The C# model has `MainObject.faction`.
- Shipped JSON sometimes includes plural `factions: []`, usually empty.
- Unity JSON deserialization ignores fields that are not present in the target type.

Recommendation:

- Advisory only.
- Preserve the field for round-trip compatibility.
- Hide from normal authoring UI or show as an advanced raw/legacy field.
- Never use it to compute effective faction behavior.

### `connection.guardZone.nonEndpoint`

Breakdown:

- `4` occurrences in `Infinity.rmg.json`; all point at `Center`.

Source evidence:

- The resolver sees `Center` as a real zone, but not as the connection's `from` or `to`.
- `MapDescriptionBuilder.CreateConnections` sets runtime `connection.guardZone` to the found zone index, then resets it to `-1` if it is neither endpoint.

Recommendation:

- Advisory only for official data.
- UI should show two values:
  - authored guard zone: `Center`
  - effective runtime guard zone: none / `-1`
- For new authored connections, block or warn before save when `guardZone` is not empty and not an endpoint.

## Legacy Shape Already Accepted

The official templates include `17` scalar `contentCountLimits` assignments, for example:

- `Wastelands.rmg.json`: `contentCountLimits: "content_limits_center"` and `content_limits_connector`
- `Diamond.rmg.json`: `contentCountLimits: "content_limits_spawn"`
- `Crossroads.rmg.json`: `contentCountLimits: "content_limits_treasure"`
- `Christmas Tree.rmg.json`: `contentCountLimits: "content_limits_spawn"` and `content_limits_trunk`
- `Flashback.rmg.json`, `Expanse.rmg.json`, and `Showdown.rmg.json`

This is a legacy official-template shape. The editor core should continue to accept scalar strings as one-option arrays for read/resolve, then normalize to arrays only when the field is touched by a mutation.

## Editor Severity Model

Use two axes:

- authored validity: whether the JSON should be considered valid for newly created/edited templates
- official compatibility: whether a shipped file should be shown, preserved, and previewed despite the anomaly

Recommended levels:

- `block-save`: unresolved zone endpoints, unresolved pool ids, unresolved local presets, invalid enums, invalid spawn/owner values, broken road targets.
- `block-generation-preview`: unresolved include lists unless an explicit compatibility alias is active.
- `warn-effective-drift`: guard zone not endpoint, fields that engine discards, scalar-vs-array legacy shape.
- `preserve-raw`: unknown official fields such as plural `factions`.

## Safe Auto-Fix Rules

- Never rewrite official templates or extracted Core data silently.
- Only auto-fix references when the target exists in the same local scope and the alias is unambiguous.
- Treat template-local names as local, even if another official template has a same-named preset.
- For enum fixes, prefer suggestions over mutation unless the mapping is one-to-one and confirmed.
- Preserve unknown fields on round-trip unless the user explicitly asks for normalization.
- When a field is conditional, validate each possible selected alternative. A union of alternatives can hide real generation failures.

