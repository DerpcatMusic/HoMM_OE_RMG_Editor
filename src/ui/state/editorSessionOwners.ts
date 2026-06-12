import { PLAYER_REFS, type PlayerRef } from "../../core/rmg/enums.js";
import type { MainObject, Zone } from "../../core/rmg/rmgTypes.js";

export function inferZonePlayerOwner(zone: Zone): PlayerRef | undefined {
  for (const mainObject of zone.mainObjects ?? []) {
    const ref = mainObjectPlayerRef(mainObject);
    if (ref) return ref;
  }
  return undefined;
}

export function mainObjectPlayerRef(mainObject: MainObject | undefined): PlayerRef | undefined {
  return asPlayerRef(mainObject?.spawn) ?? asPlayerRef(mainObject?.owner);
}

export function asPlayerRef(value: unknown): PlayerRef | undefined {
  return isPlayerRef(value) ? value : undefined;
}

export function isPlayerRef(value: unknown): value is PlayerRef {
  return typeof value === "string" && (PLAYER_REFS as readonly string[]).includes(value);
}
