# Content Pool

## Purpose

Document one reusable weighted random-content pool. Zones do not contain random objects directly; each zone references one or more pool ids in `guardedContentPool`, `unguardedContentPool`, and `resourcesContentPool`, then the generator randomly selects exactly one pool id from each zone field for the generated map.

## Source-of-Truth Types/Files

- `GameEngineMapGenerator/MapGenerator/ContentPoolConfig.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPool.cs`
- `GameEngineMapGenerator/MapGenerator/TemplateContext.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `GameEngineMapGenerator/MapGenerator/ContentTask.cs`
- `src/core/resolver/resolveTemplate.ts`
- `src/core/validation/validateTemplate.ts`
- `extracted/Core/generator/content_pools/**/*.json`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | content pool | string | none | required | unique pool id | stored in template-local or Core content-pool collection | zone pool refs | unresolved zone pool ref | `"content_pool_default_guarded"` |
| `valueDistribution` | content pool | object | runtime expects a valid config | required in runtime path unless supplied by defaults upstream | `{ priceBounds: int[], weights: float[] }` | converted to value brackets and target percentages | none | generator exception for invalid bracket count/order | `{ "priceBounds": [500, 1500], "weights": [1, 3, 1] }` |
| `groups[]` | content pool | array | empty | required in practice | `ContentPoolConfig.Group[]` | each group expands its `includeLists` plus inline `content`, then contributes a normalized group weight | content lists, content ids | empty/zero candidate pool | `[{ "weight": 1, "includeLists": ["content_list_basic_storage"] }]` |
| `groups[].weight` | pool group | float | C# default `0` | required in practice | usually positive; `0` is accepted but contributes no effective weight | scales all resolved content from that group after per-biome normalization | none | group silently contributes no candidates if `0` | `10000` |
| `groups[].includeLists[]` | pool group | string array | empty/null | optional | content-list ids only | each id is looked up in `ContentList` collection and its `content` is appended to the group input | template-local or Core content lists | config error / editor validation error if unresolved | `"content_list_pickup_random_items"` |
| `groups[].content[]` | pool group | array | empty/null | optional | `ContentWeight[]` | appended after included lists and merged by sid/variant/biome | content ids | bad sid, invalid variant, zero effective weight | `{ "sid": "random_item_common", "weight": 100 }` |
| `bans[]` | content pool | array | empty/null | optional | `ContentID[]` | applied after group content is merged; `heroHireBan` can add extra bans | content ids | intended content removed from the pool | `{ "sid": "prison", "variant": -1 }` |

## Runtime Selection Behavior

- Zone pool arrays are alternatives, not merged. `MapDescriptionBuilder` calls `random.Next(zone2.guardedContentPool.Length)`, `random.Next(zone2.unguardedContentPool.Length)`, and `random.Next(zone2.resourcesContentPool.Length)`.
- Pool groups are merged into one runtime `ContentWeightsTable`, but each group is normalized independently and multiplied by `groups[].weight`.
- `includeLists` are not recursive pool includes. C# `ContentPool` only calls `contentLists.TryGetById(id)`. A pool id inside `includeLists` is invalid unless a content list with the same name exists.
- Inline `content[]` and included list content are combined by `sid`; the final effective candidate set is filtered by content DB validity, variant bans, biome-specific weights, pool bans, global bans, and per-zone content count limits.
- `ContentTask.CreateRandomContentByValue` fills budget by value brackets from highest bracket down. Each chosen object consumes the same per-zone `Limits` used by mandatory content.
- `ContentPool.GetBuilding` also filters candidates by encounter slot size and interaction layout. A pool can look valid but still fail for a specific encounter slot.

## Local vs External Definitions

- Core pools are loaded from `extracted/Core/generator/content_pools/**/*.json`.
- Template-local `contentPools` are supported by C# `TemplateContext` and by this editor core.
- When template-local pools exist, C# creates a local collection from the template and adds Core pools as references. The editor should treat local definitions as the editable layer and Core definitions as read-only/importable dependencies.
- Pool ids in zones can resolve to either template-local or Core pools.
- Content pools are not template-local-only; mandatory content presets and content count limit presets are template-local-only.

## Value Distribution

- C# `ValueDistribution` requires `weights.length == priceBounds.length + 1`.
- Bounds are converted into brackets: first bracket starts at `0`; last bracket has max `-1`; inner bracket max values come from `priceBounds`.
- Bounds must be ascending. A bound lower than the previous minimum throws a generator exception.
- Weights are normalized to percentages by dividing each weight by the total weight.
- Editor validation should block `weights.length != priceBounds.length + 1`, non-ascending bounds, and zero/negative total weight.

## Official Data Findings

- The extracted Core catalog currently contains hundreds of content pools and content lists.
- Common pool includes are basic/core list ids such as `basic_content_list_building_guarded_resource_banks_tier_2`, `basic_content_list_pickup_random_items`, `content_list_pickup_random_items`, and `content_list_building_random_hires`.
- Official Core data currently has 29 unresolved `includeLists` references: 28 references to missing `content_list_building_common_guarded_resource_banks`, and 1 Symphony reference to `template_pool_symphony_guarded_center_zone_pandora_box`.
- The Symphony case is likely an authoring mistake or upstream compatibility gap: the referenced id is shaped like a pool id, but `includeLists` resolves only content lists.

## Validation Rules

- `name` should be unique within the local pool list.
- Every `includeLists[]` id must resolve to either a template-local content list or a Core content list.
- Every inline `content[].sid` should exist in the content catalog.
- `variant` should be valid for the selected `sid`, or `-1` where runtime roll/default behavior is intended.
- `valueDistribution` must have one more weight than price bound.
- Pool preview should show if bans, biome filters, value brackets, or count limits leave no candidates.

## Common Failure Modes

- Author expects `guardedContentPool: ["a", "b"]` to merge pools. It does not; the generator randomly chooses one.
- Author puts a pool id in `includeLists`. C# does not resolve nested pools there.
- Pool has valid content but no content in the active biome because all effective weights are zero.
- Pool has valid buildings but none fit the selected encounter slots.
- `heroHireBan` removes random hire content from a pool unexpectedly.
- `valueOverrides` change object goods/guard values, causing different bracket placement and budget consumption than the raw content DB suggests.

## Example Snippets From Shipped Data

```json
{
  "name": "content_pool_default_guarded",
  "groups": [
    {
      "weight": 1,
      "includeLists": [
        "content_list_pickup_random_items",
        "content_list_basic_storage",
        "content_list_basic_buildings",
        "content_list_building_common_interact"
      ]
    }
  ],
  "bans": []
}
```

```json
{
  "weight": 20000,
  "includeLists": ["basic_content_list_pickup_random_items"],
  "content": [
    { "sid": "random_item_common", "weight": 100 },
    { "sid": "random_item_rare", "weight": 100 },
    { "sid": "random_item_epic", "weight": 100 }
  ]
}
```

## Editor Implications

- The pool editor needs two modes: assign pool alternatives to zones, and edit/clone pool definitions.
- Zone UI should label pool arrays as "random alternatives", not "contents".
- Pool definition UI should expand `includeLists` and inline `content` into a candidate preview with source labels.
- The editor should allow cloning a Core pool to a template-local pool before editing.
- The browser should flag unresolved official Core refs without auto-fixing them.
- Preview must account for value distribution, biome, bans, `heroHireBan`, value overrides, count limits, building slot fit, and guarded/unguarded/resource budget source.
