# Win Conditions

## Purpose

Document map-wide win/loss condition fields that materially affect player semantics and map settings.

## Source-of-Truth Types/Files

- `WinConditions.cs`
- `ContentPlacer.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `classic` | `gameRules.winConditions` | bool | `true` | optional | bool | emitted to map win condition list | none | expected rules missing | `true` |
| `desertion` | same | bool | `true` | optional | bool | emitted to map win condition list | none | wrong mode rules | `true` |
| `desertionDay` | same | int | `0` | conditional | non-negative int | copied when `desertion` true | none | wrong day threshold | `7` |
| `desertionValue` | same | int | `0` | conditional | non-negative int | copied when `desertion` true | none | wrong value threshold | `100` |
| `heroLighting` | same | bool | `true` | optional | bool | emitted to map win condition list | none | wrong mode rules | `true` |
| `heroLightingDay` | same | int | `0` | conditional | non-negative int | copied when `heroLighting` true | none | wrong day threshold | `7` |
| `lostStartCity` | same | bool | `false` | optional | bool | emitted when true | start city concept | wrong elimination semantics | `true` |
| `lostStartCityDay` | same | int | `0` | conditional | non-negative int | copied when `lostStartCity` true | none | misleading if dangling | `3` |
| `lostStartHero` | same | bool | `false` | optional | bool | emitted when true | start hero concept | wrong elimination semantics | `true` |
| `gladiatorArena` | same | bool | `false` | optional | bool | emitted when true | gladiator arena mode | behavior mismatch | `true` |
| `gladiatorArenaRegistrationStartWork` | same | bool | `false` | conditional | bool | copied when arena enabled | none | mode mismatch | `false` |
| `gladiatorArenaRegistrationStartFight` | same | bool | `true` | conditional | bool | copied when arena enabled | none | mode mismatch | `true` |
| `gladiatorArenaDaysDelayStart` | same | int | `0` | conditional | int | copied when arena enabled | none | mode mismatch | `30` |
| `gladiatorArenaCountDay` | same | int | `3` | conditional | int | copied when arena enabled | none | mode mismatch | `3` |
| `championSelectRule` | same | string | none | conditional | observed `StartHero` | copied when arena/tournament enabled | start hero | wrong champion selection | `"StartHero"` |
| `cityHold` | same | bool | `false` | optional | bool | declared and observed; not emitted by inspected `SetGameRules` | marked hold city | no proven emitted city-hold victory in inspected path | `true` |
| `cityHoldDays` | same | int | `0` | conditional | non-negative int | declared and observed; not emitted by inspected `SetGameRules` | none | dangling hold duration if emitter is absent | `6` |
| `tournament` | same | bool | `false` | optional | bool | declared and observed; not emitted by inspected `SetGameRules` | tournament state | no proven emitted tournament victory in inspected path | `true` |
| `tournamentPointsToWin` | same | int | `0` | conditional | non-negative int | declared and observed; not emitted by inspected `SetGameRules` | none | dangling tournament target if emitter is absent | `2` |
| `tournamentSaveArmy` | same | bool | `false` | conditional | bool | declared and observed; not emitted by inspected `SetGameRules` | none | dangling army persistence setting if emitter is absent | `true` |
| `tournamentDays` | same | int[] | empty | conditional | non-negative ints | declared and observed; not emitted by inspected `SetGameRules` | none | dangling fight schedule if emitter is absent | `[3, 3, 3]` |
| `tournamentAnnounceDays` | same | int[] | empty | conditional | non-negative ints | declared and observed; not emitted by inspected `SetGameRules` | none | dangling announcement schedule if emitter is absent | `[7, 14, 21]` |

## Defaults

- `classic`, `desertion`, `heroLighting` default to `true`
- most other flags default to `false` or `0`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- common set: `classic`, `desertion`, `heroLighting`, `lostStartCity`, `lostStartCityDay`, `lostStartHero`
- special observed keys in shipped templates: `cityHold`, `cityHoldDays`, `tournament`, `tournamentPointsToWin`, `tournamentSaveArmy`, `tournamentDays`, `tournamentAnnounceDays`

## Resolution/Derivation Behavior

- inspected `ContentPlacer.SetGameRules` translates only `classic`, `desertion`, `heroLighting`, `lostStartCity`, `lostStartHero`, and `gladiatorArena` into `MapWinCondition` entries
- start-city and start-hero loss conditions directly affect player elimination rules
- `cityHold` and `tournament` fields are declared in `WinConditions.cs` and observed in official data, but this pass did not find their `MapWinCondition` emission path
- See [misc-settings-compatibility.md](./misc-settings-compatibility.md) for the field-by-field compatibility proof table.

## External References Used

- player start city
- player start hero

## Validation Rules

- `lostStartCityDay` should be meaningful only if `lostStartCity` is true
- gladiator arena sub-fields should be meaningful only if `gladiatorArena` is true
- city-hold presets should have at least one main object with `holdCityWinCon: true`
- tournament arrays should have consistent fight/announce semantics for the selected preset

## Common Failure Modes

- dangling day/count values with their parent flag disabled

## Example Snippets From Shipped Templates

```json
"winConditions": {
  "classic": true,
  "lostStartHero": true,
  "gladiatorArena": true,
  "gladiatorArenaDaysDelayStart": 30
}
```

## Editor Implications

- group these by player-loss semantics, not only by raw field order
- expose official named presets from `win_condition_0` through `win_condition_7`
- for city-hold templates, help authors mark the target city with `holdCityWinCon: true`
- preserve and edit declared city-hold/tournament fields, but mark their current emitter path as source-uncertain until verified in a newer or less-decompiled source slice
