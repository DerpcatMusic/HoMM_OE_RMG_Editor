# Editor Schema

`src/core/editor-schema` is the headless form/schema contract for the future RMG editor UI.

## Status

- `done`: a source-backed registry exists for the main editable RMG surfaces.
- `done`: schema invariants run in `npm test`.
- `partial`: the registry is hand-curated from current source/data research, not generated from C# reflection.
- `missing`: UI rendering, field-level widget components, and live picker integration.

## Purpose

The schema registry answers these UI questions without hard-coding them into React components:

- which fields exist
- where they live in `.rmg.json`
- which editor section owns them
- whether the field is first-class, advanced, compatibility-only, or preserve-only
- which mutation should edit first-class fields
- what picker source should feed the field
- what references and validations apply
- what source evidence backs the field

## Files

- `src/core/editor-schema/editorSchemaTypes.ts`: typed schema contracts.
- `src/core/editor-schema/fieldRegistry.ts`: section and field metadata.
- `src/core/editor-schema/index.ts`: public exports.
- `src/cli/editor-schema-invariants.ts`: contract test.

The module is exported through `src/core/index.ts`.

## Sections

The registry currently exposes 9 sections:

- `templateSettings`
- `gameRules`
- `winConditions`
- `zones`
- `connections`
- `roads`
- `contentPools`
- `mandatoryContent`
- `compatibility`

Current invariant baseline:

```bash
npm run test:editor-schema
```

Expected current output:

```text
editor-schema invariants: 121 fields, 9 sections, 81 first-class fields
```

## Edit Levels

`firstClass` fields should have normal UI controls and mutation routes.

Examples:

- `zone.name`
- `zone.guardedContentPool`
- `connection.connectionType`
- `contentPool.group.content`
- `mandatoryContent.entry.sid`

`advanced` fields are valid declared fields, but should usually live behind advanced panels.

Examples:

- `gameRules.tournamentRules`
- `zone.encounterHolesSettings`
- `connection.portalPlacementRulesFrom`
- `mandatoryContent.entry.rules`

`compatibility` fields are observed in official JSON or otherwise useful to expose, but source proof is incomplete or mismatched.

Examples:

- `connection.road`
- `connection.simTurnSquad`
- `connection.guardRandomization`

`preserveOnly` fields should round-trip if loaded, but new templates should not create them by default.

Examples:

- `gameRules.uniqueMagicCostModifiers`
- `zone.mandatoryContent.legacyScalar`
- `zone.contentCountLimits.legacyScalar`

## Source Status

`declared` means the field is declared by inspected C# source and normal editor authoring is allowed.

`declaredUnverifiedRuntime` means the field is declared, but runtime use is not fully verified in the inspected generator path or official usage is sparse.

Examples:

- `winConditions.cityHold`
- `winConditions.tournament`
- `gameRules.disableMagicGuild`

`officialObservedOnly` means official `.rmg.json` files contain the field, but inspected primary schema source does not declare it.

Examples:

- `connection.road`
- `connection.simTurnSquad`

`sourceMismatch` means inspected sources disagree.

Example:

- `gameRules.uniqueMagicCostModifiers` is referenced by `ContentPlacer.SetGameRules`, absent from inspected `GameRules.cs`, and unused by official templates.

`derived` means the editor field is a higher-level authoring helper rather than a literal low-level runtime field.

Examples:

- `template.displayWinCondition`
- `winConditions.preset`

## UI Usage

Use these exports:

```ts
import {
  getEditorField,
  getEditorSchema,
  listEditorFields,
  listEditorFieldsByEditLevel,
  listEditorFieldsBySourceStatus,
} from "./core";
```

Typical UI flow:

1. Read sections from `getEditorSchema().sections`.
2. Render fields from `listEditorFields(sectionId)`.
3. Pick controls from `kind`, `picker`, and `validation`.
4. Prefer `applyEditorAction` with `type: "field.update"` for first-class fields.
5. Put `compatibility` and `preserveOnly` fields in an advanced/raw inspector.

Do not directly assign JSON fields from UI controls. Use `docs/rmg/editor-actions.md` for the command bridge.

## Critical Semantics Captured

- Zone pool fields are sampled alternatives, not cumulative includes.
- Zone mandatory-content and content-count-limit refs are sampled alternatives.
- Guard reaction distributions must contain exactly 6 slots in enum order: Aggressive, Negative, Common, Friendly, Peaceful, Docile.
- Content-pool groups can include named lists and direct weighted RMG content.
- Mandatory content can reference direct SIDs, weighted content options, lists, and placement rules.
- City Hold and Tournament are named official win-condition concepts, but their runtime path is less proven than Classic/Desertion/HeroLighting/LostStartCity/LostStartHero/GladiatorArena.
- Official connection compatibility fields are preserved separately from declared connection schema.

## Verification

Run:

```bash
npm run check
npm test
```

`npm test` includes:

- mutation invariants
- editor-schema invariants

The schema invariant test rejects:

- missing required sections
- missing required field IDs
- duplicate field IDs
- empty source evidence
- enum fields without allowed values
- first-class fields without mutation routes
- accidental reclassification of important compatibility fields
