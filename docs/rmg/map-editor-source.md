# Map Editor Source Notes

`GameEngineMapGenerator/MapEditor` is now present in this workspace. It appears to be decompiled/stripped source: many method bodies are empty or return defaults, and several member names are obfuscated. Treat it as structural evidence for editor UI domains, not as a reliable behavior implementation.

For RMG behavior, prefer `GameEngineMapGenerator/MapGenerator`.

## Useful Signals

The map editor source shows the fixed-map editor has UI modules for:

- map creation and generated-map entry points
- save/load browser
- map settings
- win conditions
- object properties
- portals
- squads and guards
- owners, spawns, heroes, sides
- random hires, random items, random squads
- quests, events, rewards, markers, comments
- map bonuses and difficulty settings
- brush/tools/areas/node visualization

Representative source files:

- `GameEngineMapGenerator/MapEditor/BhMapEditor.cs`
- `GameEngineMapGenerator/MapEditor/BhNewGenMap.cs`
- `GameEngineMapGenerator/MapEditor/BhSaveLoad.cs`
- `GameEngineMapGenerator/MapEditor/BhMapSettings.cs`
- `GameEngineMapGenerator/MapEditor/BhWinConditions.cs`
- `GameEngineMapGenerator/MapEditor/BhPropertiesPortal.cs`
- `GameEngineMapGenerator/MapEditor/BhGuardView.cs`
- `GameEngineMapGenerator/MapEditor/BhRandomHireView.cs`
- `GameEngineMapGenerator/MapEditor/BhRandomItemView.cs`
- `GameEngineMapGenerator/MapEditor/BhRandomSquadView.cs`

## Generated Map Entry

`BhNewGenMap` is the clearest editor-side clue that the shipped editor had a generated-map workflow. It has serialized UI fields for:

- template dropdown
- template input field
- seed input field
- map size list

Source: `GameEngineMapGenerator/MapEditor/BhNewGenMap.cs:8`.

The methods are empty in this source dump, so it does not reveal the actual button behavior. Use `Generator.Generate()` and `GeneratorConfig.TryGetMapTemplateJsonByName()` from `GameEngineMapGenerator/MapGenerator` for real generation behavior.

## Save/Load

`BhSaveLoad` exposes open/save/open-folder modes and file/folder UI elements. Method bodies are stripped, but the class layout confirms the fixed editor has a file browser abstraction.

Source: `GameEngineMapGenerator/MapEditor/BhSaveLoad.cs:8`.

`BhMapEditor` exposes `Save(string _mapName, string _path = "", bool refreshMapName = true)`, `Load(MapData _mapData)`, and `Load(pv fileHandle)` method signatures. This is relevant if the RMG editor eventually exports generated map data into the normal map editor format.

Source: `GameEngineMapGenerator/MapEditor/BhMapEditor.cs:313`.

## Win Conditions

`BhWinConditions` references:

- `BhWinCondition`
- `BhGladiatorArenaSettings`
- `BhTournamentSettings`
- `MapWinCondition`
- `TypeWinCondition`

Source: `GameEngineMapGenerator/MapEditor/BhWinConditions.cs:9`.

`BhPropertiesWinConditionCityHold` exists in the editor source, which is notable because some RMG JSON uses `cityHoldDays`. This supports preserving `cityHoldDays` as a compatibility field even if the inspected `GameEngineMapGenerator/MapGenerator/WinConditions.cs` model is thinner.

Source: `GameEngineMapGenerator/MapEditor/BhPropertiesWinConditionCityHold.cs:7`.

## Portal And Connection-Relevant UI

`BhPropertiesPortal` has fields for:

- target label
- active toggle
- `PropPortals`
- object selection/targeting methods

Source: `GameEngineMapGenerator/MapEditor/BhPropertiesPortal.cs:7`.

This maps cleanly to RMG `portalFromEnabled` and `portalToEnabled`, but the editor source does not reveal the RMG connection-placement logic. Use `ContentPlacer` and `MapObjectsRegistry` for runtime portal placement.

## Guard And Squad UI

`BhGuardView` handles a `PropSquad` and exposes a `mainGuardToggle`. `BhRandomSquadView` exposes requested value, faction, tier, stack count, reaction, weekly increment, escape, diplomacy, obstruction, and main-guard controls.

Sources:

- `GameEngineMapGenerator/MapEditor/BhGuardView.cs:7`
- `GameEngineMapGenerator/MapEditor/BhRandomSquadView.cs:48`

These UI fields align with RMG connection and zone guard fields:

- `guardValue`
- `guardWeeklyIncrement`
- `guardReaction`
- `guardEscape`
- `guardCutoffValue`
- `guardMultiplier`
- `guardRandomization`

Runtime guard behavior remains in `GameEngineMapGenerator/MapGenerator/ContentPlacer.cs`.

## Random Object UI

The editor has dedicated panels for generator/randomized object props:

- `BhRandomHireView`: tier and fraction dropdowns for `PropRandomHire`.
- `BhRandomItemView`: rarity dropdown for `PropRandomItem`.
- `BhRandomSquadView`: detailed random squad controls.

Sources:

- `GameEngineMapGenerator/MapEditor/BhRandomHireView.cs:7`
- `GameEngineMapGenerator/MapEditor/BhRandomItemView.cs:7`
- `GameEngineMapGenerator/MapEditor/BhRandomSquadView.cs:48`

Editor implication: the RMG editor should expose random meta-objects as first-class editable records, not just opaque SIDs.

## Practical Takeaways For Our RMG Editor

- Use `MapEditor` as a taxonomy of editor panels and property concepts.
- Do not infer runtime behavior from empty methods.
- Use `MapGenerator` for all generation semantics.
- Preserve fields that the fixed-map editor recognizes even if the RMG C# model ignores them.
- Design our RMG editor around resolved references and previewable generator data, then optionally bridge into fixed-map editor concepts like portals, squads, owners, map settings, and win conditions.
