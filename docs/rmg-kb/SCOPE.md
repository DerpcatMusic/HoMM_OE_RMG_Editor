# Scope

## In Scope

- all top-level `.rmg.json` fields used by the authoring model
- local reusable definitions inside templates:
  - `zoneLayouts`
  - `mandatoryContent`
  - `contentCountLimits`
  - `contentPools`
  - `contentLists`
- generator resolution semantics that affect authoring correctness
- template-local and cross-object references
- player, hero, city, faction, spawn, ownership, and win/loss concepts where they directly affect RMG
- shipped template archetypes in `external/map_templates`
- editor-facing invariants and safe-refactor implications

## Out Of Scope

- full `GameDB` encyclopedic coverage
- full gameplay rules outside RMG relevance
- exhaustive hero/unit/item/spell documentation
- runtime implementation changes
- full machine-generated JSON Schema
- porting or rewriting the generator

## Normative Boundary

- This knowledge base is normative for RMG authoring semantics only where backed by inspected code.
- Where shipped templates contain fields not represented in currently inspected primary types, the discrepancy is documented and flagged.

## Audience

- engineers building tooling
- engineers extracting a headless RMG core
- agents or contributors implementing validation or editor workflows

## Non-Goal Reminder

This directory should not drift into a general game design wiki.
