# Semantic Validation

Structural validation answers: "Does this JSON match the known schema and resolve IDs?"

Semantic validation answers: "Is this template likely playable and safe to author?"

The implementation lives in `src/core/validation/semanticValidation.ts` and is exported as `validateSemanticPlayability`.

## Status

- `done`: playability checks for spawns, roads, content pools, and major win-condition anchors.
- `partial`: the validator focuses on authoring safety, not full simulated gameplay correctness.
- `missing`: automatic fix suggestions and richer diagnostics for every edge case.

## Checks

`validateSemanticPlayability(resolved)` currently checks each variant for:

- at least two distinct player spawns
- every player spawn zone has a valid connection
- all player spawn zones belong to the same connected component
- roads that target connections resolve to existing non-`Proximity` connection names touching the owning zone
- roads that target main objects use a valid local main-object index
- roads that target mandatory content resolve to entry names from the zone's mandatory-content preset alternatives
- main objects placed at a connection resolve to an existing connection name
- portal placement rules that target connections resolve
- single-variant root mandatory-content placement rules that target connections resolve
- zones with guarded/unguarded/resources budgets have resolved pool alternatives
- empty zones warn when they have no main objects, mandatory content, or content budget
- `cityHold` win condition has at least one `holdCityWinCon: true` main object
- final battle/gladiator setups warn when no `GladiatorArena` connection or main object exists

## Intended Use

Use semantic validation:

- after creating a new template
- before saving/exporting a template
- after destructive edits like removing zones, connections, or main objects
- in the UI as a "Playability" diagnostics panel

Do not merge semantic validation into `core:scan` by default. Official templates contain intentional special cases, and authoring warnings such as empty zones would create too much noise for baseline source-data scans.

## Example

```ts
const resolved = resolveTemplate({ template, sourcePath, gameData });
const diagnostics = validateSemanticPlayability(resolved);
```

The generated minimal playable template is covered by `npm run mutation:scan` and currently returns zero semantic errors and zero semantic warnings.
