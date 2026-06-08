# Authoring Vs Runtime

## Purpose

Explain the split between raw `.rmg.json` authoring and the resolved runtime objects used by generation.

## Source Files

- `RandomMapTemplate.cs`
- `MapDescription.cs`
- `MapDescriptionBuilder.cs`

## Code Fact

- `RandomMapTemplate` is the raw authoring model.
- `MapDescription` is the resolved runtime model built from one sampled variant.
- `MapDescriptionBuilder.Build(...)` parses raw JSON, resolves local/global definitions, chooses a variant, resolves factions and biomes, parses roads and rules, and returns `MapDescription`.

## Authoring Layer

The authoring layer contains:

- top-level template metadata
- `gameRules`
- `variants`
- local reusable definitions
  - `zoneLayouts`
  - `mandatoryContent`
  - `contentCountLimits`
  - `contentPools`
  - `contentLists`

It also contains unresolved references:

- zone names
- connection names
- mandatory content names
- string-encoded main object indices
- enum values encoded as strings

## Runtime Layer

The runtime layer contains:

- sampled `templateVariant`
- resolved zone, content, and meta biomes
- resolved factions per main object
- resolved content pools and count limits
- resolved placement rules
- integer zone indices instead of many string names

## Why The Split Matters

- schema validation alone is not enough
- many fields are legal JSON but semantically broken
- editor preview should not operate directly on raw JSON semantics
- safe-refactor tooling must understand both authoring identities and runtime resolution

## Observed In Shipped Templates

- all shipped files are authored as raw `.rmg.json`
- all use local reusable definitions heavily
- all rely on string references and defaults

## Inference

The future editor should preserve a clear boundary:

- edit `RandomMapTemplate`-shaped data
- preview and validate through `MapDescription`-shaped resolution
