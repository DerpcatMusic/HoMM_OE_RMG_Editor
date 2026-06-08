# Reference Integrity

## Code Fact

Reference-bearing fields in RMG include:

- zone names
- connection names
- mandatory content names
- content list ids
- content pool ids
- count-limit preset ids
- mandatory preset ids
- main-object indices encoded as strings
- zone-layout ids
- biome ids and faction ids in rule arguments
- artifact/object/content SIDs in content weights, mandatory content, limits, value overrides, and global bans

References are resolved in different scopes:

- variant-local: zone names, connection names, main-object indices
- zone-local: mandatory-content entry names after a zone samples one mandatory-content preset
- template-local: mandatory-content preset names and content-count-limit preset names
- template-local with global fallback: content-pool names, content-list names, zone-layout names
- Core/game-data global: content SIDs, artifact SIDs, factions, biomes, heroes, magics, units

## Observed In Shipped Templates

- name-based refs are pervasive
- duplicate edges are legal
- unnamed connections exist in shipped templates
- some official JSON carries ignored/legacy fields such as `factions: []` on main objects where the inspected C# model has singular `faction`
- official JSON may use scalar strings for fields modeled as arrays; tooling should normalize on mutation while preserving safe read compatibility

## Break Example

Valid:

```json
{ "name": "Spawn-A-Treasure-1", "from": "Spawn-A", "to": "Treasure" }
```

Broken:

```json
{ "name": "Spawn-A-Treasure-1", "from": "Spawn-X", "to": "Treasure" }
```

Expected consequence:

- engine logs a config error for broken zone ref
- editor should block save or mark template invalid

## Editor Response

- every rename must have find-and-rewrite support
- every delete must show inbound references before applying
- index-based references need reorder guards because moving a main object can change faction, biome, placement, and road semantics
- connection names are not stable unique identities; use variant index plus connection index internally
- validate every alternative reference in sampled arrays, not only the currently selected preview alternative
