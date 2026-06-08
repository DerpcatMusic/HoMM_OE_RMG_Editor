# Jebus Cross

## Source Files

- `external/map_templates/Jebus Cross.rmg.json`
- `WinConditions.cs`

## Inventory

- size: `160x160`
- game mode: `Classic`
- variants: `1`
- zones: `5`
- connections: `24`
- main objects: `17`
- players/spawns: `Player1`, `Player2`
- local count-limit presets: `46`

## Archetype

Large classic Jebus-style jackpot center.

## Special Semantics

- huge center value budgets
- many repeated or matchup-specific count-limit presets
- `cityHold` and `cityHoldDays` observed in shipped data

## Observed In Shipped Templates

- highest local count-limit preset count in the current shipped set

## Unique Risks

- count-limit preset sprawl
- data/code discrepancy around city-hold fields must be documented, not hidden
