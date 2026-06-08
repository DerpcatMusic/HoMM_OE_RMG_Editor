# Main Object

## Purpose

Document authored zone anchors such as spawns, cities, and outposts.

## Source-of-Truth Types/Files

- `RandomMapTemplate.MainObject`
- `MapDescription.MainObject`
- `MainObjectType.cs`
- `MainObjectPlacement.cs`
- `MapObjectsRegistry.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `type` | main object | enum string | `City` | optional | `City`, `Spawn`, `AbandonedOutpost`, code-defined `GladiatorArena` | parsed to runtime enum | none | parse error | `"Spawn"` |
| `spawn` | main object | enum string | none | conditional | `Player1`... | required for `Spawn` | player side | hard failure if missing on spawn | `"Player1"` |
| `owner` | main object | enum string | none | optional | `Player1`... | parsed to optional runtime owner | player side | hard failure on bad enum | `"Player2"` |
| `isKeyObject` | main object | bool | `false` | optional | bool | copied to runtime | none | key-object semantics lost | `true` |
| `holdCityWinCon` | main object | bool | `false` | optional | bool | copied to runtime | city-hold win condition (used by semantic validation for city-hold templates) | wrong city-hold semantics | `true` |
| `placement` | main object | enum string | `Uniform` | optional | `Uniform`, `Center`, `Connection`, code-defined `NearZone` | parsed to runtime enum | local refs via args | parse error | `"Connection"` |
| `placementArgs[]` | main object | array | none | conditional | strings | interpreted by placement mode | connection names / zone names / flags | wrong anchor placement | `["Spawn-A-Treasure-1"]` |
| `faction` | main object | rule object | `FromList` default | optional | see page | resolved to runtime faction sid | main-object refs | circular/broken rule | `{ "type": "Match", "args": ["0"] }` |
| `enableWeeklyUnitIncrement` | main object | bool | `true` | optional | bool | copied into city/outpost growth props | none | growth mismatch | `true` |
| `initialUnitIncrement` | main object | int | `1` | optional | int | copied into city/outpost growth props | none | growth mismatch | `2` |
| `guardChance` | main object | float | `1` | optional | float | affects guard spawning | none | wrong difficulty | `0.5` |
| `guardValue` | main object | int | `0` | optional | int | affects squad value | none | wrong difficulty | `3000` |
| `guardWeeklyIncrement` | main object | float | `0` | optional | float | affects squad scaling | none | wrong scaling | `0.1` |
| `guardRandomization` | main object | float | `0` | optional | float | affects guard spawning variance | none | wrong difficulty | `0.2` |
| `removeGuardIfHasOwner` | main object | bool | `false` | optional | bool | affects guard removal logic | owner semantics | unintuitive owned-city guards | `true` |
| `buildingsConstructionSid` | main object | string | none | optional | construction config id | copied into city props | config id | wrong city build state | `"default_buildings_construction"` |
| `buildingsBanSid` | main object | string | none | optional | ban config id | copied into city props | config id | wrong city build state | `"..."` |
| `factions[]` | main object | array | not in primary type | observed-only | strings | discrepancy field | none | drift between data and code docs | `[]` |

## Defaults

- `type = City`
- `placement = Uniform`
- growth defaults enabled with increment `1`
- full guard chance by default

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `type`: `Spawn`, `City`, `AbandonedOutpost`
- `placement`: `Uniform`, `Center`, `Connection`

## Resolution/Derivation Behavior

- `Spawn` becomes `city-spawner`
- `City` becomes `random-city`
- `AbandonedOutpost` becomes `abandoned_outpost`
- `Spawn` receives a side owner through `PropSpawn`
- `City` may receive an explicit owner through `owner`

## External References Used

- player side enum
- connection names in `placementArgs`
- faction rule refs to other main objects

## Validation Rules

- `spawn` must exist for `type = Spawn`
- `owner` must parse to a valid player side if present
- `placementArgs` must match placement mode semantics

## Common Failure Modes

- missing `spawn` on a spawn object
- reordering main objects after roads/faction rules/biome rules already reference positional indices
- using `factions[]` from shipped templates even though it is not represented in the inspected primary type

## Example Snippets From Shipped Templates

```json
{
  "type": "Spawn",
  "spawn": "Player1",
  "removeGuardIfHasOwner": true,
  "placement": "Uniform"
}
```

## Editor Implications

- main objects need stable editor identities separate from display order
- reorder must rewrite all dependent references automatically
