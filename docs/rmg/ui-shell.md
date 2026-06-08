# UI Shell

`src/ui` is the first browser-facing shell for the RMG editor.

## Status

- `done`: Git repository initialized on `main`.
- `done`: top command bar exists with load, new, save, and Core.zip actions.
- `done`: left/sidebar and right/inspector panels are horizontally resizable and persist panel widths locally.
- `done`: load reads `.rmg.json` with the browser File API.
- `done`: save writes `.rmg.json` to the same directory as the loaded Core.zip when the browser supports the File System Access API; falls back to download otherwise.
- `done`: Core.zip attachment parses browser-side catalogs through Effect-backed services and reports pool/content counts.
- `done`: center workspace shows the `Canvas` tab; zone editing moved to the inspector `Zone` tab.
- `done`: canvas shows live zones/connections projected from the current template.
- `done`: canvas zones can be dragged to editor-only positions.
- `done`: canvas zone positions persist in browser local storage by template identity.
- `done`: canvas connections are real SVG splines connected to rectangle centers and redraw live during zone drag.
- `done`: `Ctrl` + drag from one zone to another creates a default `Direct` connection.
- `done`: canvas connection lines are selectable.
- `done`: canvas zones show a 5px color strip on the left border using `--zone-color` (player color or gray for neutral).
- `done`: canvas zones glow when their owner player is focused in the sidebar.
- `done`: canvas right-click context menus for zones (select, assign player, delete) and connections (select, change type, delete).
- `done`: left sidebar has three resizable sections: global settings, zone list, and players.
- `done`: sidebar global settings form is directly visible at the top, no nav buttons required.
- `done`: sidebar zones section lists zones with click-to-select.
- `done`: sidebar players section shows player color strips, zone counts, add/remove buttons, and click-to-focus.
- `done`: player management derives players from spawn main objects; supports up to 8 players with official colors.
- `done`: validation marquee at sidebar bottom shows player coverage errors (red pulse) or all-clear (green).
- `done`: save is blocked when validation errors exist.
- `done`: right inspector has tabs for Zone, Connection, Objects, Content, Pools, Roads, Raw, and Validation.
- `done`: inspector `Zone` tab edits zone name, size, layout, biome rules, guard tuning, content budgets, pool alternatives, mandatory-content presets, and content-count-limit presets with instant-apply and per-field reset.
- `done`: inspector `Connection` tab edits endpoints, connection type, length, portal flags, guard fields, gate placement, road flag, sim squad flag, and guard randomization with instant-apply.
- `done`: inspector tabs scroll horizontally when there are too many tabs for the panel width.
- `done`: shell reads real editor-schema metadata for field routing.
- `done`: add zone, remove zone, add connection, rename zone, resize zone, and edit zone content-pool alternatives call `applyEditorAction`.
- `done`: zone edit form includes a main-object editor for type, spawn, owner, key/city-hold flags, placement, faction, weekly-unit, guard, and building-SID fields.
- `done`: zone-internal object node positions are draggable and persist in browser local storage.
- `done`: zone-internal roads are parsed from authored `zone.roads[]`, rendered as SVG splines connected to object rectangle centers, labeled by road type, and redrawn live during object drag.
- `done`: inspector `Roads` tab edits road type plus structured `from` and `to` targets.
- `done`: road target args are populated from selected-zone main objects, incident non-proximity connections, and mandatory-content entries referenced by the zone.
- `done`: biome rule args use a source-backed builder for `FromList`, `MatchZone`, and `MatchMainObject`; unknown existing args remain visible.
- `done`: `FromList` preserves `differentFrom:` exclusions separately from biome candidates.
- `done`: `MatchZone` exposes blank/current-zone behavior with role-specific preview text.
- `done`: `MatchMainObject` exposes main-object index plus optional zone controls from current template context.
- `done`: main-object faction rules use source-backed `FromList` and `Match` controls, including catalog-backed faction candidates when Core.zip is attached and preserved `differentFrom:` exclusions.
- `done`: SingleHero mode forces the dependent game-rule/win-condition defaults in the UI and session action path.
- `done`: undo/redo controls are wired to transaction history.
- `done`: Effect services wrap browser file I/O, Core.zip parsing, catalog generation, layout persistence, and command programs.
- `done`: instant-apply pattern with per-field reset buttons for all form controls.
- `done`: Core.zip is cached in IndexedDB and auto-loaded on page refresh; load modal appears only when no cached Core.zip is found.
- `missing`: real content/artifact/hero catalog picker controls, full content-pool authoring surfaces, deep mandatory-content placement-rule editing, and deep road row management.

## Source Files

- `src/ui/index.html`: source HTML template copied into `dist/ui`.
- `src/ui/main.ts`: browser entry.
- `src/ui/dom.ts`: DOM helper.
- `src/ui/data/shellData.ts`: shell data types including `ShellPlayerItem` and `ShellConnectionItem`.
- `src/ui/components/appShell.ts`: app mount, render loop, and shell state wiring.
- `src/ui/components/header.ts`: top command bar.
- `src/ui/components/sidebar.ts`: resizable sidebar with global settings, zone list, and players sections.
- `src/ui/components/workspace.ts`: canvas with zone/connection rendering and context menus.
- `src/ui/components/inspector.ts`: inspector tab routing and body creation.
- `src/ui/components/inspector/connectionPanel.ts`: connection settings form with instant-apply.
- `src/ui/components/inspector/controls.ts`: form control factories including `createInstantField`.
- `src/ui/components/zoneFormHelpers.ts`: zone editor form extracted from workspace.
- `src/ui/components/primitives.ts`: reusable buttons, tabs, and value rows.
- `src/ui/data/templateProjection.ts`: template-to-shell zone/connection/player projection.
- `src/ui/state/editorSession.ts`: browser editor session, player management, and core action adapter.
- `src/ui/state/browserFiles.ts`: file picker, File System Access API, and download helpers.
- `src/ui/state/editorLayoutPersistence.ts`: Effect-backed persisted editor layout.
- `src/ui/effect/*.ts`: Effect programs and services for file I/O, Core.zip parsing, catalog summaries, and typed UI errors.
- `src/ui/styles/tokens.css`: bare editor tokens.
- `src/ui/styles/base.css`: reset/base/accessibility.
- `src/ui/styles/layout.css`: responsive editor grid.
- `src/ui/styles/components.css`: flat component styles.

## Build

Run:

```bash
npm run ui:build
```

Output:

- `dist/ui/index.html`
- `dist/ui/assets/main.js`
- `dist/ui/styles/*.css`

Preview:

```bash
npm run ui:preview
```

Then open:

```text
http://127.0.0.1:4173/
```

## Design Direction

The shell is intentionally plain:

- hard one-pixel and two-pixel separators
- square controls
- monochrome surfaces
- short labels
- no cards, no shadows, no gradients, no decorative fantasy skin

The source of truth is:

- `DESIGN.md`
- `src/ui/styles/tokens.css`

## Component Direction

The shell is intentionally not React yet. It is a low-dependency browser layer that proves editor layout, region anatomy, and component boundaries before committing to an app framework.

Keep this module shape:

- `components/`
- `data/`
- `styles/`
- small entry file
- no monolithic app file

Editing controls call:

- `getEditorSchema`
- `resolveEditorPicker`
- `applyEditorAction`

Do not wire controls by directly mutating `.rmg.json` objects.

## Current Shell Behavior

- Top bar loads, creates, saves, parses Core.zip, and exposes undo/redo.
- The app shell owns `100dvh`; long regions scroll internally instead of expanding the document.
- Sidebar has three resizable sections: global settings (top), zone list (middle), and players (bottom), separated by drag dividers.
- Global settings form is directly visible in the sidebar; no nav buttons required.
- Sidebar and inspector width can be resized with hard separator handles.
- Canvas is the only center workspace tab; zone editing moved to the inspector.
- Canvas zone clicks update the inspector while staying on canvas.
- Dragging a canvas zone moves it in the editor canvas only, while SVG connection splines redraw live from rectangle centers.
- `Ctrl` + drag from a canvas zone draws a dotted draft line; releasing over another zone creates a default `Direct` connection.
- Clicking a canvas connection selects it and opens the inspector `Connection` tab.
- Canvas zones show a 5px color strip on the left border using `--zone-color` (player color or gray for neutral).
- Canvas zones glow when their owner player is focused in the sidebar.
- Right-click context menus on canvas: zones (select, assign player, delete), connections (select, change type, delete).
- Left-zone clicks select the zone and open the inspector `Zone` tab.
- Inspector `Zone` tab edits zone name, size, layout, biome rules, guard tuning, content budgets, pool alternatives, mandatory-content presets, and content-count-limit presets with instant-apply and per-field reset.
- Inspector `Connection` tab edits endpoints, connection type, length, portal flags, guard fields, gate placement, road flag, sim squad flag, and guard randomization with instant-apply.
- Biome controls use the generated Core.zip biome catalog after Core.zip is attached; without Core.zip, `FromList` stays editable as raw args.
- Sidebar players section shows player color strips, zone counts, add/remove buttons, and click-to-focus.
- Player management derives players from spawn main objects; supports up to 8 players with official colors.
- Validation marquee at sidebar bottom shows player coverage errors (red pulse) or all-clear (green).
- Save is blocked when validation errors exist.

- Zone edit main-object editor updates authored main objects through `mainObject.update`, not direct JSON assignment.
- Faction `FromList` separates catalog faction candidates from `differentFrom:` exclusions; absent `mainObject.faction` remains absent unless the user chooses a rule type.
- Faction `Match` uses a main-object index and optional zone selector. These are positional references and remain reorder-sensitive.
- Inspector `Roads` tab can select an authored road and update `Dirt`/`Stone`, `from`, and `to` through core `road.update`.

## Current Mutation Coverage

- `zone.add`: add a default zone to the active variant.
- `zone.remove`: remove selected zone with incident connection/reference cleanup.
- `zone.deleteByName`: delete a zone by name from canvas context menu with connection/reference cleanup.
- `connection.add`: connect the selected zone to the first other named zone.
- `connection.add`: connect two canvas zones through `Ctrl` + drag snap.
- `connection.deleteByName`: delete a connection by name from canvas context menu.
- `connection.updateSettings`: edit connection name, endpoints, type, length, portals, guards, gate placement, road flag, sim squad flag, and guard randomization.
- `connection.updateTypeByName`: change connection type from canvas context menu.
- `zone.reassignOwner`: reassign zone owner from canvas context menu.
- `field.update / zone.name`: rename selected zone and update references.
- `zone.updateSettings`: update size, layout, biome rules, crossroads position, diplomacy modifier, guard parameters, and reaction weights.
- `zone.setContentBudgets`: update guarded, unguarded, and resource content budgets.
- `field.update / zone.guardedContentPool`: update guarded pool alternatives.
- `field.update / zone.unguardedContentPool`: update unguarded pool alternatives.
- `field.update / zone.resourcesContentPool`: update resource pool alternatives.
- `zone.setMandatoryContentPresets`: update zone mandatory-content preset alternatives when changed.
- `zone.setContentCountLimitPresets`: update zone content-count-limit preset alternatives when changed.
- `template.update`: apply global game mode, game-rule, and win-condition settings as one validated mutation.
- `mainObject.add`: add a default city main object to the selected zone.
- `mainObject.update`: edit selected-zone main object type, spawn, owner, key/city-hold flags, placement args, faction rule, growth, guards, and building SIDs.
- `road.add`: add a default stone road from main object `0` to the first incident non-proximity connection.
- `road.update`: edit road type plus `from` and `to` targets from inspector controls.

## Current Limitations

- Canvas node positions are editor-only positions, not saved RMG coordinates.
- Resized panel widths are editor-local browser state, not template data.
- `Add connection` currently picks the first other named zone instead of opening an endpoint selector.
- Core.zip browser parsing supports normal ZIP central-directory archives, but not ZIP64.
- Catalogs are parsed, but the UI only exposes biome and main-object faction pickers so far. Searchable content, hero, magic, unit, and artifact pickers are still missing.
- Zone edit object placement is draggable editor-only layout; road target data is editable from the inspector but not yet add/remove/reorder row managed.
- Conditional editors are incomplete beyond biome/faction rules and SingleHero dependencies. Placement-rule conditions, weighted content biome filters, and content-pool rows still need dedicated controls.
- Save falls back to download when the browser does not support the File System Access API.

## Verification

Run:

```bash
npm run check
npm run ui:build
npm test
```

`npm test` includes `src/cli/ui-session-invariants.ts`, which verifies session-backed global edits, zone add/edit/move, connection create/edit, undo/redo, main-object add/update, road add/update, zone-object layout, cleanup, and serialization.
