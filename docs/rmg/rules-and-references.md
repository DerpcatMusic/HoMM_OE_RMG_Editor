# Rules And References

RMG JSON uses many small stringly typed rules. The editor should present these as structured forms, not raw `args` arrays.

## Status

- `done`: the major reference types and parsing rules are mapped from source.
- `partial`: several rules are documented from behavior rather than a single canonical schema.
- `missing`: one unified editor schema for all rule types and live validation hints.

## Source References

- Enum parser: `GameEngineMapGenerator/MapGenerator/EnumParser.cs:23`
- Shared target parsing: `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:8`
- Biome rule parser: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:930`
- Faction rule parser: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:1024`
- Placement rule parser: `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs:216`
- Road parser: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:487`

## Reference Types

- Zone names: used by connections, biome rules, faction rules, gate placement, and `NearZone`.
- Connection names: used by road targets and placement rules.
- Main-object indexes: zero-based within a zone.
- Mandatory content names: used by road targets and placement rules.
- Preset names: zone references to layout/content/limit/mandatory presets.
- Pool/list names: content pool and include-list references.

## Enum Parsing

Enum strings are exact and case-sensitive. On failure, the parser returns `false` and outputs the enum's first value as fallback. Many callers log errors rather than throwing.

Sources: `GameEngineMapGenerator/MapGenerator/EnumParser.cs:26`, `GameEngineMapGenerator/MapGenerator/EnumParser.cs:30`, `GameEngineMapGenerator/MapGenerator/EnumParser.cs:47`.

## Biome Rules

Valid types:

- `FromList`
- `MatchZone`
- `MatchMainObject`

`FromList` args are biome IDs plus optional `differentFrom:` constraints. `MatchZone` can reference a zone name or default to the current zone. `MatchMainObject` references a main-object index and optionally a zone name.

Sources: `GameEngineMapGenerator/MapGenerator/BiomeRuleType.cs:3`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:943`.

## Faction Rules

Valid types:

- `FromList`
- `Match`

`FromList` args are faction IDs plus optional `differentFrom: <mainObjectIndex> [zoneName]`. `Match` uses `<mainObjectIndex> [zoneName]`.

Sources: `GameEngineMapGenerator/MapGenerator/FactionRuleType.cs:3`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:1036`.

## Placement Rules

Valid types:

- `Random`
- `Sid`
- `MainObject`
- `Crossroads`
- `Connection`
- `Road`
- `MandatoryContent`

Rules carry `target`, `targetMin`, `targetMax`, and `weight`. The target is clamped to `0..1`; a range is sampled if `targetMax >= targetMin` and `targetMax > 0`.

Sources: `GameEngineMapGenerator/MapGenerator/PlacementRuleType.cs:3`, `GameEngineMapGenerator/MapGenerator/PlacementRule.cs:6`, `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs:309`.

## Road Targets

Road endpoint types:

- `Crossroads`
- `MainObject`
- `Connection`
- `MandatoryContent`

Source: `GameEngineMapGenerator/MapGenerator/RoadTargetType.cs:3`.

## Cycles

Faction and biome dependencies are resolved through stack walks. Circular dependency in main-object factions or zone biomes throws `GeneratorException`.

Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:672`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:805`.

## Editor Implications

- Use typed editors for each rule.
- Show main-object references as stable labels plus current index.
- Warn before reordering main objects.
- Warn before renaming zones, connections, mandatory content entries, presets, pools, or lists.
- Keep unknown raw args visible for round-trip safety.
