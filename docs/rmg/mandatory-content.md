# Mandatory Content

Mandatory content guarantees specific objects or weighted object choices in a zone. It is separate from random content pools.

## Status

- `done`: add, remove, update, rename, inspect, and validate mandatory-content presets and their references.
- `partial`: whole-preset updates are supported, but fine-grained entry/rule commands are not separated yet.
- `missing`: dedicated placement-rule editor and safer target pickers.

## Source References

- Root preset schema: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:195`
- Preset wrapper: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:224`
- Zone reference field: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:90`
- Builder expansion: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:270`
- Runtime model: `GameEngineMapGenerator/MapGenerator/MapDescription.cs:143`

## Two Meanings Of `mandatoryContent`

- Zone `mandatoryContent`: `string[]` of preset IDs; one preset ID is sampled.
- Root `mandatoryContent`: array of named `MandatoryContentPreset` definitions.

Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:90`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:281`.

## Entry Fields

- `name`: optional entry name used by placement/road references.
- `includeLists`: content lists expanded into weighted content.
- `content`: inline weighted candidates.
- `sid`: direct object/meta-object ID.
- `variant`: object variant.
- `rules`: placement rules.
- `designatedEncounter`: whether this should occupy a designated encounter.
- `soloEncounter`: whether it should be alone.
- `isGuarded`: guarded vs unguarded slot category.
- `isMine`: mine behavior marker.
- `owner`: optional player owner.

Sources: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:197`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:201`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:203`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:207`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:209`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:217`.

## Direct SID Vs Weighted Content

If `sid` is present, the builder copies `sid` and `variant` directly. If `sid` is absent, it copies inline `content` and expands `includeLists`.

Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:283`.

## Placement Rules

Mandatory entries can carry `rules`, later parsed by `PlacementRuleHandler`. Rules can bias placement relative to random, sid, main object, crossroads, connection, road, or another mandatory content entry.

Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:298`, `GameEngineMapGenerator/MapGenerator/PlacementRuleType.cs:3`, `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs:216`.

## Editor Implications

- Show preset definitions separately from zone references.
- Treat zone references as random alternatives.
- Require names for mandatory content entries that roads/rules reference.
- Validate owner strings when present.
- Preserve `isGuarded`, `soloEncounter`, and `designatedEncounter` because they materially affect slot selection.
