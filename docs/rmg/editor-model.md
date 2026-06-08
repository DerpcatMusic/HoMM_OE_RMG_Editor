# Editor Model

`src/core/editor-model` is the headless facade the future UI should consume.

## Status

- `done`: the headless read model, selectors, and smoke scan exist.
- `partial`: model construction is complete for reads, but editor actions still happen through mutations.
- `missing`: UI integration, command routing, and incremental model updates.

It combines:

- extracted Core indexes
- live template index
- resolved templates
- variant graphs
- diagnostics
- template cards
- selection helpers

It still has no React, Tauri, DOM, or storage-state dependency.

## Files

- `src/core/editor-model/editorModelTypes.ts`: UI-ready model contracts.
- `src/core/editor-model/buildEditorModel.ts`: builds the full read model.
- `src/core/editor-model/selectors.ts`: stable lookup and selection helpers.
- `src/cli/editor-scan.ts`: smoke test for model construction and selection.

## Main Contracts

`RmgEditorModel` contains:

- `gameData`: indexed Core pools/lists/layouts.
- `templates`: indexed live templates.
- `templateCards`: compact list rows for template browser UI.
- `templateModels`: full resolved template models.
- `diagnostics`: global flattened diagnostics.
- `stats`: aggregate counts.

`TemplateModel` contains:

- template id
- source file
- resolved template
- `VariantModel[]`
- template diagnostics

`VariantModel` contains:

- template id
- variant index
- resolved variant
- `RmgGraph`
- variant diagnostics

## Selection

UI selection should store only stable ids:

```ts
interface EditorSelection {
  templateId?: string;
  variantIndex?: number;
  nodeId?: string;
  edgeId?: string;
}
```

Then resolve it with:

```ts
resolveEditorSelection(model, selection)
```

This keeps React state small and avoids duplicating resolved objects in UI state.

## Smoke Test

Run:

```bash
npm run editor:scan
```

Current verified facts:

- 56 templates.
- 66 variants.
- 902 zones.
- 1,393 connections.
- 532 content pools.
- 211 content lists.
- First default selection resolves.

The remaining model errors are inherited Core data diagnostics for unresolved content-list includes, not template pool-reference failures.
