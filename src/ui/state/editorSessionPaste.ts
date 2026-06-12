import { cloneTemplate } from "../../core/mutations/cloneTemplate.js";
import type { MutationChange, MutationResult } from "../../core/mutations/mutationTypes.js";
import { pushTransaction } from "../../core/mutations/transactionManager.js";
import type { PlayerRef } from "../../core/rmg/enums.js";
import type {
  Connection,
  FactionRule,
  MainObject,
  MandatoryContent,
  MandatoryContentPreset,
  RmgTemplate,
  RoadConfig,
  RoadTargetConfig,
  Zone,
} from "../../core/rmg/rmgTypes.js";
import type { ZoneClipboardData } from "./clipboard.js";
import { saveEditorLayout } from "./editorLayoutPersistence.js";
import { asPlayerRef, inferZonePlayerOwner, isPlayerRef, mainObjectPlayerRef } from "./editorSessionOwners.js";
import type { CanvasPosition, EditorSession } from "./editorSessionTypes.js";

export function pasteZoneClipboardIntoSelectedZone(
  session: EditorSession,
  clipboardData: ZoneClipboardData,
): EditorSession {
  const targetZoneName = session.selectedZoneName;
  if (!targetZoneName) {
    return setSessionMessage(session, "No selected zone to paste into.");
  }
  const sourceZone = clipboardData.zone;
  const sourceZoneName = clipboardData.sourceZoneName || sourceZone.name || "";
  if (!sourceZoneName) {
    return setSessionMessage(session, "Copied zone data is missing its source zone name.");
  }

  const variant = session.template.variants?.[session.selectedVariantIndex];
  const targetZone = variant?.zones?.find((zone) => zone.name === targetZoneName);
  if (!variant || !targetZone) {
    return setSessionMessage(session, `Zone '${targetZoneName}' not found.`);
  }

  const template = cloneTemplate(session.template);
  const nextVariant = template.variants?.[session.selectedVariantIndex];
  const zones = nextVariant?.zones ?? [];
  const targetZoneIndex = zones.findIndex((zone) => zone.name === targetZoneName);
  const nextTargetZone = zones[targetZoneIndex];
  if (!nextVariant || !nextTargetZone) {
    return setSessionMessage(session, `Zone '${targetZoneName}' not found.`);
  }

  const changes: MutationChange[] = [];
  const copiedZone = cloneValue(sourceZone);
  const ownerRemap = buildPastedZoneOwnerRemap(sourceZone, nextTargetZone);
  const connectionNameMap = buildIncidentConnectionNameMap(
    session.template,
    session.selectedVariantIndex,
    sourceZoneName,
    targetZoneName,
  );
  const mandatoryPresetNameMap = cloneMandatoryPresetsForPastedZone(
    template,
    clipboardData,
    sourceZoneName,
    targetZoneName,
    ownerRemap,
    connectionNameMap,
    changes,
  );

  copiedZone.name = targetZoneName;
  remapZoneLocalRuleRefs(copiedZone, sourceZoneName, targetZoneName);
  copiedZone.mainObjects = remapCopiedMainObjects(
    copiedZone.mainObjects ?? clipboardData.mainObjects,
    ownerRemap,
    connectionNameMap,
    sourceZoneName,
    targetZoneName,
  );
  copiedZone.mandatoryContent = remapMandatoryPresetRefs(
    copiedZone.mandatoryContent ?? clipboardData.mandatoryContent,
    mandatoryPresetNameMap,
  );
  copiedZone.roads = remapCopiedRoads(
    copiedZone.roads ?? clipboardData.roads,
    connectionNameMap,
    copiedZone,
    template,
    nextVariant,
  );

  const beforeZone = cloneValue(nextTargetZone);
  zones[targetZoneIndex] = copiedZone;
  changes.push({
    path: `$.variants[${session.selectedVariantIndex}].zones[${targetZoneIndex}]`,
    before: beforeZone,
    after: cloneValue(copiedZone),
    reason: "zone clipboard pasted",
  });

  const nextZoneObjectPositions = {
    ...session.zoneObjectPositions,
    [targetZoneName]: remapZoneObjectPositions(clipboardData.zoneObjectPositions, connectionNameMap),
  };

  const result: MutationResult<RmgTemplate> = {
    value: template,
    changes,
    diagnostics: [],
    ok: true,
  };
  const next: EditorSession = {
    ...session,
    template,
    history: changes.length > 0
      ? pushTransaction(session.history, `Paste zone onto ${targetZoneName}`, session.template, result)
      : session.history,
    dirty: session.dirty || changes.length > 0,
    selectedZoneName: targetZoneName,
    selectedConnectionName: undefined,
    zoneObjectPositions: nextZoneObjectPositions,
    lastMessage: `Pasted zone structure into ${targetZoneName}: ${copiedZone.mainObjects.length} object(s), ${copiedZone.roads.length} road(s).`,
    lastActionFailed: false,
  };
  persistLayout(next);
  return next;
}

function cloneMandatoryPresetsForPastedZone(
  template: RmgTemplate,
  clipboardData: ZoneClipboardData,
  sourceZoneName: string,
  targetZoneName: string,
  ownerRemap: PastedZoneOwnerRemap,
  connectionNameMap: ReadonlyMap<string, string>,
  changes: MutationChange[],
): Map<string, string> {
  const presetRefs = clipboardData.zone.mandatoryContent ?? clipboardData.mandatoryContent;
  const sourcePresetsByName = new Map<string, MandatoryContentPreset>();
  const presetNameMap = new Map<string, string>();
  const templatePresets = template.mandatoryContent ?? [];
  template.mandatoryContent = templatePresets;
  for (const preset of templatePresets) {
    if (preset.name) {
      sourcePresetsByName.set(preset.name, preset);
    }
  }
  for (const preset of clipboardData.mandatoryPresetDefinitions) {
    if (preset.name) {
      sourcePresetsByName.set(preset.name, preset);
    }
  }
  const existingNames = new Set(templatePresets.map((preset) => preset.name).filter((name): name is string => Boolean(name)));

  for (const presetRef of presetRefs) {
    const sourcePreset = sourcePresetsByName.get(presetRef);
    if (!sourcePreset) {
      continue;
    }
    const nextPreset = cloneValue(sourcePreset);
    const nextName = nextPastedMandatoryPresetName(presetRef, sourceZoneName, targetZoneName, existingNames);
    nextPreset.name = nextName;
    nextPreset.content = remapMandatoryContentEntries(
      nextPreset.content ?? [],
      ownerRemap,
      connectionNameMap,
    );
    const insertIndex = templatePresets.length;
    templatePresets.push(nextPreset);
    presetNameMap.set(presetRef, nextName);
    existingNames.add(nextName);
    changes.push({
      path: `$.mandatoryContent[${insertIndex}]`,
      before: undefined,
      after: cloneValue(nextPreset),
      reason: "mandatory preset cloned for pasted zone",
    });
  }

  return presetNameMap;
}

function nextPastedMandatoryPresetName(
  sourcePresetName: string,
  sourceZoneName: string,
  targetZoneName: string,
  existingNames: Set<string>,
): string {
  const sourceZoneKey = sanitizeIdentifier(sourceZoneName);
  const targetZoneKey = sanitizeIdentifier(targetZoneName);
  const sourcePresetKey = sanitizeIdentifier(sourcePresetName);
  const baseName = sourcePresetKey.includes(sourceZoneKey)
    ? sourcePresetKey.replace(sourceZoneKey, targetZoneKey)
    : `${targetZoneKey}_${sourcePresetKey}`;
  return nextUniqueName([...existingNames], baseName);
}

function remapMandatoryPresetRefs(
  presetRefs: readonly string[],
  presetNameMap: ReadonlyMap<string, string>,
): string[] {
  return presetRefs.map((presetRef) => presetNameMap.get(presetRef) ?? presetRef);
}

function remapMandatoryContentEntries(
  content: readonly MandatoryContent[],
  ownerRemap: PastedZoneOwnerRemap,
  connectionNameMap: ReadonlyMap<string, string>,
): MandatoryContent[] {
  return content.map((entry) => {
    const next = cloneValue(entry);
    if (isPlayerRef(next.owner)) {
      next.owner = remapCopiedPlayerRef(next.owner, ownerRemap);
    }
    if (next.rules) {
      next.rules = next.rules.map((rule) => remapPlacementRule(rule, connectionNameMap));
    }
    return next;
  });
}

function remapPlacementRule(
  rule: NonNullable<MandatoryContent["rules"]>[number],
  connectionNameMap: ReadonlyMap<string, string>,
): NonNullable<MandatoryContent["rules"]>[number] {
  const next = cloneValue(rule);
  if (next.type === "Connection" && next.args?.[0]) {
    next.args[0] = connectionNameMap.get(next.args[0]) ?? next.args[0];
  }
  return next;
}

function remapCopiedMainObjects(
  mainObjects: readonly MainObject[],
  ownerRemap: PastedZoneOwnerRemap,
  connectionNameMap: ReadonlyMap<string, string>,
  sourceZoneName: string,
  targetZoneName: string,
): MainObject[] {
  return mainObjects.map((mainObject) => {
    const next = cloneValue(mainObject);
    if (isPlayerRef(next.spawn)) {
      next.spawn = remapCopiedPlayerRef(next.spawn, ownerRemap);
    }
    if (isPlayerRef(next.owner)) {
      next.owner = remapCopiedPlayerRef(next.owner, ownerRemap);
    }
    if (next.placement === "Connection" && next.placementArgs?.[0]) {
      next.placementArgs[0] = connectionNameMap.get(next.placementArgs[0]) ?? next.placementArgs[0];
    }
    if (next.placement === "NearZone" && next.placementArgs?.[0] === sourceZoneName) {
      next.placementArgs[0] = targetZoneName;
    }
    remapFactionRuleZoneRefs(next.faction, sourceZoneName, targetZoneName);
    return next;
  });
}

function remapCopiedRoads(
  roads: readonly RoadConfig[],
  connectionNameMap: ReadonlyMap<string, string>,
  zone: Zone,
  template: RmgTemplate,
  variant: NonNullable<RmgTemplate["variants"]>[number],
): RoadConfig[] {
  return roads
    .map((road) => ({
      ...cloneValue(road),
      ...(road.from ? { from: remapRoadTarget(road.from, connectionNameMap) } : {}),
      ...(road.to ? { to: remapRoadTarget(road.to, connectionNameMap) } : {}),
    }))
    .filter((road) =>
      isRoadTargetResolvable(road.from, zone, template, variant) &&
      isRoadTargetResolvable(road.to, zone, template, variant)
    );
}

function remapRoadTarget(
  target: RoadTargetConfig,
  connectionNameMap: ReadonlyMap<string, string>,
): RoadTargetConfig {
  const next = cloneValue(target);
  if (next.type === "Connection" && next.args?.[0]) {
    next.args[0] = connectionNameMap.get(next.args[0]) ?? next.args[0];
  }
  return next;
}

function isRoadTargetResolvable(
  target: RoadTargetConfig | undefined,
  zone: Zone,
  template: RmgTemplate,
  variant: NonNullable<RmgTemplate["variants"]>[number],
): boolean {
  if (!target?.type) {
    return false;
  }
  switch (target.type) {
    case "Crossroads":
      return true;
    case "MainObject": {
      const index = Number(target.args?.[0]);
      return Number.isInteger(index) && index >= 0 && index < (zone.mainObjects?.length ?? 0);
    }
    case "Connection": {
      const connectionName = target.args?.[0];
      if (!connectionName || !zone.name) return false;
      const connection = (variant.connections ?? []).find((item) => item.name === connectionName);
      return Boolean(
        connection &&
        connection.connectionType !== "Proximity" &&
        (connection.from === zone.name || connection.to === zone.name),
      );
    }
    case "MandatoryContent": {
      const contentName = target.args?.[0];
      if (!contentName) return false;
      return (zone.mandatoryContent ?? []).some((presetName) =>
        (template.mandatoryContent ?? [])
          .find((preset) => preset.name === presetName)
          ?.content?.some((entry) => entry.name === contentName),
      );
    }
    default:
      return false;
  }
}

function remapZoneObjectPositions(
  positions: Readonly<Record<string, CanvasPosition>>,
  connectionNameMap: ReadonlyMap<string, string>,
): Record<string, CanvasPosition> {
  const next: Record<string, CanvasPosition> = {};
  for (const [objectId, position] of Object.entries(positions)) {
    if (objectId.startsWith("connection:")) {
      const sourceConnectionName = objectId.replace("connection:", "");
      const targetConnectionName = connectionNameMap.get(sourceConnectionName);
      if (!targetConnectionName) {
        continue;
      }
      next[`connection:${targetConnectionName}`] = clampCanvasPosition(position);
      continue;
    }
    next[objectId] = clampCanvasPosition(position);
  }
  return next;
}

function buildIncidentConnectionNameMap(
  template: RmgTemplate,
  variantIndex: number,
  sourceZoneName: string,
  targetZoneName: string,
): Map<string, string> {
  const variant = template.variants?.[variantIndex];
  const sourceConnections = incidentRoadConnectionNames(variant?.connections ?? [], sourceZoneName);
  const targetConnections = incidentRoadConnectionNames(variant?.connections ?? [], targetZoneName);
  const map = new Map<string, string>();
  sourceConnections.forEach((connectionName, index) => {
    const targetConnectionName = targetConnections[index];
    if (targetConnectionName) {
      map.set(connectionName, targetConnectionName);
    }
  });
  return map;
}

function incidentRoadConnectionNames(
  connections: readonly Connection[],
  zoneName: string,
): string[] {
  return connections
    .filter((connection) =>
      connection.name &&
      connection.connectionType !== "Proximity" &&
      (connection.from === zoneName || connection.to === zoneName)
    )
    .map((connection) => connection.name as string);
}

interface PastedZoneOwnerRemap {
  refs: ReadonlyMap<PlayerRef, PlayerRef>;
  sourceOwner: PlayerRef | undefined;
  targetOwner: PlayerRef | undefined;
}

function buildPastedZoneOwnerRemap(sourceZone: Zone, targetZone: Zone): PastedZoneOwnerRemap {
  const refs = new Map<PlayerRef, PlayerRef>();
  const sourceOwner = inferZonePlayerOwner(sourceZone);
  const targetOwner = inferZonePlayerOwner(targetZone);
  const sourceMainObjects = sourceZone.mainObjects ?? [];
  const targetMainObjects = targetZone.mainObjects ?? [];
  const pairCount = Math.min(sourceMainObjects.length, targetMainObjects.length);

  for (let index = 0; index < pairCount; index += 1) {
    const sourceMainObject = sourceMainObjects[index];
    const targetMainObject = targetMainObjects[index];
    const targetRef = mainObjectPlayerRef(targetMainObject) ?? targetOwner;
    addPlayerRefMapping(refs, sourceMainObject?.spawn, targetMainObject?.spawn ?? targetRef);
    addPlayerRefMapping(refs, sourceMainObject?.owner, targetMainObject?.owner ?? targetRef);
  }

  if (sourceOwner && targetOwner && !refs.has(sourceOwner)) {
    refs.set(sourceOwner, targetOwner);
  }

  return { refs, sourceOwner, targetOwner };
}

function addPlayerRefMapping(
  refs: Map<PlayerRef, PlayerRef>,
  sourceValue: unknown,
  targetValue: unknown,
): void {
  const sourceRef = asPlayerRef(sourceValue);
  const targetRef = asPlayerRef(targetValue);
  if (sourceRef && targetRef && !refs.has(sourceRef)) {
    refs.set(sourceRef, targetRef);
  }
}

function remapCopiedPlayerRef(
  value: PlayerRef,
  ownerRemap: PastedZoneOwnerRemap,
): PlayerRef {
  const mapped = ownerRemap.refs.get(value);
  if (mapped) {
    return mapped;
  }
  if (!ownerRemap.targetOwner) {
    return value;
  }
  return !ownerRemap.sourceOwner || value === ownerRemap.sourceOwner ? ownerRemap.targetOwner : value;
}

function remapZoneLocalRuleRefs(zone: Zone, sourceZoneName: string, targetZoneName: string): void {
  remapRuleZoneRefs(zone.zoneBiome, sourceZoneName, targetZoneName);
  remapRuleZoneRefs(zone.contentBiome, sourceZoneName, targetZoneName);
  remapRuleZoneRefs(zone.metaObjectsBiome, sourceZoneName, targetZoneName);
}

function remapFactionRuleZoneRefs(
  rule: FactionRule | undefined,
  sourceZoneName: string,
  targetZoneName: string,
): void {
  remapRuleZoneRefs(rule, sourceZoneName, targetZoneName);
}

function remapRuleZoneRefs(
  rule: { type?: string; args?: string[] } | undefined,
  sourceZoneName: string,
  targetZoneName: string,
): void {
  if (!rule?.args) {
    return;
  }
  if (rule.type === "Match" && rule.args[1] === sourceZoneName) {
    rule.args[1] = targetZoneName;
  }
  rule.args = rule.args.map((arg) => remapDifferentFromZoneArg(arg, sourceZoneName, targetZoneName));
}

function remapDifferentFromZoneArg(arg: string, sourceZoneName: string, targetZoneName: string): string {
  const parts = arg.trim().split(/\s+/u);
  if (parts.length < 2 || parts[0] !== "differentFrom:") {
    return arg;
  }
  for (const zoneTokenIndex of [2, 1]) {
    if (parts[zoneTokenIndex] === sourceZoneName) {
      parts[zoneTokenIndex] = targetZoneName;
      return parts.join(" ");
    }
  }
  return arg;
}

function nextUniqueName(existingNames: readonly string[], baseName: string): string {
  const existing = new Set(existingNames);
  if (!existing.has(baseName)) {
    return baseName;
  }
  let suffix = 2;
  while (existing.has(`${baseName}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseName}-${suffix}`;
}

function sanitizeIdentifier(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized.length > 0 ? sanitized : "zone";
}

function clampCanvasPosition(position: CanvasPosition): CanvasPosition {
  return {
    x: Math.min(100, Math.max(0, position.x)),
    y: Math.min(100, Math.max(0, position.y)),
  };
}

function persistLayout(session: EditorSession): void {
  saveEditorLayout(session.layoutStorageKey, {
    canvasPositions: session.canvasPositions,
    zoneObjectPositions: session.zoneObjectPositions,
  });
}

function setSessionMessage(session: EditorSession, message: string): EditorSession {
  return { ...session, lastMessage: message, lastActionFailed: true };
}

function cloneValue<T>(value: T): T {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
}
