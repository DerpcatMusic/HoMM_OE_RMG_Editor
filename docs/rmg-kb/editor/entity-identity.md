# Entity Identity

## Source Files

- `schema/main-object.md`
- `reference-maps/index-based-references.md`
- `invariants/index-fragility.md`

## Inference

This is an editor design requirement derived from reference fragility.

## Problem

Several authored entities are referenced by name or by position. A future editor cannot rely on raw array order as stable identity.

## Recommended Identity Model

- zones: stable internal editor id plus authored `name`
- connections: stable internal editor id plus authored `name` or generated display label
- main objects: stable internal editor id plus display order index
- mandatory content entries: stable internal editor id plus optional authored `name`
- local presets: stable internal editor id plus authored `name`

## Why

- names are user-facing but mutable
- indices are runtime resolution aids but not stable authoring ids

## Consequence

Reorder becomes a transform over references, not a blind array move.
