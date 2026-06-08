# Conditional Generation Semantics

## Purpose

Document which `.rmg.json` fields are conditional, optional, sampled, ignored, or only meaningful after another generator decision. This page is about generator control-flow, not just schema shape.

## Primary Sources

- `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `GameEngineMapGenerator/MapGenerator/TemplateContext.cs`
- `GameEngineMapGenerator/MapGenerator/Generator.cs`
- `GameEngineMapGenerator/MapGenerator/Layout.cs`
- `GameEngineMapGenerator/MapGenerator/ZoneMapper.cs`
- `GameEngineMapGenerator/MapGenerator/Gates.cs`
- `GameEngineMapGenerator/MapGenerator/ZonePartition.cs`
- `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs`
- `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPool.cs`
- `GameEngineMapGenerator/MapGenerator/ContentTask.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs`
- `GameEngineMapGenerator/MapGenerator/GameRules.cs`
- `GameEngineMapGenerator/MapGenerator/WinConditions.cs`

## Terms

- `Conditional`: a field is only consumed when another field has a specific value.
- `Optional`: a field can be absent and the generator has a default, empty list, fallback, or no-op behavior.
- `Sampled alternative`: an array is not merged; the generator chooses exactly one entry at generation time.
- `Effective runtime type`: the final behavior after layout decisions, which can differ from the serialized JSON value.
- `Compatibility field`: observed in official JSON but not proven consumed by the inspected generator model.

## Proven Build Order

`Generator.Generate` calls `MapDescriptionBuilder.Build`, then `Layout.Generate`, then `ContentPlacer.Run`. It retries layout/content generation failures up to the requested attempt count, and it also retries while mandatory content is missing.

`MapDescriptionBuilder.Build` performs this order:

1. Parse JSON into `RandomMapTemplate`.
2. Build `TemplateContext`.
3. Pick one variant with `random.Next(template.variants.Length)`.
4. Copy template-level settings.
5. Create zones.
6. Create connections.
7. Parse roads.
8. Parse placement rules.
9. Resolve main-object factions.
10. Resolve zone/content/meta-object biomes.
11. Check resource-fraction layout settings.

Editor implication: validation must separate authoring/schema validity from generation survivability. A template can parse correctly and still fail when layout or content placement cannot satisfy gates, roads, mandatory content, or encounter slots.

## Variant Semantics

### Proven From Source

`MapDescriptionBuilder.Build` randomly selects one `variants[]` entry. Zones, connections, orientation, border, and river settings all come from that selected variant.

### Editor Implications

- Treat each variant as a complete graph, not as a patch over a base graph.
- Zone names, connection names, main-object indices, road targets, and rules are variant-local.
- A root-level edit can affect every variant, but a graph edit usually must be applied to one variant at a time unless explicitly bulk-applied.

## Template-Level Rules

### Proven From Source

`FillTemplateParams` copies `gameRules`, `valueOverrides`, `BanInfo`, and `HeroPoolCount` into `MapDescription`.

`TemplateContext` builds `BanInfo` from `globalBans`, builds `ValueOverrides`, and uses template-local `zoneLayouts`, `contentPools`, and `contentLists` when present, with generator config references also available. Mandatory content presets and content-count-limit presets are template-local collections.

`gameMode` is parsed later in `ContentPlacer.SetGameRules`. Supported inspected enum values are `Classic` and `SingleHero` from `EMapGameMode.cs`.

### Conditional Fields

| Field | Conditional behavior |
| --- | --- |
| `globalBans` | Always used to construct `BanInfo`; content pools and mandatory weighted content use ban-aware tables. |
| `valueOverrides` | Always copied into `MapDescription`; content values and guard values use it later. |
| `zoneLayouts` | Only needed when zones reference local layout names or when overriding built-in layout names. |
| `contentPools` | Only needed when zones reference local pool names or when overriding built-in pool names. |
| `contentLists` | Only needed when pools, mandatory content, or count limits reference local list names. |
| `mandatoryContent` | Only used when a zone samples a preset id from `zone.mandatoryContent`. |
| `contentCountLimits` | Only used when a zone samples a preset id from `zone.contentCountLimits`. |

### Editor Implications

- Show local definitions and external/core definitions together, but mark where each id comes from.
- Preset rename/remove must update zone references or block the edit.
- Content-list refs are transitive dependencies of content pools, mandatory content, and count limits.

## Zone Sampled Alternatives

### Proven From Source

During `CreateZones`, each zone samples exactly one id from each of these arrays:

- `guardedContentPool`
- `unguardedContentPool`
- `resourcesContentPool`

For `contentCountLimits`, if the array length is nonzero, the generator samples exactly one preset id and expands that preset's limits.

For `mandatoryContent`, if the array length is nonzero, the generator samples exactly one preset id and expands that preset's content entries.

### Important Consequences

- Pool arrays are alternatives, not additive layers.
- Mandatory-content arrays are alternatives, not cumulative preset includes.
- Content-count-limit arrays are alternatives, not cumulative preset includes.
- Roads targeting `MandatoryContent` resolve after the selected mandatory preset is expanded.

### Editor Implications

- UI labels should say "possible presets" or "random alternatives", not "enabled presets".
- A road target to mandatory content is safe only if that entry name exists in every preset alternative the zone can sample.
- Empty pool arrays are dangerous because `CreateZones` directly indexes the selected pool arrays. Empty mandatory/count arrays are allowed and mean no preset for that feature.
- Official data may use scalar strings for fields that the C# model declares as `string[]`; the editor should read those as one-entry alternatives and normalize touched fields to arrays.

## Main Object Conditionals

### Proven From Source

`RandomMapTemplate.MainObject` supports `City`, `Spawn`, `AbandonedOutpost`, and `GladiatorArena` as `MainObjectType`.

`MapDescriptionBuilder.Parse` requires `spawn` only when `type == Spawn`. Missing or invalid `spawn` on a spawn object throws a `GeneratorException`.

`owner` is optional on all main objects. When present, it is parsed as an `ESpawn` side and copied into the runtime main object.

`faction` rules are resolved after zones and connections are created. A user-supplied `spawnFactions[]` entry overrides the faction rule for spawn main objects when the spawn has a matching player index and a non-empty supplied faction.

`ZonePartition.TryPlaceMainObjectSlot` uses city encounter templates for `City`, `Spawn`, and `AbandonedOutpost`, and gladiator-arena encounter templates for `GladiatorArena`.

### Conditional Fields

| Field | Used when | Notes |
| --- | --- | --- |
| `spawn` | `type == Spawn` | Required and hard-fails if missing or invalid. |
| `owner` | field is present | Optional owner side; invalid value hard-fails. |
| `placementArgs` | depends on `placement` | `Connection` placement needs a connection name. Other placement modes have different argument meanings. |
| `buildingsConstructionSid` | city/outpost-like placement later consumes city props | Copied to runtime main object. |
| `buildingsBanSid` | city/outpost-like placement later consumes city props | Copied to runtime main object. |
| `holdCityWinCon` | city-hold style templates | Field exists on the template type, but the inspected `ContentPlacer.SetGameRules` does not emit `cityHold`; see win-condition uncertainty below. |

### Main Object Placement

`MainObjectPlacement.Connection` is stricter than normal connection placement rules. `ZonePartition.ParseConnectionPlacementRule` requires:

- the named connection exists;
- the serialized connection type needs a ground connection;
- the connection touches the current zone;
- the placed gate is valid.

This rejects `Portal`, `Proximity`, and `Default` as authored connection-placement targets, because `Default` does not satisfy `NeedsGroundConnection()` before layout resolves it.

### Editor Implications

- Spawn objects need a required player-side picker.
- Main-object order is semantically important because roads, faction rules, biome rules, and placement rules use indices.
- Reordering main objects must rewrite all positional references or be blocked.
- `MainObjectPlacement.Connection` should only offer `Direct` and `GladiatorArena` authored connections that touch the zone, and still warn that final gate placement can fail.

## Player And Ownership Conditionals

### Proven From Source

`Generator.GetMetaInfo` counts players by scanning variant `0` for main objects whose string `type` equals `Spawn`. It emits one spawn point per parsed `spawn` side.

`ResolveMainObjectFactions` uses `spawnFactions[]` only for spawn main objects. It computes `spawnEnum - 1` as the array index, so player numbering is one-based in JSON and zero-based in the supplied faction array.

Mandatory content entries also have optional `owner`. When present, the builder parses it to an optional side and `ContentPlacer` passes it into placed mine/content objects.

### Inference

The practical player count is controlled by spawn main objects, not by a standalone player-count field. The game supports up to the engine-defined spawn enum range, but this page did not find the `ESpawn` enum source in the inspected files.

### Editor Implications

- Player assignment UI should derive active players from spawn main objects.
- Do not let a zone be "owned by player" without clarifying whether that means a spawn main object, an owned main object, or owned mandatory content.
- Changing a spawn side changes faction override indexing, start-player metadata, and start-loss semantics.

## Faction Rule Conditionals

### Proven From Source

Faction rules support `FromList` and `Match`.

For `FromList`, normal args are faction ids. Args starting with `differentFrom:` exclude the faction resolved for another main object, optionally in another zone. If the filtered list is empty, the generator falls back to a random available faction.

For `Match`, args point at another main object, optionally in another zone. The resolver follows dependencies with a stack and throws a `GeneratorException` on circular dependencies.

Spawn faction overrides from `spawnFactions[]` bypass the authored faction rule for matching spawn main objects.

### Editor Implications

- Faction-rule editors need graph validation for cycles.
- `differentFrom` references must be revalidated when main objects are reordered or zones are renamed.
- Spawn faction rules should be shown as defaults that can be overridden by lobby/player selection.

## Biome Rule Conditionals

### Proven From Source

Biome rules support `FromList`, `MatchZone`, and `MatchMainObject`.

`zoneBiome` is resolved first for every zone. `contentBiome` and `metaObjectsBiome` are then resolved by `ApplyMetaBiomeRule`; if a content/meta rule fails to parse, `DefaultMetaRule` is `MatchZone` with the current zone. This pass did not prove that a missing `BiomeRule` object is safe, because `ParseBiomeRule` reads `rule.type`.

For `FromList`, args are biome ids, except args beginning with `differentFrom:` become exclusions. A `differentFrom` exclusion can reference a zone biome or a main-object faction-derived biome.

For `MatchZone`, missing args mean "match current zone". If an arg exists, it must be a zone name.

For `MatchMainObject`, args must include a main-object index and may include a zone name.

If no valid biome remains after exclusions, the generator falls back to a random biome.

### Editor Implications

- The editor should not offer `Match` as a biome rule type. It is observed in some data diagnostics, but the inspected enum only has `FromList`, `MatchZone`, and `MatchMainObject`.
- Content/meta biome fields can be omitted for "match zone" behavior only if the serialized object still exists with a valid `MatchZone` rule.
- Rules referencing main-object indices or zone names must be rewritten or revalidated on reorder/rename.
- Show biome resolution preview as "possible/effective" because random selection and exclusions can fall back.

## Connection Type Conditionals

### Proven From Source

Connection enum values are `Default`, `Direct`, `GladiatorArena`, `Portal`, and `Proximity`.

The extension methods in `Utils.cs` define the contract:

- `NeedsGroundConnection()` is true for `Direct` and `GladiatorArena`.
- `CanHaveGroundConnection()` is true for `Default`, `Direct`, and `GladiatorArena`.
- `NeedsAdjacency()` is true for `Direct`, `GladiatorArena`, and `Proximity`.

`Gates.PlaceGates` only considers `CanHaveGroundConnection()` connections.

`Layout.CreateZonesAndConnections` computes effective runtime type:

- `Proximity` stays `Proximity` and has no guard position.
- `Direct` becomes `Portal` if no valid gate exists.
- `Default` becomes `Direct` if a valid gate exists, otherwise `Portal`.
- `Portal` remains portal-like because it cannot have a ground gate.
- `GladiatorArena` expects a gate and is handled as a special ground connection.

### Conditional Fields

| Field | Used when | Notes |
| --- | --- | --- |
| `length` | adjacency-needed connections | `Direct`, `GladiatorArena`, and `Proximity` affect zone adjacency/layout length. |
| `gatePlacement` | ground-capable connections | Only relevant for `Default`, `Direct`, and `GladiatorArena`. |
| `gatePlacementArgs` | `gatePlacement == NearZone` | `Gates` resolves the first arg as a zone name. |
| `guardZone` | ground gate selection | Kept only if it names `from` or `to`; otherwise becomes `-1`. |
| `portalPlacementRulesFrom` | effective portal endpoint in `from` zone | Parsed in the `from` zone context regardless of final effective type. |
| `portalPlacementRulesTo` | effective portal endpoint in `to` zone | Parsed in the `to` zone context regardless of final effective type. |
| `portalFromEnabled` / `portalToEnabled` | effective portal | Copied into linked `PropPortals` only when portals are placed. |
| `guardValue`, `guardWeeklyIncrement`, `guardReaction`, `guardEscape`, `guardMatchGroup` | direct guards and portal squads | Copied into connection squad parameters. |

### Special Cases

`Proximity` affects adjacency but is rejected by `RuleParseUtils.TryParseConnectionIndex`, so road targets and placement rules cannot target it as a usable connection endpoint.

`GladiatorArena` requires a valid non-ramp gate. `Gates` throws `Failed to place gladiator arena.` if it cannot select one.

### Editor Implications

- Show both authored type and effective type in previews.
- Warn that `Default` is intentionally conditional and can become either direct or portal.
- Do not show portal active flags as gameplay-relevant for `Direct` unless it can fall back to portal.
- `Proximity` should be edited as layout attraction/adjacency, not as a traversable road/portal edge.
- `guardZone` picker should only offer the two endpoint zones.

## Gate Placement And Guard Zone

### Proven From Source

`gatePlacement` supports `Random`, `Center`, and `NearZone`.

Multiple eligible connections between the same zone pair are shuffled and then sorted by gate-placement priority. `Center` has higher priority than `NearZone`, which has higher priority than `Random`.

`NearZone` resolves `gatePlacementArgs[0]` as a zone name and uses that zone's graph position as the reference point. Missing or unknown zone names log config errors and fall back to no reference point.

`guardZone` is resolved to a zone index by name, but it is discarded unless it equals the connection's `from` or `to` zone. Gate selection filters by `guardZone` only when it remains set.

### Editor Implications

- Gate placement args are conditional on `gatePlacement`.
- `NearZone` requires a zone picker.
- Non-endpoint `guardZone` values should be treated as inert official-data quirks, not meaningful settings.

## Road Conditionals

### Proven From Source

Roads are zone-local. Each road has a `type`, `from`, and `to`.

Road target types are:

- `Crossroads`
- `MainObject`
- `Connection`
- `MandatoryContent`

`ParseRoadData` drops the entire road if either endpoint fails to parse.

`Crossroads` uses no args. `MainObject` parses `args[0]` as a zone-local main-object index. `Connection` parses `args[0]` as a connection name through `RuleParseUtils.TryParseConnectionIndex`. `MandatoryContent` parses `args[0]` as a mandatory-content entry name after zone mandatory preset expansion.

If either road endpoint targets mandatory content, `ParseRoads` sets that mandatory content entry's `designatedEncounter = true`.

### Conditional Fields

| Field | Used when | Notes |
| --- | --- | --- |
| road target `args` | target is `MainObject`, `Connection`, or `MandatoryContent` | `Crossroads` ignores args. |
| `Connection` target | connection is not `Proximity` and touches current zone | Duplicate names resolve to first match. |
| `MandatoryContent` target | selected preset contains entry name | Unsafe if zone has alternatives without that entry. |
| road `type` | always parsed | Missing or invalid values fall back to the first C# enum value, currently `Dirt`. Official templates commonly write `Stone` explicitly, so omitted type should not be treated as implicit Stone. |

### Inference

The inspected `Roads.cs` file is partially obfuscated/stubbed, but the surrounding pipeline proves roads are allocated, main roads are mapped before content task creation, and encounter roads are mapped after encounter placement.

### Editor Implications

- Road editors need typed target pickers, not free text.
- Revalidate roads after changing zone mandatory-content alternatives.
- Revalidate roads after connection rename, endpoint change, type change to/from `Proximity`, or duplicate-name creation.
- Treat road previews as generated output, not as exact authoring geometry.

## Placement Rule Conditionals

### Proven From Source

Placement rules support `Random`, `Sid`, `MainObject`, `Crossroads`, `Connection`, `Road`, and `MandatoryContent`.

`TryParseRule` validates args according to rule type:

- `Random`, `Crossroads`, and `Road` need no args.
- `Sid` needs a SID arg.
- `MainObject` needs a zone-local main-object index.
- `Connection` needs a non-`Proximity` connection name touching the current zone.
- `MandatoryContent` needs a mandatory-content entry name in the current zone.

`SortPoints` shuffles points when no rules exist. With rules, it computes weights and sorts candidate points.

### Editor Implications

- Rule argument UI must switch by rule type.
- Portal placement rules must validate in the connection endpoint zone context.
- Mandatory-content placement rules can only reference entries that exist after the zone's sampled preset expands.
- `Road` rules depend on generated road maps, so previews need a generated layout.

## Content Pool Conditionals

### Proven From Source

`ContentPoolConfig.Group` has `weight`, `includeLists`, and direct `content`.

`ContentPool` builds a `ContentWeightsTable` by expanding every group. Each group includes every referenced content list that resolves, plus the group's direct `content`, then applies pool bans and hero-hire bans.

`heroHireBan` conditionally adds generator-defined hero-hire bans when constructing content pools.

`GetContent`, `GetBuilding`, and `GetPickup` filter by value bracket, limits, biome weight, and building/pickup fit. If no candidate remains, they return `null`.

### Conditional Fields

| Field | Used when | Notes |
| --- | --- | --- |
| `includeLists` | group construction | Missing referenced lists are skipped in inspected code for pools. |
| direct `content` | group construction | Added alongside include lists. |
| `bans` | pool construction | Combined with hero-hire bans. |
| `valueDistribution` | content value selection | Controls value brackets and target percentages. |
| biome weights | candidate rolling | Candidates with weight `<= 0` for the effective biome are ignored. |
| content-count limits | content rolling and mandatory sid placement | Prevents content if the limit is reached. |

### Editor Implications

- A content pool is not just a list; it is weighted groups plus bans plus value distribution plus biome/limit filtering.
- Browser UI should show why an item is eligible or filtered out for a selected zone/biome/value range.
- "Add artifact to pool" should add a `ContentWeight` candidate, but preview must still account for bans, value overrides, biome weights, variants, and limits.

## Mandatory Content Conditionals

### Proven From Source

Mandatory content presets are template-local. A zone samples one preset id and expands all entries in that preset.

For each mandatory entry:

- If `sid` is non-null, the generator uses that specific map object and `variant`.
- If `sid` is null, the generator starts from `content` and appends `includeLists`, then rolls through a ban-aware `ContentWeightsTable`.
- `rules` are optional; null becomes no placement rules.
- `owner` is optional and parsed only when present.
- `designatedEncounter`, `soloEncounter`, `isGuarded`, and `isMine` are copied to runtime.

`ContentTask.CreateMandatoryContent` applies limits. A direct `sid` can still become null if its limit is reached. A weighted roll can also become null if no candidate survives bans/limits/biome weights.

Mandatory pickups that are not buildings and have no designated encounter, no solo encounter, and no placement rules can become "hobo" mandatory pickups placed into guarded or ambient pickup slots according to `isGuarded`.

`isMine` entries are handled by `PlaceMines`; non-mine mandatory content is handled by normal mandatory placement.

### Conditional Fields

| Field | Used when | Notes |
| --- | --- | --- |
| `sid` | direct mandatory object | Bypasses weighted `content` rolling. |
| `variant` | direct `sid` object has variants | Negative variant rolls a specific variant by variant roll chance. |
| `includeLists` | `sid == null` | Appended into weighted candidate list. |
| `content` | `sid == null` | Weighted direct candidates. |
| `rules` | non-null and parsed | Force/sort placement; their refs are zone-contextual. |
| `designatedEncounter` | true or road-targeted | Reserves/uses a specific encounter slot. Roads can set this implicitly. |
| `soloEncounter` | true | Affects encounter reservation/grouping. |
| `isGuarded` | mandatory pickup/building routing | Determines guarded vs unguarded/hobo placement expectations. |
| `isMine` | true | Routed through mine placement instead of normal mandatory content placement. |
| `owner` | present | Passed to placed object content. |

### Editor Implications

- Mandatory entries need two modes: direct SID mode and weighted-list mode.
- If a road targets a mandatory entry, the UI should show that the road implicitly makes it designated.
- Limits and bans can cause mandatory content to disappear; generator retries but may still fail or emit missing content.
- When editing zone mandatory alternatives, road and placement-rule targets must be checked against every possible selected preset.

## Content Count Limit Conditionals

### Proven From Source

A zone samples one content-count-limit preset id when `zone.contentCountLimits` is non-empty.

For each limit entry:

- `sid`, `variant`, `biome`, and `maxCount` are copied.
- If `sid` is null, `includeLists` are expanded into concrete `ContentID` entries.

`ContentTask.CreateLimits` passes the zone's expanded limits and effective `contentBiome` into `Limits`.

### Editor Implications

- Count limit presets are alternatives, not additive layers.
- Limit entries can target a direct SID or an include-list-expanded set.
- Count limits are zone/content-biome sensitive and can affect mandatory content as well as random content.

## Win And Loss Condition Conditionals

### Proven From Source

`WinConditions.cs` declares flags and parameters for classic, desertion, hero lighting, lost start city, lost start hero, gladiator arena, city hold, and tournament.

The inspected `ContentPlacer.SetGameRules` emits `MapWinCondition` entries only for:

- `classic`
- `desertion`
- `heroLighting`
- `lostStartCity`
- `lostStartHero`
- `gladiatorArena`

It copies these general game-rule fields into `mapData.settings`:

- `gameMode`
- `heroHireBan`
- `heroCountMin`
- `heroCountMax`
- `heroCountIncrement`
- `tournamentRules`
- `bonuses`
- `customAI`

### Source Uncertainty

`WinConditions.cs` declares `cityHold`, `cityHoldDays`, `tournament`, `tournamentPointsToWin`, `tournamentSaveArmy`, `tournamentDays`, and `tournamentAnnounceDays`, and official docs/data in this workspace reference them. However, the inspected `ContentPlacer.SetGameRules` shown here does not emit city-hold or tournament `MapWinCondition` entries.

Treat city-hold and tournament as code-declared and official-data-supported, but not fully proven in the inspected generator control-flow.

### Conditional Fields

| Field | Used when |
| --- | --- |
| `desertionDay`, `desertionValue` | `desertion == true` |
| `heroLightingDay` | `heroLighting == true` |
| `lostStartCityDay` | `lostStartCity == true` |
| gladiator registration/delay/count fields | `gladiatorArena == true` |
| `cityHoldDays` | `cityHold == true`, code-declared but not emitted by inspected `SetGameRules` |
| tournament point/day/save fields | `tournament == true`, code-declared but not emitted by inspected `SetGameRules` |

### Editor Implications

- Group win-condition parameter fields under their parent boolean.
- Preserve city-hold and tournament fields for official compatibility even though inspected emission is incomplete.
- City-hold authoring should require or warn for at least one main object with `holdCityWinCon: true`.
- Gladiator arena win conditions should warn if the map has no `GladiatorArena` connection or main object, depending on selected preset.

## Game Rule Conditionals

### Proven From Source

`heroHireBan` affects both final map settings and content generation. It adds hero-hire bans when constructing content pools and mandatory weighted content.

`heroCountMin`, `heroCountMax`, and `heroCountIncrement` are copied to map settings.

`customAI` sets `enableCustomAI` according to nullness and copies the SID or an empty string.

`encounterHoles` is consumed by `ContentPlacer` to conditionally skip encounter-hole creation when false.

### Editor Implications

- Single-hero game mode should be edited together with hero counts and start-hero loss conditions.
- `heroHireBan` should show affected content classes, especially taverns/prisons/random hires.
- `customAI` needs nullable semantics, not empty-string-only semantics.

## Compatibility Fields And Unknowns

### Proven Observed In Existing Docs/Scans

Official templates contain fields not declared on the inspected `RandomMapTemplate.Connection`, such as connection-level `road`, `simTurnSquad`, and `guardRandomization`.

Official templates also contain scalar strings for some fields declared as `string[]`.

### Editor Implications

- Preserve unknown and compatibility fields during round-trip JSON editing.
- Do not expose compatibility fields as proven generator behavior unless a source usage is found.
- Validation should distinguish "not declared in inspected model" from "definitely invalid".

## Critical Editor Rules

- Use variant index plus array index as internal identity for zones, connections, main objects, roads, and mandatory entries; display names are not always unique.
- Treat arrays of pool ids, mandatory preset ids, and count-limit preset ids as sampled alternatives.
- Revalidate transitive references after zone rename, connection rename, endpoint changes, main-object reorder, mandatory preset edits, and connection type changes.
- Show authored connection type and effective generated connection type separately.
- Preserve official-data quirks, but author new data in the strictest generator-safe shape.
- Any field with a parent boolean or enum should be visually nested under that parent to prevent dangling parameters.
- Preview and validation should explain why content is ineligible: bans, limits, biome weights, value bracket, fit, or missing slot.
