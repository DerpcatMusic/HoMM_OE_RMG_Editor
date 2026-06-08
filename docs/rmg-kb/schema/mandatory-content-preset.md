# Mandatory Content Preset

## Purpose

Document one named template-local preset that expands into guaranteed zone content. Mandatory content is separate from a zone's random budget pools: it is selected first, consumes count limits, and can be targeted by roads and placement rules.

## Source-of-Truth Types/Files

- `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`
- `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs`
- `GameEngineMapGenerator/MapGenerator/ContentTask.cs`
- `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs`
- `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs`
- `src/core/resolver/resolveTemplate.ts`
- `src/core/rmg/stringArrayCompat.ts`
- `external/map_templates/*.rmg.json`

## Preset Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | preset | string | none | required | unique template-local preset id | indexed into template-local mandatory preset collection | zone `mandatoryContent` refs | unresolved preset ref | `"mandatory_content_spawn"` |
| `content[]` | preset | array | empty/null | optional but normally present | mandatory-content entries | copied into the zone when this preset is selected | entry-local content/list/rule refs | empty mandatory preset creates no guaranteed objects | `[{ "sid": "mine_gold", "isMine": true }]` |

## Entry Fields Summary

| Field name | Meaning |
| --- | --- |
| `name` | Optional entry name used by road targets and `MandatoryContent` placement rules. |
| `sid` / `variant` | Direct guaranteed object. If `sid` exists, the entry ignores random `content[]` and `includeLists[]`. |
| `includeLists[]` | Content-list ids used only for random mandatory entries with no direct `sid`. |
| `content[]` | Inline `ContentWeight[]` used for random mandatory entries with no direct `sid`. |
| `rules[]` | Placement rules parsed after roads/main objects/connections exist. |
| `designatedEncounter` | Forces/marks a dedicated encounter path; roads targeting the entry set this to true at runtime. |
| `soloEncounter` | Requests a separate encounter for the mandatory object. |
| `isGuarded` | Controls guarded-vs-unguarded accounting and placement behavior. |
| `isMine` | Marks mine-like mandatory content. |
| `owner` | Parsed as `ESpawn`; invalid values are generator errors. |

## Runtime Selection Behavior

- Zone `mandatoryContent` is an array of preset alternatives. The generator randomly chooses exactly one preset id from the zone list.
- If the zone list is empty, the zone gets no mandatory content.
- Mandatory presets are template-local only. C# `TemplateContext` creates the mandatory preset collection only from `template.mandatoryContent`; Core does not provide global mandatory presets.
- Each selected preset entry becomes one runtime `MapDescription.MandatoryContent`.
- If an entry has direct `sid`, the generator rolls that specific object/variant using `GetMapObjectDescRollSpecific`.
- If an entry has no `sid`, the generator expands `includeLists[]`, appends inline `content[]`, builds a temporary `ContentWeightsTable`, and rolls one object by biome and weight.
- Mandatory content is created before guarded, unguarded, and resource random budget content.
- Mandatory picks consume the same per-zone `Limits` later used by random content. If a direct mandatory object is already limited out, it becomes a null/default mandatory entry.
- `heroHireBan` applies to random mandatory content through the same ban path used by weighted content.

## Conditional Behavior

- Direct `sid` entry: `includeLists[]` and `content[]` are not expanded.
- Random entry without `sid`: `includeLists[]` and `content[]` are merged, then one object is rolled.
- Entry with placement `rules[]`: not counted as a "hobo pickup" for random encounter filler accounting.
- Entry with `designatedEncounter` or `soloEncounter`: not counted as a hobo pickup.
- Road target of type `MandatoryContent`: after road parsing, the targeted mandatory entry has `designatedEncounter = true`.
- Pickup mandatory content without rules, without `designatedEncounter`, without `soloEncounter`, and matching guarded state contributes to guarded/unguarded hobo pickup counts.

## Zone Field Compatibility

- C# schema declares zone `mandatoryContent` as `string[]`.
- The current official templates linked in `external/map_templates` use arrays for all 902 zone `mandatoryContent` fields.
- The editor core still accepts legacy scalar strings for compatibility and normalizes them as a single alternative when resolving/mutating.

## Official Data Findings

- Common zone preset refs include `mandatory_content_spawn`, `mandatory_content_treasure`, `mandatory_content_side`, `mandatory_content_center`, `mandatory_content_yellow`, and `mandatory_content_green`.
- Current official unresolved mandatory preset refs:
- `Fair'n Square`, variant `0`, zone `Treasure-7`: `mandatory_content_treasur_1`.
- `Trinity`, variant `0`, zones `Yellow-1` and `Yellow-3`: `mandatory_content_yellow`.
- These should be surfaced as validation errors. Do not auto-correct them unless a user explicitly chooses a replacement preset.

## Validation Rules

- Preset names must be unique within the template.
- Every zone `mandatoryContent` id must resolve to a local preset.
- Entry `owner`, if present, must parse to a valid spawn enum.
- Entry direct `sid` should exist and variant should be valid.
- Random entries should have at least one resolved candidate after included lists, inline content, bans, biome filter, and count limits.
- Entry names referenced by roads or `MandatoryContent` placement rules must exist in that zone after preset selection.

## Common Failure Modes

- Author expects all entries from every zone `mandatoryContent[]` preset id to appear. The array is alternatives; only one preset is selected.
- Direct `sid` plus `includeLists` is authored expecting fallback behavior. There is no fallback; direct `sid` wins.
- Count limits suppress a mandatory object, leaving a null/default slot.
- Road or placement rule references a mandatory entry name that is absent in one alternative preset.
- Renaming a mandatory entry breaks roads or placement rules that reference it by name or index-like args.

## Example Snippets

```json
{
  "name": "mandatory_content_spawn",
  "content": [
    {
      "name": "gold_mine",
      "sid": "mine_gold",
      "variant": -1,
      "isMine": true,
      "isGuarded": false
    }
  ]
}
```

```json
{
  "name": "random_mandatory_reward",
  "includeLists": ["content_list_pickup_random_items"],
  "content": [
    { "sid": "pandora_box", "weight": 1 }
  ],
  "isGuarded": true,
  "rules": [
    { "type": "Road", "args": [] }
  ]
}
```

## Editor Implications

- Zone UI should label `mandatoryContent` as "random preset alternatives".
- Preset UI should label `content[]` as "guaranteed entries in the selected preset".
- Entry UI must clearly separate direct object mode from random weighted mode.
- Road editing must validate mandatory-content targets against every possible preset alternative for that zone.
- Preview should show whether an entry is direct, random, guarded, mine, solo/designated, road-targeted, or suppressible by limits.
- Refactor tools must update zone preset refs and also check entry names used by roads and placement rules.
