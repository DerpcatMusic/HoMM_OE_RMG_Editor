# Safe Refactors

## Source Files

- `reference-maps/*.md`
- `invariants/*.md`

## Inference

This is a required tooling contract derived from the documented reference graph.

## Safe Rename Rules

- renaming a zone must rewrite all zone-name consumers
- renaming a connection must rewrite all connection-name consumers
- renaming mandatory content must rewrite road targets and placement rules
- renaming local presets must rewrite all local references

## Safe Reorder Rules

- reordering main objects must rewrite:
  - road targets
  - faction rules
  - biome rules
  - `crossroadsPosition`
  - placement args where applicable

## Safe Delete Rules

- delete only after inbound references are enumerated
- if unresolved references would remain, block delete or offer rewrite path
