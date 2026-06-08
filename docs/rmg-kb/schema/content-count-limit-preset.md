# Content Count Limit Preset

## Purpose

Document one named template-local preset that expands into per-zone content count limits. Limits constrain mandatory content and later random pool content in the same zone.

## Source-of-Truth Types/Files

- `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`
- `GameEngineMapGenerator/MapGenerator/ContentCountLimit.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `GameEngineMapGenerator/MapGenerator/Limits.cs`
- `GameEngineMapGenerator/MapGenerator/ContentTask.cs`
- `src/core/resolver/resolveTemplate.ts`
- `src/core/rmg/stringArrayCompat.ts`
- `external/map_templates/*.rmg.json`

## Preset Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | preset | string | none | required | unique template-local preset id | indexed into template-local count-limit collection | zone `contentCountLimits` refs | unresolved preset ref | `"content_limits_spawn"` |
| `limits[]` | preset | array | empty/null | optional | `ContentCountLimit[]` | selected preset entries are copied into runtime zone limits | content/list refs | no-op or broken limits | `[{ "sid": "prison", "maxCount": 1 }]` |

## Limit Entry Fields

| Field name | Meaning |
| --- | --- |
| `sid` | Direct content sid to limit. If present, `includeLists[]` is not expanded for this entry. |
| `variant` | Variant-specific limit. `-1` means sid-wide limit. |
| `biome` | Optional biome sid; limit applies only when the zone content biome matches it. |
| `maxCount` | Maximum count for matching content. C# runtime default is `1` in `MapDescription.ContentCountLimit`. |
| `includeLists[]` | Content-list ids for group limits when `sid` is absent. |
| `content[]` | Explicit `ContentID[]` for group limits when `sid` is absent. |

## Runtime Selection Behavior

- Zone `contentCountLimits` is an array of preset alternatives. The generator randomly chooses exactly one preset id from the zone list if the list is non-empty.
- Content count limit presets are template-local only. C# `TemplateContext` creates this collection only from `template.contentCountLimits`.
- If the selected preset id does not resolve, C# logs a config error and the zone gets no entries from that id.
- If a limit entry has `sid`, it becomes a direct sid/variant limit.
- If a limit entry has no `sid`, `includeLists[]` are expanded and converted to `ContentID` entries, then combined with `content[]` into a group limit.
- Limit weights do not exist. If a list was included, only each list entry's `sid` and `variant` matter.
- Limits are created before mandatory content. Mandatory content consumes limits first; guarded, unguarded, and resource random content consume what remains.
- The runtime also injects an implicit `prison` limit based on hero pool and spawn count.

## Conditional Behavior

- Direct `sid` entry: use `sid`, `variant`, `biome`, and `maxCount`; ignore `includeLists[]` for expansion.
- Group entry without `sid`: expand `includeLists[]` and `content[]` into a group, then the group has one shared `maxCount`.
- Biome-limited entry: ignored unless the zone content biome matches the entry biome.
- Multiple limits for the same sid/variant use the stricter minimum max count in `Limits.AddEntry`.
- Group limits count any matching sid/variant in the group toward the same group cap.

## Zone Field Compatibility

- C# schema declares zone `contentCountLimits` as `string[]`.
- Official templates currently use arrays in 885 zones and scalar strings in 17 zones.
- Scalar official values observed: `content_limits_spawn`, `content_limits_trunk`, `content_limits_treasure`, `content_limits_center`, and `content_limits_connector`.
- The editor core accepts scalar strings as legacy-compatible single alternatives and normalizes touched refs to arrays during mutations.

## Official Data Findings

- Common refs include `content_limits_treasure`, `content_limits_spawn`, `content_limits_side`, `content_limits_sides`, `content_limits_green`, `content_limits_yellow`, and `content_limits_center`.
- Current official unresolved count-limit preset refs:
- `All Around`, `Highway`, `Junction`, `Staircase`, and `Sworn`: `content_limits_spaws`.
- `Staircase` and `Yin Yang`: `content_limits_supertreasures`.
- These are likely typos or upstream data gaps and should remain validation errors unless explicitly remapped by the user.

## Validation Rules

- Preset names must be unique within the template.
- Every zone `contentCountLimits` id must resolve to a local preset.
- Direct `sid` should exist and `variant` should be valid.
- Group entries should resolve at least one content id from `includeLists[]` and `content[]`.
- `maxCount` should be non-negative; practical authoring normally uses positive integers.
- `biome`, if present, should resolve to a known biome sid.

## Common Failure Modes

- Author expects all presets in zone `contentCountLimits[]` to stack. They do not; one preset is randomly chosen.
- A group limit includes a weighted content list and expects weights to matter. They do not.
- A direct sid entry also has `includeLists`; the direct sid path wins.
- A typo in preset name silently removes intended caps at runtime after a config error.
- A low cap suppresses mandatory content before random pool filling begins.

## Example Snippets

```json
{
  "name": "content_limits_spawn",
  "limits": [
    { "sid": "prison", "variant": -1, "maxCount": 1 },
    {
      "includeLists": ["content_list_building_random_hires"],
      "maxCount": 2
    }
  ]
}
```

```json
{
  "contentCountLimits": ["content_limits_spawn", "content_limits_spawn_alt"]
}
```

## Editor Implications

- Zone UI should label `contentCountLimits` as "random limit preset alternatives".
- Validation should distinguish scalar compatibility warnings from real unresolved preset errors.
- Preview should show direct caps, group caps, biome-scoped caps, and the implicit prison cap.
- When editing mandatory content, show which limits could suppress it.
- Refactor tools must rewrite zone refs when presets are renamed and block deletion unless cascade cleanup is chosen.
