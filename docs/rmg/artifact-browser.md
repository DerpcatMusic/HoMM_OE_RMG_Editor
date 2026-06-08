# Artifact Browser

The artifact browser is a game-data catalog for direct artifact authoring in RMG content pools.

## Status

- `done`: Core indexes placeable artifact map objects.
- `done`: Core joins wearable item records, object logic values, item-set names, English localization, and global banned-item flags.
- `done`: Core exposes a filterable `listArtifactOptions` API for UI/browser use.
- `missing`: Visual UI palette and generated-map playtest loop.

## Source Files

- Artifact map objects: `extracted/Core/DB/map/objects/6_artifacts.json`
- Artifact logic values: `extracted/Core/DB/objects_logic/items/artifacts.json`
- Wearable item records: `extracted/Core/DB/items/items/*.json`
- Item sets: `extracted/Core/DB/items/item_sets/item_sets.json`
- Global banned items: `extracted/Core/DB/data.json`
- Localized names: `extracted/Core/Lang/english/texts/*.json`
- Core implementation: `src/core/game-data/artifactCatalog.ts`
- Scan command: `src/cli/artifact-scan.ts`
- Core.zip cache command: `npm run game-data:refresh`

## Current Counts

Current scan result:

- `154` placeable map objects with `tag: "Artifact"`
- `151` wearable artifacts
- `3` scroll container objects: `scroll_box`, `enchanted_scroll_box`, `mythic_scroll_box`
- `7` globally banned items
- `153` entries with localized names

The same artifact catalog can now be generated directly from `external/Core.zip` into `.cache/game-data/artifacts.json`; a full `extracted/Core` folder is not required for this cache path.

The remaining missing localized name is a campaign item key not found in the current English text bundle.

## Data Model

`ArtifactCatalogEntry` contains:

- `id`: direct content `sid`
- `name`: localized display name when available
- `description`: localized description when available
- `slot`: raw item slot such as `head`, `armor`, `left_hand`, `right_hand`, or `item_slot`
- `slotName`: localized slot label such as `Head`, `Armor`, `Main Hand`, or `Off Hand`
- `rarity`: `common`, `rare`, `epic`, or `legendary`
- `itemSet` and `setName`
- `goodsValue`
- `prefab`
- `rmgPlaceable`
- `directArtifact`
- `scrollContainer`
- `globallyBanned`
- `sourcePaths`
- `warnings`

## Slot Mapping

Observed wearable slots:

- `head`: Head
- `armor`: Armor
- `back`: Back
- `belt`: Belt
- `boots`: Boots
- `left_hand`: Main Hand
- `right_hand`: Off Hand
- `ring`: Ring
- `item_slot`: Item
- `unic_slot`: Holy Relic

## RMG Authoring Rules

Direct artifact placement is supported because artifacts are real map objects. To place an exact artifact candidate, add it to a content pool group or content list:

```json
{ "sid": "angelic_alliance_armor_of_wonder_artifact", "weight": 100 }
```

Random artifact buckets are different:

```json
{ "sid": "random_item_epic", "weight": 100 }
```

`random_item_epic` is a generator meta-object from `generator_config.json`, not a content pool and not a content list. It resolves to the map object `random-item` with metadata telling the placed object to roll an item by rarity.

Content pools do not include other content pools. The generator-supported nesting is:

- zone uses content pools
- content pool groups include content lists
- content lists contain direct content weights
- groups can also contain direct content weights

## UI Implications

The default browser should:

- hide `globallyBanned` entries unless the user enables advanced/campaign content
- hide scroll containers when browsing wearable artifacts, but show them in spell-scroll/container mode
- search by localized name and raw `sid`
- filter by slot, rarity, and item set
- insert selected entries as ordinary `ContentWeight` values

For balance, direct artifacts should be allowed but made explicit. Official RMG templates mostly use `random_item_*` buckets for broad item randomness.
