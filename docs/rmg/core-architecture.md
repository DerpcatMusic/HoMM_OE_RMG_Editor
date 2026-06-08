# Core Architecture

The editor core starts as a headless TypeScript library under `src/core`. It has no React, Tauri, DOM, or UI state dependencies.

## Status

- `done`: the headless core, resolver, validator, graph adapter, editor model, editor schema registry, editor action layer, mutation layer, bulk mutation runner, and transaction history exist.
- `partial`: the core still reflects the current source/data snapshot rather than a complete authored-game spec.
- `missing`: UI, command orchestration, and richer preview/simulation tools.

## Current Modules

- `src/core/paths`: stable game-data path configuration.
- `src/core/json`: BOM-safe JSON reading and file discovery.
- `src/core/rmg`: C#-aligned RMG template/content/schema types, enum constants, and win-condition presets.
- `src/core/game-data`: indexes Core definitions by name, reads either extracted Core or Core.zip, generates picker catalogs, and summarizes content pools for browsing.
- `src/core/indexers`: loads installed `.rmg.json` templates.
- `src/core/resolver`: resolves template-local and Core references.
- `src/core/validation`: reports structural and resolver diagnostics.
- `src/core/validation/semanticValidation.ts`: reports playability and authoring-safety diagnostics.
- `src/core/graph`: converts resolved variants into UI-ready graph nodes and edges.
- `src/core/editor-model`: combines templates, resolver output, graphs, diagnostics, and selection helpers for UI consumption.
- `src/core/editor-schema`: source-backed field metadata for UI forms, pickers, edit levels, compatibility handling, and mutation routing.
- `src/core/editor-actions`: schema-driven and typed commands that route UI actions to safe mutations, picker options, and transaction history.
- `src/core/mutations`: immutable template edit operations with reference rewrites and changed-path output.
- `src/ui`: browser-facing tokenized shell built from reusable vanilla TypeScript components and Effect-backed browser I/O services.
- `src/cli/core-scan.ts`: smoke test over all live templates.
- `src/cli/game-data-refresh.ts`: generates compact `.cache/game-data` catalogs directly from `external/Core.zip`.
- `src/cli/graph-scan.ts`: smoke test over all graph-adapted variants.
- `src/cli/editor-scan.ts`: smoke test over the complete UI-ready read model.
- `src/cli/editor-schema-invariants.ts`: contract test for editor schema sections, fields, source evidence, enum values, mutation routing, and compatibility classifications.
- `src/cli/editor-action-invariants.ts`: contract test for field routing, entity actions, pickers, preserve-only rejection, and transaction push.
- `src/cli/mutation-scan.ts`: smoke test for safe in-memory edits over a live template.
- `npm run ui:build`: bundles the browser shell into `dist/ui`.

## Runtime Alignment

The resolver follows `TemplateContext` behavior:

- Template-local `zoneLayouts` override/add to Core zone layouts.
- Template-local `contentPools` override/add to Core content pools.
- Template-local `contentLists` override/add to Core content lists.
- Root `mandatoryContent` defines presets; zone `mandatoryContent` references preset alternatives.
- Root `contentCountLimits` defines presets; zone `contentCountLimits` references preset alternatives.
- Zone pool fields are sampled alternatives, not cumulative includes.
- Connections resolve `from`, `to`, and `guardZone` by zone name.

## Validation Policy

The core preserves unknown fields for round-trip safety, but validates against the inspected C# public model.

Important diagnostics currently detected from live data:

- `mainObject.factions.unknown`: JSON uses `factions`, but RMG C# uses singular `faction`.
- `schema.stringArray.invalid`: e.g. scalar `contentCountLimits` where C# expects `string[]`.
- `contentPool.includeList.unresolved`: extracted Core pool references a missing content list.

Semantic validation is intentionally separate from structural validation. It checks playability concerns such as player spawns, connected spawn zones, connection-target references, budgeted zones with missing pools, empty zones, city-hold anchors, and final-battle/gladiator anchors.

## Smoke Test

Run:

```bash
npm run core:scan
```

Current verified facts:

- 56 live templates.
- 66 variants.
- 902 zones across variants.
- 1,393 connections.
- 532 content pool definitions.
- 211 content list definitions.
- 872 RMG content SID definitions.
- 154 artifact definitions.
- 8 faction IDs, with 6 playable factions from `DB/data.json.availableFractions`.
- 7 biome mappings.
- 177 hero definitions.
- 131 magic definitions.
- 152 unit definitions.
- 399 unique template pool references.
- 0 unresolved template pool references.

The remaining errors are Core content-pool include-list diagnostics, not template pool-reference failures.

## Graph Layer

`src/core/graph` is the next adapter layer. It converts `ResolvedVariant` into `RmgGraph`:

- one node per zone
- one edge per resolved connection
- stable IDs for layout persistence
- connection behavior flags for direct/portal/proximity/gladiator styling
- inferred zone roles for visual grouping

Run:

```bash
npm run graph:scan
```

## Editor Model Layer

`src/core/editor-model` builds `RmgEditorModel`, a facade intended for the future app shell:

- compact `templateCards` for template lists
- full `templateModels` for inspectors
- one `VariantModel` per resolved variant
- each variant carries an `RmgGraph`
- global and local diagnostics are included
- selectors resolve `{ templateId, variantIndex, nodeId, edgeId }`

Run:

```bash
npm run editor:scan
```

## Editor Schema Layer

`src/core/editor-schema` is the form/schema contract for future UI inspectors. It exposes:

- section metadata for template settings, game rules, win conditions, zones, connections, roads, content pools, mandatory content, and compatibility fields
- field metadata with JSON path, label, type, edit level, source status, source evidence, picker hints, validation hints, and mutation route
- explicit separation between first-class fields, advanced fields, compatibility fields, and preserve-only source-mismatch fields

Run:

```bash
npm run test:editor-schema
```

Current verified facts:

- 121 schema fields.
- 9 editor sections.
- 81 first-class fields.
- important sampled fields are marked as sampled alternatives.
- `connection.road`, `connection.simTurnSquad`, and `connection.guardRandomization` are compatibility fields.
- `gameRules.uniqueMagicCostModifiers` is preserve-only/source-mismatched.

## Editor Action Layer

`src/core/editor-actions` is the command bridge the future UI should call first. It exposes:

- `applyEditorAction` for field and entity actions
- `applyFieldUpdate` for direct schema field edits
- `applyEntityAction` for typed CRUD/entity commands
- `resolveEditorPicker` for enum, template-reference, and game-data catalog choices
- optional transaction-history push on successful non-empty actions

Run:

```bash
npm run test:editor-actions
```

Current verified facts:

- field update `zone.name` rewrites dependent references through `renameZone`.
- field update `connection.connectionType` applies portal defaults through `updateConnectionType`.
- field update `zone.guardedContentPool` preserves sampled-alternative semantics.
- field update `mandatoryContent.entry.sid` edits an entry through the preset mutation.
- preserve-only fields such as `gameRules.uniqueMagicCostModifiers` are blocked.
- pickers resolve enum and variant-local options.

## UI Shell Layer

`src/ui` is the first browser-facing shell. It is intentionally thin:

- browser file picker/download workflow for `.rmg.json`
- browser Core.zip parsing through an Effect-backed `CoreDataSource`
- no React or app framework dependency yet
- no direct JSON mutation
- schema-driven section navigation and field metadata
- reusable tokenized components
- transaction-backed undo/redo controls
- persisted editor-only graph/internal layout

Run:

```bash
npm run ui:build
npm run ui:preview
```

The preview server serves `dist/ui` on port `4173`.

## Mutation Layer

`src/core/mutations` is the first write-oriented core layer. It does not write files. It clones `RmgTemplate`, performs narrow edits, returns diagnostics, and lists exact changed paths for future undo/history UI.

Currently implemented:

- `createDefaultTemplate`
- `createMinimalPlayableTemplate`
- `stringifyRmgTemplate`
- `writeRmgTemplateFile`
- `createDefaultZone`
- `addZone`
- `removeZone`
- `addZoneRoad`
- `updateZoneRoad`
- `removeZoneRoad`
- `createDefaultConnection`
- `addConnection`
- `removeConnection`
- `renameZone`
- `renameConnection`
- `updateConnectionEndpoints`
- `updateConnectionType`
- `updateConnectionSettings`
- `setZoneContentPools`
- `setZoneContentBudgets`
- `setZoneMandatoryContentPresets`
- `setZoneContentCountLimitPresets`
- `updateZoneSettings`
- `addMainObject`
- `createDefaultMainObject`
- `updateMainObject`
- `removeMainObject`
- `updateTemplateSettings`
- `renameMandatoryContentPreset`
- `renameContentCountLimitPreset`
- `renameLocalContentPool`

Run:

```bash
npm run mutation:scan
```

See `mutations.md` for reference rewrite coverage.

## Generated Game-Data Cache

`npm run game-data:refresh` reads `external/Core.zip` directly and writes UI picker catalogs into `.cache/game-data` without extracting the archive.

Generated files:

- `manifest.json`: source path, size, mtime, hash, and per-catalog entry counts.
- `artifacts.json`: placeable artifact map objects joined with item metadata, slots, rarity, values, and bans.
- `rmg-content.json`: broad RMG-placeable SID browser built from map objects, object logic, generator meta objects, and official pool/list references.
- `content-pools.json`: content pool summaries with group counts, include-list counts, direct content samples, bans, and value-distribution flags.
- `content-lists.json`: content list summaries with content counts, positive weights, biome-filtered entries, and samples.
- `factions.json`: all faction IDs, playable flag, localized faction metadata, biome/resource metadata, standard hero count, total hero count, and campaign hero count.
- `biomes.json`: biome-to-faction and biome-to-water-object mappings.
- `heroes.json`: hero IDs, faction, native biome, class, start roster size, cost/start level, campaign flag, and global ban flag.
- `magics.json`: magic IDs, localized names, school, rank, map/battle classification, and global ban flag.
- `units.json`: unit IDs, faction, tier, squad value, upgrade link, tags, and global ban flag.
