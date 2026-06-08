# Zones

Zones are the main authored regions in an `.rmg.json` variant. They carry layout, biome, main-object, content-pool, value-budget, road, guard, and mandatory-content settings.

## Status

- `done`: zone create/remove/rename/clone, settings edits, pool assignment, budgets, main objects, roads, and bulk zone mutation support.
- `partial`: higher-level zone presets.
- `missing`: richer zone authoring UX and automatic index-repair tools.

## Source References

- Authored schema: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:31`
- Runtime zone model: `GameEngineMapGenerator/MapGenerator/MapDescription.cs:10`
- Builder copy/resolve logic: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:187`
- Final generated zone wrapper: `GameEngineMapGenerator/MapGenerator/Zone.cs:3`

## Authored Fields

- `name`: unique zone name inside a variant.
- `size`: relative zone size.
- `layout`: `ZoneLayoutConfig` ID.
- `mainObjects`: cities/spawns/outposts/gladiator arenas.
- `zoneBiome`, `contentBiome`, `metaObjectsBiome`: biome rules.
- `crossroadsPosition`: authored integer hint for crossroads placement.
- `guardedContentPool`, `unguardedContentPool`, `resourcesContentPool`: arrays of pool IDs; one ID from each array is sampled.
- `contentCountLimits`: array of content-count-limit preset IDs; one ID is sampled if non-empty.
- `guardedContentValue`, `guardedContentValuePerArea`, `unguardedContentValue`, `unguardedContentValuePerArea`, `resourcesValue`, `resourcesValuePerArea`: content budgets.
- `randomHireEnableWeeklyUnitIncrement`, `randomHireInitialUnitIncrement`: random hire tuning.
- `diplomacyModifier`, `guardCutoffValue`, `guardMultiplier`, `guardRandomization`, `guardWeeklyIncrement`, `guardReactionDistribution`: guard tuning.
  - `guardReactionDistribution` is exactly six weights in runtime enum order: `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, `Docile`. The default runtime distribution is `[1, 1, 1, 1, 1, 0]`, so `Docile` is not selected by default.
- `encounterHolesSettings`: encounter-hole tuning.
- `roads`: local road configs.
- `mandatoryContent`: array of mandatory-content preset IDs; one ID is sampled if non-empty.

Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:34`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:50`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:56`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:58`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:70`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:74`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:86`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:88`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:90`.

## Sampling Behavior

The builder chooses one guarded pool ID, one unguarded pool ID, and one resources pool ID from their arrays. It also chooses one content-count-limit preset and one mandatory-content preset when those arrays are non-empty.

Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:237`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:246`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:275`.

## Main Objects

A zone can contain zero or more main objects. Valid `MainObjectType` values are:

- `City`
- `Spawn`
- `AbandonedOutpost`
- `GladiatorArena`

Source: `GameEngineMapGenerator/MapGenerator/MainObjectType.cs:3`.

Main-object placement values are:

- `Uniform`
- `Center`
- `Connection`
- `NearZone`

Source: `GameEngineMapGenerator/MapGenerator/MainObjectPlacement.cs:3`.

`Spawn` main objects require `spawn`, and `owner` is optional. Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:103`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:151`.

## Zone Roles

Roles are naming conventions in shipped data, not hard-coded enums:

- `Spawn-*`: starting areas.
- `Side-*`: connector/side areas.
- `Treasure-*`: treasure areas.
- `SuperTreasure-*`: high-value treasure areas.
- `Center-*`: center/contest areas.
- `Connector-*`: graph-routing areas.

The generator sees only field values and references.

## Editor Implications

- Enforce unique zone names per variant.
- Treat pool/preset arrays as random alternatives, not cumulative includes.
- Show sampled references and resolved runtime objects separately.
- Protect zone renames because many rules reference zone names.
- Warn on scalar `contentCountLimits` because the C# model expects `string[]`.

## Default Editor Zone

The editor core now uses a blank default zone for creation:

- `layout: "zone_layout_default"`
- no main objects
- no roads
- no mandatory content
- zero random-content budgets
- valid default guarded/unguarded/resources pool refs
- explicit biome rules

The explicit biome rules matter: the generator parser dereferences `zoneBiome`, `contentBiome`, and `metaObjectsBiome`. A zone can be empty of gameplay content, but it should not omit biome-rule objects.

To make this zone generate random loot, set content pools and non-zero value budgets. To make it structurally important, add main objects. To attach it to the map, add connections.
