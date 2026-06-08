# Legacy Project Cross-Reference

This pass inspected two older editor attempts under `/home/derpcat/projects/OE_RMG`.

## Sources

- `/home/derpcat/projects/OE_RMG/apps/rmg-editor`: Tauri 2, Rust backend, Vite/vanilla TypeScript frontend.
- `/home/derpcat/projects/OE_RMG/rmg_editor_python`: symlink to a Python/PySide6 editor.

## Ideas To Keep

- Treat `.rmg.json` as a graph plus local definition catalog, not as isolated JSON forms.
- Keep separate analysis outputs for summary, references, diagnostics, and graph projection.
- Use canvas selection plus contextual inspector as the main workflow.
- Group selected-zone editing by task: general, roads and objects, content and limits, guard and misc.
- Build condition/rule editors with schema-backed argument controls and live readable previews.
- Build road editors from actual zone context: main object indices, incident connection names, mandatory content names, and crossroads.
- Build content-pool editors from a searchable Core.zip content browser, then author weighted rows against validated SIDs.
- Show reference impact before zone rename/delete and before main-object reorder/delete.
- Keep shipped official templates read-only until an explicit save-as/export path.

## Ideas To Avoid

- Do not copy a monolithic imperative app/state split.
- Do not mutate `.rmg.json` directly from UI controls; route all edits through editor actions and core mutations.
- Do not use first-variant-only assumptions.
- Do not infer important semantics from names like `spawn`, `treasure`, or `resource`.
- Do not auto-reposition loaded template structure as if it were source data. Canvas positions are editor-only state.
- Do not hide schema drift behind permissive model settings or fake fallback catalogs.
- Do not maintain multiple validation engines with conflicting rules.
- Do not copy stale road dialogs with invalid road types. Current source-backed road types are `Dirt` and `Stone`.
- Do not rely on Windows registry, hard-coded Steam paths, or automatic ZIP extraction as the only data-loading path.

## Cross-Reference Against Current Editor

- Current core already improves on the old projects by using editor actions, mutation diagnostics, reference rewrites, and transaction history.
- Current UI already keeps canvas plus inspector, but still needs context-derived deep editors for roads, main objects, content pools, and mandatory content.
- Current Core.zip browser parser is the right direction. Expand it into picker payloads instead of adding fake fallback data.
- Current validation should become the single canonical path-addressed diagnostics source for UI warnings, save checks, and future export checks.

## Python Feature Mine

The Python editor is not a reliable implementation source, but it is useful as a UX feature inventory.

| Area | Python Had | Current Editor Has | Decision |
|---|---|---|---|
| Zone editor | Task-grouped zone properties, road/object section, content/limit section, guard/misc section. | Selected-zone editor with many fields, but not task-tabbed inside the zone form. | Rebuild as compact task tabs or sections. |
| Road editor | Road type plus structured `from`/`to` target type and context-derived args. | Road add, update core mutations, road visualization, and inspector editing for type/from/to. | First concept ported; add row-level add/remove/reorder later. |
| Biome rules | Rule builder for `FromList`, `MatchZone`, `MatchMainObject`, preview text. | Source-backed builder for `FromList`, `MatchZone`, and `MatchMainObject`. | Initial concept ported; add dependency warnings/cycle display later. |
| Placement rules | Builder for main-object, connection, mandatory-content, SID, road, crossroads placement. | Core schema/actions know placement-rule fields, but UI has no builder. | High-value port after road editor. |
| Mandatory content | Direct zone-focused item editor with defaults and placement rules. | Core can mutate mandatory presets; zone UI only edits preset references. | Port concept, but preserve actual preset model underneath. |
| Content pools | Pool management plus row table for SID, weight, max count, drag/drop from browser. | Core has full pool/list/group/ban/value-distribution mutations; UI has no authoring surface. | Port concept as searchable picker plus table rows, not raw drag/drop first. |
| Content browser | Searchable content browser feeding other editors. | Core indexes RMG content from Core.zip; UI exposes biome and main-object faction options. | Build a browser panel from current generated catalog. |
| Owner/player pickers | Owner dropdown based on players/spawns. | Global settings and zones exist; no owner picker yet for mandatory/main objects. | Use context-derived player list, but avoid Python's hero-count heuristic. |
| Variant display | Shows `-1` as `Any`. | Core supports variant fields, but UI does not expose those rows yet. | Port as display convention for content/mandatory rows. |
| Data modder | Hero/unit/misc game-data editing. | Out of RMG scope. | Do not port now. |

## Porting Order

1. Road target editor: structured `type/from/to` controls with options from selected zone context. Initial implementation done.
2. Generic rule builder: biome/faction/placement rules with preview and path-addressed validation. Biome and main-object faction builders have initial source-backed implementations; placement remains.
3. RMG content browser: searchable Core.zip catalog with SID, name, tag, biome, value, source path.
4. Content-pool authoring: pool groups, weighted content rows, include-list rows, bans, and value distribution.
5. Mandatory-content authoring: direct zone workflow that maps to real root presets and zone preset references.
6. Main-object editor: spawn/owner/faction/placement/building/guard fields with reference-impact warnings.

## Current Verdict

The current editor is better as an engine and safer as an authoring core. The Python editor is better as a sketch of advanced workflows. We should port the workflows, not the code or assumptions.
