# Olden Era RMG Editor

**[🎮 Use the Editor Here](https://derpcatmusic.github.io/HoMM_OE_RMG_Editor/)** — Browser-first editor core and shell for Heroes of Might and Magic: Olden Era `.rmg.json` random-map templates.

## What Works Now

- Headless TypeScript core for RMG schema types, resolver, graph model, semantic validation, editor schema, editor actions, immutable mutations, bulk mutations, and transaction history.
- Template creation from scratch through `createMinimalPlayableTemplate`.
- Zone CRUD through safe editor actions: add, remove with cleanup, rename with reference rewrites, resize, clone, and pool-field edits.
- Connection CRUD and deep settings mutations: add, remove, rename, endpoint edits, type changes, portal defaults, guard fields, gate placement, road flag, sim squad flag, and guard randomization.
- Template-level map size, victory-condition display SID, game settings, and win-condition editing through `template.update`.
- Main-object and road basics: add a default city main object and a default stone road to the first incident non-proximity connection.
- Root content structures in core mutations: local content pools, content pool groups, bans, value distributions, content lists, mandatory content presets, content count limit presets, global bans, value overrides, and zone layouts.
- Core.zip generated catalogs from game data: content pools, content lists, factions, biomes, heroes, magics, units, RMG-placeable content, and artifacts.
- AssetRipper Texture2D visual catalog generation for source-backed image candidates, with confidence scoring and documented limits for portraits.
- Browser UI shell with top bar, left sidebar, canvas workspace, and right inspector.
- Left sidebar has three resizable sections: global settings, zone list, and players.
- Global settings form is directly visible in sidebar; zone editor moved to inspector `Zone` tab.
- Player management derives players from spawn main objects; supports up to 8 players with official colors.
- Validation marquee at sidebar bottom shows player coverage errors or all-clear.
- Save is blocked when validation errors exist.
- Resizable left sidebar and right inspector panel with persisted panel widths.
- Browser load/new/save for `.rmg.json`; save writes to Core.zip directory via File System Access API when available.
- Canvas zone dragging with persisted editor-only layout and live SVG connection redraw.
- Double-click empty canvas space to create a new zone; `Ctrl` + drag from a zone to another zone creates a default direct connection.
- Selectable canvas connection lines and a connection inspector tab for deep connection settings.
- Canvas zones show a 5px color strip on the left border using player color or gray for neutral.
- Canvas zones glow when their owner player is focused in the sidebar.
- Canvas right-click context menus for zones (select, assign player, delete) and connections (select, change type, delete).
- Inspector `Zone` tab edits zone name, size, layout, biome rules, guard tuning, content budgets, pool alternatives, mandatory-content presets, and content-count-limit presets with instant-apply, per-field reset, and accordion sections.
- Inspector `Connection` tab edits endpoints, connection type, length, portal flags, guard fields, gate placement, road flag, sim squad flag, and guard randomization with instant-apply, per-field reset, and accordion sections.
- Inspector `Objects` tab edits main-object type, spawn, owner, key/city-hold flags, placement mode/args, faction rule args, guard fields, weekly unit increment, and city building SIDs.
- Road inspector edits authored road type and structured `from`/`to` targets using selected-zone context.
- Searchable content-pool selectors for zone guarded, unguarded, and resource pool alternatives, filtered by Core.zip pool naming/source conventions.
- Right-side tool dock with vertical Inspector/Browser tabs. Inspector owns selected entity editing; Browser owns searchable Core.zip lookup/copy/drag rows.
- Browser panel inspired by the older Python/TS editor layout: scope filter, category filter, dense capped result list, click-to-copy IDs, draggable content SIDs, and a details pane for the selected entry.
- Connection-aware canvas auto-layout: serial chains become lines, long chains wrap/snake inside the canvas, cycles become polygon-like clusters, hubs become spokes, spawn-to-spawn maps keep a central backbone with side branches, and dragged manual positions stay pinned.
- Inspector content-pool tab for creating template-local pools, adding groups, and editing group weights/include-lists/content rows.
- Catalog-backed biome `FromList` controls in the zone editor after Core.zip is attached, with unknown existing args preserved.
- Source-backed biome rule builder for `FromList`, `MatchZone`, and `MatchMainObject`, including context-derived zone/main-object args and previews.
- Source-backed faction rule builder for main objects: `FromList` candidate/exclusion editing and `Match` main-object/optional-zone references.
- SingleHero global mode normalization in core/session/UI: one hero, hero hiring banned, encounter holes disabled, and lost-start-hero enabled.
- Undo/redo controls backed by transaction history.
- Effect service layer for browser file I/O, Core.zip parsing/catalog generation, layout persistence, command programs, and typed UI errors.
- Core.zip is cached in IndexedDB and auto-loaded on page refresh; when no usable cached Core.zip exists, a drag/drop + file-picker modal prompts for it, and the header shows loaded/missing Core status.

## Still Missing

- Full content-pool authoring polish: rename/remove pools, clone official Core pools from full source configs in-browser, structured per-row content editing, bans, value distributions, reorder controls, and validation messages.
- Visual catalog UI integration, including safe placeholders for unresolved artifact, hero, and unit portraits.
- Full mandatory-content and content-count-limit editors.
- Road editing still needs add/remove/reorder controls per road row and richer inline validation display.
- Conditional editors beyond current biome/faction rules and SingleHero rules, especially placement rules, weighted content biome filters, and content-pool weight rows.
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
