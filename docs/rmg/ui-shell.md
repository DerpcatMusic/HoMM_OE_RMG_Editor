# UI Shell

`src/ui` is the first browser-facing shell for the RMG editor.

## Status

- `done`: Git repository initialized on `main`.
- `done`: top command bar exists with load, new, save, and Core.zip actions.
- `done`: left/sidebar and right/inspector panels are horizontally resizable and persist panel widths locally.
- `done`: load reads `.rmg.json` with the browser File API.
- `done`: save downloads the current template as formatted `.rmg.json`.
- `done`: new creates a minimal playable template through the core factory.
- `done`: Core.zip attachment parses browser-side catalogs through Effect-backed services and reports pool/content counts.
- `done`: center workspace has `Canvas` and `Selected zone` tabs.
- `done`: canvas shows live zones/connections projected from the current template.
- `done`: canvas zones can be dragged to editor-only positions.
- `done`: canvas zone positions persist in browser local storage by template identity.
- `done`: canvas connections are real SVG splines connected to rectangle centers and redraw live during zone drag.
- `done`: `Ctrl` + drag from one zone to another creates a default `Direct` connection.
- `done`: canvas connection lines are selectable.
- `done`: left rail separates general template areas from the zone list.
- `done`: right inspector has tabs for global settings, zone props, connection settings, content pools, roads, and raw schema fields.
- `done`: global inspector edits game mode, hero counts, game-rule booleans/modifiers, and common win-condition settings.
- `done`: connection inspector edits endpoints, connection type, length, portal flags, guard fields, gate placement, road flag, sim squad flag, and guard randomization.
- `done`: inspector tabs scroll horizontally when there are too many tabs for the panel width.
- `done`: shell reads real editor-schema metadata for field routing.
- `done`: add zone, remove zone, add connection, rename zone, resize zone, and edit zone content-pool alternatives call `applyEditorAction`.
- `done`: `Zone edit` workspace tab visualizes selected-zone main objects, connection anchors, and roads.
- `done`: `Zone edit` can add a default city main object and a default road from main object `0` to the first incident non-proximity connection.
- `done`: `Zone edit` includes a main-object editor for type, spawn, owner, key/city-hold flags, placement, faction, weekly-unit, guard, and building-SID fields.
- `done`: zone-internal object node positions are draggable and persist in browser local storage.
- `done`: zone-internal roads are parsed from authored `zone.roads[]`, rendered as SVG splines connected to object rectangle centers, labeled by road type, and redrawn live during object drag.
- `done`: inspector `Roads` tab edits road type plus structured `from` and `to` targets.
- `done`: road target args are populated from selected-zone main objects, incident non-proximity connections, and mandatory-content entries referenced by the zone.
- `done`: selected-zone editor now exposes layout, biome rules, crossroads/diplomacy, guard tuning, content budgets, pool alternatives, mandatory-content presets, and content-count-limit presets.
- `done`: biome rule args use a source-backed builder for `FromList`, `MatchZone`, and `MatchMainObject`; unknown existing args remain visible.
- `done`: `FromList` preserves `differentFrom:` exclusions separately from biome candidates.
- `done`: `MatchZone` exposes blank/current-zone behavior with role-specific preview text.
- `done`: `MatchMainObject` exposes main-object index plus optional zone controls from current template context.
- `done`: main-object faction rules use source-backed `FromList` and `Match` controls, including catalog-backed faction candidates when Core.zip is attached and preserved `differentFrom:` exclusions.
- `done`: SingleHero mode forces the dependent game-rule/win-condition defaults in the UI and session action path.
- `done`: undo/redo controls are wired to transaction history.
- `done`: Effect services wrap browser file I/O, Core.zip parsing, catalog generation, layout persistence, and command programs.
- `missing`: real content/artifact/hero catalog picker controls, full content-pool authoring surfaces, deep mandatory-content placement-rule editing, deep road row management, and validation panels.

## Source Files

- `src/ui/index.html`: source HTML template copied into `dist/ui`.
- `src/ui/main.ts`: browser entry.
- `src/ui/dom.ts`: DOM helper.
- `src/ui/data/shellData.ts`: temporary shell data plus schema summaries.
- `src/ui/components/appShell.ts`: app mount and shell state.
- `src/ui/components/header.ts`: top command bar.
- `src/ui/components/sidebar.ts`: project and zone navigation.
- `src/ui/components/workspace.ts`: canvas and selected-zone workspaces.
- `src/ui/components/inspector.ts`: selected-zone inspector tabs.
- `src/ui/components/primitives.ts`: reusable buttons, tabs, and value rows.
- `src/ui/data/templateProjection.ts`: template-to-shell zone/connection projection.
- `src/ui/state/editorSession.ts`: browser editor session and core action adapter.
- `src/ui/state/browserFiles.ts`: file picker and download helpers.
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
- Left rail lists general template areas and live zones.
- Left rail and inspector width can be resized with hard separator handles.
- Canvas tab shows live zones and connections.
- Canvas zone clicks update the inspector while staying on canvas.
- Dragging a canvas zone moves it in the editor canvas only, while SVG connection splines redraw live from rectangle centers.
- `Ctrl` + drag from a canvas zone draws a dotted draft line; releasing over another zone creates a default `Direct` connection.
- Clicking a canvas connection selects it and opens the inspector `Connection` tab.
- Left-zone clicks switch to the selected-zone tab.
- Selected-zone tab can edit zone name, size, layout, biome rules, guard tuning, content budgets, guarded/unguarded/resource pool alternatives, mandatory-content presets, and content-count-limit presets.
- Biome controls use the generated Core.zip biome catalog after Core.zip is attached; without Core.zip, `FromList` stays editable as raw args.
- Inspector `Global` tab edits top-level game settings and win-condition fields.
- Inspector `Global` disables the SingleHero-dependent fields while showing their forced values.
- Inspector `Connection` tab edits the first deep set of connection settings.
- Inspector zone tabs summarize selected-zone props, biome rules, guard settings, content budgets, content pools, road count, and schema fields.
- Zone edit tab shows selected-zone internals, including main objects, incident connection anchors, and roads.
- Zone edit object nodes can be dragged as persisted editor-only layout; authored road splines redraw live and carry road-type labels.
- Zone edit main-object editor updates authored main objects through `mainObject.update`, not direct JSON assignment.
- Faction `FromList` separates catalog faction candidates from `differentFrom:` exclusions; absent `mainObject.faction` remains absent unless the user chooses a rule type.
- Faction `Match` uses a main-object index and optional zone selector. These are positional references and remain reorder-sensitive.
- Inspector `Roads` tab can select an authored road and update `Dirt`/`Stone`, `from`, and `to` through core `road.update`.

## Current Mutation Coverage

- `zone.add`: add a default zone to the active variant.
- `zone.remove`: remove selected zone with incident connection/reference cleanup.
- `connection.add`: connect the selected zone to the first other named zone.
- `connection.add`: connect two canvas zones through `Ctrl` + drag snap.
- `connection.updateSettings`: edit connection name, endpoints, type, length, portals, guards, gate placement, road flag, sim squad flag, and guard randomization.
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
- Save downloads a file; it does not write directly to disk because this shell is browser-only.

## Verification

Run:

```bash
npm run check
npm run ui:build
npm test
```

`npm test` includes `src/cli/ui-session-invariants.ts`, which verifies session-backed global edits, zone add/edit/move, connection create/edit, undo/redo, main-object add/update, road add/update, zone-object layout, cleanup, and serialization.
