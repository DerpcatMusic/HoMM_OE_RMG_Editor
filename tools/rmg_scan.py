#!/usr/bin/env python3
"""Read-only scanner for Olden Era RMG templates and extracted Core data."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path
from typing import Any


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def pool_definitions(pool_dir: Path, root: Path) -> dict[str, str]:
    definitions: dict[str, str] = {}
    for path in sorted(pool_dir.rglob("*.json")):
        data = load_json(path)
        if not isinstance(data, list):
            continue
        for item in data:
            if isinstance(item, dict) and isinstance(item.get("name"), str):
                definitions[item["name"]] = str(path.relative_to(root))
    return definitions


def iter_template_paths(template_dir: Path) -> list[Path]:
    return sorted(template_dir.glob("*.rmg.json"))


def scan(root: Path) -> dict[str, Any]:
    template_dir = root / "external" / "map_templates"
    pool_dir = root / "extracted" / "Core" / "generator" / "content_pools"
    list_dir = root / "extracted" / "Core" / "generator" / "content_lists"
    encounter_dir = root / "extracted" / "Core" / "generator" / "encounter_templates"

    definitions = pool_definitions(pool_dir, root)
    all_pool_refs: set[str] = set()
    connection_types: Counter[str] = Counter()
    root_keys: Counter[str] = Counter()
    anomaly_counts: Counter[str] = Counter()
    spawn_owner_counts: Counter[str] = Counter()
    templates: list[dict[str, Any]] = []

    for path in iter_template_paths(template_dir):
        template = load_json(path)
        if not isinstance(template, dict):
            anomaly_counts["template_root_not_object"] += 1
            continue

        root_keys.update(template.keys())
        variants = template.get("variants") or []
        zones_total = 0
        connections_total = 0
        template_connections: Counter[str] = Counter()
        template_pool_refs: set[str] = set()
        template_players: Counter[str] = Counter()

        for variant in variants:
            zones = variant.get("zones") or []
            connections = variant.get("connections") or []
            zones_total += len(zones)
            connections_total += len(connections)

            for connection in connections:
                connection_type = connection.get("connectionType", "Default")
                template_connections[connection_type] += 1
                connection_types[connection_type] += 1

            for zone in zones:
                for field in ("guardedContentPool", "unguardedContentPool", "resourcesContentPool"):
                    value = zone.get(field)
                    if isinstance(value, list):
                        template_pool_refs.update(v for v in value if isinstance(v, str))
                    elif value is not None:
                        anomaly_counts[f"{field}_not_list"] += 1

                content_count_limits = zone.get("contentCountLimits")
                if content_count_limits is not None and not isinstance(content_count_limits, list):
                    anomaly_counts["contentCountLimits_not_list"] += 1

                mandatory_content = zone.get("mandatoryContent")
                if mandatory_content is not None and not isinstance(mandatory_content, list):
                    anomaly_counts["mandatoryContent_not_list"] += 1

                for main_object in zone.get("mainObjects") or []:
                    if "factions" in main_object:
                        anomaly_counts["mainObject_has_factions_field"] += 1
                    owner = main_object.get("owner")
                    spawn = main_object.get("spawn")
                    object_type = main_object.get("type")
                    if owner or spawn or object_type == "Spawn":
                        player_ref = owner or spawn or "unknown"
                        template_players[player_ref] += 1
                        spawn_owner_counts[player_ref] += 1

        all_pool_refs.update(template_pool_refs)
        templates.append(
            {
                "name": path.name,
                "variants": len(variants),
                "zones": zones_total,
                "connections": connections_total,
                "connectionTypes": dict(sorted(template_connections.items())),
                "poolRefs": len(template_pool_refs),
                "embeddedPools": len(template.get("contentPools") or []),
                "embeddedLists": len(template.get("contentLists") or []),
                "mandatoryPresets": len(template.get("mandatoryContent") or []),
                "contentLimitPresets": len(template.get("contentCountLimits") or []),
                "players": dict(sorted(template_players.items())),
            }
        )

    unresolved = sorted(all_pool_refs - set(definitions))
    return {
        "templateCount": len(templates),
        "contentPoolFiles": len(list(pool_dir.rglob("*.json"))),
        "contentPoolDefinitions": len(definitions),
        "contentListFiles": len(list(list_dir.rglob("*.json"))),
        "encounterTemplateFiles": len(list(encounter_dir.rglob("*.json"))),
        "uniquePoolRefs": len(all_pool_refs),
        "unresolvedPoolRefs": unresolved,
        "connectionTypes": dict(sorted(connection_types.items())),
        "rootKeys": dict(sorted(root_keys.items())),
        "anomalyCounts": dict(sorted(anomaly_counts.items())),
        "spawnOwnerCounts": dict(sorted(spawn_owner_counts.items())),
        "templates": sorted(templates, key=lambda item: item["name"]),
    }


def print_markdown(report: dict[str, Any]) -> None:
    print("# RMG Scan Report")
    print()
    print(f"- Templates: {report['templateCount']}")
    print(f"- Content pool files: {report['contentPoolFiles']}")
    print(f"- Content pool definitions: {report['contentPoolDefinitions']}")
    print(f"- Content list files: {report['contentListFiles']}")
    print(f"- Encounter template files: {report['encounterTemplateFiles']}")
    print(f"- Unique pool references: {report['uniquePoolRefs']}")
    print(f"- Unresolved pool references: {len(report['unresolvedPoolRefs'])}")
    print()
    print("## Connection Types")
    print()
    for key, value in report["connectionTypes"].items():
        print(f"- `{key}`: {value}")
    print()
    print("## Anomalies")
    print()
    for key, value in report["anomalyCounts"].items():
        print(f"- `{key}`: {value}")
    print()
    print("## Templates")
    print()
    print("| Template | Variants | Zones | Connections | Pool Refs | Players |")
    print("| --- | ---: | ---: | ---: | ---: | --- |")
    for item in report["templates"]:
        players = ", ".join(f"{k}:{v}" for k, v in item["players"].items())
        print(
            f"| {item['name']} | {item['variants']} | {item['zones']} | "
            f"{item['connections']} | {item['poolRefs']} | {players} |"
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".", help="Project root")
    parser.add_argument("--format", choices=("json", "markdown"), default="markdown")
    args = parser.parse_args()

    report = scan(Path(args.root).resolve())
    if args.format == "json":
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print_markdown(report)


if __name__ == "__main__":
    main()
