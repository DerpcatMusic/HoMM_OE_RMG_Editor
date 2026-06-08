# Conditional Fields

## Purpose

This is the implementation catalog for conditional `.rmg.json` editing. It lists every known field or nested pseudo-field whose meaning, requiredness, argument shape, picker options, or UI visibility changes based on another field.

Use this page when building inspector panels and validation. Do not hard-code one-off UI checks in components when a rule belongs here.

## Labels

- `Active`: generator consumes the field for the current context.
- `Inactive preserved`: field exists but the current parent setting means it is ignored, fallback-only, or not meaningful. Preserve it on round trip.
- `Invalid`: field points to a missing, out-of-range, or disallowed reference.
- `Source-uncertain`: declared or official-data-observed, but not fully proven in the inspected runtime path.

## Primary Sources

- `RandomMapTemplate.cs`
- `MapDescriptionBuilder.cs`
- `RuleParseUtils.cs`
- `PlacementRuleHandler.cs`
- `Utils.cs`
- `Layout.cs`
- `Gates.cs`
- `ContentPlacer.cs`
- `ContentPool.cs`
- `ContentTask.cs`
- `src/core/rmg/rmgTypes.ts`
- `src/core/rmg/enums.ts`
- `src/core/editor-schema/fieldRegistry.ts`
- [domain/conditional-generation-semantics.md](../domain/conditional-generation-semantics.md)

## UI Policy

- The center workspace is spatial. Template/zone content fields belong in the inspector, not on the canvas.
- Hide inactive controls by default, but show existing inactive values in an `Inactive preserved` drawer.
- Never delete hidden inactive values automatically.
- Every conditional control should expose why it is hidden, disabled, required, or warning.
- Filter picker options at the conditional-rule layer, not inside individual components.
- Validate references after renames, endpoint changes, main-object reorder, preset edits, and connection type changes.

## Template And Game Rules

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `gameMode` | always | Mode picker: `Classic`, `SingleHero`. | none | `EMapGameMode.cs`, `ContentPlacer.SetGameRules` |
| `gameRules.heroCountMin` | `gameMode == SingleHero` | Force `1`; disable manual edits. | Classic: editable. | current core normalization; game mode enum |
| `gameRules.heroCountMax` | `gameMode == SingleHero` | Force `1`; disable manual edits. | Classic: editable. | current core normalization; game mode enum |
| `gameRules.heroCountIncrement` | `gameMode == SingleHero` | Force `1`; disable manual edits. | Classic: editable. | current core normalization; game mode enum |
| `gameRules.heroHireBan` | `gameMode == SingleHero` | Force or strongly recommend true; explain it affects pool construction. | Classic: editable. | `ContentPool` adds hero-hire bans when `heroHireBan` |
| `gameRules.encounterHoles` | `gameMode == SingleHero` | Force false in current editor policy. | Classic: editable. | current core normalization |
| `gameRules.customAI` | nullable semantics | Show nullable/freeform SID. Empty string is not the same as absent if we later support exact semantics. | Preserve raw values. | `GameRules.customAI`, `ContentPlacer.SetGameRules` |
| `gameRules.bonuses` | only useful with known bonus data | Show advanced object editor when bonus catalog exists; otherwise raw JSON. | Preserve unknown bonus object shapes. | `GameRules.bonuses`, schema says opaque object array |
| `gameRules.uniqueMagicCostModifiers` | compatibility only | Do not first-class edit. | Preserve only. | schema source mismatch |

## Win Conditions

| Field path | Parent condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `gameRules.winConditions.classic` | always | Parent checkbox. | none | `WinConditions.cs`, `ContentPlacer.SetGameRules` |
| `gameRules.winConditions.desertion` | always | Parent checkbox. | none | `WinConditions.cs`, `ContentPlacer.SetGameRules` |
| `gameRules.winConditions.desertionDay` | `desertion == true` | Show integer input. | Hide; preserve existing value. | editor schema conditions |
| `gameRules.winConditions.desertionValue` | `desertion == true` | Show integer input. | Hide; preserve existing value. | editor schema conditions |
| `gameRules.winConditions.heroLighting` | always | Parent checkbox. | none | `WinConditions.cs`, `ContentPlacer.SetGameRules` |
| `gameRules.winConditions.heroLightingDay` | `heroLighting == true` | Show integer input. | Hide; preserve existing value. | editor schema conditions |
| `gameRules.winConditions.lostStartCity` | always | Parent checkbox. | none | `WinConditions.cs`, `ContentPlacer.SetGameRules` |
| `gameRules.winConditions.lostStartCityDay` | `lostStartCity == true` | Show integer input. | Hide; preserve existing value. | editor schema conditions |
| `gameRules.winConditions.lostStartHero` | always, forced in `SingleHero` policy | Checkbox, disabled/forced true in `SingleHero`. | Classic: editable. | `ContentPlacer.SetGameRules`, current normalization |
| `gameRules.winConditions.gladiatorArena` | always | Parent checkbox. | none | `WinConditions.cs`, `ContentPlacer.SetGameRules` |
| `gameRules.winConditions.gladiatorArenaRegistrationStartWork` | `gladiatorArena == true` | Show advanced arena checkbox. | Hide; preserve. | `WinConditions.cs`, win conditions docs |
| `gameRules.winConditions.gladiatorArenaRegistrationStartFight` | `gladiatorArena == true` | Show advanced arena checkbox. | Hide; preserve. | `WinConditions.cs`, win conditions docs |
| `gameRules.winConditions.gladiatorArenaDaysDelayStart` | `gladiatorArena == true` | Show integer input. | Hide; preserve. | editor schema conditions |
| `gameRules.winConditions.gladiatorArenaCountDay` | `gladiatorArena == true` | Show integer input. | Hide; preserve. | editor schema conditions |
| `gameRules.winConditions.championSelectRule` | `gladiatorArena == true || tournament == true` | Show `StartHero`/freeform rule editor. | Hide; preserve. | `WinConditions.cs`, official preset usage |
| `gameRules.winConditions.cityHold` | always, source-uncertain runtime | Parent checkbox with source-uncertain badge. | none | declared and official-observed; emission path not found |
| `gameRules.winConditions.cityHoldDays` | `cityHold == true` | Show integer input; require target city warning. | Hide; preserve. | editor schema conditions |
| `mainObject.holdCityWinCon` | `cityHold == true` is enabled or field exists | Show in object inspector with warning if parent flag off. | Preserve if cityHold false. | `MainObject.holdCityWinCon`, official usage |
| `gameRules.winConditions.tournament` | always, source-uncertain runtime | Parent checkbox with source-uncertain badge. | none | declared and official-observed; emission path not found |
| `gameRules.winConditions.tournamentPointsToWin` | `tournament == true` | Show integer input. | Hide; preserve. | editor schema conditions |
| `gameRules.winConditions.tournamentSaveArmy` | `tournament == true` | Show checkbox. | Hide; preserve. | `WinConditions.cs` |
| `gameRules.winConditions.tournamentDays` | `tournament == true` | Show integer-array editor. | Hide; preserve. | editor schema conditions |
| `gameRules.winConditions.tournamentAnnounceDays` | `tournament == true` | Show integer-array editor. | Hide; preserve. | editor schema conditions |
| `gameRules.tournamentRules` | `winConditions.tournament == true` or official preset | Show alongside tournament win condition. | Preserve if off. | `GameRules.tournamentRules`, official usage |

## Variants And Sampled Alternatives

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `variants[]` | selected variant | Treat zones/connections/roads as variant-local. | Non-selected variants remain editable through variant selector, not merged. | `MapDescriptionBuilder.Build` randomly selects one variant |
| `zone.guardedContentPool[]` | always required for valid generation | Show sampled-alternative picker, not additive list. | Empty array is invalid/dangerous. | `CreateZones` indexes random element |
| `zone.unguardedContentPool[]` | always required for valid generation | Show sampled-alternative picker. | Empty array is invalid/dangerous. | `CreateZones` indexes random element |
| `zone.resourcesContentPool[]` | always required for valid generation | Show sampled-alternative picker. | Empty array is invalid/dangerous. | `CreateZones` indexes random element |
| `zone.mandatoryContent[]` | non-empty array | Show sampled mandatory preset alternatives. | Empty means no mandatory preset. | `CreateZones` samples one if length nonzero |
| `zone.contentCountLimits[]` | non-empty array | Show sampled count-limit preset alternatives. | Empty means no count limits. | `CreateZones` samples one if length nonzero |

## Zone Fields

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `zone.layout` | always, if layout id exists | Picker from local/Core layouts. | Unknown id is invalid or external-missing. | `ctx.GetZoneLayoutConfig` |
| `zone.encounterHolesSettings` | `gameRules.encounterHoles == true` | Show advanced per-zone hole settings. | Hide; preserve. | editor schema condition |
| `zone.guardedContentValue`, `zone.guardedContentValuePerArea` | guarded pool alternatives exist or value nonzero | Show guarded budget section. | Warn if value > 0 and no guarded pool alternatives. | zone schema and content placement |
| `zone.unguardedContentValue`, `zone.unguardedContentValuePerArea` | unguarded pool alternatives exist or value nonzero | Show unguarded budget section. | Warn if value > 0 and no unguarded pool alternatives. | zone schema and content placement |
| `zone.resourcesValue`, `zone.resourcesValuePerArea` | resource pool alternatives exist or value nonzero | Show resources budget section. | Warn if value > 0 and no resource pool alternatives. | zone schema and content placement |
| `zone.randomHireEnableWeeklyUnitIncrement[]` | random-hire content exists in zone/pools | Show advanced random-hire array editor only with matching context. | Preserve raw arrays. | `RandomMapTemplate.Zone` declares arrays |
| `zone.randomHireInitialUnitIncrement[]` | matching random-hire increment toggles/indexes exist | Show paired with random-hire weekly toggle array. | Preserve raw arrays. | `RandomMapTemplate.Zone` declares arrays |

## Main Objects

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `mainObject.type` | always | Type picker: `City`, `Spawn`, `AbandonedOutpost`, `GladiatorArena`. | none | `MainObjectType.cs` |
| `mainObject.spawn` | `mainObject.type == Spawn` | Required player picker. Missing/invalid hard-fails. | Hide for non-spawn; preserve if present. | `MapDescriptionBuilder.Parse` throws for missing/invalid spawn |
| `mainObject.owner` | present or object can be owned | Optional player picker. Invalid owner hard-fails. | Hide only if object type cannot use ownership, but preserve existing values. | `MapDescriptionBuilder.Parse` parses if non-null |
| `mainObject.faction` | all main objects, but spawn can be overridden by lobby `spawnFactions[]` | Structured faction rule editor. | For spawn, label as default/lobby-overridable. | `ResolveMainObjectFactions` |
| `mainObject.placement` | always | Placement type picker. | none | `MainObjectPlacement.cs` |
| `mainObject.placementArgs[]` | depends on `mainObject.placement` | Typed argument UI by placement. | Preserve args for argless placements as inactive. | `ZonePartition.ParseConnectionPlacementRule`, placement docs |
| `mainObject.holdCityWinCon` | city-hold templates or existing true | Show with city-hold consistency warning. | Preserve if parent win condition disabled. | official usage and schema |
| `mainObject.enableWeeklyUnitIncrement` | all main objects, meaningful for growth-capable object flows | Parent checkbox. | none | `RandomMapTemplate.MainObject` |
| `mainObject.initialUnitIncrement` | `enableWeeklyUnitIncrement == true` | Show numeric input under parent. | Hide; preserve. | schema relationship/inference from names |
| `mainObject.guardChance` | guardable main objects | Show guard section for `City`, `Spawn`, `AbandonedOutpost`; hide or warn for `GladiatorArena` if unused. | Preserve values. | `MapDescriptionBuilder` copies; `MapObjectsRegistry` uses main object guards |
| `mainObject.guardValue` | guardable main objects | Show guard section. | Preserve. | `GetSquadParamsForMainObject` |
| `mainObject.guardWeeklyIncrement` | `guardValue > 0` or field exists | Show under guard section. | Preserve. | `GetSquadParamsForMainObject` |
| `mainObject.guardRandomization` | `guardValue > 0` or field exists | Show under guard section. | Preserve. | `GetModifiedGuardValue` for main objects |
| `mainObject.removeGuardIfHasOwner` | `owner` present or `type in City, Spawn` | Show under guard/ownership section. | Preserve. | `MapObjectsRegistry.AddMainObject` guard condition |
| `mainObject.buildingsConstructionSid` | `type in City, Spawn, AbandonedOutpost` | Show city/outpost building SID control. | Hide for `GladiatorArena`; preserve. | `MapObjectsRegistry` handles city/spawn/outpost templates |
| `mainObject.buildingsBanSid` | `type in City, Spawn, AbandonedOutpost` | Show city/outpost building SID control. | Hide for `GladiatorArena`; preserve. | `MapObjectsRegistry` handles city/spawn/outpost templates |

## Main Object Placement Args

| Parent value | Args | Active UI | Invalid cases | Proof |
| --- | --- | --- | --- | --- |
| `placement == Uniform` | none or optional raw args | Hide args for new authoring. | Existing args preserved as inactive. | placement rule docs |
| `placement == Center` | none | Hide args. | Existing args preserved as inactive. | placement rule docs |
| `placement == Connection` | `args[0] = connection name` | Required connection picker. Only offer touching `Direct` and `GladiatorArena` authored connections with valid gate potential. | Missing, unknown, not touching zone, `Portal`, `Proximity`, authored `Default`, or invalid gate. | `ZonePartition.ParseConnectionPlacementRule` requires `NeedsGroundConnection()` |
| `placement == NearZone` | `args[0] = zone name` | Required zone picker. | Missing/unknown zone invalid or fallback depending path. | placement docs and zone reference parser |

## Faction Rules

| Field path | Condition | Active UI | Invalid cases | Proof |
| --- | --- | --- | --- | --- |
| `faction.type == FromList` | main object faction rule | Faction multi-select plus `differentFrom` refs. Empty result falls back to random available faction. | Unknown faction ids warn; circular differentFrom/match graph invalid. | faction rule docs, `ResolveMainObjectFactions` |
| `faction.args[]` normal token | `FromList` | Faction id. | Missing catalog id warns. | faction rule docs |
| `faction.args[] = differentFrom:<mainObjectIndex> [zoneName]` | `FromList` | Structured exclusion reference picker. | Missing object/zone or circular dependency invalid. | faction rule docs |
| `faction.type == Match` | main object faction rule | Zone picker plus main-object index picker. | Missing object/zone or circular dependency invalid. | faction rule docs |
| spawn main-object faction | spawn has supplied `spawnFactions[]` override at generation | Show authored faction rule as default only. | none | `ResolveMainObjectFactions` |

## Biome Rules

| Field path | Condition | Active UI | Invalid cases | Proof |
| --- | --- | --- | --- | --- |
| `zone.zoneBiome.type == FromList` | terrain biome rule | Biome multi-select plus exclusions. | Unknown biome warns; empty after exclusions falls back random. | biome rule docs |
| `zone.contentBiome.type == FromList` | content biome rule | Biome multi-select plus exclusions. | Unknown biome warns; empty after exclusions falls back random. | biome rule docs |
| `zone.metaObjectsBiome.type == FromList` | meta-object biome rule | Biome multi-select plus exclusions. | Unknown biome warns; empty after exclusions falls back random. | biome rule docs |
| biome `args[] = differentFrom:<zone>` | `FromList` | Zone exclusion picker. | Missing zone invalid/warn. | biome rule docs |
| biome `args[] = differentFrom:<mainObjectIndex> [zoneName]` | `FromList` | Main-object exclusion picker. | Missing object/zone invalid. | biome rule docs |
| `type == MatchZone` | all biome rules | Optional zone picker. | Unknown zone invalid. | `BiomeRuleType.cs`, docs |
| `zoneBiome MatchZone` with no arg | no arg | Treat as random/fallback per docs; show warning. | none | conditional semantics doc |
| `contentBiome/metaObjectsBiome MatchZone` with no arg | no arg | Means current zone. | none | conditional semantics doc |
| `type == MatchMainObject` | all biome rules | Main-object index picker plus optional zone picker. | Missing object invalid. | biome rule docs |
| observed unsupported `Match` | compatibility value | Preserve raw; do not offer as new authoring. | unsupported in enum. | `BIOME_RULE_TYPES` |

## Connections

| Field path | Parent condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `connection.connectionType` | always | Type picker with authored/effective preview. | none | `ConnectionType.cs` |
| `connection.length` | `type in Direct, GladiatorArena, Proximity`; advisory for `Default` | Show for adjacency-needed connections. | Hide for authored `Portal`; preserve. | `Utils.NeedsAdjacency` |
| `connection.gatePlacement` | `type in Default, Direct, GladiatorArena` | Show gate placement section. | Hide for `Portal` and `Proximity`; preserve. | `Utils.CanHaveGroundConnection`, `Gates.PlaceGates` |
| `connection.gatePlacementArgs[]` | `gatePlacement == NearZone` and ground-capable type | Show zone picker. | Hide for `Random`/`Center` or non-ground connection; preserve. | `Gates.GetReferencePoint` |
| `connection.guardZone` | ground gate selection | Picker restricted to `from` and `to` endpoint zones. | Non-endpoint values are inert; preserve but warn. | `CreateConnections` discards non-endpoint guardZone |
| `connection.guardValue` | `type in Direct, GladiatorArena, Portal` effective; fallback possible for `Default`/`Direct` | Show guard squad section except pure `Proximity`. | Hide for `Proximity`; preserve. | `PlaceMainGuards`, `PlacePortals`, `GetSquadParamsForConnection` |
| `connection.guardWeeklyIncrement` | guard squad active | Show under guard squad. | Hide for `Proximity`; preserve. | `GetSquadParamsForConnection` |
| `connection.guardReaction` | guard squad active | Show under guard squad. | Hide for `Proximity`; preserve. | `GetSquadParamsForConnection` |
| `connection.guardEscape` | guard squad active | Show under guard squad. | Hide for `Proximity`; preserve. | `GetSquadParamsForConnection` |
| `connection.guardMatchGroup` | guard squad active and non-empty or authoring advanced | Show advanced guard group field. | Hide for `Proximity`; preserve. | `GetSquadParamsForConnection` |
| `connection.portalFromEnabled` | effective portal or authored `Portal` | Show in portal section. | For `Default`/`Direct`, show in collapsed fallback portal settings if value exists. Hide for `GladiatorArena`/`Proximity`; preserve. | `PlacePortals`, `MakePortalPair` |
| `connection.portalToEnabled` | effective portal or authored `Portal` | Show in portal section. | Same as above. | `PlacePortals`, `MakePortalPair` |
| `connection.portalPlacementRulesFrom[]` | effective portal endpoint in `from` zone or authored `Portal` | Show placement-rule list in `from` zone context. | For fallback-capable types, collapsed fallback portal settings. Hide for `GladiatorArena`/`Proximity`; preserve. | `ParseRules`, `PlacePortals` |
| `connection.portalPlacementRulesTo[]` | effective portal endpoint in `to` zone or authored `Portal` | Show placement-rule list in `to` zone context. | Same as above. | `ParseRules`, `PlacePortals` |
| `connection.road` | compatibility only | Advanced/raw compatibility toggle. | Preserve. Prefer zone `roads[]` for real roads. | official-observed only |
| `connection.simTurnSquad` | compatibility only | Advanced/raw compatibility toggle. | Preserve. | official-observed only |
| `connection.guardRandomization` | compatibility only | Advanced/raw numeric field. | Preserve. | official-observed only |

## Connection Type Matrix

| Authored type | Active sections | Hidden/preserved sections | Notes |
| --- | --- | --- | --- |
| `Default` | endpoints, length advisory, gate placement, guard squad, fallback portal drawer | none by default | Effective type becomes `Direct` if gate exists, otherwise `Portal`. |
| `Direct` | endpoints, length, gate placement, guard zone, guard squad, fallback portal drawer | portal fields collapsed unless existing | Effective type can become `Portal` if no valid gate exists. |
| `GladiatorArena` | endpoints, length, gate placement, guard squad, arena consistency warnings | portal fields hidden/preserved | Requires valid non-ramp gate. |
| `Portal` | endpoints, portal flags, portal placement rules, guard squad | length, gate placement, gate args, guardZone hidden/preserved | Places portal pair and uses portal active flags. |
| `Proximity` | endpoints, length/adjacency | guard, gate, portal, road-target affordances hidden/preserved | Not targetable by road/placement `Connection` refs. |

## Roads

| Field path | Parent condition | Active UI | Invalid cases | Proof |
| --- | --- | --- | --- | --- |
| `road.type` | always | `Dirt`/`Stone` picker. | Invalid enum falls back/logs; author new as valid enum. | `RoadType.cs`, `ParseRoadData` |
| `road.from.type`, `road.to.type` | always | Target type picker. | invalid enum drops road. | `ParseRoadTarget` |
| `roadTarget.args[]` | `type == Crossroads` | Hide args. | Existing args inactive/preserved. | `ParseRoadTarget` |
| `roadTarget.args[0]` | `type == MainObject` | Required main-object index picker. | Missing/out-of-range drops road. | `RuleParseUtils.TryParseMainObjectIndex` |
| `roadTarget.args[0]` | `type == Connection` | Required connection picker filtered to non-`Proximity` connections touching current zone. | Missing/unknown/proximity/not-touching drops road. | `RuleParseUtils.TryParseConnectionIndex` |
| `roadTarget.args[0]` | `type == MandatoryContent` | Required mandatory entry picker valid for selected preset alternatives. | Missing/unknown drops road. | `RuleParseUtils.TryParseMandatoryContentIndex` |
| `mandatoryContent.entry.designatedEncounter` | road endpoint targets that entry | Show implied designation badge. | Do not silently unset if road exists. | `ParseRoads` sets `designatedEncounter = true` |

## Placement Rules

Placement rules appear in `mandatoryContent.entry.rules[]`, `connection.portalPlacementRulesFrom[]`, and `connection.portalPlacementRulesTo[]`.

| Rule type | Args | Active UI | Invalid cases | Proof |
| --- | --- | --- | --- | --- |
| `Random` | none | Hide args; show target/weight controls. | none | `PlacementRuleHandler.TryParseRule` |
| `Sid` | `args[0] = SID` | Required content SID picker. | Missing SID invalid. | `TryParseSidRule` |
| `MainObject` | `args[0] = main object index` | Required main-object picker in current zone context. | Missing/out-of-range invalid. | `TryParseMainObjectIndex` |
| `Crossroads` | none | Hide args. | none | `TryParseRule` |
| `Connection` | `args[0] = connection name` | Required connection picker filtered to non-`Proximity` and touching current zone. | Missing/unknown/proximity/not-touching invalid. | `TryParseConnectionIndex` |
| `Road` | none | Hide args; preview requires generated road map. | no road map means rule has no useful preview. | `RoadRule` |
| `MandatoryContent` | `args[0] = mandatory entry name` | Required mandatory entry picker in current zone context. | Missing/unknown invalid. | `TryParseMandatoryContentIndex` |
| `target`, `targetMin`, `targetMax` | all rule types | Show distance/weight tuning section. | Invalid ranges clamp/fallback. | `ResolveTarget` |
| `weight` | all rule types | Show weight input. | Non-finite invalid. | `ProcessRule` uses `rule.weight` |

## Mandatory Content

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `mandatoryContent[].content[].sid` | direct SID mode | Direct content picker. | If empty, weighted mode is active. | `CreateZones`: `sid == null` branch |
| `mandatoryContent[].content[].variant` | direct SID mode and SID has variants | Variant picker. Negative/empty means generator variant behavior. | Hide if no direct SID or no variants; preserve. | `MandatoryContent.variant`, content IDs |
| `mandatoryContent[].content[].includeLists[]` | weighted mode, `sid == null` | Content-list picker. | Hide in direct SID mode; preserve. | `CreateZones`: adds lists only when `sid == null` |
| `mandatoryContent[].content[].content[]` | weighted mode, `sid == null` | Weighted content editor. | Hide in direct SID mode; preserve. | `CreateZones`: uses content only when `sid == null` |
| `mandatoryContent[].content[].rules[]` | optional placement rules | Show placement-rule editor. | Empty means no placement rules. | `ParseRules` |
| `mandatoryContent[].content[].designatedEncounter` | explicit true or implied by road target | Show checkbox plus implied-by-road badge. | Preserve. | `ParseRoads` |
| `mandatoryContent[].content[].soloEncounter` | true | Show encounter behavior toggle. | Preserve. | `MandatoryContent.soloEncounter` copied |
| `mandatoryContent[].content[].isGuarded` | all entries | Show guarded routing toggle. | Preserve. | `MandatoryContent.isGuarded`, `ContentTask` |
| `mandatoryContent[].content[].isMine` | mine content or true | Show mine routing toggle and owner field. | Preserve. | `PlaceMines`, mandatory docs |
| `mandatoryContent[].content[].owner` | present or mine/owned object | Optional player picker. Invalid owner hard-fails. | Hide only when not useful; preserve. | `MapDescriptionBuilder.Parse` parses owner |

## Content Count Limits

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `contentCountLimits[].limits[].sid` | direct limit mode | Direct SID picker. | Empty SID means include-list expansion mode. | `CreateZones`: `sid == null` branch |
| `contentCountLimits[].limits[].variant` | direct SID has variants | Variant picker. | Hide if no direct SID; preserve. | `ContentCountLimit.variant` |
| `contentCountLimits[].limits[].biome` | optional biome-specific cap | Biome picker. | Empty applies without biome restriction. | `ContentCountLimit.biome`, `Limits` creation |
| `contentCountLimits[].limits[].includeLists[]` | `sid == null` | Content-list picker. | Hide in direct SID mode; preserve. | `AddContentIDsFromLists` |
| `contentCountLimits[].limits[].content[]` | derived/expanded content ids | Show as preview/advanced if represented. | Preserve. | `ContentCountLimit.content` in TS type |
| `contentCountLimits[].limits[].maxCount` | all limit entries | Required non-negative integer. | Missing means invalid/undefined cap. | `ContentCountLimit.maxCount` |

## Content Pools And Lists

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `contentPools[].groups[]` | always in pool | Group list editor. | Empty pool warns no candidates. | `ContentPool` iterates groups |
| `contentPools[].groups[].weight` | always in group | Numeric weight. | Zero means unlikely/disabled depending group sampler. | `ContentPoolConfig.Group.weight` |
| `contentPools[].groups[].includeLists[]` | present | Content-list picker. Missing refs are skipped with config error behavior. | Preserve unknown refs. | `ContentPool` expands include lists if found |
| `contentPools[].groups[].content[]` | present | Direct weighted content editor. | Empty allowed if includeLists provide candidates. | `ContentPool` adds direct content |
| `contentPools[].bans[]` | present | Ban list editor. | Empty means no pool-specific bans. | `ContentPool` ban lists |
| `contentPools[].valueDistribution.priceBounds[]` | value distribution exists | Bounds editor. | Missing uses default `ValueDistribution` behavior. | `ValueDistribution` |
| `contentPools[].valueDistribution.weights[]` | value distribution exists | Weights editor. | Missing uses default `ValueDistribution` behavior. | `ValueDistribution` |
| `contentWeight.sid` | every weighted content row | Required SID picker. | Missing row invalid/ignored. | `ContentWeightsTable` |
| `contentWeight.variant` | selected SID has variants | Variant picker. | Hide for non-variant objects; preserve. | `ContentWeightsTable.Add` |
| `contentWeight.biome` | biome-specific weighting desired | Biome picker. | Empty means all/effective biome handling. | `ContentWeightsTable.GetWeight` |
| `contentWeight.weight` | every weighted content row | Numeric weight. | `<= 0` makes candidate unavailable for that roll. | `ContentPool.GetContent/GetBuilding/GetPickup` |
| `contentID.variant` | selected SID has variants | Variant picker. | Hide for non-variant objects; preserve. | `ContentID` |

## Content Eligibility Conditions

These are not field-visibility rules, but the browser/pool editor must explain them.

| Eligibility factor | Affected content | UI implication | Proof |
| --- | --- | --- | --- |
| `globalBans` | pool and mandatory weighted content | Browser should show banned candidates. | `TemplateContext.BanInfo`, `ContentWeightsTable` |
| `gameRules.heroHireBan` | random hire/tavern/prison style content | Browser should show hero-hire content filtered. | `ContentPool` calls `GetHeroHireBans` |
| pool `bans` | one content pool | Show pool-local banned candidates. | `ContentPool` ban lists |
| content count limits | random and mandatory content | Show limit-hit reason. | `Limits`, `ContentTask.CreateLimits` |
| effective `contentBiome` | weighted content with biome weights | Show biome-ineligible candidates. | `ContentWeightsTable.GetWeight` |
| value brackets | pool-generated content | Show value bracket filters. | `ContentPool.GetContent/GetBuilding/GetPickup` |
| building fit/slot type | buildings and interactables | Browser should distinguish building vs pickup eligibility. | `ContentTask.SlottedContent`, `ContentSlotsFiller` |

## Global Bans And Value Overrides

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `globalBans.magics` | always | Magic SID multi-picker. | Empty means no magic bans. | `GlobalBans` |
| `globalBans.items` | always | Item/artifact SID multi-picker. | Empty means no item bans. | `GlobalBans` |
| `globalBans.skills` | always | Skill SID multi-picker. | Empty means no skill bans. | `GlobalBans` |
| `globalBans.heroes` | always | Hero SID multi-picker. | Empty means no hero bans. | `GlobalBans` |
| `globalBans.units` | always | Unit SID multi-picker. | Empty means no unit bans. | `GlobalBans` |
| `valueOverrides[].sid` | always in override row | Required content SID picker. | Missing invalid. | `ContentValueOverride` |
| `valueOverrides[].variant` | selected SID has variants | Variant picker. | Hide for non-variant SIDs; preserve. | `ContentKey` |
| `valueOverrides[].goodsValue` | present | Numeric override. | Empty means no override. | `ValueOverrides` |
| `valueOverrides[].guardValue` | present | Numeric override. | Empty means no override. | `ValueOverrides.GetGuardValue` |
| `valueOverrides[].aiValue` | present | Numeric override. | Empty means no override. | `ContentValueOverride` |

## Compatibility Fields

| Field path | Condition | Active UI | Inactive/preserved behavior | Proof |
| --- | --- | --- | --- | --- |
| `connection.road` | official-observed only | Advanced compatibility toggle. | Preserve. | field registry |
| `connection.simTurnSquad` | official-observed only | Advanced compatibility toggle. | Preserve. | field registry |
| `connection.guardRandomization` | official-observed only | Advanced compatibility numeric input. | Preserve. | field registry |
| scalar `zone.mandatoryContent` | legacy/source mismatch | Normalize touched values to array. | Preserve raw if untouched. | field registry |
| scalar `zone.contentCountLimits` | legacy/source mismatch | Normalize touched values to array. | Preserve raw if untouched. | field registry |
| unknown object fields | unknown | Raw JSON drawer only. | Preserve. | `UnknownFields` in TS types |

## Implementation Checklist

1. Create a conditional rule module with these categories:
   - `template`
   - `gameRules`
   - `winConditions`
   - `zone`
   - `mainObject`
   - `mainObjectPlacement`
   - `factionRule`
   - `biomeRule`
   - `connection`
   - `roadTarget`
   - `placementRule`
   - `mandatoryContentEntry`
   - `contentCountLimitEntry`
   - `contentWeight`
   - `contentPool`
2. Return a normalized state per field:
   - `state: "active" | "inactivePreserved" | "invalid" | "sourceUncertain"`
   - `visible`
   - `enabled`
   - `required`
   - `reason`
   - `pickerFilter`
3. Refactor UI in this order:
   - connection inspector
   - win/global settings
   - main-object inspector
   - road target editor
   - placement-rule editor
   - mandatory content editor
   - content pool row editor
4. Add tests for every enum value listed on this page.
