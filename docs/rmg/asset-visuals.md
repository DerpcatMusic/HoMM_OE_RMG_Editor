# Asset Visual Catalog

The asset visual catalog is a generated bridge between Core.zip game-data SIDs and PNG textures exported by AssetRipper.

## Status

- `done`: Local ignored Texture2D cache at `.cache/assets/Texture2D`.
- `done`: Generated mapper from `.cache/game-data/*.json` catalogs to Texture2D PNG candidates.
- `done`: PNG dimension scanning without loading image libraries.
- `done`: Conservative scoring for exact, suffix, contains, reverse-contains, and meaningful token overlap.
- `done`: Hero generated catalog now preserves Core hero `icon` IDs.
- `missing`: UI consumption of the visual catalog.
- `missing`: Atlas/sprite-reference tracing for artifact, hero, and unit portraits.

## Source Paths

AssetRipper export source:

```text
/mnt/Gaming/SteamLibrary/steamapps/common/Heroes of Might and Magic Olden Era/AssetRipper_export_20260505_154541/Assets/Texture2D
```

Local cache:

```text
.cache/assets/Texture2D
```

Generated output:

```text
.cache/game-data/asset-visual-mappings.json
```

The local cache and generated visual mappings are ignored working data. They should be regenerated from the installed game, not committed.

## Refresh Command

Run:

```bash
npm run asset-visual:refresh
```

Optional arguments:

```bash
bun run src/cli/asset-visual-refresh.ts <project-root> <texture-dir>
```

The command expects the normal Core.zip catalogs to already exist under `.cache/game-data`. Refresh those first with:

```bash
npm run game-data:refresh
```

## Current Scan Result

Observed after copying the Texture2D export:

- `1571` PNG textures scanned.
- `1501` game-data entries considered for mapping.
- `3` high-confidence mappings.
- `28` medium-confidence mappings.
- `971` low-confidence mappings.

High-confidence examples are exact environmental/RMG object filename matches:

- `ice_2` -> `ice2.png`
- `market` -> `market.png`
- `arena` -> `arena.png`

Medium-confidence examples include biome/faction/environment UI assets:

- `Autumn` biome -> `autumn_city_ground1.png`
- `Grass` biome -> `Grass_sky_texture.png`
- `Snow` biome -> `Snow_backgroundImage.png`
- `undead` faction -> `Button_Necropolis_MouseOver_Center.png`
- `unfrozen` faction -> `unfrozen_logo.png`
- `chest` RMG content -> `-treasure-chest-80.png`
- `tavern` RMG content -> `Button_CityNavigation_Tavern.png`

## Important Finding

Texture2D filenames are not enough to reliably map individual artifact, hero, or unit portraits.

Evidence from the current export:

- Artifact SIDs such as `ambassadors_word_ambassadors_sash_artifact` and `ancient_idol_artifact` do not have direct Texture2D filename matches.
- Artifact hits mostly resolve to generic artifact frames or equipment slot UI, not actual item portraits.
- Unit searches mostly resolve to generic unit-card frames or 3D diffuse textures such as `angel-low_diffuse.png`.
- Hero records in Core.zip have `icon` IDs such as `hero_campaign_3_valentina`, but those icon IDs do not appear as direct Texture2D filenames in the scanned export.

The correct next step for real portraits is not broader fuzzy matching. It is to trace sprite/atlas/addressable references from Core `icon` IDs, artifact `icon` IDs, and UI atlas metadata.

## Generated Shape

`asset-visual-mappings.json` contains:

- `textures`: all PNGs with relative path, dimensions, normalized name, tokens, and rough categories.
- `mappings`: one entry per catalog entity with search keys and ranked candidates.
- `confidence`: `high`, `medium`, or `low` per candidate.
- `reasons`: why a candidate matched, such as `exact:<sid>`, `contains:<key>`, or `token-overlap:<key>:<count>`.

## UI Implications

Use this catalog safely:

- Show high-confidence matches directly.
- Show medium-confidence matches as suggested art only.
- Hide low-confidence matches by default unless the user opens a debug/mapping view.
- For artifacts, heroes, and units, prefer a missing-art placeholder until atlas tracing exists.
- For biomes and factions, visual candidates are useful enough for previews but still should expose their source and confidence.
