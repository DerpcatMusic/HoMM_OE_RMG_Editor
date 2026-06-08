# Content Pools

Content pools define weighted random content candidates for guarded, unguarded, and resource filling.

## Status

- `done`: zone pool selection, pool inventory lookup, template-local pool add/update/remove/rename, and Core-to-local pool cloning.
- `done`: fine-grained pool group add/update/move/remove commands for weights, include-lists, and direct content.
- `done`: fine-grained pool ban add/update/move/remove commands and value-distribution set/clear commands.
- `missing`: resolved roll-probability previews.

## Source References

- Pool schema: `GameEngineMapGenerator/MapGenerator/ContentPoolConfig.cs:7`
- Pool runtime: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:10`
- Content lists: `GameEngineMapGenerator/MapGenerator/ContentList.cs:7`
- Content weights: `GameEngineMapGenerator/MapGenerator/ContentWeight.cs:6`
- Weight table: `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:8`
- Template-local plus external resolution: `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:81`

## Pool Fields

- `name`: pool ID.
- `valueDistribution`: price brackets and target weights.
- `groups`: weighted content groups.
- `bans`: `ContentID` list removed from the pool.

Source: `GameEngineMapGenerator/MapGenerator/ContentPoolConfig.cs:19`.

## Group Fields

- `weight`: multiplier for the group.
- `includeLists`: content list IDs expanded into the group.
- `content`: inline `ContentWeight` entries.

Source: `GameEngineMapGenerator/MapGenerator/ContentPoolConfig.cs:10`.

There is no observed `includePools` field. Pools do not nest other pools directly. The nesting layer is:

- zone points at one or more content pool IDs
- content pool groups include content list IDs
- content lists contain direct `sid`/`variant`/`biome`/`weight` entries
- pool groups can also contain direct content entries

Random item buckets such as `random_item_common` are not pools. They are generator meta-objects declared in `extracted/Core/generator/generator_config.json` and resolved by `ContentDatabase`.

## Content Weight Fields

- `sid`: object/meta-object ID.
- `variant`: variant index, `-1` means default/all depending on context.
- `biome`: optional biome sid for biome-specific weight.
- `weight`: candidate weight.

Source: `GameEngineMapGenerator/MapGenerator/ContentWeight.cs:6`.

## Resolution Behavior

The pool constructor expands include lists, adds inline content, applies bans, applies hero-hire bans if enabled, normalizes weights per biome, and stores object descriptors for later roll/filter operations.

Sources: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:197`, `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:105`.

Detailed flow:

- `ContentPool` creates a `ValueDistribution` from the pool config. Source: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:201`.
- It creates a `ContentWeightsTable` using the content database and ban info. Source: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:202`.
- If `heroHireBan` is enabled, tavern/prison are added as bans. Sources: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:204`, `GameEngineMapGenerator/MapGenerator/GeneratorConfig.cs:175`.
- For each group, every `includeLists` ID is looked up in `contentLists`; the included list content plus inline group content is sent to the weight table with the group's `weight`. Sources: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:210`, `GameEngineMapGenerator/MapGenerator/ContentPool.cs:222`.
- The weight table combines entries by `sid`, then applies bans before computing concrete variant/biome weights. Sources: `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:107`, `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:115`, `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:192`.

## Variant And Biome Weights

`ContentWeight.variant = -1` is a wildcard-like default. When a specific variant is valid, the table can override that variant separately. If no specific variant is selected, object variant roll chances from logic configs influence the final weight.

`ContentWeight.biome` can restrict a weight to one biome. The biome string is resolved through `ContentDatabase.GetBiomeIdForSid`; invalid biome strings cause that content-weight entry to be ignored.

Sources: `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:25`, `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:51`, `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:198`, `GameEngineMapGenerator/MapGenerator/ContentWeightsTable.cs:263`.

## Roll APIs

Runtime content placement asks pools for:

- `GetContent()`: any weighted content matching biome/value/limits.
- `GetBuilding()`: building content that fits an encounter building slot.
- `GetPickup()`: non-building pickup content.

Sources: `GameEngineMapGenerator/MapGenerator/ContentPool.cs:105`, `GameEngineMapGenerator/MapGenerator/ContentPool.cs:134`, `GameEngineMapGenerator/MapGenerator/ContentPool.cs:168`.

## Value Distribution Validation

`ValueDistribution` requires `priceBounds.Length + 1 == weights.Length`. Bounds must be ascending. It normalizes configured weights into target percentages.

Sources: `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:34`, `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:39`, `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:48`, `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:55`.

## Local Vs External Pools

`TemplateContext` first loads template-local `contentPools`, then adds references to global generator content pools. `GeneratorConfig` expects global pools under mod folders at `generator/content_pools`.

Sources: `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:81`, `GameEngineMapGenerator/MapGenerator/GeneratorConfig.cs:72`.

The installed Core data is now extracted locally, so those external shared pools are available at `extracted/Core/generator/content_pools`. This folder contains 73 JSON files and 532 pool definitions.

The full installed template folder is symlinked at `external/map_templates`. It contains 56 `.rmg.json` templates. Most templates have empty root `contentPools` arrays and reference external shared pools from `extracted/Core/generator/content_pools`.

Examples of external pool references:

- `template_pool_jebus_cross_guarded_center_zone` is referenced by `external/map_templates/Jebus Cross.rmg.json:68` and defined in `extracted/Core/generator/content_pools/template_pools_jebus_cross.json`.
- `content_pool_general_resources_start_zone_rich` is referenced by `external/map_templates/Jebus Cross.rmg.json:171` and defined in `extracted/Core/generator/content_pools/basic_pools_resources.json`.
- `template_pool_shamrock_guarded_treasure_zone` is referenced by `external/map_templates/Shamrock.rmg.json:124` and defined in `extracted/Core/generator/content_pools/template_pools_shamrock.json`.

Local pools in `bbolbval.rmg.json`:

- `content_pool_guarded` at `GameDB/RMGMAPS/bbolbval.rmg.json:323` (older sample)
- `content_pool_unguarded` at `GameDB/RMGMAPS/bbolbval.rmg.json:343` (older sample)
- `content_pool_resources` at `GameDB/RMGMAPS/bbolbval.rmg.json:363` (older sample)

## Known Local Issue

The three `bbolbval.rmg.json` pools each define two `priceBounds` and one `weight`, which violates the inspected C# validator. Treat `bbolbval` as experimental or broken until these are fixed.

Sources: `GameDB/RMGMAPS/bbolbval.rmg.json:325` (older sample), `GameDB/RMGMAPS/bbolbval.rmg.json:345` (older sample), `GameDB/RMGMAPS/bbolbval.rmg.json:365` (older sample), `GameEngineMapGenerator/MapGenerator/ValueDistribution.cs:39`.

## Editor Implications

- Mark every pool reference as local or external.
- Prefer resolving external pools from `extracted/Core/generator/content_pools`.
- Resolve include lists before previewing candidate weights.
- Validate `valueDistribution.priceBounds.Length + 1 == weights.Length`.
- Preserve variant/biome-specific weights.
- Show bans next to includes so users understand why expected content is absent.

## Core Browser Helper

`listContentPoolOptions({ gameData, template, sampleSize })` returns UI-friendly pool summaries from Core plus optional template-local pools.

Each option includes:

- pool ID
- source: `core` or `template-local`
- source path for Core pools
- group count
- include-list count
- direct-content count
- ban count
- whether value distribution is configured
- a small direct-content sample

This is intended for the zone content-pool selector. It does not expand include lists yet; that remains a future richer preview step.

## Artifact Content Browser

Direct artifacts are valid map objects in `extracted/Core/DB/map/objects/6_artifacts.json`. The core now indexes them through `indexArtifactCatalog` and exposes `listArtifactOptions` for a UI picker.

The picker should write direct artifacts into a pool or content list as normal content weights:

```json
{ "sid": "angelic_alliance_armor_of_wonder_artifact", "weight": 100 }
```

For default artifact randomness, official pools mostly use meta-object buckets:

- `random_item_common`
- `random_item_rare`
- `random_item_epic`
- `random_item_legendary`

For exact artifact authoring, use direct artifact SIDs from the artifact catalog.

## Core-To-Local Clone

`cloneCoreContentPoolToLocal` copies a resolved Core pool into the template root `contentPools` array. By default it names the local copy `<source>_local` and appends a numeric suffix if needed. Callers can provide an explicit `localName`; explicit duplicates are rejected.

Use this before editing a shipped Core pool. The clone is a deep copy, so later local edits do not mutate the indexed Core data. After cloning, assign the new local pool to zones with `setZoneContentPools`.

## Group Editing

Use the first-class group mutations for normal content-pool editing:

- `addContentPoolGroup`
- `updateContentPoolGroup`
- `moveContentPoolGroup`
- `removeContentPoolGroup`

`updateContentPoolGroup` can edit `weight`, `includeLists`, and `content`. Passing `null` for one of those fields removes it from the group. This lets the UI edit one group at a time without replacing the whole pool object.

## Bans And Value Distribution Editing

Use the first-class ban mutations for normal pool ban editing:

- `addContentPoolBan`
- `updateContentPoolBan`
- `moveContentPoolBan`
- `removeContentPoolBan`

Use `updateContentPoolValueDistribution` to set or clear `valueDistribution`. It validates the engine rule that `weights.length == priceBounds.length + 1` and that price bounds are strictly ascending.
