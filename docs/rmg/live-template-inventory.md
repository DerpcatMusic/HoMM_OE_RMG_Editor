# Live Template Inventory

Generated from the installed game templates linked at `external/map_templates` and the extracted Core resolver data under `extracted/Core`.

## Status

- `done`: the inventory generation and source scan are working.
- `partial`: it is a generated reference snapshot, not an editing surface.
- `missing`: automatic diffing against prior snapshots and change-aware reports.

Refresh command:

```bash
python3 tools/rmg_scan.py --format markdown > docs/rmg/live-template-inventory.md
```

Source scanner: `tools/rmg_scan.py`.

## Summary

- Templates: 56
- Content pool files: 73
- Content pool definitions: 532
- Content list files: 17
- Encounter template files: 641
- Unique pool references: 399
- Unresolved pool references: 0

## Connection Types

- `Default`: 382
- `Direct`: 728
- `GladiatorArena`: 2
- `Portal`: 170
- `Proximity`: 111

## Schema Anomalies

- `contentCountLimits_not_list`: 17
- `mainObject_has_factions_field`: 90

These are compatibility findings against the inspected C# model, not necessarily fatal runtime failures.

## Templates

| Template | Variants | Zones | Connections | Pool Refs | Players |
| --- | ---: | ---: | ---: | ---: | --- |
| All Around.rmg.json | 1 | 17 | 16 | 32 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1 |
| Anarchy.rmg.json | 5 | 79 | 120 | 14 | Player1:6, Player2:6 |
| Arcade.rmg.json | 3 | 15 | 15 | 9 | Player1:3, Player2:3 |
| Blitz.rmg.json | 1 | 17 | 34 | 20 | Player1:1, Player2:1 |
| Chosen One.rmg.json | 1 | 24 | 27 | 16 | Player1:1, Player2:1 |
| Christmas Tree.rmg.json | 1 | 11 | 16 | 9 | Player1:1, Player2:3 |
| Crossroads.rmg.json | 1 | 9 | 11 | 11 | Player1:1, Player2:1 |
| Diamond.rmg.json | 1 | 16 | 32 | 6 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Exodus Classic.rmg.json | 1 | 10 | 23 | 10 | Player1:1, Player2:1 |
| Exodus.rmg.json | 1 | 10 | 23 | 10 | Player1:2, Player2:2 |
| Expanse.rmg.json | 1 | 25 | 44 | 10 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Eye of the Storm.rmg.json | 1 | 7 | 16 | 11 | Player1:1, Player2:1 |
| Fair'n Square.rmg.json | 1 | 12 | 16 | 6 | Player1:2, Player2:2, Player3:2, Player4:2 |
| Flashback.rmg.json | 1 | 25 | 50 | 10 | Player1:1, Player2:1 |
| Full Hire.rmg.json | 1 | 48 | 52 | 13 | Player1:1, Player2:1 |
| Hallway.rmg.json | 1 | 14 | 29 | 9 | Player1:2, Player2:2, Player3:2, Player4:2 |
| Hard Place.rmg.json | 1 | 8 | 14 | 18 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Harmony.rmg.json | 1 | 8 | 10 | 9 | Player1:2, Player2:2 |
| Helltide.rmg.json | 1 | 8 | 15 | 9 | Player1:3, Player2:3 |
| Highway.rmg.json | 1 | 8 | 8 | 47 | Player1:1, Player2:1 |
| Ikarus.rmg.json | 1 | 17 | 24 | 9 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Infinity.rmg.json | 1 | 7 | 14 | 5 | Player1:2, Player2:2 |
| Jebus Cross Classic.rmg.json | 1 | 5 | 24 | 8 | Player1:1, Player2:1 |
| Jebus Cross.rmg.json | 1 | 5 | 24 | 8 | Player1:1, Player2:1 |
| Jebus Outcast.rmg.json | 3 | 15 | 78 | 8 | Player1:6, Player2:6 |
| Junction.rmg.json | 1 | 10 | 9 | 49 | Player1:1, Player2:1, Player3:1, Player4:1 |
| Kerberos.rmg.json | 1 | 13 | 21 | 11 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1 |
| King of the Hill.rmg.json | 1 | 13 | 18 | 7 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1 |
| Last Fortress.rmg.json | 1 | 11 | 14 | 11 | Player1:1, Player2:1 |
| Last Stand.rmg.json | 1 | 21 | 24 | 47 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1 |
| Madness.rmg.json | 1 | 8 | 17 | 7 | Player1:1, Player2:1 |
| Maneuvers.rmg.json | 1 | 11 | 12 | 12 | Player1:1, Player2:4 |
| Massacre.rmg.json | 1 | 24 | 31 | 16 | Player1:1, Player2:1 |
| Maze.rmg.json | 3 | 84 | 82 | 13 | Player1:3, Player2:3 |
| Mini-Nostalgia.rmg.json | 1 | 15 | 14 | 6 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Miracle.rmg.json | 1 | 7 | 9 | 9 | Player1:1, Player2:1 |
| Nuclear.rmg.json | 1 | 25 | 24 | 45 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1 |
| OctoJebus.rmg.json | 1 | 9 | 48 | 6 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| One for All.rmg.json | 1 | 16 | 27 | 47 | Player1:1, Player2:1, Player3:1, Player4:1 |
| Overthrow.rmg.json | 1 | 21 | 34 | 13 | Player1:2, Player2:2 |
| Pyramid.rmg.json | 1 | 6 | 10 | 7 | Player1:2, Player2:2, Player3:2 |
| Sand Clover.rmg.json | 1 | 13 | 26 | 14 | Player1:3, Player2:3 |
| Shamrock.rmg.json | 1 | 16 | 21 | 15 | Player1:1, Player2:1, Player3:1 |
| Showdown.rmg.json | 1 | 9 | 16 | 5 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Spider.rmg.json | 1 | 24 | 40 | 9 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1, Player7:1, Player8:1 |
| Sprint.rmg.json | 1 | 14 | 12 | 17 | Player1:1, Player2:1 |
| Staircase.rmg.json | 1 | 13 | 13 | 67 | Player1:1, Player2:1, Player3:1, Player4:1, Player5:1, Player6:1 |
| Sworn.rmg.json | 1 | 11 | 12 | 48 | Player1:1, Player2:1, Player3:1 |
| Symmetry.rmg.json | 1 | 6 | 5 | 6 | Player1:1, Player2:1 |
| Symphony.rmg.json | 1 | 33 | 40 | 13 | Player1:2, Player2:2, Player3:2, Player4:2 |
| Trinity.rmg.json | 1 | 11 | 12 | 12 | Player1:1, Player2:1 |
| Universe.rmg.json | 1 | 5 | 5 | 9 | Player1:1, Player2:1 |
| Vendetta.rmg.json | 1 | 5 | 24 | 10 | Player1:1, Player2:1 |
| Wastelands.rmg.json | 1 | 9 | 16 | 7 | Player1:1, Player2:1 |
| Yin Yang.rmg.json | 1 | 11 | 12 | 61 | Player1:1, Player2:1, Player3:1 |
| Zookeeper.rmg.json | 1 | 8 | 10 | 10 | Player1:1, Player2:1 |
