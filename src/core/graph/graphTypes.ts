import type { ConnectionType } from "../rmg/enums.js";

export interface RmgGraph {
  templateName: string;
  variantIndex: number;
  nodes: RmgGraphNode[];
  edges: RmgGraphEdge[];
  stats: RmgGraphStats;
}

export interface RmgGraphNode {
  id: string;
  zoneIndex: number;
  name: string;
  role: ZoneRole;
  size: number;
  layout?: string;
  ownerRefs: string[];
  spawnRefs: string[];
  poolRefs: {
    guarded: string[];
    unguarded: string[];
    resources: string[];
  };
  mandatoryContentRefs: string[];
  contentCountLimitRefs: string[];
  budgets: ZoneBudgets;
  diagnostics: {
    errors: number;
    warnings: number;
  };
}

export interface RmgGraphEdge {
  id: string;
  connectionIndex: number;
  name?: string;
  source: string;
  target: string;
  connectionType: ConnectionType | string;
  behavior: ConnectionBehavior;
  guard: ConnectionGuardSummary;
  portal: ConnectionPortalSummary;
  diagnostics: {
    errors: number;
    warnings: number;
  };
}

export interface ConnectionBehavior {
  needsGroundConnection: boolean;
  canHaveGroundConnection: boolean;
  needsAdjacency: boolean;
  canBecomePortal: boolean;
}

export interface ConnectionGuardSummary {
  guardZone?: string;
  guardValue: number;
  guardWeeklyIncrement: number;
  guardReaction?: string;
  guardEscape: boolean;
  guardMatchGroup?: string;
}

export interface ConnectionPortalSummary {
  fromEnabled: boolean;
  toEnabled: boolean;
}

export interface ZoneBudgets {
  guardedContentValue: number;
  guardedContentValuePerArea: number;
  unguardedContentValue: number;
  unguardedContentValuePerArea: number;
  resourcesValue: number;
  resourcesValuePerArea: number;
}

export interface RmgGraphStats {
  zones: number;
  connections: number;
  connectionTypes: Record<string, number>;
  zoneRoles: Record<string, number>;
  playerRefs: Record<string, number>;
  diagnostics: {
    errors: number;
    warnings: number;
  };
}

export type ZoneRole =
  | "spawn"
  | "treasure"
  | "superTreasure"
  | "center"
  | "side"
  | "connector"
  | "back"
  | "win"
  | "neutral"
  | "unknown";
