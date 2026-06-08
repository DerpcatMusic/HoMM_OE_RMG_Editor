# RMG Roads

Roads are authored per zone in `zone.roads[]`. They are not the same as the observed connection-level `road` compatibility field. Real generator roads connect two road targets inside one zone and are drawn onto the generated road map.

## Status

- `done`: add/update/remove roads and validate road targets against live generator rules.
- `partial`: road authoring is supported in the core, but the UI workflow is not built.
- `missing`: bulk road repair, road visualization, and convenience placement tools.

## Source Model

`RoadConfig` contains:

| Field | Meaning |
| --- | --- |
| `type` | Optional road surface enum: `Dirt` or `Stone`. Missing values parse to the enum default in practice; official templates contain missing `type` roads. |
| `from` | First road target. Required for safe authoring. |
| `to` | Second road target. Required for safe authoring. |

`RoadTargetConfig` contains:

| Field | Meaning |
| --- | --- |
| `type` | One of `Crossroads`, `MainObject`, `Connection`, `MandatoryContent`. |
| `args` | Target arguments. `MainObject`, `Connection`, and `MandatoryContent` use `args[0]`; `Crossroads` uses no args. |

Sources: `GameEngineMapGenerator/MapGenerator/RoadConfig.cs:6`, `GameEngineMapGenerator/MapGenerator/RoadTargetConfig.cs:6`, `GameEngineMapGenerator/MapGenerator/RoadType.cs:3`, `GameEngineMapGenerator/MapGenerator/RoadTargetType.cs:3`.

## Target Resolution

Road target parsing happens in the selected zone context.

| Target type | Args | Resolution |
| --- | --- | --- |
| `Crossroads` | none | Uses the zone crossroads tile. |
| `MainObject` | `["0"]` | Parses a zone-local main-object index. |
| `Connection` | `["Connection-Name"]` | Finds the first connection with that name, rejects `Proximity`, and requires the connection to touch this zone. |
| `MandatoryContent` | `["entry_name"]` | Parses a mandatory-content entry name after the zone samples one root mandatory-content preset alternative. |

Sources: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:487`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:512`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:7`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:43`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:72`.

Important consequence: `MandatoryContent` road targets reference mandatory-content entry names, not root preset names. If a zone has multiple `mandatoryContent` preset alternatives, a road target is safest only when the target entry exists in every alternative.

## Generation Phases

Road generation runs after gates/partitions/walkable paths and before final obstacle filling.

The high-level generation order is:

- `Roads.AllocateRoadsData`
- `Roads.MapMainRoads`
- content task creation
- encounter placement
- `Roads.MapEncounterRoads`
- obstacle, lake, river, ambient pickup passes

Sources: `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:11781`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:11782`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:11788`.

Road target positions differ by phase:

- Main roads can use crossroads, main objects, and valid gate connections.
- Portal roads can map a connection without a gate to the generated portal encounter.
- Encounter roads can use placed mandatory-content encounters and connection portal encounters.

Sources: `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17628`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17647`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17666`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17741`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17769`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17797`.

`MakeRoad` skips drawing when both endpoints are already placed, tries every primary/fallback endpoint pair, and writes the strongest road surface along the first successful path. `Stone` has a higher road-map byte value than `Dirt`, so it wins when paths overlap. Sources: `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:17708`, `GameEngineMapGenerator/MapGenerator/important for ai for olde nera:10861`.

## Official Template Usage

Scan scope: 56 official templates in `external/map_templates`.

Observed roads:

- zones with roads: 759
- total roads: 2173
- road types: `Stone` 1901, missing `type` 192, `Dirt` 80

Target endpoints:

| Endpoint type | As `from` | As `to` |
| --- | ---: | ---: |
| `MainObject` | 1614 | 216 |
| `Crossroads` | 329 | 206 |
| `Connection` | 218 | 1670 |
| `MandatoryContent` | 12 | 81 |

Common target pairs:

| Pair | Count |
| --- | ---: |
| `MainObject -> Connection` | 1240 |
| `Crossroads -> Connection` | 294 |
| `MainObject -> MainObject` | 208 |
| `Connection -> Connection` | 130 |
| `MainObject -> Crossroads` | 128 |
| `Connection -> Crossroads` | 78 |
| `MainObject -> MandatoryContent` | 38 |
| `Crossroads -> MandatoryContent` | 31 |

Typical patterns:

- Spawn/city zones often road from `MainObject 0` to one or more connection gates.
- Hub zones often road from `Crossroads` to connection gates.
- Treasure/special zones may road between main objects or to mandatory-content entries.
- Placement rules of type `Road` use the generated road map as an attraction/avoidance reference for mandatory content.

Examples: `external/map_templates/All Around.rmg.json:76`, `external/map_templates/Hallway.rmg.json:104`, `external/map_templates/Wastelands.rmg.json:330`, `external/map_templates/Yin Yang.rmg.json:107`.

## Editor Rules

For new edits, the core should enforce:

- `from` and `to` targets are present.
- `type`, when present, is `Dirt` or `Stone`.
- `MainObject` target `args[0]` is a valid zone-local main-object index.
- `Connection` target `args[0]` names a connection, the first matching connection is not `Proximity`, and that connection touches the road's zone.
- Duplicate connection names warn because the generator resolves the first match.
- `MandatoryContent` target `args[0]` names a content entry from the zone's selected mandatory-content preset alternatives.
- `Crossroads` ignores args.

Current implementation:

- `updateZoneSettings` can replace all roads, clear all roads, or generate road stubs.
- `addZoneRoad` adds one validated road.
- `updateZoneRoad` updates one road's `type`, `from`, and `to`.
- `removeZoneRoad` removes one road by index.
- `validateSemanticPlayability` checks road references as an optional playability pass.

Official templates include some broken road references. Keep official-data scans permissive, but keep editor mutations strict so newly authored roads are generator-safe.
