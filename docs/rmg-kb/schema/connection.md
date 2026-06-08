# Connection

## Purpose

Document graph edges between zones and their gate/portal/guard semantics.

## Source-of-Truth Types/Files

- `RandomMapTemplate.Connection`
- `MapDescription.Connection`
- `ConnectionType.cs`
- `GatePlacement.cs`
- `MapDescriptionBuilder.cs`
- shipped templates

## Fields Table

| Field name | Container type | Value type | Default | Requiredness | Allowed values | Resolution behavior | Reference target | Failure mode | Example |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `name` | connection | string | none | optional in code, common in data | connection label | copied to runtime | road/rule refs | broken downstream refs if missing | `"Spawn-A-Treasure-1"` |
| `from` | connection | string | none | required | zone name | resolved to zone index | zone name | config error if missing/bad | `"Spawn-A"` |
| `to` | connection | string | none | required | zone name | resolved to zone index | zone name | config error if missing/bad | `"Treasure"` |
| `connectionType` | connection | enum string | `Default` | optional | `Default`, `Direct`, `GladiatorArena`, `Portal`, `Proximity` | parsed to runtime enum | none | parse error | `"Portal"` |
| `length` | connection | float | `0` | optional | float | used by graph embedding/adjacency | none | poor layout tuning | `1.0` |
| `portalFromEnabled` | connection | bool | `true` | optional | bool | copied to runtime | none | portal endpoint mismatch | `true` |
| `portalToEnabled` | connection | bool | `true` | optional | bool | copied to runtime | none | portal endpoint mismatch | `true` |
| `guardZone` | connection | string | none | optional | zone name | resolved to zone index if valid | zone name | falls back to `-1` if not endpoint zone | `"Spawn-A"` |
| `guardValue` | connection | int | `0` | optional | signed int | copied into runtime | none | wrong guard strength | `5000` |
| `guardWeeklyIncrement` | connection | float | `0` | optional | float | copied into runtime | none | wrong scaling | `0.1` |
| `guardReaction` | connection | enum string | `Common` | optional | `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, `Docile` | parsed to runtime enum | none | parse error | `"Common"` |
| `guardEscape` | connection | bool | `true` | optional | bool | copied into runtime | none | wrong guard behavior | `false` |
| `guardMatchGroup` | connection | string | none | optional | string | copied into runtime | none | group matching drift | `"group_1"` |
| `gatePlacement` | connection | enum string | `Random` | optional | `Random`, `Center`, `NearZone` | parsed to runtime enum | zone refs via args | parse error | `"Center"` |
| `gatePlacementArgs[]` | connection | array | none | optional | strings | used by gate placement logic | zone names/placement args | unexpected gate placement | `["Spawn-A"]` |
| `portalPlacementRulesFrom[]` | connection | array | none | optional | placement rules | parsed and resolved | local refs | parse failure | `[{ "type": "Road" }]` |
| `portalPlacementRulesTo[]` | connection | array | none | optional | placement rules | parsed and resolved | local refs | parse failure | `[{ "type": "Road" }]` |
| `road` | connection | bool | not in primary type | observed-only | bool | discrepancy field in shipped data | none | schema drift if ignored | `true` |
| `simTurnSquad` | connection | bool | not in primary type | observed-only | bool | discrepancy field in shipped data | none | unknown runtime behavior | `true` |
| `guardRandomization` | connection | float | not in primary type | observed-only | float | discrepancy field in shipped data | none | unknown runtime behavior | `0.1` |

## Defaults

- `connectionType = Default`
- portals enabled on both sides
- `guardReaction = Common`
- `guardEscape = true`
- `gatePlacement = Random`

## Allowed Enum/Rule Values Actually Used In Shipped Templates

- `connectionType`: `Default`, `Direct`, `Portal`, `Proximity`, `GladiatorArena`
- `gatePlacement`: `Center`
- `guardReaction`: no official `external/map_templates` usage found in this scan; source-supported runtime values are `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, `Docile`

## Resolution/Derivation Behavior

- `from` and `to` resolve to zone indices during parse
- `Default` may later resolve to `Direct` or `Portal` depending on gate validity
- `guardZone` must match one endpoint zone or it is discarded to `-1`

## External References Used

- zone names
- placement-rule targets

## Validation Rules

- `from` and `to` must exist in the same variant
- named connections used by roads/rules should really have stable unique names
- connection `name` is optional in official data, but unnamed connections cannot be referenced by name
- duplicate connection names exist in official data; name lookups resolve to the first match and are ambiguous
- `guardZone` should be empty or one endpoint zone; the generator discards missing and non-endpoint values
- `guardValue` is signed in official data; do not force it non-negative
- `portalPlacementRulesFrom` validate in the `from` zone context
- `portalPlacementRulesTo` validate in the `to` zone context

## Common Failure Modes

- missing names on connections that later need to be referenced by roads
- relying on `road` booleans from shipped data even though they are absent from the inspected primary authoring type
- relying on `simTurnSquad` or connection-level `guardRandomization` without confirmed generator usage
- changing endpoints without revalidating portal placement rules

## Official Template Scan Notes

- Scan scope: 56 official templates, 66 variants, 902 zones, 1393 connections under `external/map_templates`.
- Type counts: `Direct` 728, `Default` 382, `Portal` 170, `Proximity` 111, `GladiatorArena` 2.
- Observed-only field counts: `road` 917, `simTurnSquad` 430, connection-level `guardRandomization` 166.
- No shipped template in this scan uses `guardReaction`, `portalFromEnabled`, `portalToEnabled`, or `gatePlacementArgs`.

## Example Snippets From Shipped Templates

```json
{
  "name": "Side-A-Center",
  "from": "Side-A",
  "to": "Center",
  "connectionType": "Direct",
  "guardValue": 5000
}
```

## Editor Implications

- never dedupe connections by endpoints
- show both name-based identity and edge multiplicity
- use variant index plus connection index as stable editor identity, not connection name
- preserve unknown and observed-only fields for round-trip compatibility
