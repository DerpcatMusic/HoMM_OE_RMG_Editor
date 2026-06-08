# Spawn

## Entity Card

- Name: `Spawn`
- Category: main-object subtype and player anchor
- Source Types: `MainObjectType.Spawn`, `MapObjectsRegistry.AddCity`, `Generator.GetMetaInfo`
- Authoring Representation: main object with `type = Spawn` and required `spawn`
- Runtime Representation: `city-spawner` object plus spawn owner prop
- References Out: player side, zone biome/faction rules, roads, win/loss semantics
- References In: roads, biome rules, faction rules, player semantics
- Critical Invariants: `spawn` must be present and valid
- Editor Risks: confusing spawn with generic city

## Code Fact

Spawn is authored as a main object but runtime behavior treats it as a special owned city-spawner anchor.

## Distinction

- `Spawn` is a player start anchor
- `City` is a regular city anchor that may or may not be owned
- `AbandonedOutpost` is another city-like anchor but not a player spawn

## Observed In Shipped Templates

- every playable template introduces players through spawn main objects
- spawn objects frequently use `removeGuardIfHasOwner`

## Inference

The future editor should render spawns as first-class player-entry nodes, not only as one city flavor.
