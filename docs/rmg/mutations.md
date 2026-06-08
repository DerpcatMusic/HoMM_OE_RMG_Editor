# Core Mutations

The mutation layer lives under `src/core/mutations`. It is headless, immutable, and intended to be the first write boundary used by the future RMG editor UI.

## Status

- `done`: the core mutation layer covers the editable RMG JSON surface, including zones, connections, roads, pools, lists, presets, layouts, bans, value overrides, bulk edits, and transaction history.
- `partial`: some domains still use whole-object replacement instead of fine-grained child commands.
- `missing`: UI command orchestration, dry-run previews, and multi-command grouping semantics.

## Focused Tests

Run `npm test` for targeted mutation invariants. These tests cover high-risk reference rewrites for content lists, local content pools, zone layouts, and transaction history snapshot isolation.

## Contract

Every mutation:

- accepts an in-memory `RmgTemplate`
- clones the template before editing
- preserves unknown JSON fields
- returns `MutationResult<RmgTemplate>`
- reports exact changed JSON paths for undo/history UI
- returns diagnostics instead of throwing for invalid edit input
- does not read or write files

The result shape is:

```ts
interface MutationResult<T = RmgTemplate> {
  value: T;
  changes: MutationChange[];
  diagnostics: Diagnostic[];
  ok: boolean;
}
```

`ok` only reflects mutation-input diagnostics. Call the resolver and validator after a mutation to check game-data references.

## Implemented Mutations

- `renameZone`: renames one zone in one variant and rewrites known zone-name consumers.
- `createDefaultTemplate`: creates a new authoring-safe `.rmg.json` template object with one empty variant.
- `createMinimalPlayableTemplate`: creates a small connected player-vs-player template using real spawn zones.
- `stringifyRmgTemplate`: serializes a template object to formatted `.rmg.json` text.
- `writeRmgTemplateFile`: writes a `.rmg.json` file after path-extension validation.
- `createDefaultZone`: creates a blank-but-generator-safe zone object for previews or insertion.
- `addZone`: inserts a complete zone into one variant.
- `removeZone`: removes a zone, optionally cascading incident connections and cleaning direct references.
- `addZoneRoad`: adds one generator-validated road to a zone.
- `updateZoneRoad`: edits one road's type and endpoints.
- `removeZoneRoad`: removes one road by index.
- `createDefaultConnection`: creates a named connection edge with portal defaults when needed.
- `addConnection`: inserts a complete connection into one variant.
- `removeConnection`: removes one connection and optionally cleans known connection-name consumers.
- `renameConnection`: renames one connection in one variant and rewrites known connection-name consumers.
- `updateConnectionEndpoints`: updates `from` and `to` for a connection and removes `guardZone` if it no longer points at an endpoint.
- `updateConnectionType`: changes connection type and optional portal endpoint flags.
- `updateConnectionSettings`: edits the full connection field surface, including endpoints, type, guards, gates, portals, placement rules, and observed compatibility fields.
- `setZoneContentPools`: replaces one of `guardedContentPool`, `unguardedContentPool`, or `resourcesContentPool`.
- `setZoneContentBudgets`: changes random-content value budgets.
- `setZoneMandatoryContentPresets`: replaces zone mandatory-content preset alternatives.
- `setZoneContentCountLimitPresets`: replaces zone content-count-limit preset alternatives.
- `updateZoneSettings`: changes zone size, layout, biome rules, guard/diplomacy settings, and roads.
- `addMainObject`: appends or inserts a main object without rewriting existing index-based refs.
- `createDefaultMainObject`: creates a default city anchor object.
- `updateMainObject`: changes spawn/owner/faction/placement/guard/building/win-anchor settings on one main object.
- `removeMainObject`: removes one main object when known index references are safe or explicitly allowed.
- `updateTemplateSettings`: changes root game mode, display win condition, win-condition preset, map size, and basic game rules.
- `renameMandatoryContentPreset`: renames a root mandatory-content preset and rewrites zone preset alternatives.
- `renameContentCountLimitPreset`: renames a root content-count-limit preset and rewrites zone preset alternatives.
- `renameLocalContentPool`: renames a template-local content pool and rewrites zone pool alternatives.
- `cloneCoreContentPoolToLocal`: deep-copies one indexed Core content pool into template-local `contentPools` with a non-conflicting local name.
- `addContentPoolGroup`: inserts one group into a template-local content pool.
- `updateContentPoolGroup`: edits one group weight, include-list refs, or direct content; `null` removes a field.
- `moveContentPoolGroup`: reorders one group inside a template-local content pool.
- `removeContentPoolGroup`: removes one group from a template-local content pool.
- `updateContentPoolValueDistribution`: sets or clears one template-local pool value distribution with shape validation.
- `addContentPoolBan`: inserts one ban into a template-local content pool.
- `updateContentPoolBan`: replaces one ban in a template-local content pool.
- `moveContentPoolBan`: reorders one ban inside a template-local content pool.
- `removeContentPoolBan`: removes one ban from a template-local content pool.
- `addMandatoryContentPreset`: appends a root mandatory-content preset.
- `updateMandatoryContentPreset`: replaces editable fields on a root mandatory-content preset.
- `removeMandatoryContentPreset`: removes a root mandatory-content preset and rewrites zone preset alternatives.
- `addContentCountLimitPreset`: appends a root content-count-limit preset.
- `updateContentCountLimitPreset`: replaces editable fields on a root content-count-limit preset.
- `removeContentCountLimitPreset`: removes a root content-count-limit preset and rewrites zone preset alternatives.
- `addLocalContentPool`: appends a template-local content pool.
- `updateLocalContentPool`: replaces editable fields on a template-local content pool.
- `removeLocalContentPool`: removes a template-local content pool and rewrites zone pool alternatives.
- `addContentList`: appends a template-local content list.
- `updateContentList`: replaces editable fields on a template-local content list.
- `renameContentList`: renames a template-local content list and rewrites pool include-list references.
- `removeContentList`: removes a template-local content list and rewrites pool include-list references.
- `addZoneLayout`: appends a template-local zone layout.
- `updateZoneLayout`: replaces editable fields on a template-local zone layout.
- `renameZoneLayout`: renames a template-local zone layout and rewrites zone layout references.
- `removeZoneLayout`: removes a template-local zone layout and rewrites zone layout references when requested.
- `addValueOverride`: appends a root content value override.
- `updateValueOverride`: replaces editable fields on a root content value override.
- `removeValueOverride`: removes a root content value override.
- `updateGlobalBans`: sets or clears root global bans.
- `createTransactionHistory`, `pushTransaction`, `canUndo`, `undo`, `canRedo`, `redo`, `getCurrentTemplate`, and `clearHistory`: manage immutable edit history for UI undo/redo.
- `runBulkZoneMutation`, `runBulkConnectionMutation`, and `runBulkMainObjectMutation`: apply a mutation across predicate-matched template objects.

Exports are available from `src/core/index.ts`.

## New Template Creation

`createDefaultTemplate` creates a brand-new RMG template object with:

- root `name`
- `gameMode: "Classic"` unless overridden
- `displayWinCondition: "win_condition_1"` unless overridden
- a named win-condition preset, defaulting to `classic`
- `sizeX` and `sizeZ` defaulting to `128`
- `gameRules` with hero-count settings and win conditions
- one empty variant
- default orientation and border objects
- empty `zones` and `connections`
- empty root `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`, `zoneLayouts`, and `valueOverrides`

The empty variant is authoring-safe, not playable by itself. To make it playable, add zones, connect them, add player spawn main objects, and add content budgets/pools.

`createMinimalPlayableTemplate` creates a small playable skeleton with:

- `Center` neutral zone
- `Spawn-A` through `Spawn-H` depending on `playerCount`
- official `type: "Spawn"` main objects using `spawn: "PlayerN"`
- one connection from each spawn zone to `Center`
- road stubs from each spawn object to its connection
- non-zero guarded, unguarded, and resource budgets
- `orientation.zeroAngleZone: "Spawn-A"`

When called with `winConditionPreset: "cityHold"`, the center zone gets a `City` main object with `holdCityWinCon: true`.

Use `stringifyRmgTemplate` to produce JSON text and `writeRmgTemplateFile` when the UI needs to save to disk. The writer requires paths ending in `.rmg.json`.

## Zone Rename Coverage

`renameZone` rewrites:

- `variant.zones[index].name`
- connection `from`
- connection `to`
- connection `guardZone`
- `orientation.zeroAngleZone`
- connection `gatePlacementArgs[0]` when `gatePlacement` is `NearZone`
- main-object `placementArgs[0]` when `placement` is `NearZone`
- biome `MatchZone` args
- biome `MatchMainObject` optional zone args
- biome `FromList` `differentFrom:` zone args
- faction `Match` optional zone args
- faction `FromList` `differentFrom:` optional zone args

This matches the inspected generator semantics where zones are resolved by name in connection building, orientation setup, gate placement, main-object placement, and biome/faction rule parsing.

## Default Zone

`createDefaultZone` returns an intentionally empty zone:

- no main objects
- no mandatory content
- no roads
- zero guarded/unguarded/resources content budgets
- default guarded/unguarded/resources pool refs
- `zoneBiome: { type: "FromList", args: [] }`
- `contentBiome` and `metaObjectsBiome` matching the zone biome
- `crossroadsPosition: -1`

The biome rules are required because the generator dereferences biome-rule objects. Omitting them is not a safe default.

The default pool refs are:

- `content_pool_default_guarded`
- `content_pool_default_unguarded`
- `content_pool_default_resources`

The default layout is `zone_layout_default`, which resolves from extracted Core data.

## Add And Remove Zone

`addZone` enforces unique zone names inside the selected variant and inserts either a caller-supplied complete zone or a default zone from `createDefaultZone`.

`removeZone` defaults to cascading incident connection deletion. This prevents invalid `from`/`to` endpoint references. It also cleans direct references to the deleted zone:

- `orientation.zeroAngleZone`
- connection `guardZone`
- `NearZone` gate anchors
- `NearZone` main-object placement anchors
- biome rule zone refs
- faction rule zone refs

For each deleted incident connection, it also cleans direct connection-name consumers:

- roads targeting the deleted connection
- main objects placed at the deleted connection
- portal placement rules targeting the deleted connection
- root mandatory-content placement rules targeting the deleted connection

## Add Connection

`addConnection` inserts a connection into one variant. It validates:

- unique connection name
- `from` zone exists
- `to` zone exists
- no self-loop
- valid `connectionType`
- `guardZone`, when present, names an existing zone

It preserves unknown connection fields for round-trip safety. It does not block non-endpoint `guardZone` values because shipped templates contain them; the resolver reports those as warnings because `MapDescriptionBuilder` discards non-endpoint guard zones at generation time.

`createDefaultConnection` defaults `connectionType` to `Default`. If the connection type is `Portal`, missing `portalFromEnabled` and `portalToEnabled` default to `true`.

## Remove Connection

`removeConnection` removes one connection by index or name.

With default `cleanupReferences: true`, it also cleans:

- roads targeting the deleted connection
- main objects placed at the deleted connection
- portal placement rules targeting the deleted connection
- root mandatory-content placement rules targeting the deleted connection

With `cleanupReferences: false`, it blocks removal if known references still exist.

As with connection rename, root `mandatoryContent` is template-global. If cleanup touches it in a multi-variant template, the mutation returns a warning so the UI can force review.

## Connection Rename Coverage

`renameConnection` rewrites:

- `variant.connections[index].name`
- road targets with `type: "Connection"`
- main-object `placementArgs[0]` when `placement` is `Connection`
- portal placement rules with `type: "Connection"`
- root mandatory-content placement rules with `type: "Connection"`

Root `mandatoryContent` is template-global. If the editor supports templates with multiple variants, connection renames need UI review when root mandatory-content rules are shared across variants.

## Endpoint Mutation

`updateConnectionEndpoints` validates that both zone names exist and rejects self-loops. If an existing `guardZone` is not equal to the new `from` or `to`, the mutation deletes `guardZone` because the generator treats connection guards as belonging to one endpoint side.

## Connection Type Mutation

`updateConnectionType` validates against engine-backed connection types:

- `Default`
- `Direct`
- `GladiatorArena`
- `Portal`
- `Proximity`

When changing to `Portal`, it defaults missing `portalFromEnabled` and `portalToEnabled` to `true` so a newly portalized connection is usable by default. Callers can override those flags explicitly.

## Connection Settings Mutation

`updateConnectionSettings` is the comprehensive connection edit API. It can update:

- `name`
- `from`
- `to`
- `connectionType`
- `length`
- `portalFromEnabled`
- `portalToEnabled`
- `guardZone`
- `guardValue`
- `guardWeeklyIncrement`
- `guardReaction`
- `guardEscape`
- `guardMatchGroup`
- `gatePlacement`
- `gatePlacementArgs`
- `portalPlacementRulesFrom`
- `portalPlacementRulesTo`
- observed compatibility fields `road`, `simTurnSquad`, and connection-level `guardRandomization`

Use `undefined` to leave a field unchanged. Use `null` on optional fields to delete that JSON field.

Validation includes:

- connection type enum checks
- endpoint existence and self-loop rejection
- duplicate-name rejection when assigning a new name
- numeric guard/layout field checks
- runtime guard reaction enum checks
- `guardZone` existence checks and non-endpoint warnings
- `NearZone` gate target checks
- portal placement rule enum, args, numeric range, and context checks
- warnings for observed-only fields preserved from official templates
- warnings when `guardMatchGroup` members drift in guard value, weekly increment, reaction, or escape behavior

`portalPlacementRulesFrom` are validated in the `from` zone context. `portalPlacementRulesTo` are validated in the `to` zone context. This matters when an endpoint changes, because existing rules of type `Connection` can become invalid if the referenced connection no longer touches the endpoint zone.

The editor should prefer this mutation for the full connection inspector. The narrower `updateConnectionEndpoints` and `updateConnectionType` remain useful for quick actions and simple graph-edit gestures.

## Content Pool Mutation

`setZoneContentPools` replaces a zone pool-reference array. These arrays are alternatives: the generator samples one ID from each of `guardedContentPool`, `unguardedContentPool`, and `resourcesContentPool`. The mutation blocks empty arrays because there must be at least one selectable pool ID.

It does not require a `GameDataIndex`; this keeps the mutation pure. Validate the result with `resolveTemplate` and `validateResolvedTemplate` to catch unresolved pool IDs.

`setZoneContentBudgets` updates the value budgets that make random content appear. A zone with valid pools but zero budgets still has no random loot.

Important fields:

- `guardedContentValue`
- `guardedContentValuePerArea`
- `unguardedContentValue`
- `unguardedContentValuePerArea`
- `resourcesValue`
- `resourcesValuePerArea`

## Zone Preset Assignment

`setZoneMandatoryContentPresets` replaces a zone's `mandatoryContent` alternatives. The preset IDs are validated against root `template.mandatoryContent`.

`setZoneContentCountLimitPresets` replaces a zone's `contentCountLimits` alternatives. The preset IDs are validated against root `template.contentCountLimits`.

Both mutations allow empty arrays, because clearing mandatory content or count limits is a valid authoring action.

## Zone Settings

`updateZoneSettings` handles:

- `size`
- `layout`
- `zoneBiome`
- `contentBiome`
- `metaObjectsBiome`
- `crossroadsPosition`
- `diplomacyModifier`
- `guardCutoffValue`
- `guardMultiplier`
- `guardRandomization`
- `guardWeeklyIncrement`
- `guardReactionDistribution`
- replacing `roads`
- clearing `roads`
- generating road stubs from main object `0` or another selected main object to named connections

Only one road operation can be used per call: `roads`, `clearRoads`, or `roadStubs`.

## Zone Roads

Roads are zone-local route requests. A road has an optional `type` and two endpoint targets:

- `Crossroads`
- `MainObject`
- `Connection`
- `MandatoryContent`

`addZoneRoad` inserts one road into a zone. `updateZoneRoad` changes one road's `type`, `from`, and/or `to`. `removeZoneRoad` deletes one road by index.

Road validation follows generator target parsing:

- `MainObject` targets use a zone-local main-object index in `args[0]`.
- `Connection` targets use a connection name in `args[0]`, reject `Proximity`, and must touch the owning zone.
- Duplicate connection names warn because the generator resolves the first match.
- `MandatoryContent` targets use mandatory-content entry names, not root preset names.
- `Crossroads` targets do not need args.

`updateZoneSettings` still supports bulk road replacement, clearing roads, and generating road stubs. Use the first-class road mutations for normal UI edits because they produce smaller history entries.

## Main Object Add

`addMainObject` appends or inserts a main object in a zone. Appending is safe because existing index-based references do not shift. Inserting before existing main objects can shift indexes, so the UI should prefer append until index-ref rewrite tools exist.

`createDefaultMainObject` creates:

- `type: "City"`
- `placement: "Uniform"`
- `placementArgs: []`
- `faction: { type: "FromList", args: [] }`

The faction rule is intentional. The generator dereferences `mainObject.faction` for non-spawn objects; `FromList` with empty args falls back to a random active faction.

`GladiatorArena` main objects are allowed without a faction rule because official templates use that shape.

## Main Object Update And Remove

`updateMainObject` handles:

- `type`
- `spawn`
- `owner`
- `isKeyObject`
- `holdCityWinCon`
- `placement`
- `placementArgs`
- `faction`
- weekly unit increment settings
- guard settings
- `removeGuardIfHasOwner`
- `buildingsConstructionSid`
- `buildingsBanSid`

Use `null` for nullable fields such as `spawn`, `owner`, `faction`, and building SIDs to delete the field.

`removeMainObject` is conservative because many references use main-object indexes. By default, it removes only when no known exact or shifting index references block the edit. Known references include:

- roads targeting `MainObject`
- biome `MatchMainObject`
- faction `Match`
- faction `FromList` `differentFrom:` arguments

Set `cleanupExactReferences` or `allowIndexShift` only from an advanced UI flow that previews the diagnostics.

## Template Settings

`updateTemplateSettings` handles root-level basic settings:

- `gameMode`
- `displayWinCondition`
- `winConditionPreset`
- `winConditions`
- `sizeX`
- `sizeZ`
- `gameRules.heroCountMin`
- `gameRules.heroCountMax`
- `gameRules.heroCountIncrement`
- `gameRules.heroHireBan`
- `gameRules.encounterHoles`
- `gameRules.disableFactionLaws`
- `gameRules.disableMagicGuild`
- `gameRules.disableMagicCustomLearning`
- `gameRules.tournamentRules`
- `gameRules.customAI`

Valid game modes are `Classic` and `SingleHero`. `applyGameModeDefaults` can set `SingleHero` defaults: one hero, increment one, hero hiring banned.

Named win-condition presets are:

- `storyBased` -> `win_condition_0`
- `classic` -> `win_condition_1`
- `capitalCapture` -> `win_condition_2`
- `capitalHold` -> `win_condition_3`
- `finalBattle` -> `win_condition_4`
- `cityHold` -> `win_condition_5`
- `tournament` -> `win_condition_6`
- `battleForCapital` -> `win_condition_7`

When `winConditionPreset` is supplied, the mutation replaces `gameRules.winConditions` with the preset's engine fields plus optional `winConditions` overrides. It also updates `displayWinCondition` to the preset SID unless the caller passes `displayWinCondition` explicitly.

## Preset Rename Mutations

`renameMandatoryContentPreset` rewrites:

- root `mandatoryContent[index].name`
- every zone `mandatoryContent[]` alternative matching the old preset name
- legacy scalar `zone.mandatoryContent` values if a dirty template uses that shape

It intentionally does not rewrite placement rules with `type: "MandatoryContent"`. Those rules reference mandatory-content entry names inside the selected preset after expansion, not the root preset ID.

`renameContentCountLimitPreset` rewrites:

- root `contentCountLimits[index].name`
- every zone `contentCountLimits[]` alternative matching the old preset name
- legacy scalar `zone.contentCountLimits` values if a dirty template uses that shape

Both preset renames are template-level operations because root presets are shared by all variants.

## Local Content Pool Rename

`renameLocalContentPool` rewrites:

- root `contentPools[index].name`
- every zone `guardedContentPool[]` alternative matching the old local pool name
- every zone `unguardedContentPool[]` alternative matching the old local pool name
- every zone `resourcesContentPool[]` alternative matching the old local pool name

The installed live templates currently reference Core pools and do not define root `contentPools`, but the schema and older samples support template-local pools. The smoke test uses a synthetic in-memory local pool fixture to keep this mutation covered without writing test data.

## Smoke Test

Run:

```bash
npm run mutation:scan
```

Current live-data check against `Jebus Cross.rmg.json`:

- `renameZone`: 41 changed paths, zero post-mutation validation errors.
- `renameConnection`: 6 changed paths, zero post-mutation validation errors.
- `updateConnectionEndpoints`: 2 changed paths, zero post-mutation validation errors.
- `setZoneContentPools`: 1 changed path, zero post-mutation validation errors.
- `createDefaultTemplate`: zero post-factory validation errors.
- `createMinimalPlayableTemplate`: zero post-factory validation errors.
- `createMinimalPlayableTemplate.semantic`: zero semantic errors and zero semantic warnings.
- `addZone`: 1 changed path, zero post-mutation validation errors.
- `addConnection`: 1 changed path, zero post-mutation validation errors.
- `addZoneRoad`: 1 changed path, zero post-mutation validation errors.
- `updateZoneRoad`: 2 changed paths, zero post-mutation validation errors.
- `removeZoneRoad`: 1 changed path, zero post-mutation validation errors.
- `removeConnection`: 1 changed path, zero post-mutation validation errors.
- `setZoneContentBudgets`: 2 changed paths, zero post-mutation validation errors.
- `addMainObject`: 1 changed path, zero post-mutation validation errors.
- `updateZoneSettings`: 5 changed paths, zero post-mutation validation errors.
- `updateMainObject`: 2 changed paths, zero post-mutation validation errors.
- `removeMainObject`: 1 changed path, zero post-mutation validation errors.
- `removeZone`: 1 changed path, zero post-mutation validation errors.
- `updateConnectionType`: 3 changed paths, zero post-mutation validation errors.
- `updateTemplateSettings`: 6 changed paths, zero post-mutation validation errors.
- `renameMandatoryContentPreset`: 2 changed paths, zero post-mutation validation errors.
- `setZoneMandatoryContentPresets`: 1 changed path, zero post-mutation validation errors.
- `renameContentCountLimitPreset`: 2 changed paths, zero post-mutation validation errors.
- `setZoneContentCountLimitPresets`: 1 changed path, zero post-mutation validation errors.
- `renameLocalContentPool`: 2 changed paths, zero post-mutation validation errors.

## Next Mutation Targets

- reorder main objects and rewrite index-based references
- richer main-object index rewrite previews for advanced destructive edits
- rename mandatory-content entries and rewrite road/placement targets
- rename local content lists and rewrite local pool/list consumers
- add UI-level command grouping around compound edits
