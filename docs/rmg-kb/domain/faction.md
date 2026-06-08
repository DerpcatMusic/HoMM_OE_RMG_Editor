# Faction

## Entity Card

- Name: `Faction`
- Category: semantic content/ownership/biome alignment concept
- Source Types: `FactionRule`, `ContentDatabase`, `TemplateContext`, `extracted/Core/DB/data.json`
- Authoring Representation: faction rules on main objects
- Runtime Representation: resolved faction sid per main object
- References Out: city props, biomes, hero pools
- References In: faction rules, available fractions
- Critical Invariants: faction rules must resolve against available factions
- Editor Risks: hiding fallback behavior when filtered lists go empty

## Code Fact

Available playable factions in this data slice are:

- `human`
- `undead`
- `unfrozen`
- `dungeon`

## Observed In Shipped Templates

- faction rules commonly use `FromList` and `Match`
- maps often enforce “different from spawn faction” semantics

## Inference

Faction resolution is part of template correctness, not just cosmetic content flavor.
