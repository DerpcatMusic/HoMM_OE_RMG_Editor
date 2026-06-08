# Validation Rules

## Source Files

- `schema/*.md`
- `invariants/*.md`
- `architecture/generation-pipeline.md`
- `invariants/official-template-anomalies.md`

## Inference

This page translates documented constraints into editor validation behavior.

## Blocking

- unresolved names or ids
- invalid enums
- invalid spawn ownership
- broken road targets
- cyclic faction or biome rules
- invalid preset references
- unresolved `ContentPoolConfig.groups[].includeLists[]` references unless an explicit compatibility alias is active
- local preset references that only exist in another template

## Advisory

- unnamed connections
- data/code discrepancy fields
- dangling optional fields
- suspicious duplicates
- official legacy fields ignored by the C# model, such as plural `mainObject.factions`
- scalar string in fields that the C# model declares as `string[]`
- `connection.guardZone` that resolves to a non-endpoint zone; runtime treats this as no guard zone

## Preview-Required Checks

- generation failure after successful parse/build
- missing mandatory content after placement
- conditional failures caused by sampled alternatives, especially `mandatoryContent[]`, `contentCountLimits[]`, and the three zone content-pool arrays

## Official Template Policy

- Official shipped anomalies should be visible, but not silently rewritten.
- New or edited templates should be held to stricter rules than imported official templates.
- Unknown official fields should round-trip by default.
- Compatibility aliases must be explicit data, not hardcoded guesswork in validators.

## Conditional Validation Policy

- Treat zone pool arrays as alternatives; the engine samples one id from each array.
- Treat `mandatoryContent[]` and `contentCountLimits[]` as alternatives; the engine samples one preset id, not all presets.
- Validate roads and placement rules against the selected zone context. Connection targets must exist, be incident to the zone, and not be `Proximity`.
- A road targeting mandatory content is safe only if the targeted content exists under every selectable mandatory preset, unless the editor models the road as conditional.
