# Misc Settings Compatibility

## Purpose

Classify the non-obvious `.rmg.json` settings that are easy to mis-handle in an editor.

This page answers four questions for each field:

- Can it be authored in `.rmg.json`?
- Is it declared in the inspected C# RMG model?
- Do official templates use it?
- What does the editor do with it?

## Evidence Sources

- `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs`
- `GameEngineMapGenerator/MapGenerator/GameRules.cs`
- `GameEngineMapGenerator/MapGenerator/WinConditions.cs`
- `GameEngineMapGenerator/MapGenerator/EncounterHolesSettings.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs`
- `GameEngineMapGenerator/MapGenerator/RandomHireMetaObject.cs`
- `external/map_templates/*.rmg.json`
- `extracted/Core/DB/map_bonuses/map_bonuses.json`

## Classification

| Field | JSON location | Can be in `.rmg.json`? | C# declaration status | Official usage | Meaning / runtime effect | Editor policy |
| --- | --- | --- | --- | ---: | --- | --- |
| `factionLawsExpModifier` | `gameRules` | yes | declared in `GameRules.cs` | 15 templates | Game-rule scalar for faction-law experience conversion/modification. This pass did not find the final copy path in inspected `ContentPlacer.SetGameRules`. | First-class editable finite number; preserve. |
| `astrologyExpModifier` | `gameRules` | yes | declared in `GameRules.cs` | 17 templates | Game-rule scalar for astrology experience modification. This pass did not find the final copy path in inspected `ContentPlacer.SetGameRules`. | First-class editable finite number; preserve. |
| `bonuses` | `gameRules` | yes | declared as `MapBonus[]` in `GameRules.cs` | 21 templates | Copied to `mapData.settings.bonuses` by `ContentPlacer.SetGameRules`. Bonus IDs/receiver filters come from Core map-bonus DB. | First-class editable as opaque bonus objects until bonus schema is fully modeled. |
| `tournamentRules` | `gameRules` | yes | declared in `GameRules.cs` | 1 template | Copied to `mapData.settings.isTournamentRules`. Separate from `winConditions.tournament`. | First-class editable boolean. |
| `customAI` | `gameRules` | yes | declared in `GameRules.cs` | 0 templates | `null` disables custom AI; non-null enables custom AI and writes `customAISid`. | First-class editable nullable string. |
| `disableFactionLaws` | `gameRules` | yes | declared in `GameRules.cs` | 0 templates | Declared authoring field. This pass did not find final map-settings copy path in inspected source. | First-class editable boolean; preserve. |
| `disableMagicGuild` | `gameRules` | yes | declared in `GameRules.cs` | 0 templates | Declared authoring field. This pass did not find final map-settings copy path in inspected source. | First-class editable boolean; preserve. |
| `disableMagicCustomLearning` | `gameRules` | yes | declared in `GameRules.cs` | 0 templates | Declared authoring field. This pass did not find final map-settings copy path in inspected source. | First-class editable boolean; preserve. |
| `uniqueMagicCostModifiers` | `gameRules` | source-mismatch only | referenced by `ContentPlacer.SetGameRules`, not declared in inspected `GameRules.cs` | 0 templates | `ContentPlacer` copies it to `mapData.settings.uniqueMagicCostModifiers`, but this workspace lacks the defining `GameRules` field. | Preserve if encountered through unknown-field support; do not expose as normal control until defining source is found. |
| `cityHold` / `cityHoldDays` | `gameRules.winConditions` | yes | declared in `WinConditions.cs` | 13 templates | Declared and official-data-supported. Current inspected `ContentPlacer.SetGameRules` does not emit city-hold `MapWinCondition`; semantic validator still requires `holdCityWinCon` target when `cityHold` is true. | First-class editable, but mark emission path source-uncertain. |
| `tournament*` win fields | `gameRules.winConditions` | yes | declared in `WinConditions.cs` | 5 templates | Declared and official-data-supported. Current inspected `ContentPlacer.SetGameRules` does not emit tournament `MapWinCondition`. | First-class editable, but mark emission path source-uncertain. |
| `holdCityWinCon` | `variants[].zones[].mainObjects[]` | yes | declared in `RandomMapTemplate.MainObject` | 8 objects in 5 templates | Marks the main object as the city-hold target/anchor for city-hold style templates. | First-class editable boolean; require at least one when `cityHold` is true. |
| `encounterHoles` | `gameRules` | yes | declared in `GameRules.cs` | 57 occurrences across 56 templates | If false, `ContentPlacer` skips encounter-hole creation. If true, zone `encounterHolesSettings` can affect holes. | First-class editable boolean. |
| `encounterHolesSettings.affectedEncounters` | zone | yes | declared in `EncounterHolesSettings.cs` | 163 zones in 2 templates | Fraction-like value used to choose how many encounters are affected by holes. | First-class editable object fields; validate finite non-negative numbers. |
| `encounterHolesSettings.twoHoleEncounters` | zone | yes | declared in `EncounterHolesSettings.cs` | 163 zones in 2 templates | Fraction-like value used to choose how many affected encounters get two holes. | First-class editable object fields; validate finite non-negative numbers. |
| `guardReactionDistribution` | zone | yes | declared in `RandomMapTemplate.Zone` | 902 zones | Six weights for guard reaction roll: `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, `Docile`. | First-class editable 6-number array. Block other lengths. |
| `diplomacyModifier` | zone | yes | declared in `RandomMapTemplate.Zone` | 313 zones | Copied to zone and used in squad params as diplomacy units-count bonus/modifier. | First-class editable finite number. |
| `randomHireEnableWeeklyUnitIncrement` | zone | yes | declared in `RandomMapTemplate.Zone` | 31 zones | Passed to random-hire meta object as constant-growth flags. | First-class editable array; deeper length semantics still need source mapping. |
| `randomHireInitialUnitIncrement` | zone | yes | declared in `RandomMapTemplate.Zone` | 31 zones | Passed to random-hire meta object as initial growth/count values. | First-class editable array; deeper length semantics still need source mapping. |
| `connection.road` | connection | can appear, but not model-declared | absent from inspected `RandomMapTemplate.Connection` | 923 connections | Official compatibility field. No inspected generator usage in current source. Unity JSON model would ignore it. | Preserve and optionally expose in advanced/raw, but do not rely on it for generation. |
| `connection.simTurnSquad` | connection | can appear, but not model-declared | absent from inspected `RandomMapTemplate.Connection` | 430 connections | Official compatibility field. No inspected generator usage in current source. | Preserve and optionally expose in advanced/raw, but do not rely on it for generation. |
| `connection.guardRandomization` | connection | can appear, but not model-declared | absent from inspected `RandomMapTemplate.Connection` | 166 connections by connection-level scan | Official compatibility field. Zone and main-object `guardRandomization` are declared; connection-level is not in inspected model. | Preserve and optionally expose in advanced/raw, but do not rely on it for generation. |

## Map Bonus Values

`gameRules.bonuses` is real `.rmg.json` content because `GameRules.cs` declares `MapBonus[] bonuses` and `ContentPlacer.SetGameRules` copies it to `mapData.settings.bonuses`.

Observed official bonus fields:

- `sid`: map bonus id.
- `side`: player/side selector in some templates.
- `receiverFilter`: observed `start_hero` and `all_heroes`.
- `parameters`: bonus-specific string parameters.

Core bonus definitions are in `extracted/Core/DB/map_bonuses/map_bonuses.json`. That file defines valid receiver filters such as `start_hero` and `all_heroes`.

Editor policy:

- Use Core map-bonus catalog for pickers.
- Preserve unknown bonus fields.
- Validate `sid` and `receiverFilter` only after the map-bonus catalog is indexed.

## City Hold And Tournament Caveat

`WinConditions.cs` declares city-hold and tournament fields, and official templates use them. However, the inspected `ContentPlacer.SetGameRules` only emits these `MapWinCondition` entries:

- `Classic`
- `Desertion`
- `HeroLighting`
- `LostStartCity`
- `LostStartHero`
- `GladiatorArena`

It does not emit city-hold or tournament entries in this source slice. Therefore:

- They are valid `.rmg.json` fields.
- They must be preserved and edited.
- The editor should label their final emission path as source-uncertain until a newer/non-stubbed generator source proves the missing path.

## Compatibility Field Rule

Fields absent from inspected C# but present in official JSON are not safe to use as normal generation controls. The editor should:

- preserve them during round-trip JSON edits;
- show them in an advanced compatibility/raw section;
- avoid creating them by default in new templates;
- avoid using them in previews unless a source usage is later found.

## Core Status

Current editor core support:

- Declared game-rule modifiers and `bonuses` are editable through `updateTemplateSettings`.
- `guardReactionDistribution` is validated as exactly six non-negative numbers.
- Connection compatibility fields are shape-validated and preserved, but still treated as observed-only.
- `uniqueMagicCostModifiers` remains preserve-only through unknown-field support.
