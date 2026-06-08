# Ownership

## Entity Card

- Name: `Ownership`
- Category: semantic side assignment
- Source Types: `mainObject.owner`, `mainObject.spawn`, `mandatoryContent.owner`, `Content.owner`, `MapObjectsRegistry`
- Authoring Representation: `spawn` and `owner` fields
- Runtime Representation: owner props on runtime map objects
- References Out: players, cities, generated content, guard removal
- References In: main objects, mandatory content
- Critical Invariants: `spawn` and `owner` are not interchangeable
- Editor Risks: conflating starting side anchor with explicit owned city/content

## Code Fact

- `spawn` identifies the side attached to a `Spawn` main object
- `owner` assigns side ownership to a city or generated content object

## Spawn Vs Owner

- `spawn`
  - only meaningful on `type = Spawn`
  - creates start-side anchoring
- `owner`
  - meaningful on `City` and mandatory/generated content
  - does not by itself make an object a player spawn

## Observed In Shipped Templates

- some templates place explicit owned cities for players
- some only declare spawns and leave other cities neutral or faction-matched

## Inference

Ownership needs a dedicated editor panel because it touches:

- player structure
- guard removal
- loss conditions
- content semantics
