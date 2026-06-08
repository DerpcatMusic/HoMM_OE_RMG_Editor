import type { ConnectionBehavior } from "./graphTypes.js";

export function connectionBehavior(connectionType: string | undefined): ConnectionBehavior {
  const type = connectionType ?? "Default";
  return {
    needsGroundConnection: type === "Direct" || type === "GladiatorArena",
    canHaveGroundConnection: type === "Default" || type === "Direct" || type === "GladiatorArena",
    needsAdjacency: type === "Direct" || type === "GladiatorArena" || type === "Proximity",
    canBecomePortal: type === "Default" || type === "Direct" || type === "Portal",
  };
}
