# Editor Actions

`src/core/editor-actions` is the command bridge between UI state and the lower-level mutation layer.

## Status

- `done`: a modular action folder exists and is exported by `src/core/index.ts`.
- `done`: field updates route through source-backed schema metadata and safe mutations.
- `done`: typed entity actions wrap the existing CRUD mutation layer.
- `done`: transaction push is centralized.
- `done`: picker resolution exists for enums, template references, and game-data catalogs.
- `partial`: not every advanced schema field has a granular `field.update` route yet.
- `missing`: UI command builders, action preview panels, and command grouping semantics.

## Files

- `src/core/editor-actions/editorActionTypes.ts`: action, selection, options, and result contracts.
- `src/core/editor-actions/applyEditorAction.ts`: top-level action runner with optional transaction history push.
- `src/core/editor-actions/fieldActionRouter.ts`: `field.update` router from schema field IDs to safe mutations.
- `src/core/editor-actions/entityActionRouter.ts`: typed entity/CRUD action router.
- `src/core/editor-actions/pickerResolver.ts`: picker options for fields.
- `src/core/editor-actions/actionResult.ts`: shared result helpers.
- `src/cli/editor-action-invariants.ts`: action contract smoke test.

## Main API

Use:

```ts
applyEditorAction({
  template,
  history,
  action: {
    type: "field.update",
    fieldId: "zone.guardedContentPool",
    value: ["content_pool_default_guarded"],
    selection: {
      variantIndex: 0,
      zone: { zoneName: "Spawn-A" },
    },
  },
});
```

Use picker resolution:

```ts
resolveEditorPicker({
  template,
  gameData,
  fieldId: "connection.from",
  selection: { variantIndex: 0 },
});
```

## Field Routing

The field router intentionally uses specialized mutations where reference rewrites matter:

- `zone.name` routes to `renameZone`, not raw property assignment.
- `connection.name` routes to `renameConnection`.
- `connection.from` and `connection.to` load the current opposite endpoint, then route through `updateConnectionEndpoints`.
- `connection.connectionType` routes to `updateConnectionType` so portal defaults can be normalized.
- zone pool arrays route to `setZoneContentPools`, preserving sampled-alternative semantics.
- mandatory-content entry fields clone the preset content array and route through `updateMandatoryContentPreset`.

Preserve-only fields are rejected by `field.update`.

Example:

- `gameRules.uniqueMagicCostModifiers` returns `editorAction.field.preserveOnly`.

Known-but-unrouted fields return:

- `editorAction.field.unsupported`

That is intentional. Unsupported fields should be added deliberately with a test proving the exact mutation semantics.

## Entity Actions

Typed entity actions wrap existing mutation inputs without duplicating validation:

- template settings
- global bans
- variants
- zones
- connections
- main objects
- roads
- local content pools
- content pool groups
- content pool bans
- content lists
- mandatory-content presets
- content-count-limit presets
- value overrides
- zone layouts

Example:

```ts
applyEditorAction({
  template,
  action: {
    type: "zone.add",
    input: {
      variantIndex: 0,
      zone: { name: "Extra-Zone", size: 1 },
    },
  },
});
```

## Transactions

`applyEditorAction` accepts an optional `TransactionHistory`.

If an action succeeds and produces at least one change, it pushes a transaction frame:

- `before`: original template snapshot
- `after`: resulting template snapshot
- `label`: supplied `transactionLabel` or action type

No-op successful actions do not pollute undo history.

Failed actions never push history.

## Picker Resolution

`resolveEditorPicker` is synchronous. It does not read files.

It can return:

- enum values from field metadata
- players
- zones in the selected variant
- connections in the selected variant
- main-object indexes in the selected zone
- template-local and Core content pools
- template-local and Core content lists
- template-local and Core zone layouts
- mandatory-content presets
- content-count-limit presets
- RMG content SIDs from `GameDataIndex`
- artifact SIDs from `GameDataIndex`

If a catalog-backed picker is requested without `GameDataIndex`, it returns available template-local options and a warning.

## Verification

Run:

```bash
npm run test:editor-actions
```

Current baseline:

```text
editor-action invariants: template zones=4, historyFrames=6, pickerZones=4
```

The invariant currently proves:

- `zone.name` rewrites zone references.
- `connection.connectionType` applies portal defaults.
- zone content-pool field updates mutate sampled alternatives.
- game-rule field updates route through template settings.
- mandatory-content entry fields can be edited by entry index.
- entity action `zone.add` works.
- preserve-only fields are blocked.
- zone and enum pickers resolve useful options.
