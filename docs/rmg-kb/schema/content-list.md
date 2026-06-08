# Content List

## Purpose

Document one reusable named list of weighted content entries. A content list is not a pool by itself; it is a reusable ingredient consumed by content pools, mandatory content entries, and content count limit entries.

## Source-of-Truth Types/Files

- `GameEngineMapGenerator/MapGenerator/ContentList.cs`
- `GameEngineMapGenerator/MapGenerator/ContentWeight.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPool.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `src/core/game-data/contentListIndex.ts`
- `src/core/resolver/resolveTemplate.ts`
- `extracted/Core/generator/content_lists/**/*.json`

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | content list | string | none | required | unique list id | indexed into local/Core content-list collection | `includeLists` refs | unresolved include-list refs | `"basic_content_list_basic_resources"` |
| `content[]` | content list | array | empty/null | required in practice | `ContentWeight[]` | copied into the consumer's temporary content list before weighted resolution | content ids | empty/no-op include | `[{ "sid": "resource_gold", "weight": 250 }]` |

## Consumers

- `ContentPoolConfig.Group.includeLists[]`: list content is appended to that pool group.
- `RandomMapTemplate.MandatoryContent.includeLists[]`: list content is appended to the mandatory entry only when the mandatory entry does not specify direct `sid`.
- `ContentCountLimit.includeLists[]`: list entries are converted from `ContentWeight` to `ContentID` and become a group count limit.

## Runtime Resolution Behavior

- Lists are copied, not referenced at runtime. After `MapDescriptionBuilder` or `ContentPool` expands a list, later edits to the source list do not matter for that generated map.
- List entries preserve `sid`, `variant`, `biome`, and `weight` when consumed by pools or mandatory random entries.
- Count limits ignore list weights. They copy only `sid` and `variant`.
- Content lists do not include other content lists. There is no nested `includeLists` field on `ContentList`.
- Template-local lists and Core lists share the same lookup path for pools and mandatory entries. Local definitions are the editable layer; Core definitions are read-only dependencies.

## Local vs External Definitions

- Core lists are loaded from `extracted/Core/generator/content_lists/**/*.json`.
- Template-local `contentLists` are supported by C# `TemplateContext` and the editor resolver.
- When template-local lists exist, C# creates a local collection and adds Core lists as references.
- Pool and mandatory entries can refer to either local or Core content lists.

## Official Data Findings

- The extracted Core catalog has many reusable list families: `basic_content_list_*`, `content_list_*`, and template-specific `custom_content_lists_*`.
- Example Core list `basic_content_list_basic_resources` contains weighted resource pickups such as `resource_gold`, `resource_wood`, and `resource_ore`.
- Official unresolved pool refs are almost entirely a missing list named `content_list_building_common_guarded_resource_banks`.
- A Symphony Core pool references `template_pool_symphony_guarded_center_zone_pandora_box` through `includeLists`, but no content list with that name exists in the extracted Core list catalog.

## Validation Rules

- `name` should be unique in the template-local list collection.
- Each `content[].sid` should exist in the content catalog.
- Each `content[].variant` should be valid for the selected sid, or `-1` if the object supports runtime/default variant selection.
- `content[].weight` should be positive for random selection use. Zero is accepted by shape but usually means "never selected".
- Every consumer `includeLists[]` should resolve to local or Core content lists.

## Common Failure Modes

- Renaming a content list without updating all pool, mandatory-content, and content-count-limit `includeLists` refs.
- Treating list weights as limits. Count limit presets ignore weights.
- Assuming a list is single-purpose. The same list id can feed random pools and mandatory random content.
- Missing Core list refs can leave whole groups weaker or empty.

## Example Snippets From Shipped Data

```json
{
  "name": "basic_content_list_basic_resources",
  "content": [
    { "sid": "resource_gold", "weight": 250 },
    { "sid": "resource_wood", "weight": 100 },
    { "sid": "resource_ore", "weight": 100 }
  ]
}
```

## Editor Implications

- Show reverse references: pools, mandatory presets, and count limit presets that consume the list.
- Show effective consumers separately because the same list weight means different things in different consumers.
- Provide an expanded preview of list entries with actual object names and variants from the generated content catalog.
- Warn before deleting or renaming a list unless cascade rewrite is requested.
