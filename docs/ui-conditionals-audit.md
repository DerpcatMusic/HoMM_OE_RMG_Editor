# UI Conditionals Audit

Purpose: define which editor controls should be shown, hidden, nested, warned, or disabled based on selected `.rmg.json` values. This is an implementation guide for the UI layer, not a replacement for the source-backed RMG knowledge base.

Primary proof sources:

- `docs/rmg-kb/domain/conditional-generation-semantics.md`
- `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs`
- `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPool.cs`
- `GameEngineMapGenerator/MapGenerator/ContentTask.cs`
- `src/core/rmg/rmgTypes.ts`
- `src/core/rmg/enums.ts`
- `src/core/editor-schema/fieldRegistry.ts`

## Current Gap

The editor schema currently declares condition metadata for only a small subset of fields:

- win-condition parameters gated by parent win-condition booleans
- `mainObject.spawn` gated by `type == Spawn`
- `zone.encounterHolesSettings` gated by `gameRules.encounterHoles`
- portal active flags and portal placement rules gated by `connectionType == Portal`

The generator has more conditional behavior than that. The UI should use a dedicated conditional-visibility/resolution layer instead of hand-coded ad hoc checks inside every component.

## Correct UI Approach

- Center workspace is spatial only: map canvas, zone internals canvas, live roads/connections.
- Right inspector is property editing for the current selection: zone, connection, main objects, roads, content pools, mandatory content.
- Conditional fields should be visually nested under their parent enum/boolean/rule type.
- Do not delete hidden values automatically. Hide or collapse them, then show a compact "inactive preserved fields" drawer if existing JSON contains values.
- Distinguish:
  - `Active`: generator consumes this field for current context.
  - `Inactive but preserved`: field exists in JSON but current parent setting means it will be ignored or only used after fallback.
  - `Invalid`: field points at missing/illegal reference.
  - `Source-uncertain`: code-declared or official-data-observed, but current inspected flow does not prove consumption.
- Every conditional rule should be expressible as data:
  - `visibleWhen`
  - `enabledWhen`
  - `requiredWhen`
  - `warnWhenInactive`
  - `argumentMode`
  - `referenceScope`

## Mega List

### Game Mode

| Parent | Child controls | Correct behavior |
| --- | --- | --- |
| `template.gameMode == SingleHero` | `heroCountMin`, `heroCountMax`, `heroCountIncrement` | Force `1`, disable manual editing, explain normalization. |
| `template.gameMode == SingleHero` | `gameRules.heroHireBan` | Force true or strongly recommend true. It affects content generation, not just final settings. |
| `template.gameMode == SingleHero` | `gameRules.encounterHoles` | Force false in current UI normalization. |
| `template.gameMode == SingleHero` | `winConditions.lostStartHero` | Force true in current UI normalization. |
| `template.gameMode == Classic` | hero count and hire controls | Editable normally. |

### Win Conditions

| Parent flag | Child controls | Correct behavior |
| --- | --- | --- |
| `desertion` | `desertionDay`, `desertionValue` | Show only when enabled; preserve inactive values if present. |
| `heroLighting` | `heroLightingDay` | Show only when enabled. |
| `lostStartCity` | `lostStartCityDay` | Show only when enabled. |
| `lostStartHero` | no direct numeric child | Show as standalone loss condition. |
| `gladiatorArena` | `gladiatorArenaRegistrationStartWork`, `gladiatorArenaRegistrationStartFight`, `gladiatorArenaDaysDelayStart`, `gladiatorArenaCountDay`, `championSelectRule` | Show as arena subsection only when enabled. Warn if map has no gladiator arena connection/object. |
| `cityHold` | `cityHoldDays` | Show when enabled, but mark source-uncertain in inspected emission path. Warn if no main object has `holdCityWinCon`. |
| `tournament` | `tournamentPointsToWin`, `tournamentSaveArmy`, `tournamentDays`, `tournamentAnnounceDays`, `championSelectRule` | Show when enabled, but mark source-uncertain in inspected emission path. |

### Template Definitions

| Parent/reference | Child controls | Correct behavior |
| --- | --- | --- |
| zone references local `layout` | `zoneLayouts[]` editor | Only required when overriding/creating local layouts. Still show globally as definitions. |
| zone references local content pools | `contentPools[]` editor | Required only for local/overridden pool IDs. Official Core pool IDs come from Core.zip. |
| pools, mandatory content, or count limits reference `includeLists` | `contentLists[]` editor | Needed only for referenced local lists or overrides. |
| zone references mandatory preset | `mandatoryContent[]` editor | Needed when `zone.mandatoryContent` alternatives include local preset IDs. |
| zone references count-limit preset | `contentCountLimits[]` editor | Needed when `zone.contentCountLimits` alternatives include local preset IDs. |

### Zones

| Parent | Child controls | Correct behavior |
| --- | --- | --- |
| `guardedContentPool` | alternatives picker | Alternatives, not additive. Empty is unsafe because generator indexes it. |
| `unguardedContentPool` | alternatives picker | Alternatives, not additive. Empty is unsafe. |
| `resourcesContentPool` | alternatives picker | Alternatives, not additive. Empty is unsafe. |
| `mandatoryContent` | preset alternatives picker | Alternatives, not additive. Empty means no preset. Revalidate roads/rules targeting mandatory entries. |
| `contentCountLimits` | preset alternatives picker | Alternatives, not additive. Empty means no limits. |
| `gameRules.encounterHoles == true` | `zone.encounterHolesSettings` | Show only when enabled globally. |
| content budgets | pool fields | Budgets are meaningful with corresponding pool category. Warn if budget > 0 but no pool alternatives. |
| guard tuning fields | guarded content and guards | Always serializable, but explain they affect generated guard calculations, not every object. |

### Main Objects

| Parent | Child controls | Correct behavior |
| --- | --- | --- |
| `type == Spawn` | `spawn` | Required. Missing/invalid spawn hard-fails. |
| `type != Spawn` | `spawn` | Hide; preserve if present as inactive. |
| `owner` present | owner picker | Optional on all main objects; invalid owner hard-fails. |
| `type == City || Spawn || AbandonedOutpost` | `buildingsConstructionSid`, `buildingsBanSid`, city building behavior | Show as city/outpost settings. Hide or mark less relevant for `GladiatorArena`. |
| `type == GladiatorArena` | city building SIDs, spawn-specific fields | Hide as inactive. |
| `holdCityWinCon == true` | city-hold win condition | Warn unless `winConditions.cityHold` is true. |
| `removeGuardIfHasOwner == true` | guard fields + owner | Meaningful when owner/spawn/city ownership exists. |
| `enableWeeklyUnitIncrement == true` | `initialUnitIncrement` | Show initial increment as child of weekly unit increment. |

### Main Object Placement

| Placement type | Args | Correct behavior |
| --- | --- | --- |
| `Uniform` | none or raw preserved args | Hide args for new authoring. Preserve existing args as inactive. |
| `Center` | none | Hide args. |
| `Connection` | connection name | Required. Picker should only offer authored `Direct` and `GladiatorArena` connections touching the zone. Source notes reject `Portal`, `Proximity`, and authored `Default` for this strict placement path. |
| `NearZone` | zone name | Required or strongly expected. Use zone picker. |

### Faction Rules

| Rule type | Args | Correct behavior |
| --- | --- | --- |
| `FromList` | faction ids plus `differentFrom:` refs | Show faction multi-select and structured exclusions. Empty candidates mean any faction after exclusions. |
| `Match` | main-object index, optional zone name | Show zone picker and main-object picker. Validate cycles. |
| spawn object with lobby `spawnFactions[]` override | authored faction rule | Show as default only; runtime override can bypass it. |

### Biome Rules

| Rule type | Args | Correct behavior |
| --- | --- | --- |
| `FromList` | biome ids plus `differentFrom:` refs | Show biome multi-select and structured exclusions. Empty valid result falls back to random biome. |
| `MatchZone` | optional zone name | Empty arg means current zone for content/meta rules. `zoneBiome` no-arg behavior is random per docs. |
| `MatchMainObject` | main-object index, optional zone name | Show zone picker and main-object picker. |
| unsupported/observed `Match` | raw preserved value | Do not offer for new authoring. Mark compatibility/unknown. |

### Connections

| Connection type | Active controls | Inactive or conditional controls |
| --- | --- | --- |
| `Default` | endpoints, type, length advisory, gate placement, guard/gate controls | Effective type can become `Direct` or `Portal`; portal rules may become relevant after fallback, so show in "fallback portal settings" collapsed section rather than hard hiding. |
| `Direct` | endpoints, length, gate placement, guard zone, guard squad fields, road-ish traversal preview | Portal active flags/rules are fallback-only because Direct can become Portal if no gate exists. |
| `GladiatorArena` | endpoints, length, gate placement, guard fields, arena warnings | Requires valid non-ramp gate. Warn if gladiator win condition/object settings are inconsistent. |
| `Portal` | endpoints, portal enabled flags, portal placement rules, guard squad fields | Hide gate placement, gate args, direct gate-only road semantics, and adjacency length. |
| `Proximity` | endpoints, length/adjacency | Hide portal flags, portal placement rules, gate placement, guard zone, guard squad fields, road flag. It is not targetable by road/placement connection refs. |

### Connection Subfields

| Parent | Child controls | Correct behavior |
| --- | --- | --- |
| `connectionType in Direct, GladiatorArena, Proximity` | `length` | Active for adjacency-needed connections. For `Default`, show as advisory because effective path may become direct/portal. |
| `connectionType in Default, Direct, GladiatorArena` | `gatePlacement` | Active for ground-capable connections. |
| `gatePlacement == NearZone` | `gatePlacementArgs[0]` | Show required zone picker. Missing/unknown falls back with config error. |
| `guardZone` | endpoint zone picker | Only offer `from` and `to`. Non-endpoint values are inert. |
| effective portal or authored `Portal` | `portalFromEnabled`, `portalToEnabled`, `portalPlacementRulesFrom`, `portalPlacementRulesTo` | Active for portal endpoints. For `Default`/`Direct`, keep under fallback portal section. |
| `connectionType == Proximity` | connection reference uses | Do not allow as road target or placement-rule `Connection` arg. |

### Road Editing

| Road target type | Args | Correct behavior |
| --- | --- | --- |
| `Crossroads` | none | Hide args. |
| `MainObject` | main-object index | Required zone-local main-object picker. |
| `Connection` | connection name | Required picker filtered to non-`Proximity` connections touching current zone. Duplicate names need warnings. |
| `MandatoryContent` | mandatory entry name | Required picker from every possible selected mandatory preset. Warn if not present in all alternatives. |
| road `type` missing/invalid | `Dirt` fallback | Show `Dirt` as safe default, not `Stone`. |

### Placement Rules

| Rule type | Args | Correct behavior |
| --- | --- | --- |
| `Random` | none | Hide args. |
| `Sid` | content SID | Required SID browser picker. |
| `MainObject` | main-object index | Required picker in current zone. |
| `Crossroads` | none | Hide args. |
| `Connection` | connection name | Required picker filtered to non-`Proximity` connections touching current zone. |
| `Road` | none | Hide args; preview requires generated road map. |
| `MandatoryContent` | mandatory entry name | Required picker from selected/current mandatory content context. |

### Content Pools

| Parent | Child controls | Correct behavior |
| --- | --- | --- |
| pool group | `weight`, `includeLists`, `content` | All are active together. Group contributes include-list expansions plus direct content. |
| `includeLists` | content-list picker | Missing referenced lists are skipped by inspected pool construction, but should warn. |
| direct content row | `sid`, `variant`, `biome`, `weight` | `variant` only meaningful for multi-variant objects. `biome` affects biome-specific weighting. `weight <= 0` means effectively unavailable for that biome. |
| pool `bans` | `sid`, `variant` | Active for pool construction. Combined with hero-hire bans if `heroHireBan`. |
| `valueDistribution` | `priceBounds`, `weights` | Active during value-bracket selection. Validate lengths and brackets. |
| `heroHireBan == true` | hero hire candidates | Generator adds hero-hire bans into pool construction. Browser should explain filtered entries. |

### Mandatory Content

| Mode/parent | Child controls | Correct behavior |
| --- | --- | --- |
| direct mode, `sid` set | `sid`, `variant`, flags, rules, owner | Hide weighted `includeLists` and `content` for new authoring. Preserve if present. |
| weighted mode, `sid` empty | `includeLists`, `content`, flags, rules, owner | Show weighted-list controls. |
| direct `sid` with variants | `variant` | Variant negative means roll by variant chance; non-negative requests specific variant. |
| `rules` present | placement-rule editor | Rule args are conditional by rule type. |
| road targets this mandatory entry | `designatedEncounter` | Road implicitly designates it; UI should show that implication. |
| `isMine == true` | mine placement path | Show owner and mine-specific warnings. |
| `isGuarded` | guarded vs unguarded mandatory routing | Affects placement route for pickups/buildings. |
| `owner` present | owner picker | Optional owner side. Invalid owner hard-fails. |

### Content Count Limits

| Mode/parent | Child controls | Correct behavior |
| --- | --- | --- |
| direct limit, `sid` set | `sid`, `variant`, `biome`, `maxCount` | Active direct content cap. |
| expanded limit, `sid` empty | `includeLists`, `biome`, `maxCount` | Expands list entries into concrete content IDs. |
| zone `contentBiome` | `biome` matching | Limits are evaluated with effective content biome. |

### Global Bans And Value Overrides

| Parent | Child controls | Correct behavior |
| --- | --- | --- |
| `globalBans` | magics/items/skills/heroes/units | Always active. Content pools and mandatory weighted content use ban-aware tables. |
| `valueOverrides` | `goodsValue`, `guardValue`, `aiValue` | Always copied. Affects content values and guard calculations where content is eligible. |

## Implementation Plan

1. Add a `src/ui/conditionals` module with pure functions like `getConnectionFieldStates`, `getMainObjectFieldStates`, `getRuleArgSpec`, and `getWinConditionFieldStates`.
2. Return structured field state: `{ visible, enabled, required, severity, reason, preservedValue }`.
3. Use the same module in inspector forms and validation panels.
4. Keep hidden existing values in an "inactive preserved fields" disclosure per section.
5. Filter picker options from the conditional module, not component-local logic.
6. Add invariant tests for all enum/rule combinations.
7. Then refactor inspector panels one at a time: connections first, then win conditions, main-object placement, road targets, mandatory content, content pools.

## First UI Target

Connection inspector should be fixed first because it is the most obvious mental-load bug:

- `Portal`: show endpoints, portal active flags, portal placement rules, guard squad section; hide gate placement, length, guard zone.
- `Proximity`: show endpoints and length only; hide guards, gates, portal, road flags.
- `Direct`: show endpoints, length, gate placement, gate args, endpoint guard zone, guard squad; show collapsed fallback portal settings.
- `Default`: show endpoints, length as advisory, gate placement, endpoint guard zone, guard squad; show authored/effective-type explanation and collapsed fallback portal settings.
- `GladiatorArena`: show endpoints, length, gate placement, guard squad, arena warnings; hide portal active flags unless preserving existing values.
