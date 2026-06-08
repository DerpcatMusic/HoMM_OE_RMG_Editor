# Olden Era RMG Editor

Browser-first editor core and shell for Heroes of Might and Magic: Olden Era `.rmg.json` random-map templates.

## What Works Now

- Headless TypeScript core for RMG schema types, resolver, graph model, semantic validation, editor schema, editor actions, immutable mutations, bulk mutations, and transaction history.
- Template creation from scratch through `createMinimalPlayableTemplate`.
- Zone CRUD through safe editor actions: add, remove with cleanup, rename with reference rewrites, resize, clone, and pool-field edits.
- Connection CRUD and deep settings mutations: add, remove, rename, endpoint edits, type changes, portal defaults, guard fields, gate placement, road flag, sim squad flag, and guard randomization.
- Template-level game settings and win-condition editing through `template.update`.
- Main-object and road basics: add a default city main object and a default stone road to the first incident non-proximity connection.
- Root content structures in core mutations: local content pools, content pool groups, bans, value distributions, content lists, mandatory content presets, content count limit presets, global bans, value overrides, and zone layouts.
- Core.zip generated catalogs from game data: content pools, content lists, factions, biomes, heroes, magics, units, RMG-placeable content, and artifacts.
- AssetRipper Texture2D visual catalog generation for source-backed image candidates, with confidence scoring and documented limits for portraits.
- Browser UI shell with top bar, left rail, canvas workspace, selected-zone workspace, zone-internal workspace, and right inspector.
- Left rail is split into top game-data/global settings editing and bottom zone navigation so template-level controls do not compete with zone rows.
- Resizable left sidebar and right inspector panel with persisted panel widths.
- Browser load/new/save for `.rmg.json`.
- Browser Core.zip parsing via Effect-backed ZIP/CoreDataSource services. The header reports parsed pool and RMG-content counts, and the app remembers the last selected Core.zip metadata so it can ask to load it again after reload.
- Canvas zone dragging with persisted editor-only layout and live SVG connection redraw.
- `Ctrl` + drag from a zone to another zone creates a default direct connection.
- Selectable canvas connection lines and a connection inspector tab for deep connection settings.
- Zone edit workspace shows main objects, connection anchors, authored `zone.roads[]`, draggable internal object layout, SVG road splines connected to object centers with road-type labels, and a compact object/road summary.
- Inspector `Objects` tab edits main-object type, spawn, owner, key/city-hold flags, placement mode/args, faction rule args, guard fields, weekly unit increment, and city building SIDs.
- Road inspector edits authored road type and structured `from`/`to` targets using selected-zone context.
- Expanded zone settings editor for layout, biome rules, guard tuning, content budgets, pool alternatives, mandatory-content alternatives, and count-limit alternatives.
- Searchable content-pool selectors for zone guarded, unguarded, and resource pool alternatives, filtered by Core.zip pool naming/source conventions.
- Right-side tool dock with vertical Inspector/Browser tabs. Inspector owns selected entity editing; Browser owns searchable Core.zip lookup/copy/drag rows.
- Browser panel inspired by the older Python/TS editor layout: scope filter, category filter, dense capped result list, click-to-copy IDs, draggable content SIDs, and a details pane for the selected entry.
- Inspector content-pool tab for creating template-local pools, adding groups, and editing group weights/include-lists/content rows.
- Catalog-backed biome `FromList` controls in the zone editor after Core.zip is attached, with unknown existing args preserved.
- Source-backed biome rule builder for `FromList`, `MatchZone`, and `MatchMainObject`, including context-derived zone/main-object args and previews.
- Source-backed faction rule builder for main objects: `FromList` candidate/exclusion editing and `Match` main-object/optional-zone references.
- SingleHero global mode normalization in core/session/UI: one hero, hero hiring banned, encounter holes disabled, and lost-start-hero enabled.
- Undo/redo controls backed by transaction history.
- Effect service layer for browser file I/O, Core.zip parsing/catalog generation, layout persistence, command programs, and typed UI errors.

## Still Missing

- Persistent Core.zip file handles with permission restore where the browser supports the File System Access API. Current browser-safe behavior remembers the archive metadata and asks the user to select it again.
- Full content-pool authoring polish: rename/remove pools, clone official Core pools from full source configs in-browser, structured per-row content editing, bans, value distributions, reorder controls, and validation messages.
- Visual catalog UI integration, including safe placeholders for unresolved artifact, hero, and unit portraits.
- Full mandatory-content and content-count-limit editors.
- Road editing still needs add/remove/reorder controls per road row and richer inline validation display.
- Conditional editors beyond current biome/faction rules and SingleHero rules, especially placement rules, weighted content biome filters, and content-pool weight rows.
- Visual validation panel with actionable diagnostics.
- File-system save/open beyond browser download and file picker.
- Persisted editor layout is local UI state only; it is not part of the `.rmg.json` template.
- Browser Core.zip parser does not support ZIP64 archives yet.

## Useful Commands

```bash
npm run check
npm test
npm run ui:build
npm run core:scan
npm run editor:scan
npm run game-data:refresh
npm run asset-visual:refresh
```

Preview the UI after building:

```bash
npm run ui:preview
```

Then open:

```text
http://127.0.0.1:4173/
```

## Main Source Areas

- `src/core`: source-backed headless RMG editor core.
- `src/ui`: browser shell and Effect-backed UI service layer.
- `docs/rmg`: focused implementation notes and schema research.
- `docs/rmg-kb`: source-grounded knowledge base for RMG behavior.
