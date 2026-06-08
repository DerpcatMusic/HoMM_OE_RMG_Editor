import type { ResolvedZone } from "../resolver/resolvedTypes.js";
import type { ZoneRole } from "./graphTypes.js";

export function inferZoneRole(zone: ResolvedZone): ZoneRole {
  const name = zone.zone.name?.toLowerCase() ?? "";
  const hasSpawnMainObject = (zone.zone.mainObjects ?? []).some((mainObject) => mainObject.type === "Spawn" || mainObject.spawn);

  if (hasSpawnMainObject || token(name, "spawn")) {
    return "spawn";
  }
  if (token(name, "supertreasure") || token(name, "super-treasure") || token(name, "super_treasure")) {
    return "superTreasure";
  }
  if (token(name, "treasure")) {
    return "treasure";
  }
  if (token(name, "center") || token(name, "centre")) {
    return "center";
  }
  if (token(name, "side")) {
    return "side";
  }
  if (token(name, "connector")) {
    return "connector";
  }
  if (token(name, "back")) {
    return "back";
  }
  if (token(name, "win")) {
    return "win";
  }
  if (zone.zone.mainObjects?.length === 0) {
    return "neutral";
  }
  return "unknown";
}

function token(value: string, needle: string): boolean {
  return value.includes(needle);
}
