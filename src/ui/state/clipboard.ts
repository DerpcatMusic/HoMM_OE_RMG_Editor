import type { Zone, Connection } from "../../core/rmg/rmgTypes.js";
import type { ZoneUpdateDraft, ConnectionUpdateDraft } from "./editorSession.js";

export type ClipboardEntry =
  | { kind: "zone"; data: ZoneClipboardData }
  | { kind: "connection"; data: ConnectionClipboardData };

export interface ZoneClipboardData {
  size: number | undefined;
  layout: string | undefined;
  zoneBiomeType: string;
  zoneBiomeArgs: readonly string[];
  contentBiomeType: string;
  contentBiomeArgs: readonly string[];
  metaObjectsBiomeType: string;
  metaObjectsBiomeArgs: readonly string[];
  crossroadsPosition: number | undefined;
  diplomacyModifier: number | undefined;
  guardCutoffValue: number | undefined;
  guardMultiplier: number | undefined;
  guardRandomization: number | undefined;
  guardWeeklyIncrement: number | undefined;
  guardReactionDistribution: readonly number[] | undefined;
  guardedContentValue: number | undefined;
  guardedContentValuePerArea: number | undefined;
  unguardedContentValue: number | undefined;
  unguardedContentValuePerArea: number | undefined;
  resourcesValue: number | undefined;
  resourcesValuePerArea: number | undefined;
  guardedPools: readonly string[];
  unguardedPools: readonly string[];
  resourcesPools: readonly string[];
  mandatoryContent: readonly string[];
  contentCountLimits: readonly string[];
}

export interface ConnectionClipboardData {
  connectionType: string;
  length: number | undefined;
  portalFromEnabled: boolean;
  portalToEnabled: boolean;
  guardZone: string;
  guardValue: number | undefined;
  guardWeeklyIncrement: number | undefined;
  guardReaction: string;
  guardEscape: boolean;
  gatePlacement: string;
  gatePlacementArgs: readonly string[];
  road: boolean;
  simTurnSquad: boolean;
  guardRandomization: number | undefined;
}

let clipboard: ClipboardEntry | undefined;

export function getClipboard(): ClipboardEntry | undefined {
  return clipboard;
}

export function copyZone(zone: Zone): void {
  clipboard = {
    kind: "zone",
    data: {
      size: zone.size,
      layout: zone.layout,
      zoneBiomeType: zone.zoneBiome?.type ?? "",
      zoneBiomeArgs: zone.zoneBiome?.args ?? [],
      contentBiomeType: zone.contentBiome?.type ?? "",
      contentBiomeArgs: zone.contentBiome?.args ?? [],
      metaObjectsBiomeType: zone.metaObjectsBiome?.type ?? "",
      metaObjectsBiomeArgs: zone.metaObjectsBiome?.args ?? [],
      crossroadsPosition: zone.crossroadsPosition,
      diplomacyModifier: zone.diplomacyModifier,
      guardCutoffValue: zone.guardCutoffValue,
      guardMultiplier: zone.guardMultiplier,
      guardRandomization: zone.guardRandomization,
      guardWeeklyIncrement: zone.guardWeeklyIncrement,
      guardReactionDistribution: zone.guardReactionDistribution,
      guardedContentValue: zone.guardedContentValue,
      guardedContentValuePerArea: zone.guardedContentValuePerArea,
      unguardedContentValue: zone.unguardedContentValue,
      unguardedContentValuePerArea: zone.unguardedContentValuePerArea,
      resourcesValue: zone.resourcesValue,
      resourcesValuePerArea: zone.resourcesValuePerArea,
      guardedPools: zone.guardedContentPool ?? [],
      unguardedPools: zone.unguardedContentPool ?? [],
      resourcesPools: zone.resourcesContentPool ?? [],
      mandatoryContent: zone.mandatoryContent ?? [],
      contentCountLimits: zone.contentCountLimits ?? [],
    },
  };
}

export function copyConnection(connection: Connection): void {
  clipboard = {
    kind: "connection",
    data: {
      connectionType: connection.connectionType ?? "",
      length: connection.length,
      portalFromEnabled: connection.portalFromEnabled ?? false,
      portalToEnabled: connection.portalToEnabled ?? false,
      guardZone: connection.guardZone ?? "",
      guardValue: connection.guardValue,
      guardWeeklyIncrement: connection.guardWeeklyIncrement,
      guardReaction: connection.guardReaction ?? "",
      guardEscape: connection.guardEscape ?? false,
      gatePlacement: connection.gatePlacement ?? "",
      gatePlacementArgs: connection.gatePlacementArgs ?? [],
      road: connection.road ?? false,
      simTurnSquad: connection.simTurnSquad ?? false,
      guardRandomization: connection.guardRandomization,
    },
  };
}

export function applyZoneClipboard(target: ZoneUpdateDraft): ZoneUpdateDraft {
  if (clipboard?.kind !== "zone") return target;
  const src = clipboard.data;
  return {
    ...target,
    size: src.size ?? target.size,
    layout: src.layout ?? target.layout,
    zoneBiomeType: src.zoneBiomeType,
    zoneBiomeArgs: src.zoneBiomeArgs,
    contentBiomeType: src.contentBiomeType,
    contentBiomeArgs: src.contentBiomeArgs,
    metaObjectsBiomeType: src.metaObjectsBiomeType,
    metaObjectsBiomeArgs: src.metaObjectsBiomeArgs,
    crossroadsPosition: src.crossroadsPosition,
    diplomacyModifier: src.diplomacyModifier,
    guardCutoffValue: src.guardCutoffValue,
    guardMultiplier: src.guardMultiplier,
    guardRandomization: src.guardRandomization,
    guardWeeklyIncrement: src.guardWeeklyIncrement,
    guardReactionDistribution: src.guardReactionDistribution,
    guardedContentValue: src.guardedContentValue,
    guardedContentValuePerArea: src.guardedContentValuePerArea,
    unguardedContentValue: src.unguardedContentValue,
    unguardedContentValuePerArea: src.unguardedContentValuePerArea,
    resourcesValue: src.resourcesValue,
    resourcesValuePerArea: src.resourcesValuePerArea,
    guardedPools: src.guardedPools,
    unguardedPools: src.unguardedPools,
    resourcesPools: src.resourcesPools,
    mandatoryContent: src.mandatoryContent,
    contentCountLimits: src.contentCountLimits,
  };
}

export function applyConnectionClipboard(target: ConnectionUpdateDraft): ConnectionUpdateDraft {
  if (clipboard?.kind !== "connection") return target;
  const src = clipboard.data;
  return {
    ...target,
    connectionType: src.connectionType,
    length: src.length,
    portalFromEnabled: src.portalFromEnabled,
    portalToEnabled: src.portalToEnabled,
    guardZone: src.guardZone,
    guardValue: src.guardValue,
    guardWeeklyIncrement: src.guardWeeklyIncrement,
    guardReaction: src.guardReaction,
    guardEscape: src.guardEscape,
    gatePlacement: src.gatePlacement,
    road: src.road,
    simTurnSquad: src.simTurnSquad,
    guardRandomization: src.guardRandomization,
  };
}

export function buildZoneDraft(zone: Zone, zoneName: string): ZoneUpdateDraft {
  return {
    name: zoneName,
    size: zone.size ?? 1,
    layout: zone.layout ?? "",
    zoneBiomeType: zone.zoneBiome?.type ?? "",
    zoneBiomeArgs: zone.zoneBiome?.args ?? [],
    contentBiomeType: zone.contentBiome?.type ?? "",
    contentBiomeArgs: zone.contentBiome?.args ?? [],
    metaObjectsBiomeType: zone.metaObjectsBiome?.type ?? "",
    metaObjectsBiomeArgs: zone.metaObjectsBiome?.args ?? [],
    crossroadsPosition: zone.crossroadsPosition,
    diplomacyModifier: zone.diplomacyModifier,
    guardCutoffValue: zone.guardCutoffValue,
    guardMultiplier: zone.guardMultiplier,
    guardRandomization: zone.guardRandomization,
    guardWeeklyIncrement: zone.guardWeeklyIncrement,
    guardReactionDistribution: zone.guardReactionDistribution,
    guardedContentValue: zone.guardedContentValue,
    guardedContentValuePerArea: zone.guardedContentValuePerArea,
    unguardedContentValue: zone.unguardedContentValue,
    unguardedContentValuePerArea: zone.unguardedContentValuePerArea,
    resourcesValue: zone.resourcesValue,
    resourcesValuePerArea: zone.resourcesValuePerArea,
    guardedPools: zone.guardedContentPool ?? [],
    unguardedPools: zone.unguardedContentPool ?? [],
    resourcesPools: zone.resourcesContentPool ?? [],
    mandatoryContent: zone.mandatoryContent ?? [],
    contentCountLimits: zone.contentCountLimits ?? [],
  };
}

export function buildConnectionDraft(connection: Connection, connectionName: string): ConnectionUpdateDraft {
  return {
    originalName: connectionName,
    name: connectionName,
    from: connection.from ?? "",
    to: connection.to ?? "",
    connectionType: connection.connectionType ?? "Direct",
    length: connection.length,
    portalFromEnabled: connection.portalFromEnabled ?? true,
    portalToEnabled: connection.portalToEnabled ?? true,
    guardZone: connection.guardZone ?? "",
    guardValue: connection.guardValue,
    guardWeeklyIncrement: connection.guardWeeklyIncrement,
    guardReaction: connection.guardReaction ?? "Common",
    guardEscape: connection.guardEscape ?? true,
    gatePlacement: connection.gatePlacement ?? "Random",
    road: connection.road ?? false,
    simTurnSquad: connection.simTurnSquad ?? false,
    guardRandomization: connection.guardRandomization,
  };
}
