# RMG Connections

Connections are template edges between two zones. They influence zone graph layout, optional physical gates, portal encounters/buildings, main guards, gladiator arena placement, and name-based references from roads/placement rules.

## Status

- `done`: connection create/remove/rename, endpoint changes, type changes, and deep settings edits.
- `partial`: convenience presets for common connection patterns.
- `missing`: visual connection authoring, batch rewrites, and safer connection repair workflows.

## Source Model

`RandomMapTemplate.Connection` serializes these fields:

| Field | Default | Meaning |
| --- | --- | --- |
| `name` | none | Stable label used by roads and placement rules. |
| `from`, `to` | none | Endpoint zone names. |
| `connectionType` | `Default` | One of `Default`, `Direct`, `GladiatorArena`, `Portal`, `Proximity`. |
| `length` | `0` in C#, optional in editor model | Extra graph distance for adjacency-required connections. |
| `portalFromEnabled`, `portalToEnabled` | `true` | Active flags copied to linked portal props. |
| `guardZone` | none | Preferred endpoint zone for gate/guard side. Non-endpoint values are discarded. |
| `guardValue` | `0` | Signed integer guard strength for direct guards and portal squads. Official templates include negative values. |
| `guardWeeklyIncrement` | `0` | Weekly guard growth for connection guards. |
| `guardReaction` | `Common` | Connection guard reaction enum string: `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, or `Docile`. |
| `guardEscape` | `true` | Whether connection guard squads can escape. |
| `guardMatchGroup` | none | Reuses one randomly selected guard squad across matching connections. |
| `gatePlacement` | `Random` | Gate selection bias: `Random`, `Center`, or `NearZone`. |
| `gatePlacementArgs` | none | Arguments for `gatePlacement`; `NearZone` expects a zone name. |
| `portalPlacementRulesFrom`, `portalPlacementRulesTo` | none | Placement rules for the generated portal encounter at each endpoint. |

References: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:93`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:96`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:98`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:100`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:102`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:106`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:110`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:116`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:118`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:120`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:122`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:124`, `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:126`.

If `connectionType` is omitted from JSON, Unity deserialization keeps the C# field initializer, so the template connection is `Default`. Reference: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:102`.

The parsed runtime copy stores zone indices, parsed enum values, guard settings, gate placement, and parsed portal placement rules. References: `GameEngineMapGenerator/MapGenerator/MapDescription.cs:71`, `GameEngineMapGenerator/MapGenerator/MapDescription.cs:75`, `GameEngineMapGenerator/MapGenerator/MapDescription.cs:79`, `GameEngineMapGenerator/MapGenerator/MapDescription.cs:87`, `GameEngineMapGenerator/MapGenerator/MapDescription.cs:97`, `GameEngineMapGenerator/MapGenerator/MapDescription.cs:99`, `GameEngineMapGenerator/MapGenerator/MapDescription.cs:103`.

## Observed Official Compatibility Fields

Official templates include connection fields that are not declared on `RandomMapTemplate.Connection` in the inspected C# source. The editor preserves and exposes them for round-trip compatibility, but should label them as observed/compatibility fields until runtime usage is found.

| Field | Official count | Status |
| --- | ---: | --- |
| `road` | 917 | Observed on connections, but real road authoring is zone-level `roads[]`. |
| `simTurnSquad` | 430 | Observed on connections; no inspected `MapGenerator` field or usage. |
| `guardRandomization` | 166 | Observed on connections; C# declares this field on zones and main objects, not connections. |

Scan scope: 56 official templates, 66 variants, 902 zones, and 1393 connections under `external/map_templates`.

## Connection Types

| Type | Ground gate? | Zone adjacency? | Runtime effect |
| --- | --- | --- | --- |
| `Default` | May have one | Not required | Opportunistic: becomes effective `Direct` if a gate is placed, otherwise effective `Portal`. |
| `Direct` | Required by intent | Required | Draws a ground connection; if no gate is valid, layout downgrades it to effective `Portal`. |
| `Portal` | No | No | Creates portal encounters/buildings at both endpoints and links them. |
| `Proximity` | No | Required | Pulls zones together without a gate or portal; excluded from area neighbors and connection targets. |
| `GladiatorArena` | Required | Required | Requires a non-ramp gate and places the gladiator arena at the gate guard position. |

Valid enum values are defined in `ConnectionType.cs`. References: `GameEngineMapGenerator/MapGenerator/ConnectionType.cs:3`, `GameEngineMapGenerator/MapGenerator/ConnectionType.cs:5`, `GameEngineMapGenerator/MapGenerator/ConnectionType.cs:6`, `GameEngineMapGenerator/MapGenerator/ConnectionType.cs:7`, `GameEngineMapGenerator/MapGenerator/ConnectionType.cs:8`, `GameEngineMapGenerator/MapGenerator/ConnectionType.cs:9`.

The extension methods are the concise behavior contract:

| Helper | Returns true for |
| --- | --- |
| `NeedsGroundConnection()` | `Direct`, `GladiatorArena` |
| `CanHaveGroundConnection()` | `Default`, `Direct`, `GladiatorArena` |
| `NeedsAdjacency()` | `Direct`, `GladiatorArena`, `Proximity` |

References: `GameEngineMapGenerator/MapGenerator/Utils.cs:189`, `GameEngineMapGenerator/MapGenerator/Utils.cs:198`, `GameEngineMapGenerator/MapGenerator/Utils.cs:207`.

## Generation Lifecycle

`ZoneMapper` uses `NeedsGroundConnection()` connections as drawn zone links and uses `NeedsAdjacency()` connections to set adjacency constraints and apply `length`. `Default` and `Portal` do not force adjacency; `Proximity` forces adjacency but is not drawn as a ground link. References: `GameEngineMapGenerator/MapGenerator/ZoneMapper.cs:33`, `GameEngineMapGenerator/MapGenerator/ZoneMapper.cs:39`, `GameEngineMapGenerator/MapGenerator/ZoneMapper.cs:43`, `GameEngineMapGenerator/MapGenerator/ZoneMapper.cs:46`.

`Gates.PlaceGates` only considers connections where `CanHaveGroundConnection()` is true. That means `Default`, `Direct`, and `GladiatorArena` can receive gates; serialized `Portal` and `Proximity` cannot. References: `GameEngineMapGenerator/MapGenerator/Gates.cs:191`, `GameEngineMapGenerator/MapGenerator/Gates.cs:194`.

`Layout.CreateZonesAndConnections` converts template connection types into effective runtime types. `Proximity` stays `Proximity`; a `Direct` without a valid gate becomes `Portal`; `Default` becomes `Direct` if the gate is valid and `Portal` otherwise. References: `GameEngineMapGenerator/MapGenerator/Layout.cs:134`, `GameEngineMapGenerator/MapGenerator/Layout.cs:141`, `GameEngineMapGenerator/MapGenerator/Layout.cs:148`, `GameEngineMapGenerator/MapGenerator/Layout.cs:152`, `GameEngineMapGenerator/MapGenerator/Layout.cs:156`.

`ContentPlacer.SetAreas` excludes `Proximity` when writing area neighbors. References: `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:576`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:579`.

## Gates And `gatePlacement`

`gatePlacement` is parsed as `GatePlacement.Random`, `GatePlacement.Center`, or `GatePlacement.NearZone`. References: `GameEngineMapGenerator/MapGenerator/GatePlacement.cs:3`, `GameEngineMapGenerator/MapGenerator/GatePlacement.cs:5`, `GameEngineMapGenerator/MapGenerator/GatePlacement.cs:6`, `GameEngineMapGenerator/MapGenerator/GatePlacement.cs:7`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:145`.

Multiple eligible connections between the same zone pair are shuffled and then sorted by placement priority: `Center` first, `NearZone` second, `Random` last. References: `GameEngineMapGenerator/MapGenerator/Gates.cs:548`, `GameEngineMapGenerator/MapGenerator/Gates.cs:552`, `GameEngineMapGenerator/MapGenerator/Gates.cs:557`, `GameEngineMapGenerator/MapGenerator/Gates.cs:639`.

`Center` uses the border centroid. `NearZone` resolves `gatePlacementArgs[0]` as a zone name and uses that zone's graph position as the reference point. Missing or unknown zone names log config errors and fall back to no reference point. References: `GameEngineMapGenerator/MapGenerator/Gates.cs:621`, `GameEngineMapGenerator/MapGenerator/Gates.cs:625`, `GameEngineMapGenerator/MapGenerator/Gates.cs:627`, `GameEngineMapGenerator/MapGenerator/Gates.cs:917`, `GameEngineMapGenerator/MapGenerator/Gates.cs:924`, `GameEngineMapGenerator/MapGenerator/Gates.cs:925`.

`guardZone` is resolved only if it names one of the two endpoint zones; otherwise it becomes `-1`. Gate selection filters candidates by this preferred guard zone when it is set. References: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:385`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:386`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:388`, `GameEngineMapGenerator/MapGenerator/Gates.cs:651`, `GameEngineMapGenerator/MapGenerator/Gates.cs:662`.

`GladiatorArena` requires a valid non-ramp gate. If no arena gate can be selected, generation throws `Failed to place gladiator arena.` References: `GameEngineMapGenerator/MapGenerator/Gates.cs:584`, `GameEngineMapGenerator/MapGenerator/Gates.cs:585`, `GameEngineMapGenerator/MapGenerator/Gates.cs:587`, `GameEngineMapGenerator/MapGenerator/Gates.cs:589`.

## Portals

Portal encounters are placed for any non-`Proximity` connection touching the current zone when that connection has no valid gate. This includes serialized `Portal`, gate-less `Default`, and gate-less `Direct`. References: `GameEngineMapGenerator/MapGenerator/Encounters.cs:108`, `GameEngineMapGenerator/MapGenerator/Encounters.cs:121`, `GameEngineMapGenerator/MapGenerator/Encounters.cs:124`, `GameEngineMapGenerator/MapGenerator/Encounters.cs:127`.

Linked portal buildings are placed later for effective runtime `ConnectionType.Portal`, not solely for serialized `connectionType: "Portal"`. `Layout` can make `Default` or failed `Direct` effective portals. `portalFromEnabled` and `portalToEnabled` are copied to `PropPortals.isActive`, and both portal endpoints also receive the connection squad. References: `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:696`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:701`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:724`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:727`, `GameEngineMapGenerator/MapGenerator/MapObjectsRegistry.cs:240`, `GameEngineMapGenerator/MapGenerator/MapObjectsRegistry.cs:243`, `GameEngineMapGenerator/MapGenerator/MapObjectsRegistry.cs:246`, `GameEngineMapGenerator/MapGenerator/MapObjectsRegistry.cs:250`.

`portalPlacementRulesFrom` are parsed in the `from` zone; `portalPlacementRulesTo` are parsed in the `to` zone. References: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:463`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:470`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:475`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:479`.

## Guards

Effective `Direct` connections place a main guard squad at the gate's `guardPosition`. Effective `GladiatorArena` connections place a gladiator arena object at that same position instead of a normal direct guard. Effective `Portal` connections attach random squad props to both portal buildings. `Proximity` has no gate, no portal encounter, and no direct guard placement, so guard fields on `Proximity` should not be used for gameplay-critical protection.

References: `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1190`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1192`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1194`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1199`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1204`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1206`, `GameEngineMapGenerator/MapGenerator/MapObjectsRegistry.cs:250`.

`guardValue`, `guardWeeklyIncrement`, `guardReaction`, and `guardEscape` are copied from the template into `MapDescription.Connection`. References: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:380`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:381`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:382`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:383`.

`guardMatchGroup` makes multiple connections share one selected main guard squad. The first connection in the group selects a matching guard by `guardValue`; later connections reuse it and log config errors if value, weekly increment, reaction, or escape differ. References: `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1212`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1215`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1218`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1220`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1224`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1228`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1232`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1239`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1252`, `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs:1253`.

## Reference And Validation Rules

`MapDescriptionBuilder.Parse` logs config errors for invalid `connectionType`, invalid `guardReaction`, missing endpoint zones, and invalid `gatePlacement`. It resolves `from` and `to` by name against the selected variant's zones. References: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:124`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:127`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:131`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:135`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:137`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:141`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:145`.

Placement rules and road targets of type `Connection` are name-based. They reject missing names, unknown connection names, `Proximity` connections, and connections that do not touch the current zone. References: `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:50`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:54`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:60`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:66`, `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:71`, `GameEngineMapGenerator/MapGenerator/PlacementRuleHandler.cs:246`, `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:532`.

`MainObjectPlacement.Connection` is stricter than generic `Connection` placement rules: it requires `NeedsGroundConnection()`, requires the connection to touch the zone, and requires a valid gate. Therefore `Default`, serialized `Portal`, and `Proximity` are rejected for this placement mode; `Direct` can still fail if it falls back to a portal. References: `GameEngineMapGenerator/MapGenerator/ZonePartition.cs:546`, `GameEngineMapGenerator/MapGenerator/ZonePartition.cs:562`, `GameEngineMapGenerator/MapGenerator/ZonePartition.cs:567`, `GameEngineMapGenerator/MapGenerator/ZonePartition.cs:573`, `GameEngineMapGenerator/MapGenerator/ZonePartition.cs:576`.

Derived editor models in this workspace also propose additional checks, such as warning on portals with both endpoints disabled and warning on `Proximity` connections with guard fields. Treat those as editor UX rules, not proven engine requirements, unless they are backed by the C# files above. The engine-backed enum sets are `ConnectionType`, `GatePlacement`, and runtime `ESquadReactionType`.

Runtime guard reaction values are `Aggressive`, `Negative`, `Common`, `Friendly`, `Peaceful`, and `Docile`. `NUM` exists as the runtime enum sentinel and should not be offered as an editor value. Source: `/mnt/Gaming/SteamLibrary/steamapps/common/Heroes of Might and Magic Olden Era/AssetRipper_export_20260505_154541/Scripts/Hex/Hex/Configs/ESquadReactionType.cs:6`.

## Official Template Scan

Connection type counts in `external/map_templates`:

| Type | Count |
| --- | ---: |
| `Direct` | 728 |
| `Default` | 382 |
| `Portal` | 170 |
| `Proximity` | 111 |
| `GladiatorArena` | 2 |

Frequently observed fields:

| Field | Count |
| --- | ---: |
| `guardValue` | 1284 |
| `name` | 1255 |
| `guardWeeklyIncrement` | 1251 |
| `road` | 917 |
| `guardEscape` | 604 |
| `simTurnSquad` | 430 |
| `guardZone` | 200 |
| `gatePlacement` | 190 |
| `guardRandomization` | 166 |
| `length` | 111 |
| `guardMatchGroup` | 40 |
| `portalPlacementRulesTo` | 34 |
| `portalPlacementRulesFrom` | 30 |

No official template in this scan contains `guardReaction`, `portalFromEnabled`, `portalToEnabled`, or `gatePlacementArgs`. All shipped `gatePlacement` values are `Center`.

Important data quirks:

- `name` is optional in official data; 138 connections are unnamed.
- Duplicate connection names exist in official data; name-based references resolve to the first match, so editor internals must use variant index plus connection index as stable identity.
- `guardZone` usage is messy. The generator keeps it only when it names one endpoint zone; official templates often point it at missing or non-endpoint zone names, which the generator discards.

## Shipped Examples

| Feature | Example |
| --- | --- |
| Direct guard/gate fields plus observed `guardRandomization` | `external/map_templates/All Around.rmg.json:1075`. |
| Portal placement rules plus observed connection-level `road` | `external/map_templates/Blitz.rmg.json:862`. |
| `guardMatchGroup` | `external/map_templates/Jebus Cross Classic.rmg.json:487`. |
| `Proximity` with `length` | `external/map_templates/Yin Yang.rmg.json:729`. |
| `GladiatorArena` connection | `external/map_templates/Symmetry.rmg.json:379`. |
| `GladiatorArena` win connection | `external/map_templates/Helltide.rmg.json:569`. |
| Portal `MainObject` placement rule with extra tolerated arg | `external/map_templates/Sand Clover.rmg.json:645`. |

No official `external/map_templates/*.rmg.json` example found during this pass uses `gatePlacement: "NearZone"` or `gatePlacementArgs`; these are code-supported but not represented in the inspected shipped templates.

## Editor Editing Surface

A full connection editor should group fields by behavior:

- Identity: connection index, optional `name`, duplicate-name warning, unresolved reference impact.
- Endpoints: `from`, `to`, self-loop rejection, endpoint zone existence.
- Type/layout: `connectionType`, authored type vs effective runtime type, `length` for adjacency-needed types.
- Guard: `guardZone`, `guardValue`, `guardWeeklyIncrement`, `guardReaction`, `guardEscape`, `guardMatchGroup`.
- Gate: `gatePlacement`, `gatePlacementArgs`, `NearZone` target validation.
- Portal: `portalFromEnabled`, `portalToEnabled`, `portalPlacementRulesFrom`, `portalPlacementRulesTo`.
- Compatibility: observed-only `road`, `simTurnSquad`, and connection-level `guardRandomization`.

`portalPlacementRulesFrom` must be validated in the `from` zone context. `portalPlacementRulesTo` must be validated in the `to` zone context. If endpoints change, existing portal placement rules need revalidation because a rule targeting a connection must touch the new context zone.
