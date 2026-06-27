import type { Connection, MainObject, RmgTemplate, RoadConfig, RoadTargetConfig, Variant, Zone } from "../../core/rmg/rmgTypes.js";
import { computeTopologyPackedLayout } from "./graphLayout.js";
import { PLAYER_COLORS, type ShellConnectionItem, type ShellPlayerItem, type ShellRuleItem, type ShellZoneItem, type ShellZoneObjectItem, type ShellZoneRoadItem } from "./shellData.js";

export interface TemplateProjection {
  templateName: string;
  variantIndex: number;
  zones: ShellZoneItem[];
  connections: ShellConnectionItem[];
  players: ShellPlayerItem[];
  selectedZone?: ShellZoneItem;
  selectedConnection?: ShellConnectionItem;
}

export function projectTemplateToShellData(
  template: RmgTemplate,
  variantIndex: number,
  selectedZoneName: string | undefined,
  selectedConnectionName: string | undefined,
  canvasPositions: Readonly<Record<string, { x: number; y: number }>> = {},
  zoneObjectPositions: Readonly<Record<string, Readonly<Record<string, { x: number; y: number }>>>> = {},
): TemplateProjection {
  const variant = getVariant(template, variantIndex);
  const variantZones = variant?.zones ?? [];
  const autoPositions = computeTopologyPackedLayout(
    variantZones.map((zone, index) => {
      const label = zone.name ?? `Zone ${index + 1}`;
      return { name: label, index, role: inferZoneRole(zone, label), size: zone.size ?? 1 };
    }),
    variant?.connections ?? [],
    canvasPositions,
  );
  const zones = variantZones.map((zone, index, allZones) =>
    projectZone(zone, index, allZones.length, variant, canvasPositions, autoPositions, zoneObjectPositions, template.mandatoryContent)
  );
  const selectedZone = zones.find((zone) => zone.label === selectedZoneName) ?? zones[0];
  const connections = (variant?.connections ?? []).map((connection, index) => ({
    id: connection.name ?? `connection-${index + 1}`,
    label: connection.name ?? `Connection ${index + 1}`,
    index,
    from: connection.from ?? "",
    to: connection.to ?? "",
    type: connection.connectionType ?? "Default",
    ...(connection.length !== undefined ? { length: connection.length } : {}),
    ...(connection.portalFromEnabled !== undefined ? { portalFromEnabled: connection.portalFromEnabled } : {}),
    ...(connection.portalToEnabled !== undefined ? { portalToEnabled: connection.portalToEnabled } : {}),
    ...(connection.guardZone !== undefined ? { guardZone: connection.guardZone } : {}),
    ...(connection.guardValue !== undefined ? { guardValue: connection.guardValue } : {}),
    ...(connection.guardWeeklyIncrement !== undefined ? { guardWeeklyIncrement: connection.guardWeeklyIncrement } : {}),
    ...(connection.guardReaction !== undefined ? { guardReaction: connection.guardReaction } : {}),
    ...(connection.guardEscape !== undefined ? { guardEscape: connection.guardEscape } : {}),
    ...(connection.gatePlacement !== undefined ? { gatePlacement: connection.gatePlacement } : {}),
    ...(connection.road !== undefined ? { road: connection.road } : {}),
    ...(connection.simTurnSquad !== undefined ? { simTurnSquad: connection.simTurnSquad } : {}),
    ...(connection.guardRandomization !== undefined ? { guardRandomization: connection.guardRandomization } : {}),
  }));
  const selectedConnection = connections.find((connection) => connection.id === selectedConnectionName);
  const projection: TemplateProjection = {
    templateName: template.name ?? "Untitled RMG",
    variantIndex,
    zones,
    connections,
    players: projectPlayers(zones),
  };
  if (selectedZone) {
    projection.selectedZone = selectedZone;
  }
  if (selectedConnection) {
    projection.selectedConnection = selectedConnection;
  }
  return projection;
}

function projectPlayers(zones: readonly ShellZoneItem[]): ShellPlayerItem[] {
  const playerZones = new Map<string, string[]>();
  for (const zone of zones) {
    if (zone.owner !== "Neutral") {
      const list = playerZones.get(zone.owner) ?? [];
      list.push(zone.id);
      playerZones.set(zone.owner, list);
    }
  }
  return Array.from(playerZones.entries()).map(([owner, zoneIds]) => ({
    id: owner,
    label: owner,
    color: PLAYER_COLORS[owner] ?? "#444",
    zoneCount: zoneIds.length,
    zoneIds,
  }));
}

function getVariant(template: RmgTemplate, variantIndex: number): Variant | undefined {
  return template.variants?.[variantIndex] ?? template.variants?.[0];
}

function projectZone(
  zone: Zone,
  index: number,
  zoneCount: number,
  variant: Variant | undefined,
  canvasPositions: Readonly<Record<string, { x: number; y: number }>>,
  autoPositions: Readonly<Record<string, { x: number; y: number }>>,
  zoneObjectPositions: Readonly<Record<string, Readonly<Record<string, { x: number; y: number }>>>>,
  mandatoryContentPresets?: readonly import("../../core/rmg/rmgTypes.js").MandatoryContentPreset[],
): ShellZoneItem {
  const label = zone.name ?? `Zone ${index + 1}`;
  const guardedPools = [...(zone.guardedContentPool ?? [])];
  const unguardedPools = [...(zone.unguardedContentPool ?? [])];
  const resourcesPools = [...(zone.resourcesContentPool ?? [])];
  const position = canvasPositions[label] ?? autoPositions[label] ?? zonePosition(index, zoneCount, inferZoneRole(zone, label));
  const zoneObjects = applyZoneObjectPositions(projectZoneObjects(zone, label, variant, mandatoryContentPresets), zoneObjectPositions[label] ?? {});
  const zoneRoads = projectZoneRoads(zone, zoneObjects);
  return {
    id: label,
    label,
    owner: inferZoneOwner(zone),
    role: inferZoneRole(zone, label),
    index,
    x: position.x,
    y: position.y,
    size: zone.size ?? 1,
    layout: zone.layout ?? "",
    zoneBiome: projectRule(zone.zoneBiome),
    contentBiome: projectRule(zone.contentBiome),
    metaObjectsBiome: projectRule(zone.metaObjectsBiome),
    ...(zone.crossroadsPosition !== undefined ? { crossroadsPosition: zone.crossroadsPosition } : {}),
    ...(zone.diplomacyModifier !== undefined ? { diplomacyModifier: zone.diplomacyModifier } : {}),
    ...(zone.guardCutoffValue !== undefined ? { guardCutoffValue: zone.guardCutoffValue } : {}),
    ...(zone.guardMultiplier !== undefined ? { guardMultiplier: zone.guardMultiplier } : {}),
    ...(zone.guardRandomization !== undefined ? { guardRandomization: zone.guardRandomization } : {}),
    ...(zone.guardWeeklyIncrement !== undefined ? { guardWeeklyIncrement: zone.guardWeeklyIncrement } : {}),
    guardReactionDistribution: [...(zone.guardReactionDistribution ?? [])],
    ...(zone.guardedContentValue !== undefined ? { guardedContentValue: zone.guardedContentValue } : {}),
    ...(zone.guardedContentValuePerArea !== undefined ? { guardedContentValuePerArea: zone.guardedContentValuePerArea } : {}),
    ...(zone.unguardedContentValue !== undefined ? { unguardedContentValue: zone.unguardedContentValue } : {}),
    ...(zone.unguardedContentValuePerArea !== undefined ? { unguardedContentValuePerArea: zone.unguardedContentValuePerArea } : {}),
    ...(zone.resourcesValue !== undefined ? { resourcesValue: zone.resourcesValue } : {}),
    ...(zone.resourcesValuePerArea !== undefined ? { resourcesValuePerArea: zone.resourcesValuePerArea } : {}),
    guardedPool: guardedPools[0] ?? "none",
    guardedPools,
    unguardedPools,
    resourcesPools,
    mandatoryContent: [...(zone.mandatoryContent ?? [])],
    contentCountLimits: [...(zone.contentCountLimits ?? [])],
    mainObjectCount: zone.mainObjects?.length ?? 0,
    roadCount: zone.roads?.length ?? 0,
    zoneObjects,
    zoneRoads,
  };
}

function projectRule(rule: { type?: string; args?: string[] } | undefined): ShellRuleItem {
  return {
    type: rule?.type ?? "",
    args: [...(rule?.args ?? [])],
  };
}

function applyZoneObjectPositions(
  objects: readonly ShellZoneObjectItem[],
  positions: Readonly<Record<string, { x: number; y: number }>>,
): ShellZoneObjectItem[] {
  return objects.map((object) => {
    const legacyMandatoryId = object.id.startsWith("mandatory:")
      ? `mc:${object.id.replace("mandatory:", "")}`
      : "";
    const position = positions[object.id] ?? (legacyMandatoryId ? positions[legacyMandatoryId] : undefined);
    return position ? { ...object, x: position.x, y: position.y } : object;
  });
}

function inferZoneOwner(zone: Zone): string {
  const mainObject = zone.mainObjects?.find((item) => item.spawn || item.owner);
  return mainObject?.spawn ?? mainObject?.owner ?? "Neutral";
}

function inferZoneRole(zone: Zone, label: string): ShellZoneItem["role"] {
  if ((zone.mainObjects ?? []).some((item) => item.type === "Spawn" || item.spawn)) {
    return "spawn";
  }
  const normalized = label.toLowerCase();
  if (normalized.includes("center")) {
    return "center";
  }
  if (normalized.includes("treasure")) {
    return "treasure";
  }
  if (normalized.includes("connector") || normalized.includes("portal")) {
    return "connector";
  }
  return "neutral";
}

function zonePosition(index: number, zoneCount: number, role: ShellZoneItem["role"]): { x: number; y: number } {
  if (role === "center") {
    return { x: 48, y: 42 };
  }
  if (zoneCount <= 1) {
    return { x: 46, y: 42 };
  }
  const angle = (Math.PI * 2 * index) / zoneCount - Math.PI / 2;
  const radiusX = 34;
  const radiusY = 28;
  return {
    x: clampPercent(48 + Math.cos(angle) * radiusX),
    y: clampPercent(44 + Math.sin(angle) * radiusY),
  };
}

function clampPercent(value: number): number {
  return Math.max(6, Math.min(82, Number(value.toFixed(2))));
}
function projectZoneObjects(zone: Zone, zoneName: string, variant: Variant | undefined, mandatoryContentPresets?: readonly import("../../core/rmg/rmgTypes.js").MandatoryContentPreset[]): ShellZoneObjectItem[] {
  const objects = (zone.mainObjects ?? []).map((mainObject, index, allObjects) => projectMainObject(mainObject, index, allObjects.length));
  const incidentConnections = (variant?.connections ?? []).filter((connection) =>
    connection.name &&
    connection.connectionType !== "Proximity" &&
    (connection.from === zoneName || connection.to === zoneName)
  );
  const connectionObjects = incidentConnections.map((connection, index, allConnections) => projectConnectionAnchor(connection, index, allConnections.length));
  const extras = new Map<string, ShellZoneObjectItem>();
  const zonePresetNames = new Set(zone.mandatoryContent ?? []);
  const roadTargetNames = new Set((zone.roads ?? [])
    .flatMap((road) => [road.from, road.to])
    .filter((target): target is RoadTargetConfig => target?.type === "MandatoryContent")
    .map((target) => target.args?.[0]?.trim() ?? "")
    .filter(Boolean));
  if (mandatoryContentPresets) {
    let mcIndex = 0;
    let presetIndex = 0;
    for (const preset of mandatoryContentPresets) {
      if (!preset.name || !zonePresetNames.has(preset.name)) continue;
      const isManualPreset = isZoneLocalMandatoryPreset(preset.name, zoneName);
      if (!isManualPreset) {
        const presetId = `mandatory-preset:${preset.name}`;
        extras.set(presetId, {
          id: presetId,
          kind: "mandatoryPreset",
          label: preset.name,
          type: "Mandatory preset",
          detail: `${(preset.content ?? []).length} entries`,
          x: 24,
          y: clampInternalPercent(24 + presetIndex * 8),
          placementArgs: [],
          faction: { type: "", args: [] },
          mandatoryPresetNames: [preset.name],
          roadTargetable: false,
        });
        presetIndex++;
      }
      for (const [entryIndex, entry] of (preset.content ?? []).entries()) {
        const targetableName = entry.name?.trim() || "";
        const shouldProjectEntry = isManualPreset || (targetableName && roadTargetNames.has(targetableName));
        if (!shouldProjectEntry) {
          mcIndex++;
          continue;
        }
        const id = targetableName
          ? `mandatory:${targetableName}`
          : `mandatory-preview:${preset.name}:${entryIndex}`;
        const existing = extras.get(id);
        if (existing) {
          extras.set(id, {
            ...existing,
            mandatoryPresetNames: [...new Set([...(existing.mandatoryPresetNames ?? []), preset.name])],
          });
        } else {
          const angle = (Math.PI * 2 * mcIndex) / Math.max(1, (preset.content ?? []).length) - Math.PI / 2;
          extras.set(id, {
            id,
            kind: "mandatory",
            label: mandatoryEntryLabel(entry, mcIndex),
            type: "MandatoryContent",
            detail: mandatoryEntryDetail(entry, Boolean(targetableName)),
            x: clampInternalPercent(42 + Math.cos(angle) * 30),
            y: clampInternalPercent(45 + Math.sin(angle) * 30),
            placementArgs: [],
            faction: { type: "", args: [] },
            ...(targetableName ? { mandatoryEntryName: targetableName } : {}),
            mandatoryPresetNames: [preset.name],
            ...(entry.sid !== undefined ? { mandatorySid: entry.sid } : {}),
            ...(entry.owner !== undefined ? { owner: entry.owner } : {}),
            roadTargetable: Boolean(targetableName),
          });
        }
        mcIndex++;
      }
    }
  }
  // Add road target extras (crossroads, etc.)
  for (const road of zone.roads ?? []) {
    ensureRoadTargetObject(road.from, extras);
    ensureRoadTargetObject(road.to, extras);
  }
  return [...objects, ...connectionObjects, ...extras.values()];
}

function projectMainObject(mainObject: MainObject, index: number, objectCount: number): ShellZoneObjectItem {
  const angle = objectCount <= 1 ? 0 : (Math.PI * 2 * index) / objectCount - Math.PI / 2;
  return {
    id: `main:${index}`,
    kind: "main",
    index,
    label: `${mainObject.type ?? "MainObject"} ${index}`,
    type: mainObject.type ?? "MainObject",
    detail: mainObject.spawn ?? mainObject.owner ?? mainObject.placement ?? "",
    x: clampInternalPercent(42 + Math.cos(angle) * 22),
    y: clampInternalPercent(45 + Math.sin(angle) * 22),
    ...(mainObject.spawn !== undefined ? { spawn: mainObject.spawn } : {}),
    ...(mainObject.owner !== undefined ? { owner: mainObject.owner } : {}),
    ...(mainObject.isKeyObject !== undefined ? { isKeyObject: mainObject.isKeyObject } : {}),
    ...(mainObject.holdCityWinCon !== undefined ? { holdCityWinCon: mainObject.holdCityWinCon } : {}),
    ...(mainObject.placement !== undefined ? { placement: mainObject.placement } : {}),
    placementArgs: [...(mainObject.placementArgs ?? [])],
    faction: projectRule(mainObject.faction),
    ...(mainObject.enableWeeklyUnitIncrement !== undefined ? { enableWeeklyUnitIncrement: mainObject.enableWeeklyUnitIncrement } : {}),
    ...(mainObject.initialUnitIncrement !== undefined ? { initialUnitIncrement: mainObject.initialUnitIncrement } : {}),
    ...(mainObject.guardChance !== undefined ? { guardChance: mainObject.guardChance } : {}),
    ...(mainObject.guardValue !== undefined ? { guardValue: mainObject.guardValue } : {}),
    ...(mainObject.guardWeeklyIncrement !== undefined ? { guardWeeklyIncrement: mainObject.guardWeeklyIncrement } : {}),
    ...(mainObject.guardRandomization !== undefined ? { guardRandomization: mainObject.guardRandomization } : {}),
    ...(mainObject.removeGuardIfHasOwner !== undefined ? { removeGuardIfHasOwner: mainObject.removeGuardIfHasOwner } : {}),
    ...(mainObject.buildingsConstructionSid !== undefined ? { buildingsConstructionSid: mainObject.buildingsConstructionSid } : {}),
    ...(mainObject.buildingsBanSid !== undefined ? { buildingsBanSid: mainObject.buildingsBanSid } : {}),
  };
}

function projectConnectionAnchor(connection: Connection, index: number, connectionCount: number): ShellZoneObjectItem {
  const y = connectionCount <= 1 ? 48 : 18 + (index * 64) / Math.max(1, connectionCount - 1);
  return {
    id: `connection:${connection.name ?? index}`,
    kind: "connection",
    label: connection.name ?? `Connection ${index + 1}`,
    type: "Connection",
    detail: `${connection.from ?? "?"} -> ${connection.to ?? "?"} / ${connection.connectionType ?? "Default"}`,
    connectionType: connection.connectionType ?? "Default",
    x: 78,
    y: clampInternalPercent(y),
    placementArgs: [],
    faction: { type: "", args: [] },
  };
}

function projectZoneRoads(zone: Zone, zoneObjects: readonly ShellZoneObjectItem[]): ShellZoneRoadItem[] {
  const objectIds = new Set(zoneObjects.map((object) => object.id));
  return (zone.roads ?? []).map((road, index) => {
    const fromId = roadTargetId(road.from);
    const toId = roadTargetId(road.to);
    return {
      id: `road:${index}`,
      label: `Road ${index + 1}`,
      index,
      type: road.type ?? "Dirt",
      fromId: objectIds.has(fromId) ? fromId : "unknown",
      toId: objectIds.has(toId) ? toId : "unknown",
      fromTarget: projectRoadTarget(road.from),
      toTarget: projectRoadTarget(road.to),
    };
  });
}

function projectRoadTarget(target: RoadTargetConfig | undefined): { type: string; args: string[] } {
  return {
    type: target?.type ?? "Crossroads",
    args: [...(target?.args ?? [])],
  };
}

function ensureRoadTargetObject(target: RoadTargetConfig | undefined, extras: Map<string, ShellZoneObjectItem>): void {
  const id = roadTargetId(target);
  if (id === "unknown" || id.startsWith("main:") || id.startsWith("connection:") || extras.has(id)) {
    return;
  }
  extras.set(id, {
    id,
    kind: target?.type === "Crossroads"
      ? "crossroads"
      : target?.type === "MandatoryContent"
        ? "mandatory"
        : "roadTarget",
    label: roadTargetLabel(target),
    type: target?.type ?? "RoadTarget",
    detail: target?.args?.join(", ") ?? "",
    x: id.startsWith("crossroads") ? 18 : 22,
    y: id.startsWith("crossroads") ? 52 : 72,
    placementArgs: [],
    faction: { type: "", args: [] },
    ...(target?.type === "MandatoryContent" ? {
      mandatoryEntryName: target?.args?.[0] ?? "",
      mandatorySid: target?.args?.[0] ?? "",
    } : {}),
  });
}

function roadTargetId(target: RoadTargetConfig | undefined): string {
  if (!target?.type) {
    return "unknown";
  }
  if (target.type === "MainObject") {
    return `main:${target.args?.[0] ?? "0"}`;
  }
  if (target.type === "Connection") {
    return `connection:${target.args?.[0] ?? ""}`;
  }
  if (target.type === "Crossroads") {
    return "crossroads";
  }
  if (target.type === "MandatoryContent") {
    return `mandatory:${target.args?.[0] ?? ""}`;
  }
  return `${target.type}:${target.args?.[0] ?? "0"}`;
}

function roadTargetLabel(target: RoadTargetConfig | undefined): string {
  if (!target?.type) {
    return "Unknown";
  }
  return target.args?.[0] ? `${target.type} ${target.args[0]}` : target.type;
}

function mandatoryEntryLabel(entry: import("../../core/rmg/rmgTypes.js").MandatoryContent, index: number): string {
  if (entry.name) return entry.name;
  if (entry.sid) return entry.sid;
  if ((entry.includeLists ?? []).length > 0) return `List ${entry.includeLists?.[0] ?? index + 1}`;
  if ((entry.content ?? []).length > 0) return `Inline content ${index + 1}`;
  return `Random mandatory ${index + 1}`;
}

function mandatoryEntryDetail(entry: import("../../core/rmg/rmgTypes.js").MandatoryContent, roadTargetable: boolean): string {
  const parts: string[] = [];
  if (entry.sid) parts.push("direct SID");
  if ((entry.includeLists ?? []).length > 0) parts.push(`${entry.includeLists?.length ?? 0} list(s)`);
  if ((entry.content ?? []).length > 0) parts.push(`${entry.content?.length ?? 0} inline item(s)`);
  if (!roadTargetable) parts.push("unnamed, not a road target");
  return parts.join(" / ");
}

function isZoneLocalMandatoryPreset(presetName: string, zoneName: string): boolean {
  const base = `${sanitizeIdentifier(zoneName)}_mandatory`;
  return presetName === base || presetName.startsWith(`${base}-`) || presetName.startsWith(`${base}_local`);
}

function sanitizeIdentifier(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized.length > 0 ? sanitized : "zone";
}

function clampInternalPercent(value: number): number {
  return Math.max(8, Math.min(84, Number(value.toFixed(2))));
}
