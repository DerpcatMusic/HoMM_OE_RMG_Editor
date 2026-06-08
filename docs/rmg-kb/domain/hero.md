# Hero

## Entity Card

- Name: `Hero`
- Category: adjacent gameplay concept that affects RMG
- Source Types: `GameRules`, `WinConditions`, `TemplateContext`, `Generator.GetMetaInfo`
- Authoring Representation: hero counts, bans, hero-hire ban, start-hero bonuses/win-loss semantics
- Runtime Representation: map settings and ban info; no direct hero object authored in `.rmg.json`
- References Out: player loss conditions, bonus receivers, faction availability
- References In: `heroCount*`, `heroHireBan`, `globalBans.heroes`, `lostStartHero`, bonus receiver filters
- Critical Invariants: hero constraints should align with game mode and player expectations
- Editor Risks: treating heroes as absent because they are not directly placed in template JSON

## Code Fact

RMG does not author heroes as direct placed template objects here. It controls hero behavior through:

- min/max/increment hero counts
- hire bans
- banned hero ids
- start-hero win/loss rules
- bonuses that target `start_hero`

## Observed In Shipped Templates

- `SingleHero` maps set `heroCountMin = heroCountMax = 1`
- those same maps often enable `lostStartHero`
- `heroHireBan` is true in single-hero style templates

## Inference

Hero documentation belongs in RMG because hero rules materially change player semantics and content availability, even though heroes are not tile-authored objects here.
