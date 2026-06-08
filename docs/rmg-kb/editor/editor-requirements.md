# Editor Requirements

## Source Files

- `architecture/*.md`
- `schema/*.md`
- `invariants/*.md`
- `reference-maps/*.md`

## Inference

This page is derived from the documented authoring/runtime semantics and breakpoints, not from a single runtime type.

## Core Requirements

- graph-first editing model
- semantic validation against generator rules
- local-definition catalog with usage counts
- stable identity for reorderable authored entities
- preview driven by resolved/runtime debug data

## Must Support Safely

- rename zone
- rename connection
- rename mandatory content
- rename local preset defs
- reorder main objects
- duplicate zones/presets with explicit reference strategy

## Must Not Assume

- JSON alone is enough for validation
- array order is stable identity
- same-named local defs across templates are equivalent
