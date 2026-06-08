# RMG Source Notes

Focused documentation for building an RMG map editor from this repository.

## Capability Matrix

Legend:

- `done` means the core already supports the write path and we have scanned it against game data.
- `partial` means the core can represent or mutate it, but the editor experience or deep validation is not complete.
- `missing` means there is no safe editor write path yet.

| Subsystem | Status | What works now | What is still missing |
| --- | --- | --- | --- |
| Template creation | done | Create a new RMG template with default rules and a first variant. | Presets for common starting layouts. |
| Zones | done | Add, remove, rename, clone, and edit zones; set budgets, pools, and zone settings. | Higher-level zone presets and visual workflows. |
| Connections | done | Add, remove, rename, retarget, and deeply edit connections; preserve observed official compatibility fields. | Convenience presets for common connection patterns. |
| Roads | done | Add, update, and remove zone roads; validate road targets against the generator rules. | A visual road workflow and batch road editing. |
| Players / spawns | partial | Assign players through `Spawn` main objects and bulk-edit matching zones/main objects. | A richer player-planning UI and faction/hero planning tools. |
| Game mode / win conditions | done | Edit game mode, hero-count settings, and win conditions. | A dedicated win-condition authoring UI and templates for named conditions. |
| Content-pool assignment | done | Assign a zone to Core pools or template-local pools. | None on the assignment side. |
| Content-pool CRUD | done | Add, remove, update, rename template-local pools, clone Core pools locally, and list available Core/template pools. | Rich preview simulation. |
| Content-pool groups | done | Add, update, move, and remove individual pool groups; edit group weights, include-lists, and direct content. | Roll-probability preview. |
| Content-pool bans | done | Add, update, move, and remove individual pool bans. | Object browser and impact preview. |
| Value distributions | done | Set or clear pool `valueDistribution` with shape validation. | Balance visualization. |
| Content lists | done | Add, remove, update, and rename template-local content lists. | Candidate preview and object database browsing UI. |
| Generated game-data catalogs | done | Refresh Core.zip-derived catalogs for artifacts, RMG content, pools, lists, factions, biomes, heroes, magics, and units without extracting Core.zip. | UI cache invalidation and picker screens. |
| Editor schema registry | done | Exposes 121 source-backed field metadata entries across 9 UI sections, including picker hints, validation hints, mutation routes, edit levels, sampled alternatives, and compatibility classifications. | Generated schema extraction from C# source and UI field widgets. |
| Editor action layer | done | Routes schema field updates and typed entity commands to safe mutations, picker options, and undo/redo transaction history. | UI command builders, preview/dry-run panels, and grouped multi-command transactions. |
| Artifact browser | done | Index placeable artifact map objects, join wearable item metadata, names, slots, rarity, item sets, values, and banned flags. | UI palette and generated-map playtest loop for balance. |
| Mandatory content | done | Add, remove, update, and rename mandatory-content presets. | Dedicated placement-rule editor and safer target pickers. |
| Content-count limits | done | Add, remove, update, and rename content-count-limit presets. | Dedicated constraint editor and conflict analysis. |
| Main objects | partial | Add/remove/edit main objects in zones and bulk-edit matching main objects. | Safer bulk reordering and object-index repair tools. |
| Validation | done | Structural and semantic validation for core RMG rules, roads, pools, and connection integrity. | More authoring-time fix suggestions. |
| Value overrides | done | Add, remove, and update root value overrides. | Balance preview showing economic impact. |
| Global bans | done | Set or clear global bans for magics, items, skills, heroes, and units. | Object browser and impact preview. |
| Bulk mutations | done | Apply zone, connection, or main-object edits across predicate-matched objects. | UI command builder and dry-run preview. |
| Undo / redo | done | Transaction history supports push, undo, redo, current-template lookup, and clear. | Multi-command grouping semantics in the UI layer. |
| UI shell | partial | Tokenized responsive browser shell with reusable vanilla TypeScript components, schema-driven section navigation, workspace placeholder, and inspector. | Real template loading, graph editor, controls wired to editor actions, game-data pickers, and file workflow. |

## Current Capability

The core can already author a complete basic RMG template from scratch:

- create a new template object with default game rules and a first variant
- add, remove, and rename zones
- add, remove, rename, and deeply edit connections
- assign players via `Spawn` main objects
- set game mode, hero-count settings, and win conditions
- assign zone content pools from Core pools or template-local pools
- set zone random-content budgets
- create, edit, and remove zone roads
- create, edit, and remove template-local pools, lists, zone layouts, mandatory-content presets, count-limit presets, value overrides, and global bans
- browse direct placeable artifacts by real name, slot, rarity, item set, and value
- refresh generated picker catalogs directly from `external/Core.zip`
- render future forms from a source-backed editor schema registry instead of hard-coded field lists
- run UI edits through a schema/action command layer instead of directly calling low-level mutations
- build and preview a tokenized browser shell under `src/ui`
- distinguish the 6 playable factions in `DB/data.json.availableFractions` from the full 8 faction IDs including `neutral` and `mix`
- run bulk mutations and maintain undo/redo transaction history
- preserve and round-trip observed official connection compatibility fields

The core also includes semantic/playability validation for:

- player spawn connectivity
- connection reference integrity
- zone budget/pool consistency
- final-battle and city-hold anchors
- road references and road target resolution

## What Is Still Missing

The main remaining gaps are no longer basic JSON mutation coverage. They are editor experience, verification depth, and game-specific preview tooling:

- preview resolved content candidates, roll weights, bans, and value distributions
- add focused tests for rename/delete reference rewrites beyond the smoke scan
- reorder or bulk-rewrite index-sensitive references like main objects and roads
- add UI-level multi-command grouping for undo/redo
- build the UI layer on top of the core model

## Core Files

- `schema-source-references.md`: C# model, parser, and validation reference map.
- `game-data-locations.md`: local symlinks and extracted installed game data paths.
- `live-template-inventory.md`: generated inventory of all 56 installed RMG templates.
- `template-inventory.md`: shipped template inventory and observed template quirks.
- `map-editor-source.md`: notes from the newly available fixed-map editor source.
- `core-architecture.md`: current headless TypeScript core layout and contracts. Status: `done`.
- `semantic-validation.md`: playability checks layered on top of structural validation. Status: `done`.
- `graph-model.md`: graph adapter contract for future React Flow UI. Status: `done`.
- `editor-model.md`: UI-ready facade over templates, resolved variants, graphs, and diagnostics. Status: `done`.
- `editor-schema.md`: UI field metadata, edit levels, source status, picker hints, and compatibility handling. Status: `done`.
- `editor-actions.md`: schema-driven command routing, entity actions, picker resolution, and transaction integration. Status: `done`.
- `ui-shell.md`: tokenized browser shell, responsive layout, reusable components, and build/preview commands. Status: `partial`.
- `mutations.md`: safe immutable template edits for zone/connection/pool operations. Status: `done`.
- `zones.md`: zone schema, roles, budgets, main objects, roads, and editor implications. Status: `done`.
- `connections.md`: graph links, gates, portals, guards, and connection validation. Status: `done`.
- `roads.md`: zone road schema, target resolution, generation phases, official usage, and road mutations. Status: `done`.
- `content-pools.md`: weighted content pools, lists, bans, value distributions, and external dependencies. Status: `partial`.
- `artifact-browser.md`: direct artifact catalog, item metadata joins, localization, and RMG authoring rules. Status: `done`.
- `mandatory-content.md`: mandatory content presets, entries, placement rules, and ownership. Status: `done`.
- `players-factions-heroes.md`: players, spawns, owners, active factions/fractions, biome matching, and heroes. Status: `partial`.
- `win-conditions.md`: official win-condition names, display SIDs, and engine-backed rule fields. Status: `done`.
- `rules-and-references.md`: faction/biome/placement/road rules and reference syntax. Status: `partial`.
- `zone-layouts-terrain.md`: terrain, zone layout configs, elevation, obstacles, lakes, roads, and ambient pickups. Status: `partial`.
- `treasure-economy.md`: value budgets, treasure zones, resource pools, guards, content count limits, and win/treasure roles. Status: `partial`.
- `validation-and-gaps.md`: broken fields, unresolved assets, ignored JSON, and editor validation checklist. Status: `partial`.

## Broader Seed KB

`../rmg-kb/` contains a larger imported knowledge base from a related workspace. Treat it as useful prior research, not automatically authoritative for this checkout.

## Verification Standard

Every durable claim should point at one of:

- `GameEngineMapGenerator/MapGenerator/*.cs`
- `external/map_templates/*.rmg.json`
- `extracted/Core/DB/data.json`
- `extracted/Core/DB/biomes_info.json`
- `extracted/Core/DB/heroes/*/*.json`
