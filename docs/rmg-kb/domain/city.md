# City

## Entity Card

- Name: `City`
- Category: semantic owned/neutral strategic anchor
- Source Types: `MainObjectType.City`, `MainObjectType.Spawn`, `MainObjectType.AbandonedOutpost`, `MapObjectsRegistry`
- Authoring Representation: main object with type plus faction/owner/building config
- Runtime Representation: city-like map object with faction, optional owner, growth props
- References Out: ownership, faction, roads, win/loss context
- References In: roads, mandatory rules, faction/biome matching
- Critical Invariants: owner and faction semantics must be coherent
- Editor Risks: collapsing `City`, `Spawn`, and `AbandonedOutpost` into one undifferentiated UI

## Code Fact

`MapObjectsRegistry.AddCity(...)` creates different runtime object sids for:

- `City -> random-city`
- `Spawn -> city-spawner`
- `AbandonedOutpost -> abandoned_outpost`

## What Changes Between Them

- only `Spawn` carries `PropSpawn.owner`
- `City` may carry explicit `owner`
- all three can carry growth settings
- `removeGuardIfHasOwner` has different gameplay consequences depending on ownership state

## Observed In Shipped Templates

- owned cities are explicit in `Fair'n Square` and `Jebus Outcast`
- many neutral cities inherit faction through rules rather than explicit owner

## Inference

City editing should present:

- city flavor
- faction
- ownership
- guard behavior
- growth settings

as one combined semantic block.
