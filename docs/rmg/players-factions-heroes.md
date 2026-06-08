# Players, Factions, and Heroes

This document covers the RMG-visible player slots, main-object `spawn`/`owner` semantics, faction rule resolution, biome matching, observed hero pools, and editor implications.

## Status

- `done`: player-slot planning, spawn ownership via main objects, hero-count setting edits, and bulk zone/main-object mutation support.
- `partial`: faction and biome matching are documented and validated, but not all authoring paths are surfaced in UI.
- `missing`: dedicated player-planning UI and faction/hero planning tools.

## Terminology

- The code and data usually spell factions as `fractions`. Treat `fraction`, `faction`, and UI "faction" as the same domain unless a field name is quoted exactly.
- Template main objects use the singular field `faction`; older shipped templates also contain empty `factions` arrays in some objects. The runtime `RandomMapTemplate.MainObject` model only defines `faction`, not `factions`.
- Player slots are parsed through `ESpawn` enum values. The enum definition is outside this repo snapshot, but shipped RMG templates exercise `Player1` through `Player8`.

## Player Slots

Observed player identifiers in shipped templates:

- `Player1` and `Player2`: common in `Crossroads.rmg.json`, `Harmony.rmg.json`, `Helltide.rmg.json`, `Jebus Cross.rmg.json`, `Jebus Outcast.rmg.json`, and `Memory Lane.rmg.json`.
- `Player1` through `Player3`: `Shamrock.rmg.json`.
- `Player1` through `Player4`: `Fair'n Square.rmg.json`.
- `Player1` through `Player8`: `bbolbval.rmg.json`.

Exact examples:

- `external/map_templates/Shamrock.rmg.json:299`, `:503`, and `:707` define Spawn main objects for `Player1`, `Player2`, and `Player3`.
- `external/map_templates/Fair'n Square.rmg.json:53-54`, `:107-108`, `:162-163`, and `:221-222` define Spawn main objects for `Player1` through `Player4`.
- From the older `GameDB/RMGMAPS` sample, `bbolbval.rmg.json:15-17`, `:39-41`, `:63-65`, `:87-89`, `:111-113`, `:135-137`, `:159-161`, and `:183-185` define Spawn main objects for `Player1` through `Player8`.

Parser behavior:

- A `MainObject` with `type == "Spawn"` must have a non-null `spawn`, and `spawn` must parse as `ESpawn`; otherwise the parser throws a `GeneratorException`. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:103-112`.
- `owner`, when present, is also parsed as `ESpawn`; invalid owners throw a `GeneratorException`. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:114-120`.
- Parsed `spawn` and `owner` values are copied separately into `MapDescription.MainObject`. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:221-223`.

## Spawn vs Owner

`spawn` and `owner` are not interchangeable.

- `spawn` identifies the player slot for a Spawn main object. It is required only when `type` is `Spawn`.
- `owner` assigns ownership to the generated main object. It is optional and can be present independently of `spawn`.
- `RandomMapTemplate.MainObject` has both fields plus separate runtime fields `spawnEnum` and nullable `ownerEnum`. Source: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:149-153` and `:187-191`.

Shipped-template patterns:

- Most classic templates set `spawn` on Spawn main objects and omit `owner`; examples include `Crossroads.rmg.json:170` and `:215`, `Helltide.rmg.json:199` and `:284`, and `Jebus Cross.rmg.json:193` and `:271`.
- `Fair'n Square.rmg.json` uses both concepts in a zone: the Spawn object has `spawn`, while a second main object in the same spawn zone has `owner` and `faction: { "type": "Match", "args": [ "0" ] }`; examples are `external/map_templates/Fair'n Square.rmg.json:53-64`, `:107-118`, `:162-174`, and `:221-235`.
- From the older `GameDB/RMGMAPS` sample, `bbolbval.rmg.json` puts both `spawn` and matching `owner` on every Spawn object for `Player1` through `Player8`; examples are `GameDB/RMGMAPS/bbolbval.rmg.json:15-17` and `:183-185`.
- `Jebus Outcast.rmg.json` also contains variants where Spawn objects have owners, e.g. `external/map_templates/Jebus Outcast.rmg.json:1544-1548`.

Editor implications:

- Model `spawn` as a required player slot for `type: "Spawn"` only.
- Model `owner` as an optional ownership field on any main object that supports ownership, not as a synonym for `spawn`.
- Do not auto-fill `owner` from `spawn` unless the editor offers that as an explicit convenience action.
- Validate `Player1` through `Player8` as observed shipped values. If the editor can inspect the game enum at runtime, prefer that enum as the source of truth.

## Active Fractions / Factions

`extracted/Core/DB/data.json` defines two related lists:

- `fractions`: `human`, `undead`, `unfrozen`, `dungeon`, `neutral`, `mix`. Source: `extracted/Core/DB/data.json:5-12`.
- `availableFractions`: `human`, `undead`, `unfrozen`, `dungeon`. Source: `extracted/Core/DB/data.json:13-18`.

Runtime behavior uses `availableFractions` for random faction selection and filtering:

- `ContentDatabase.FilterFactions` accepts only entries present in `DB.Instance().dataInc.availableFractions`. Existing factions outside that active list log `"Faction '<id>' is not in the active list."`; unknown ids log `"Faction '<id>' doesn't exist."` Source: `GameEngineMapGenerator/MapGenerator/ContentDatabase.cs:228-249`.
- `ContentDatabase.GetRandomFaction` chooses from `availableFractions`. Source: `GameEngineMapGenerator/MapGenerator/ContentDatabase.cs:253-257`.
- `ContentDatabase.AvailableFactions()` returns `availableFractions`. Source: `GameEngineMapGenerator/MapGenerator/ContentDatabase.cs:259-262`.

Editor implications:

- Use `availableFractions` for normal RMG faction pickers: `human`, `undead`, `unfrozen`, `dungeon`.
- Show non-active known fractions (`neutral`, `mix`) as data-known but not valid for active random faction rules unless runtime data changes.
- `nature` and `demon` appear in biome mapping, but are not active in `availableFractions` in this snapshot.

## Faction Rules

Schema:

- `RandomMapTemplate.MainObject.faction` is a `FactionRule`. Source: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:161`.
- `FactionRule` has `type`, defaulting to `FromList`, and `args`. Source: `GameEngineMapGenerator/MapGenerator/FactionRule.cs:6-10`.
- Valid rule types are `FromList` and `Match`. Source: `GameEngineMapGenerator/MapGenerator/FactionRuleType.cs:3-7`.

Parsing:

- Main-object indexes in rule args are zero-based and must be in range. Source: `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:8-28`.
- Zone references are zone names matched against the selected template variant. Source: `GameEngineMapGenerator/MapGenerator/RuleParseUtils.cs:31-45`.
- `FromList` treats ordinary args as candidate faction ids and args starting with `differentFrom:` as exclusions. Faction exclusions require a main-object index and may include an optional zone name. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:1038-1078`.
- `Match` requires a main-object index and may include an optional zone name. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:1081-1091`.

Resolution:

- If Spawn factions are passed externally, a Spawn main object can receive `spawnFactions[spawnIndex]` before its authored `faction` rule is parsed. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:594-605`.
- `FromList` resolves dependencies first, excludes factions from referenced main objects, filters candidates through `ContentDatabase.FilterFactions`, and falls back to all `AvailableFactions()` when the filtered candidate list is empty. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:631-655` and `:720-728`.
- If every active faction is excluded, it falls back to a fully random active faction. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:729-737` and `GameEngineMapGenerator/MapGenerator/ContentDatabase.cs:253-257`.
- `Match` copies the resolved faction from another main object, in the current zone by default or in the named zone if supplied. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:656-666` and `:681-684`.
- Circular faction dependencies throw a `GeneratorException`. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:669-672`.

Examples from shipped templates:

- `Jebus Cross.rmg.json:96` uses `FromList` with empty args, which means random active faction after fallback.
- `Crossroads.rmg.json:83` and `:129` use `FromList` with `differentFrom: 0 Spawn-A` and `differentFrom: 0 Spawn-B`.
- `Harmony.rmg.json:96` uses multiple cross-zone `differentFrom` exclusions, including references to object index `1` in spawn zones.
- `Shamrock.rmg.json:144`, `:196`, and `:248` use `Match` to copy the center faction into related center zones.
- `Fair'n Square.rmg.json:281-291` uses two `Match` rules in one treasure zone to align objects with two different player spawns.

Editor implications:

- Present `FromList` as candidates plus exclusions, not as a raw string list only.
- Preserve exact `differentFrom: <mainObjectIndex> [ZoneName]` strings on round-trip.
- Warn if `FromList.args` includes inactive factions (`neutral`, `mix`, `nature`, `demon` in this snapshot), because runtime filters them out or logs config errors.
- Warn when exclusions cover all active factions; runtime still succeeds but discards the exclusion intent by selecting a random active faction.
- Graph `Match` and `differentFrom` dependencies to detect circular references before generation.

## Biome Matching

Schema:

- Zones define `zoneBiome`, `contentBiome`, and `metaObjectsBiome`, each a `BiomeRule`. Source: `GameEngineMapGenerator/MapGenerator/RandomMapTemplate.cs:40-46`.
- `BiomeRule` has `type`, defaulting to `MatchZone`, and `args`. Source: `GameEngineMapGenerator/MapGenerator/BiomeRule.cs:6-10`.
- Valid biome rule types are `FromList`, `MatchZone`, and `MatchMainObject`. Source: `GameEngineMapGenerator/MapGenerator/BiomeRuleType.cs:3-8`.

Data:

- `extracted/Core/DB/biomes_info.json` maps `Grass -> human`, `Deathland -> undead`, `Dirt -> dungeon`, `Autumn -> nature`, `Lava -> demon`, `Snow -> unfrozen`, and `Sand -> neutral`. Source: `extracted/Core/DB/biomes_info.json:1-15`.
- Hero files confirm the active faction/native biome pairing for skirmish factions: `human/Grass`, `undead/Deathland`, `unfrozen/Snow`, and `dungeon/Dirt`. Sources: `extracted/Core/DB/heroes/humans/human_hero_1.json:5-13`, `extracted/Core/DB/heroes/necros/necro_hero_1.json:5-13`, `extracted/Core/DB/heroes/unfrozen/unfrozen_hero_1.json:5-13`, `extracted/Core/DB/heroes/dungeon/dungeon_hero_1.json:5-13`.

Resolution:

- `MatchMainObject` resolves a biome through the referenced main object's resolved faction via `ContentDatabase.GetBiomeIdForFaction`. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:817-821` and `GameEngineMapGenerator/MapGenerator/ContentDatabase.cs:271-275`.
- `MatchZone` copies another zone's already resolved zone biome, or rolls a random biome when no zone arg is supplied. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:798-832`.
- `contentBiome` and `metaObjectsBiome` are resolved after zone biomes and can use `FromList`, `MatchZone`, or `MatchMainObject`. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:843-867`.
- `FromList` supports `differentFrom:` exclusions. For biome rules, `differentFrom:` may target either a zone name or a main-object index plus optional zone name. Source: `GameEngineMapGenerator/MapGenerator/MapDescriptionBuilder.cs:945-989` and `:872-894`.

Shipped-template patterns:

- Spawn zones typically use `zoneBiome/contentBiome/metaObjectsBiome: { "type": "MatchMainObject", "args": [ "0" ] }`, tying terrain/content/meta-object biome to the spawn faction. Examples: `Crossroads.rmg.json:178-180`, `Helltide.rmg.json:239-241`, and `Shamrock.rmg.json:308-310`.
- Neutral or center zones often use `FromList` with `Sand`, e.g. `Jebus Cross.rmg.json:140` and `Helltide.rmg.json:109-110`.
- Some templates use `MatchZone` for content/meta biomes, e.g. `Harmony.rmg.json:111-112` and `Memory Lane.rmg.json:344-346`.
- `Fair'n Square.rmg.json:301-303` uses biome `FromList` with `differentFrom` references to avoid spawn biomes.

Editor implications:

- For `MatchMainObject`, show the target faction and resulting biome when possible.
- For `MatchZone`, make it clear whether the rule copies another zone or, with no args, rolls randomly.
- Do not assume every biome has an active faction in RMG. `Autumn`, `Lava`, and `Sand` point to `nature`, `demon`, and `neutral`, which are not in `availableFractions` in this snapshot.

## Hero Pool Observations

Runtime:

- `TemplateContext` builds `HeroPoolCount` by iterating `DB.Instance().dataInc.availableFractions`, then each active fraction's `heroes`, excluding heroes removed from skirmish or banned by template/global bans. Source: `GameEngineMapGenerator/MapGenerator/TemplateContext.cs:57-68`.
- `extracted/Core/DB/data.json` bans `pvp_promo_hero_1` and `pvp_promo_hero_2`. Source: `extracted/Core/DB/data.json:47-50`.
- `extracted/Core/DB/data.json` lists campaign heroes separately, including tutorial heroes. Source: `extracted/Core/DB/data.json:53-80`.

Observed local hero folders:

- `extracted/Core/DB/heroes/humans`: 18 files, all observed with `fraction: "human"` and `nativeBiome: "Grass"`.
- `extracted/Core/DB/heroes/necros`: 18 files, all observed with `fraction: "undead"` and `nativeBiome: "Deathland"`.
- `extracted/Core/DB/heroes/unfrozen`: 18 files, all observed with `fraction: "unfrozen"` and `nativeBiome: "Snow"`.
- `extracted/Core/DB/heroes/dungeon`: 18 files, all observed with `fraction: "dungeon"` and `nativeBiome: "Dirt"`.
- `extracted/Core/DB/heroes/campaign_tutorial`: 21 files, observed as campaign/tutorial heroes rather than active skirmish faction folders.

Important caveat:

- The C# runtime counts heroes through `DB.me.fractions.Get(id).heroes`, but the fraction config source containing those hero arrays is not present as a standalone JSON file in this repo snapshot. The folder inventory above is therefore an observation from `extracted/Core/DB/heroes`, not the definitive runtime hero list.

Editor implications:

- Use active faction to filter hero pools, and apply template `globalBans.heroes` plus DB bans when previewing available heroes.
- Treat campaign/tutorial heroes as separate from normal RMG skirmish pools unless a template or game mode explicitly includes them.
- Avoid offering `nature`/`demon` hero pools unless matching faction configs and hero folders are present.

## Shipped Template Summary

| Template | Observed players | Spawn/owner pattern | Faction/biome pattern |
| --- | --- | --- | --- |
| `Crossroads.rmg.json` | `Player1`, `Player2` | Spawn objects omit `owner`. | Center/treasure use `FromList` exclusions; side zones `Match` spawn factions; most biomes `MatchMainObject`. |
| `Fair'n Square.rmg.json` | `Player1`-`Player4` | Spawn object plus same-zone owned object per player. | Owned objects `Match` spawn faction; treasure zones mix player-faction matches and biome exclusions. |
| `Harmony.rmg.json` | `Player1`, `Player2` | Spawn objects omit `owner`. | Uses object index `1` as spawn faction anchor in spawn zones; center/side factions use cross-zone `Match` and `differentFrom`. |
| `Helltide.rmg.json` | `Player1`, `Player2` | Spawn objects omit `owner`. | Win zones match player spawn factions but use Sand zone/content biomes. |
| `Jebus Cross.rmg.json` | `Player1`, `Player2` | Spawn objects omit `owner`. | Center has empty `FromList` and multiple `differentFrom` rules; spawn/side objects match local spawn factions. |
| `Jebus Outcast.rmg.json` | `Player1`, `Player2` | Variants include owned spawn objects. | Heavy use of `Match` and `FromList` exclusions across center/spawn/side zones. |
| `Memory Lane.rmg.json` | `Player1`, `Player2` | Spawn objects omit `owner`. | Contains legacy empty `factions` arrays and many biome rules; no singular `faction` rules observed in current inventory. |
| `Shamrock.rmg.json` | `Player1`-`Player3` | Spawn objects omit `owner`. | Center faction differs from all three spawns; many side/center zones match center or owning spawn. |
| `bbolbval.rmg.json` | `Player1`-`Player8` | Every Spawn object has matching `owner`. | Minimal generated test-like map; no faction/biome rules observed. |

## Round-Trip Rules for Editors

- Preserve `faction` exactly and do not write `factions` unless intentionally supporting legacy/unknown fields.
- Preserve `spawn` and `owner` independently.
- Keep rule args as ordered strings even if the editor exposes structured controls.
- Use zero-based main-object indexes in serialized rule args.
- Use exact zone names in cross-zone references.
- Validate against active factions from `extracted/Core/DB/data.json:13-18`, not the broader `fractions` list.
- Surface biome/faction mismatches: active factions map cleanly to `Grass`, `Deathland`, `Snow`, and `Dirt`, while `Autumn`, `Lava`, and `Sand` point to inactive/non-player factions in this snapshot.
