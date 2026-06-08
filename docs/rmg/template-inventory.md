# RMG Template Inventory

Inventory of the older partial sample (previously `GameDB/RMGMAPS/*.rmg.json`). The project now uses `external/map_templates/*.rmg.json` as the live symlinked source.

## Status

- `done`: the legacy sample inventory and its quirks are documented.
- `partial`: it is older sample data, not the authoritative live template set.
- `missing`: a full rewrite of this file around the live installed template inventory.

For current installed game templates, use `external/map_templates/*.rmg.json`. That symlink points at the Steam `StreamingAssets/map_templates` folder and currently contains 56 `.rmg.json` templates. The full live template inventory has not yet replaced this file.

Notes:

- `Default` connection type means `connectionType` is absent.
- All templates except `bbolbval` have empty embedded `contentPools`/`contentLists`; their zone pool references are external/shared.
- Template-specific pool references now resolve against extracted installed Core data under `extracted/Core/generator/content_pools`.
- Spawn observations are based on `mainObjects` entries with `type: "Spawn"` or a `spawn` field.

## Crossroads

Source: [`external/map_templates/Crossroads.rmg.json`](../../external/map_templates/Crossroads.rmg.json) (`name` L2, `variants` L29, first `zones` L45, `connections` L445, `zoneLayouts` L562, top-level `mandatoryContent` L661, `contentCountLimits` L744, `contentPools` L839).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `SuperTreasure`, `Treasure`, `Spawn-A`, `Spawn-B`, `Side-A`, `Side-B`, `Connector-A`, `Connector-B`, `Connector-SuperTreasure`.
- Connections: 11 total; `Direct=9`, `Portal=1`, `Proximity=1`; `Spawn-A-Side-A`, `Side-A-Connector-SuperTreasure`, `Side-A-Connector-A`, `Spawn-B-Side-B`, `Side-B-Connector-SuperTreasure`, `Side-B-Connector-B`, `Connector-SuperTreasure-SuperTreasure`, `Connector-A-Treasure`, `Connector-B-Treasure`, `SuperTreasure-Treasure`, `Pseudo-SuperTreasure-Treasure`.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_sides`, `zone_layout_spawn`; count limits `content_limits_supertreasure`, `content_limits_spawn`, `content_limits_connector`, `content_limits_treasure`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_spawn`, `mandatory_content_connector`, `mandatory_content_treasure`, `mandatory_content_supertreasure`.
- Referenced content pools: `content_pool_general_resources_side_zone_poor`, `content_pool_general_resources_start_zone_poor`, `content_pool_general_resources_treasure_zone_poor`, `template_pool_crossroads_guarded_connector_zone`, `template_pool_crossroads_guarded_start_zone`, `template_pool_crossroads_guarded_supertreasure_zone`, `template_pool_crossroads_guarded_treasure_zone`, `template_pool_crossroads_unguarded_connector_zone`, `template_pool_crossroads_unguarded_start_zone`, `template_pool_crossroads_unguarded_supertreasure_zone`, `template_pool_crossroads_unguarded_treasure_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`.
- Suspicious unresolved/unknown fields: `SuperTreasure` uses string `contentCountLimits` at L64 instead of an array; `Treasure` city has both `faction` and empty `factions` at L130; referenced content pools are not embedded locally.

## Fair'n Square

Source: [`external/map_templates/Fair'n Square.rmg.json`](../../external/map_templates/Fair'n%20Square.rmg.json) (`name` L1, `variants` L28, first `zones` L36, `connections` L698, `zoneLayouts` L859, top-level `mandatoryContent` L919, `contentCountLimits` L977, `contentPools` L1084).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `Spawn-A`, `Spawn-B`, `Spawn-C`, `Spawn-D`, `Treasure-1`, `Treasure-2`, `Treasure-3`, `Treasure-4`, `Treasure-5`, `Treasure-6`, `Treasure-7`, `Treasure-8`.
- Connections: 16 total; `Direct=8`, `Portal=8`; `Spawn-A-Treasure-1`, `Spawn-A-Treasure-2`, `Spawn-B-Treasure-3`, `Spawn-B-Treasure-4`, `Spawn-C-Treasure-2`, `Spawn-C-Treasure-3`, `Spawn-D-Treasure-1`, `Spawn-D-Treasure-4`, `Spawn-A-Treasure-5`, `Spawn-B-Treasure-8`, `Spawn-C-Treasure-7`, `Spawn-D-Treasure-6`, `Treasure-5-Treasure-6`, `Treasure-5-Treasure-7`, `Treasure-6-Treasure-8`, `Treasure-7-Treasure-8`.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_spawns`; count limits `content_limits_spawn`, `content_limits_treasure`, `content_limits_supertreasure`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_spawn`, `mandatory_content_treasure`.
- Referenced content pools: `content_pool_general_resources_start_zone_medium`, `content_pool_general_resources_treasure_zone_rich`, `content_pool_template_hallway_guarded_start_zone`, `content_pool_template_hallway_unguarded_start_zone`, `content_pool_template_square_guarded_treasure_zone`, `content_pool_template_square_unguarded_treasure_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`, `Spawn-C:Player3`, `Spawn-D:Player4`.
- Suspicious unresolved/unknown fields: referenced content pools are not embedded locally; no broken zone/connection references observed.

## Harmony

Source: [`external/map_templates/Harmony.rmg.json`](../../external/map_templates/Harmony.rmg.json) (`name` L2, `variants` L35, first `zones` L58, `connections` L486, `zoneLayouts` L603, top-level `mandatoryContent` L733, `contentCountLimits` L1048, `contentPools` L1290).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `Center-A`, `Center-B`, `Spawn-A`, `Spawn-B`, `Back-A`, `Back-B`, `Side-A`, `Side-B`.
- Connections: 11 total; `Direct=9`, `Proximity=2`; `Spawn-A-Side-A`, `Side-A-Center-A`, `Spawn-B-Side-B`, `Side-B-Center-B`, `Center-A-Center-B-1`, `Center-A-Center-B-2`, `Spawn-A-Back-A`, `Spawn-B-Back-B`, `Back-A-Back-B`, `Back-A-Spawn-B`, `Back-B-Spawn-A`.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_back`, `zone_layout_sides`, `zone_layout_spawn`; count limits `content_limits_center`, `content_limits_empty`, `content_limits_spawn`, `content_limits_side`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_center`, `mandatory_content_spawn`, `mandatory_content_side`, `mandatory_content_back`.
- Referenced content pools: `content_pool_general_resources_side_zone_poor`, `content_pool_general_resources_start_zone_poor`, `content_pool_general_resources_treasure_zone_poor`, `template_pool_harmony_guarded_center_zone`, `template_pool_harmony_guarded_side_zone`, `template_pool_harmony_guarded_start_zone`, `template_pool_harmony_unguarded_center_zone`, `template_pool_harmony_unguarded_side_zone`, `template_pool_harmony_unguarded_start_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`.
- Suspicious unresolved/unknown fields: `Center-A` and `Center-B` city objects have both `faction` and empty `factions` at L97 and L160; referenced content pools are not embedded locally.

## Helltide

Source: [`external/map_templates/Helltide.rmg.json`](../../external/map_templates/Helltide.rmg.json) (`name` L2, `variants` L45, first `zones` L68, `connections` L540, `zoneLayouts` L695, top-level `mandatoryContent` L792, `contentCountLimits` L1018, `contentPools` L1145).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `Center-Win-A`, `Center-Win-B`, `Spawn-A`, `Spawn-B`, `Spawn-A-Treasure-1`, `Spawn-A-Treasure-2`, `Spawn-B-Treasure-1`, `Spawn-B-Treasure-2`.
- Connections: 15 total; `Direct=12`, `GladiatorArena=1`, `Proximity=2`; `Win-Connection`, `Treasure-1-1`, `Treasure-2-2`, `Spawn-A-Spawn-A-Treasure-1-1`, `Spawn-A-Spawn-A-Treasure-1-2`, `Spawn-A-Spawn-A-Treasure-2-1`, `Spawn-A-Spawn-A-Treasure-2-2`, `Spawn-A-Treasure-1-Center-Win-A`, `Spawn-A-Treasure-2-Center-Win-A`, `Spawn-B-Spawn-B-Treasure-1-1`, `Spawn-B-Spawn-B-Treasure-1-2`, `Spawn-B-Spawn-B-Treasure-2-1`, `Spawn-B-Spawn-B-Treasure-2-2`, `Spawn-B-Treasure-1-Center-Win-B`, `Spawn-B-Treasure-2-Center-Win-B`.
- Embedded presets: zone layouts `zone_layout_wincondition_zone`, `zone_layout_treasure_zone`, `zone_layout_start_zone`; count limits `content_limits_center`, `content_limits_spawn`, `content_limits_side`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_center`, `mandatory_content_spawn`, `mandatory_content_side`.
- Referenced content pools: `content_pool_general_resources_start_zone_poor`, `content_pool_general_resources_start_zone_rich`, `content_pool_general_resources_treasure_zone_rich_no_scrolls`, `template_pool_helltide_guarded_side_zone`, `template_pool_helltide_guarded_start_zone`, `template_pool_helltide_unguarded_side_zone`, `template_pool_helltide_unguarded_start_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`.
- Suspicious unresolved/unknown fields: referenced content pools are not embedded locally; no broken zone/connection references observed.

## Jebus Cross

Source: [`external/map_templates/Jebus Cross.rmg.json`](../../external/map_templates/Jebus%20Cross.rmg.json) (`name` L2, `variants` L31, first `zones` L53, `connections` L471, `zoneLayouts` L718, top-level `mandatoryContent` L785, `contentCountLimits` L1257, `contentPools` L3972).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `Center`, `Spawn-A`, `Spawn-B`, `Side-C`, `Side-D`.
- Connections: 24 total; `Direct=20`, `Proximity=4`; named connections are `Center-A-Main`, `Center-B-Main`, `Center-C-Main`, `Center-D-Main`, `Pseudo-A-C`, `Pseudo-A-D`, `Pseudo-B-C`, `Pseudo-B-D`; 16 direct connections are unnamed.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_spawns`; count limits include `content_limits_center`, `content_limits_side`, plus generated pair variants `content_limits_center_*` and `content_limits_side_*`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_center`, `mandatory_content_side`.
- Referenced content pools: `content_pool_general_resources_start_zone_rich`, `content_pool_general_resources_treasure_zone_rich_no_scrolls`, `template_pool_jebus_cross_guarded_center_zone`, `template_pool_jebus_cross_guarded_start_zone`, `template_pool_jebus_cross_unguarded_center_zone`, `template_pool_jebus_cross_unguarded_start_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`.
- Suspicious unresolved/unknown fields: 16 unnamed direct connection objects in the connections section starting L471; referenced content pools are not embedded locally.

## Jebus Outcast

Source: [`external/map_templates/Jebus Outcast.rmg.json`](../../external/map_templates/Jebus%20Outcast.rmg.json) (`name` L2, `variants` L29, variant connection sections L482/L1120/L1758, `zoneLayouts` L1947, top-level `mandatoryContent` L2008, `contentCountLimits` L2944, `contentPools` L3057).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 3 unnamed variants, same zone names and connection pattern.
- Zones per variant: `Center`, `Spawn-A`, `Spawn-B`, `Side-C`, `Side-D`.
- Connections per variant: 22 total; `Direct=16`, `Proximity=6`; named connections are `Center-A-Main`, `Center-B-Main`, `Center-C-Main`, `Center-D-Main`, `Pseudo-Side-D-Side-C`, `Pseudo-Spawn-A-Spawn-B`, `Pseudo-A-C`, `Pseudo-A-D`, `Pseudo-B-C`, `Pseudo-B-D`; 12 direct connections per variant are unnamed.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_spawns`; count limits `content_limits_center`, `content_limits_spawn`, `content_limits_side`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_center`, `mandatory_content_spawn_1`, `mandatory_content_spawn_2`, `mandatory_content_spawn_3`, `mandatory_content_side`.
- Referenced content pools: `content_pool_general_resources_start_zone_rich`, `content_pool_general_resources_treasure_zone_rich`, `content_pool_template_jebus_outcast_pools_guarded_center_zone`, `content_pool_template_jebus_outcast_pools_guarded_side_zone`, `content_pool_template_jebus_outcast_pools_guarded_start_zone`, `content_pool_template_jebus_outcast_pools_unguarded_center_zone`, `content_pool_template_jebus_outcast_pools_unguarded_side_zone`, `content_pool_template_jebus_outcast_pools_unguarded_start_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2` in each variant.
- Suspicious unresolved/unknown fields: 36 unnamed direct connection objects total across the 3 variant connection sections; referenced content pools are not embedded locally.

## Memory Lane

Source: [`external/map_templates/Memory Lane.rmg.json`](../../external/map_templates/Memory%20Lane.rmg.json) (`name` L1, `variants` L28, first `zones` L35, `connections` L1126, `zoneLayouts` L1582, top-level `mandatoryContent` L1673, `contentCountLimits` L1798, `contentPools` L1948).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `Spawn-A`, `Spawn-B`, `Spawn-C`, `Spawn-D`, `Spawn-E`, `Spawn-F`, `Spawn-G`, `Spawn-H`, `Connector-1`, `Connector-2`, `Connector-3`, `Connector-4`, `Treasure-1`, `Treasure-2`, `Treasure-3`, `Treasure-4`, `Treasure-5`, `Treasure-6`, `Treasure-7`, `Treasure-8`, `SuperTreasure-1`, `SuperTreasure-2`, `SuperTreasure-3`, `SuperTreasure-4`, `SuperTreasure-Center`.
- Connections: 50 total; `Direct=24`, `Portal=12`, `Default=14`; all connection objects are named.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_sides`, `zone_layout_spawns`; count limits `content_limits_spawn`, `content_limits_connector`, `content_limits_treasure`, `content_limits_supertreasure`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_spawn`, `mandatory_content_connector`, `mandatory_content_treasure_1`, `mandatory_content_treasure_2`, `mandatory_content_treasure_3`, `mandatory_content_supertreasure`.
- Referenced content pools: `content_pool_general_resources_start_zone_very_poor`, `content_pool_general_resources_treasure_zone_zero`, `content_pool_template_memory_lane_guarded_connector_zone`, `content_pool_template_memory_lane_guarded_start_zone`, `content_pool_template_memory_lane_guarded_supertreasure_zone`, `content_pool_template_memory_lane_guarded_treasure_zone`, `content_pool_template_memory_lane_unguarded_connector_zone`, `content_pool_template_memory_lane_unguarded_start_zone`, `content_pool_template_memory_lane_unguarded_supertreasure_zone`, `content_pool_template_memory_lane_unguarded_treasure_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`.
- Suspicious unresolved/unknown fields: `Spawn-H` uses string `contentCountLimits` at L404 instead of an array; empty `factions` arrays on spawn objects at L56, L102, L150, L198, L246, L294; referenced content pools are not embedded locally.

## Shamrock

Source: [`external/map_templates/Shamrock.rmg.json`](../../external/map_templates/Shamrock.rmg.json) (`name` L2, `variants` L29, first `zones` L52, `connections` L881, `zoneLayouts` L1104, top-level `mandatoryContent` L1267, `contentCountLimits` L1629, `contentPools` L2110).

- Top-level sections: `name`, `gameMode`, `description`, `displayWinCondition`, `sizeX`, `sizeZ`, `gameRules`, `variants`, `zoneLayouts`, `mandatoryContent`, `contentCountLimits`, `contentPools`, `contentLists`.
- Variants: 1 unnamed variant.
- Zones: `Center`, `Center-A`, `Center-B`, `Center-C`, `Spawn-A`, `Side-A`, `Side-A-Back-1`, `Side-A-Back-2`, `Spawn-B`, `Side-B`, `Side-B-Back-1`, `Side-B-Back-2`, `Spawn-C`, `Side-C`, `Side-C-Back-1`, `Side-C-Back-2`.
- Connections: 21 total; `Direct=18`, `Proximity=3`; named direct connections are `Spawn-A-Side-A`, `Side-A-Center`, `Spawn-B-Side-B`, `Side-B-Center`, `Spawn-C-Side-C`, `Side-C-Center`, `Center-Center-A`, `Center-Center-B`, `Center-Center-C`, `Spawn-A-Side-A-Back-1`, `Side-A-Back-1-Side-A-Back-2`, `Side-A-Back-2-Side-B`, `Spawn-B-Side-B-Back-1`, `Side-B-Back-1-Side-B-Back-2`, `Side-B-Back-2-Side-C`, `Spawn-C-Side-C-Back-1`, `Side-C-Back-1-Side-C-Back-2`, `Side-C-Back-2-Side-A`; 3 proximity connections are unnamed.
- Embedded presets: zone layouts `zone_layout_center`, `zone_layout_treasure`, `zone_layout_sides`, `zone_layout_spawn`, `zone_layout_second_spawn`; count limits `content_limits_center`, `content_limits_treasure`, `content_limits_side`, `content_limits_spawn`, `content_limits_second_spawn`; embedded content pools/lists none.
- Mandatory content presets: `mandatory_content_center`, `mandatory_content_treasure`, `mandatory_content_side`, `mandatory_content_spawn`, `mandatory_content_second_spawn`.
- Referenced content pools: `content_pool_general_resources_side_zone_medium`, `content_pool_general_resources_side_zone_poor`, `content_pool_general_resources_start_zone_poor`, `content_pool_general_resources_treasure_zone_medium`, `content_pool_general_resources_treasure_zone_rich`, `template_pool_shamrock_guarded_center_zone`, `template_pool_shamrock_guarded_second_spawn_zone`, `template_pool_shamrock_guarded_side_zone`, `template_pool_shamrock_guarded_start_zone`, `template_pool_shamrock_guarded_treasure_zone`, `template_pool_shamrock_unguarded_center_zone`, `template_pool_shamrock_unguarded_second_spawn_zone`, `template_pool_shamrock_unguarded_side_zone`, `template_pool_shamrock_unguarded_start_zone`, `template_pool_shamrock_unguarded_treasure_zone`.
- Observed players/spawns: `Spawn-A:Player1`, `Spawn-B:Player2`, `Spawn-C:Player3`.
- Suspicious unresolved/unknown fields: 3 unnamed proximity connection objects in the connections section starting L881; referenced content pools are not embedded locally.

## bbolbval

Source: `GameDB/RMGMAPS/bbolbval.rmg.json` (older sample; not present in current live `external/map_templates`) (`name` L2, `variants` L6, first `zones` L8, `connections` L216, `zoneLayouts` L316, `contentPools` L321, `contentLists` L383, `mandatoryContent` L384, `contentCountLimits` L385).

- Top-level sections: `name`, `gameMode`, `sizeX`, `sizeZ`, `variants`, `zoneLayouts`, `contentPools`, `contentLists`, `mandatoryContent`, `contentCountLimits`.
- Variants: 1 unnamed variant.
- Zones: `Zone-P1`, `Zone-P2`, `Zone-P3`, `Zone-P4`, `Zone-P5`, `Zone-P6`, `Zone-P7`, `Zone-P8`, `Zone-Center`.
- Connections: 16 total, all `Default`; `Connection-P1-Center`, `Connection-P2-Center`, `Connection-P3-Center`, `Connection-P4-Center`, `Connection-P5-Center`, `Connection-P6-Center`, `Connection-P7-Center`, `Connection-P8-Center`, `Connection-P1-P2`, `Connection-P2-P3`, `Connection-P3-P4`, `Connection-P4-P5`, `Connection-P5-P6`, `Connection-P6-P7`, `Connection-P7-P8`, `Connection-P8-P1`.
- Embedded presets: zone layout `zone_layout_default`; content pools `content_pool_guarded`, `content_pool_unguarded`, `content_pool_resources`; content lists none; mandatory content none; content count limits none.
- Mandatory content presets: none.
- Referenced content pools: `content_pool_guarded`, `content_pool_unguarded`, `content_pool_resources`, all embedded locally.
- Observed players/spawns: `Zone-P1:Player1`, `Zone-P2:Player2`, `Zone-P3:Player3`, `Zone-P4:Player4`, `Zone-P5:Player5`, `Zone-P6:Player6`, `Zone-P7:Player7`, `Zone-P8:Player8`.
- Suspicious unresolved/unknown fields: none observed.
