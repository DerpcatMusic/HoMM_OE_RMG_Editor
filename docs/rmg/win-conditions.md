# Win Conditions

RMG templates expose win conditions through two layers:

- `displayWinCondition`: UI text SID shown to the player.
  - `win_condition_0`: Story-Based
  - `win_condition_1`: Classic
  - `win_condition_2`: Capital Capture
  - `win_condition_3`: Capital Hold
  - `win_condition_4`: Final Battle
  - `win_condition_5`: City Hold
  - `win_condition_6`: Tournament
  - `win_condition_7`: Battle for Capital
- `gameRules.winConditions`: engine flags and parameters consumed by the map generator.

## Status

- `done`: edit game mode, hero-count settings, and named win-condition rules.
- `partial`: the engine-backed names and rule fields are documented, but there is no specialized authoring UI yet.
- `missing`: presets and validation helpers for every named condition variant.

Sources checked:

- `extracted/Core/Lang/english/texts/ui.json`
- `GameEngineMapGenerator/MapGenerator/WinConditions.cs`
- `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs`
- installed templates under `external/map_templates/*.rmg.json`

## Official Names

| Preset ID | Display SID | Official English name | Core preset ID |
| --- | --- | --- | --- |
| 0 | `win_condition_0` | Story-Based | `storyBased` |
| 1 | `win_condition_1` | Classic | `classic` |
| 2 | `win_condition_2` | Capital Capture | `capitalCapture` |
| 3 | `win_condition_3` | Capital Hold | `capitalHold` |
| 4 | `win_condition_4` | Final Battle | `finalBattle` |
| 5 | `win_condition_5` | City Hold | `cityHold` |
| 6 | `win_condition_6` | Tournament | `tournament` |
| 7 | `win_condition_7` | Battle for Capital | `battleForCapital` |

The editor core stores these in `src/core/rmg/winConditions.ts` as `WIN_CONDITION_PRESETS`.

## Engine Fields

`WinConditions.cs` defines these fields:

- `classic`
- `desertion`, `desertionDay`, `desertionValue`
- `heroLighting`, `heroLightingDay`
- `lostStartCity`, `lostStartCityDay`
- `lostStartHero`
- `gladiatorArena`, `gladiatorArenaRegistrationStartWork`, `gladiatorArenaRegistrationStartFight`, `gladiatorArenaDaysDelayStart`, `gladiatorArenaCountDay`, `championSelectRule`
- `cityHold`, `cityHoldDays`
- `tournament`, `tournamentPointsToWin`, `tournamentSaveArmy`, `tournamentDays`, `tournamentAnnounceDays`

`ContentPlacer.cs` in the currently inspected source emits classic/desertion/hero-lighting/start-city/start-hero/gladiator-arena conditions. The broader source/data set also contains city-hold and tournament fields, and shipped templates use them, so the editor must preserve and expose them.

## Special Map Requirements

Some win-condition presets need map structure, not only root flags.

- `City Hold`: at least one `MainObject` should have `holdCityWinCon: true`. Shipped examples include `Jebus Cross`, `Jebus Cross Classic`, `Arcade`, `Universe`, and `Zookeeper`.
- `Final Battle`: shipped examples use gladiator-arena rules, and some maps use a `connectionType: "GladiatorArena"` or `MainObject` with `type: "GladiatorArena"`.
- `Tournament`: shipped examples set tournament fields but do not necessarily place a gladiator arena object in the template.
- `Capital Capture` and `Capital Hold`: rely on starting city/start hero semantics from player spawn zones.

## Core Support

Implemented core helpers:

- `getWinConditionPreset(id)`
- `isWinConditionPresetId(value)`
- `createWinConditionsFromPreset(id, overrides)`
- `cloneWinConditions(winConditions)`
- `updateTemplateSettings({ winConditionPreset, winConditions })`
- `createDefaultTemplate({ winConditionPreset })`
- `createMinimalPlayableTemplate({ winConditionPreset: "cityHold" })`

`updateTemplateSettings` applies the preset's display SID unless the caller explicitly passes `displayWinCondition`.

`createMinimalPlayableTemplate` adds a center city with `holdCityWinCon: true` when `winConditionPreset` is `cityHold`.
