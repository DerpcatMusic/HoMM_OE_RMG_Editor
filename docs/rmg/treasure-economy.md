# Treasure, Economy, Value Budgets

Treasure in RMG is not a single field. It emerges from zone content-value budgets, content pools, mandatory content, resources pools, guards, value overrides, and content count limits.

## Status

- `done`: zone budgets, pool assignment, value overrides, global bans, road links, and the value-budget model are documented and editable in core.
- `partial`: content selection behavior is understood, but preview/simulation tooling is not complete.
- `missing`: full economy balancing tools, pool preview simulation, and budget-aware tuning UI.

## Source References

- Zone value budgets: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:58`
- Runtime budget copy: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:198`
- Content pools: `GameEngineMapGenerator/MapGenerator/ContentPoolConfig.cs:7`
- Value distribution: `GameEngineMapGenerator/MapGenerator/ValueDistributionConfig.cs:6`
- Value override fields: `GameEngineMapGenerator/MapGenerator/ContentValueOverride.cs:6`
- Content count limits: `GameEngineMapGenerator/MapGenerator/ContentCountLimit.cs:6`

## Zone Budgets

Each zone can define:

- `guardedContentValue`
- `guardedContentValuePerArea`
- `unguardedContentValue`
- `unguardedContentValuePerArea`
- `resourcesValue`
- `resourcesValuePerArea`

The builder copies these into `MapDescription.Zone`; later content placement uses the budgets and pools to fill slots. Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:58`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:66`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:198`.

The runtime total for each budget is:

```text
flatValue + round(perAreaValue * playableArea * 0.1)
```

`playableArea` is not the authored zone size. It is computed from generated zone cells that are free for encounters after obstacles are known. Sources: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:275`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:314`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:328`.

`ContentTask.Create` produces three per-zone streams:

- `guarded`: random content generated from `guardedContentValue` and `guardedContentValuePerArea`.
- `unguarded`: random content generated from `unguardedContentValue` and `unguardedContentValuePerArea`.
- `resources`: random content generated from `resourcesValue` and `resourcesValuePerArea`.

Sources: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:267`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:269`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:271`.

## Content Pool Value Distributions

`ContentPoolConfig.valueDistribution` contains:

- `priceBounds`
- `weights`

`ValueDistribution` requires exactly one more weight than price bound. Brackets are built as `[0, firstBound)`, `[boundN, boundN+1)`, and the last bracket has max `-1` for no upper bound.

Sources: `GameEngineMapGenerator/MapGenerator/ValueDistributionConfig.cs:6`, `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:34`, `GameEngineMapGenerator/MapGenerator/Utils.cs:262`.

`CreateRandomContentByValue` iterates value brackets from high to low, allocates each bracket a percentage of the total budget, repeatedly rolls content from the selected pool, and subtracts value by accumulating `ValueOverrides.GetValue()`. It stops a bracket when the pool cannot provide a valid object or the bracket budget is consumed. Sources: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:410`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:414`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:421`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:430`.

## Value Overrides

`ContentValueOverride` can override:

- `goodsValue`
- `guardValue`
- `aiValue`

`ValueOverrides.GetValue()` uses positive `goodsValue` first, then meta-object value, then logic-config value. `GetGuardValue()` uses positive `guardValue` first, then meta-object guard/value, then logic-config guard value.

Sources: `GameEngineMapGenerator/MapGenerator/ContentValueOverride.cs:8`, `GameEngineMapGenerator/MapGenerator/ValueOverrides.cs:19`, `GameEngineMapGenerator/MapGenerator/ValueOverrides.cs:36`.

## Guards And Treasure

Guarded encounter strength is derived from placed content guard values and zone guard tuning:

- `guardCutoffValue`
- `guardMultiplier`
- `guardRandomization`
- `guardWeeklyIncrement`
- `guardReactionDistribution`

Encounter guards are placed only when encounter guard strength reaches the zone cutoff. Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:76`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1156`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1178`.

Connection guards use the connection's `guardValue`, `guardWeeklyIncrement`, `guardReaction`, `guardEscape`, and optional `guardMatchGroup`. Source: `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1212`.

## Content Count Limits

Zone `contentCountLimits` is a sampled list of preset IDs. The selected preset expands into runtime limits. Limit entries can target a specific `sid`/`variant`/`biome` or expand `includeLists`.

Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:56`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:232`, `GameEngineMapGenerator/MapGenerator/ContentCountLimit.cs:8`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:243`.

`Limits` always adds a derived prison cap based on `heroPoolCount`, spawn count, and zone count. It supports direct SID limits, variant-specific limits, biome-gated limits, and grouped limits from explicit `content` entries or expanded include lists. Sources: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:389`, `GameEngineMapGenerator/MapGenerator/Limits.cs:49`, `GameEngineMapGenerator/MapGenerator/Limits.cs:58`, `GameEngineMapGenerator/MapGenerator/Limits.cs:176`.

Mandatory content is generated before random budget content, using cloned per-zone limits. Successful mandatory rolls are added to limits, so they can reduce later random content availability. Sources: `GameEngineMapGenerator/MapGenerator/ContentTask.cs:255`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:258`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:349`, `GameEngineMapGenerator/MapGenerator/ContentTask.cs:351`.

## Slot Filling

`ContentSlotsFiller` receives the generated object lists and places them into free encounter slots. Buildings and pickups are handled differently:

- Buildings are matched to suitable building slots and prefer slots with lower local duplicate counts.
- Pickups are assigned to pickup slots and use locality limits to avoid clustering identical SIDs.
- If target value remains after normal building placement, free building slots can receive fallback content from the same pool and value distribution.

Sources: `GameEngineMapGenerator/MapGenerator/ContentSlotsFiller.cs:43`, `GameEngineMapGenerator/MapGenerator/ContentSlotsFiller.cs:51`, `GameEngineMapGenerator/MapGenerator/ContentSlotsFiller.cs:54`, `GameEngineMapGenerator/MapGenerator/ContentSlotsFiller.cs:56`, `GameEngineMapGenerator/MapGenerator/ContentSlotsFiller.cs:91`, `GameEngineMapGenerator/MapGenerator/ContentSlotsFiller.cs:110`.

Editor implication: the authored budget is only the target input. Actual generated value depends on terrain/slots, limits, pool availability, fallback behavior, and missing external content.

## Shipped Template Roles

Templates commonly encode treasure roles in zone names and pool names:

- `Treasure`, `SuperTreasure`, `Center`, `Side`, `Connector`, `Spawn`
- pools like `content_pool_general_resources_treasure_zone_rich`
- mandatory presets like `mandatory_content_treasure` and `mandatory_content_supertreasure`

These names are conventions, not hard-coded enums. The generator only sees fields and references.

## Known Local Data Issue

`bbolbval.rmg.json` embeds three local content pools, but each has two `priceBounds` and only one `weight`. The C# validator requires `priceBounds.Length + 1 == weights.Length`, so these pools are invalid under the inspected source.

Sources: `GameDB/RMGMAPS/bbolbval.rmg.json:323` (older sample), `GameDB/RMGMAPS/bbolbval.rmg.json:343` (older sample), `GameDB/RMGMAPS/bbolbval.rmg.json:363` (older sample), `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:39`.

## Editor Implications

- Display total budget, per-area budget, and resolved area-adjusted budget separately.
- Show which pool supplies guarded, unguarded, and resources content.
- Validate value distributions before generation.
- Provide a treasure-role label as editor metadata, but keep JSON authored through actual fields.
- Surface count-limit presets in the same view as content pools, because they constrain treasure output.
