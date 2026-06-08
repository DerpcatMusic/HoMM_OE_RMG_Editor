# Game Rules

## Purpose

Document map-wide gameplay rules that directly affect RMG generation, ownership, and player/hero constraints.

## Source-of-Truth Types/Files

- `GameRules.cs`
- `ContentPlacer.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `heroCountMin` | `gameRules` | int | `5` | optional | non-negative int | copied to map settings | none | impossible or unintended hero caps | `1` |
| `heroCountMax` | `gameRules` | int | `10` | optional | non-negative int | copied to map settings | none | impossible hero caps | `1` |
| `heroCountIncrement` | `gameRules` | int | `1` | optional | non-negative int | copied to map settings | none | bad selection step | `1` |
| `heroHireBan` | `gameRules` | bool | `false` | optional | `true`/`false` | affects map settings and content-pool bans | tavern/prison behavior | mismatch between authored intent and available hero sources | `true` |
| `encounterHoles` | `gameRules` | bool | `false` | optional | `true`/`false` | copied into runtime rules | none | placement behavior drift | `false` |
| `disableFactionLaws` | `gameRules` | bool | `false` | optional | `true`/`false` | copied into runtime rules | none | faction-law behavior drift | `true` |
| `disableMagicGuild` | `gameRules` | bool | `false` | optional | `true`/`false` | copied into runtime rules | none | magic-guild behavior drift | `true` |
| `disableMagicCustomLearning` | `gameRules` | bool | `false` | optional | `true`/`false` | copied into runtime rules | none | custom-learning behavior drift | `true` |
| `tournamentRules` | `gameRules` | bool | `false` | optional | `true`/`false` | copied into runtime rules | none | tournament behavior drift | `true` |
| `customAI` | `gameRules` | string | none | optional | string | copied into runtime rules | AI config id | AI behavior mismatch | `"custom_ai"` |
| `factionLawsExpModifier` | `gameRules` | number | `0` | optional | number | copied into runtime rules | none | experience scaling mismatch | `1.0` |
| `astrologyExpModifier` | `gameRules` | number | `0` | optional | number | copied into runtime rules | none | experience scaling mismatch | `1.0` |
| `bonuses` | `gameRules` | array | empty | optional | map bonus objects | copied to map settings | bonus receiver filters | unrecognized bonus semantics | `[{ "sid": "..."}]` |
| `winConditions` | `gameRules` | object | defaults object | optional | see page | copied to map settings | start-city/start-hero semantics | wrong loss/win behavior | `{...}` |

## Defaults

- hero counts default to `5`, `10`, `1`
- `heroHireBan` defaults to `false`
- `encounterHoles` defaults to `false`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `bonuses.receiverFilter` observed: `start_hero`

## Resolution/Derivation Behavior

- `heroHireBan` removes hero-hire related content from pools through generator bans
- hero counts, `tournamentRules`, `bonuses`, `customAI`, and `heroHireBan` are written into final map settings in the inspected `ContentPlacer.SetGameRules`
- `encounterHoles` is consumed later by encounter-hole placement; when false, the generator skips encounter-hole creation
- `disableFactionLaws`, `disableMagicGuild`, `disableMagicCustomLearning`, `factionLawsExpModifier`, and `astrologyExpModifier` are declared in `GameRules.cs`, but this pass did not find their final map-settings copy path in the inspected source

## Source Mismatch / Misc Settings

- `ContentPlacer.SetGameRules` references `mapDesc.gameRules.uniqueMagicCostModifiers`, but the inspected `GameRules.cs` file in this workspace does not declare that field.
- No official `external/map_templates/*.rmg.json` use of `uniqueMagicCostModifiers` was found in this pass.
- Treat `uniqueMagicCostModifiers` as a preserve-only unknown field until the defining C# model or official data usage is found.
- See [misc-settings-compatibility.md](./misc-settings-compatibility.md) for the full proof table and editor policy.

## External References Used

- content bans for `tavern` and `prison`
- player/hero semantics in final map settings

## Validation Rules

- `heroCountMin <= heroCountMax`
- `heroCountIncrement >= 0`
- bonus objects should be treated as opaque unless their receiver/filter format is verified

## Common Failure Modes

- enabling `heroHireBan` without accounting for hero-related content expectations
- authoring single-hero modes without aligning loss conditions

## Example Snippets From Shipped Templates

```json
"gameRules": {
  "heroCountMin": 1,
  "heroCountMax": 1,
  "heroHireBan": true,
  "bonuses": [
    { "sid": "add_bonus_hero_unit_multipler", "receiverFilter": "start_hero" }
  ]
}
```

## Editor Implications

- expose hero constraints near player semantics, not as isolated scalars
- warn when hero-hire rules conflict with expected map flow
- expose `factionLawsExpModifier`, `astrologyExpModifier`, and `bonuses` as first-class edit targets before claiming complete game-rule editing
- keep source-mismatch fields in an advanced/raw section unless source usage is proven
