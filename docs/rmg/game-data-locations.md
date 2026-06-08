# Game Data Locations

This workspace now has stable local references to the installed game data.

## Local References

| Path | Type | Meaning |
| --- | --- | --- |
| `external/Core.zip` | symlink | Points to the installed Steam `Core.zip`. |
| `external/map_templates` | symlink | Points to the installed Steam `StreamingAssets/map_templates` folder. |
| `.cache/game-data` | generated cache | Compact catalogs generated directly from `external/Core.zip` without extracting the zip. |
| `.cache/assets/Texture2D` | generated/cache copy | Local ignored copy of the AssetRipper Texture2D PNG export for visual mapping. |
| `extracted/Core` | extracted copy | Local extraction of `external/Core.zip` for fast source inspection. |

Steam source paths:

- `/mnt/Gaming/SteamLibrary/steamapps/common/Heroes of Might and Magic Olden Era/HeroesOldenEra_Data/StreamingAssets/Core.zip`
- `/mnt/Gaming/SteamLibrary/steamapps/common/Heroes of Might and Magic Olden Era/HeroesOldenEra_Data/StreamingAssets/map_templates`
- `/mnt/Gaming/SteamLibrary/steamapps/common/Heroes of Might and Magic Olden Era/AssetRipper_export_20260505_154541/Assets/Texture2D`

## Counts Observed

- `external/map_templates`: 56 `.rmg.json` templates.
- `.cache/game-data/rmg-content.json`: 872 RMG content SID entries generated from `Core.zip`.
- `.cache/game-data/artifacts.json`: 154 artifact map-object entries generated from `Core.zip`.
- `.cache/game-data/content-pools.json`: 532 Core content pool summaries generated from `Core.zip`.
- `.cache/game-data/content-lists.json`: 211 Core content list summaries generated from `Core.zip`.
- `.cache/game-data/factions.json`: 8 faction IDs generated from `Core.zip`; 6 are playable factions from `DB/data.json.availableFractions`.
- `.cache/game-data/biomes.json`: 7 biome mappings generated from `Core.zip`.
- `.cache/game-data/heroes.json`: 177 hero definitions generated from `Core.zip`; standard faction rosters are 18 heroes per playable faction.
- `.cache/game-data/magics.json`: 131 magic definitions generated from `Core.zip`.
- `.cache/game-data/units.json`: 152 unit logic definitions generated from `Core.zip`.
- `.cache/game-data/asset-visual-mappings.json`: 1571 Texture2D PNGs scanned and 1501 game-data entries mapped to visual candidates.
- `extracted/Core/generator/content_pools`: 73 JSON files.
- `extracted/Core/generator/content_pools`: 532 content pool definitions total.
- Live templates reference 399 unique content pool names; all 399 resolve against `extracted/Core/generator/content_pools`.
- `extracted/Core/generator/content_lists`: 17 JSON files.
- `extracted/Core/generator/zone_layouts`: 1 JSON file.

## Important RMG Paths

- Real templates: `external/map_templates/*.rmg.json`
- Extracted core DB: `extracted/Core/DB`
- Biomes: `extracted/Core/DB/biomes_info.json`
- Global data: `extracted/Core/DB/data.json`
- Heroes: `extracted/Core/DB/heroes`
- Content pools: `extracted/Core/generator/content_pools`
- Content lists: `extracted/Core/generator/content_lists`
- Encounter templates: `extracted/Core/generator/encounter_templates`
- Zone layouts: `extracted/Core/generator/zone_layouts`

## Editor Implication

Use `external/map_templates` as the full live template source. For UI picker catalogs, prefer generated files under `.cache/game-data`; they are generated directly from `external/Core.zip` and do not require a full extracted copy. `extracted/Core` remains useful for debugging, source inspection, and resolver smoke tests.

The older checked-in `GameDB/RMGMAPS` folder (no longer maintained) is only a partial sample; the project now uses live symlinks to the installed game data.

## Core.zip Refresh

Run:

```bash
npm run game-data:refresh
```

This reads `external/Core.zip` directly with `unzip`, without unpacking the whole archive. It writes:

- `.cache/game-data/manifest.json`
- `.cache/game-data/artifacts.json`
- `.cache/game-data/rmg-content.json`
- `.cache/game-data/content-pools.json`
- `.cache/game-data/content-lists.json`
- `.cache/game-data/factions.json`
- `.cache/game-data/biomes.json`
- `.cache/game-data/heroes.json`
- `.cache/game-data/magics.json`
- `.cache/game-data/units.json`

The manifest records the Core.zip path, size, mtime, and a source fingerprint so the future app can detect when the installed game data changed and refresh catalogs.

Generated catalog source map:

- `artifacts.json`: `DB/map/objects/6_artifacts.json`, `DB/objects_logic/items/artifacts.json`, `DB/items/items`, `DB/items/item_sets`, `DB/data.json`, and localization text.
- `rmg-content.json`: `DB/map/objects`, `DB/objects_logic`, `generator/generator_config.json`, official content pools/lists, and localization text.
- `content-pools.json`: `generator/content_pools`.
- `content-lists.json`: `generator/content_lists`.
- `factions.json`: `DB/data.json`, `DB/fractions`, `DB/heroes`, and localization text.
- `biomes.json`: `DB/biomes_info.json` and `generator/generator_config.json`.
- `heroes.json`: `DB/heroes`, `DB/data.json`, and localization text.
- `magics.json`: `DB/magics`, `DB/data.json`, and localization text.
- `units.json`: `DB/units/units_logics`, `DB/data.json`, and localization text.

## Asset Visual Refresh

Run:

```bash
npm run asset-visual:refresh
```

This reads `.cache/assets/Texture2D` and generated catalogs under `.cache/game-data`, then writes `.cache/game-data/asset-visual-mappings.json`.

The visual mapper is intentionally conservative. Current Texture2D filenames support some environment, biome, faction, and UI-object candidates, but do not reliably expose individual artifact, hero, or unit portraits. For those, the editor needs a later atlas/reference tracing pass from Core `icon` IDs and Sprite/atlas metadata.

## Reproducible Scan

Run:

```bash
python3 tools/rmg_scan.py --format markdown
```

This reports live template counts, pool resolution, connection-type totals, player references, and known schema-shape anomalies.
