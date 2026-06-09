import { applyEditorAction } from "../../core/editor-actions/applyEditorAction.js";
import type { EditorAction } from "../../core/editor-actions/editorActionTypes.js";
import { createMinimalPlayableTemplate } from "../../core/mutations/minimalPlayableTemplate.js";
import {
  canRedo,
  canUndo,
  createTransactionHistory,
  redo,
  type TransactionHistory,
  undo,
} from "../../core/mutations/transactionManager.js";
import type { ConnectionType, GameMode, GatePlacement, GuardReaction, MainObjectPlacement, MainObjectType, PlayerRef, RoadTargetType, RoadType } from "../../core/rmg/enums.js";
import { PLAYER_REFS } from "../../core/rmg/enums.js";
import type { ContentWeight, FactionRule, MainObject, RmgTemplate, RoadTargetConfig, Zone } from "../../core/rmg/rmgTypes.js";
import { createDefaultConnection, createDefaultZone } from "../../core/mutations/defaultObjects.js";
import {
  createLayoutStorageKey,
  loadEditorLayout,
  saveEditorLayout,
} from "./editorLayoutPersistence.js";

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface EditorLayoutState {
  canvasPositions: Record<string, CanvasPosition>;
  zoneObjectPositions: Record<string, Record<string, CanvasPosition>>;
}

export interface CoreArchiveRef {
  name: string;
  size: number;
  lastModified: number;
  catalogSummary?: CoreArchiveCatalogSummary;
  source?: "bundled" | "uploaded";
  contentPoolIndex?: Map<string, import("../../core/rmg/rmgTypes.js").ContentPoolConfig>;
  contentListIndex?: Map<string, import("../../core/rmg/rmgTypes.js").ContentList>;
}

export interface CoreArchiveCatalogSummary {
  contentPools: number;
  contentLists: number;
  factions: number;
  biomes: number;
  heroes: number;
  magics: number;
  units: number;
  rmgContent: number;
  biomeOptions: readonly CoreCatalogOption[];
  factionOptions: readonly CoreCatalogOption[];
  contentPoolOptions: readonly CoreCatalogOption[];
  guardedContentPoolOptions: readonly CoreCatalogOption[];
  unguardedContentPoolOptions: readonly CoreCatalogOption[];
  resourceContentPoolOptions: readonly CoreCatalogOption[];
  rmgContentOptions: readonly CoreCatalogOption[];
}

export interface CoreCatalogOption {
  id: string;
  label: string;
}

export interface ZoneUpdateDraft {
  name: string;
  size: number;
  layout: string;
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

export interface GlobalSettingsDraft {
  gameMode: string;
  sizeX: number;
  displayWinCondition: string;
  sizeZ: number;
  heroCountMin: number;
  heroCountMax: number;
  heroCountIncrement: number;
  heroHireBan: boolean;
  encounterHoles: boolean;
  disableFactionLaws: boolean;
  disableMagicGuild: boolean;
  disableMagicCustomLearning: boolean;
  tournamentRules: boolean;
  factionLawsExpModifier: number | undefined;
  astrologyExpModifier: number | undefined;
  classic: boolean;
  desertion: boolean;
  desertionDay: number | undefined;
  desertionValue: number | undefined;
  heroLighting: boolean;
  heroLightingDay: number | undefined;
  lostStartCity: boolean;
  lostStartCityDay: number | undefined;
  lostStartHero: boolean;
  gladiatorArena: boolean;
  gladiatorArenaDaysDelayStart: number | undefined;
  gladiatorArenaCountDay: number | undefined;
  championSelectRule: string;
  cityHold: boolean;
  cityHoldDays: number | undefined;
  tournament: boolean;
  tournamentPointsToWin: number | undefined;
}

export interface ConnectionUpdateDraft {
  originalName: string;
  name: string;
  from: string;
  to: string;
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
  road: boolean;
  simTurnSquad: boolean;
  guardRandomization: number | undefined;
}

export interface RoadUpdateDraft {
  roadIndex: number;
  type: string;
  from: {
    type: string;
    args: readonly string[];
  };
  to: {
    type: string;
    args: readonly string[];
  };
}

export interface MainObjectUpdateDraft {
  objectIndex: number;
  type: string;
  spawn: string;
  owner: string;
  isKeyObject: boolean;
  holdCityWinCon: boolean;
  placement: string;
  placementArgs: readonly string[];
  factionType: string;
  factionArgs: readonly string[];
  enableWeeklyUnitIncrement: boolean;
  initialUnitIncrement: number | undefined;
  guardChance: number | undefined;
  guardValue: number | undefined;
  guardWeeklyIncrement: number | undefined;
  guardRandomization: number | undefined;
  removeGuardIfHasOwner: boolean;
  buildingsConstructionSid: string;
  buildingsBanSid: string;
}

export interface ContentPoolCreateDraft {
  name: string;
}

export interface ContentPoolGroupCreateDraft {
  poolIndex: number;
}

export interface ContentPoolGroupUpdateDraft {
  poolIndex: number;
  groupIndex: number;
  weight: number | undefined;
  includeLists: readonly string[];
  content: readonly ContentWeight[];
}

export interface EditorSession {
  template: RmgTemplate;
  history: TransactionHistory;
  sourceFileName: string | undefined;
  coreArchive: CoreArchiveRef | undefined;
  dirty: boolean;
  lastMessage: string;
  lastActionFailed: boolean;
  selectedVariantIndex: number;
  selectedZoneName: string | undefined;
  selectedConnectionName: string | undefined;
  layoutStorageKey: string;
  canvasPositions: Record<string, CanvasPosition>;
  zoneObjectPositions: Record<string, Record<string, CanvasPosition>>;
  focusedPlayer: string | undefined;
}

export function createInitialEditorSession(): EditorSession {
  const template = createMinimalPlayableTemplate({
    name: "Untitled RMG",
    playerCount: 2,
  });
  return createSessionFromTemplate(template, {
    lastMessage: "New playable template created.",
  });
}

export function createSessionFromTemplateText(text: string, sourceFileName: string): EditorSession {
  const parsed = JSON.parse(text) as unknown;
  if (!isTemplateObject(parsed)) {
    throw new Error("Selected file is not a JSON object template.");
  }
  return createSessionFromTemplate(parsed, {
    sourceFileName,
    lastMessage: `Loaded ${sourceFileName}.`,
  });
}

export function attachCoreArchive(session: EditorSession, file: File): EditorSession {
  return {
    ...session,
    coreArchive: {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
    },
    lastMessage: `Attached ${file.name}.`,
    lastActionFailed: false,
  };
}
export function setCoreArchiveCatalogSummary(
  session: EditorSession,
  file: File,
  catalogSummary: CoreArchiveCatalogSummary,
  contentPoolIndex?: Map<string, import("../../core/rmg/rmgTypes.js").ContentPoolConfig>,
  contentListIndex?: Map<string, import("../../core/rmg/rmgTypes.js").ContentList>,
): EditorSession {
  return {
    ...session,
    coreArchive: {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified,
      catalogSummary,
      source: "uploaded",
      ...(contentPoolIndex ? { contentPoolIndex } : {}),
      ...(contentListIndex ? { contentListIndex } : {}),
    },
    lastMessage: `Parsed ${file.name}: ${catalogSummary.contentPools} pools, ${catalogSummary.rmgContent} content entries.`,
    lastActionFailed: false,
  };
}
export function setBundledCoreArchiveCatalogSummary(
  session: EditorSession,
  catalogSummary: CoreArchiveCatalogSummary,
): EditorSession {
  return {
    ...session,
    coreArchive: {
      name: "Bundled Core",
      size: 0,
      lastModified: 0,
      catalogSummary,
      source: "bundled",
    },
    lastMessage: `Bundled core loaded: ${catalogSummary.contentPools} pools, ${catalogSummary.rmgContent} content entries.`,
    lastActionFailed: false,
  };
}

export function markSessionSaved(session: EditorSession): EditorSession {
  return {
    ...session,
    dirty: false,
    lastMessage: "Template JSON downloaded.",
    lastActionFailed: false,
  };
}

export function setSessionMessage(session: EditorSession, message: string): EditorSession {
  return { ...session, lastMessage: message, lastActionFailed: true };
}

export function setSessionStatusMessage(session: EditorSession, message: string): EditorSession {
  return { ...session, lastMessage: message, lastActionFailed: false };
}

export function serializeSessionTemplate(session: EditorSession): string {
  return `${JSON.stringify(session.template, null, "\t")}\n`;
}

export function getSessionSaveFileName(session: EditorSession): string {
  if (session.sourceFileName?.endsWith(".rmg.json")) {
    return session.sourceFileName;
  }
  const baseName = sanitizeFileName(session.template.name ?? "untitled");
  return `${baseName}.rmg.json`;
}

export function selectZone(session: EditorSession, zoneName: string): EditorSession {
  return {
    ...session,
    selectedZoneName: zoneName,
    selectedConnectionName: undefined,
    lastMessage: `Selected ${zoneName}.`,
    lastActionFailed: false,
  };
}

export function selectConnection(session: EditorSession, connectionName: string): EditorSession {
  return {
    ...session,
    selectedConnectionName: connectionName,
    lastMessage: `Selected connection ${connectionName}.`,
    lastActionFailed: false,
  };
}

export function moveZoneInSession(session: EditorSession, zoneName: string, position: CanvasPosition): EditorSession {
  const next = {
    ...session,
    canvasPositions: {
      ...session.canvasPositions,
      [zoneName]: clampCanvasPosition(position),
    },
    lastMessage: `Moved ${zoneName}.`,
    lastActionFailed: false,
  };
  persistLayout(next);
  return next;
}

export function moveZoneObjectInSession(
  session: EditorSession,
  zoneName: string,
  objectId: string,
  position: CanvasPosition,
): EditorSession {
  const next = {
    ...session,
    zoneObjectPositions: {
      ...session.zoneObjectPositions,
      [zoneName]: {
        ...(session.zoneObjectPositions[zoneName] ?? {}),
        [objectId]: clampCanvasPosition(position),
      },
    },
    lastMessage: `Moved ${objectId} in ${zoneName}.`,
    lastActionFailed: false,
  };
  persistLayout(next);
  return next;
}

export function addZoneToSession(session: EditorSession): EditorSession {
  const zoneName = nextUniqueName(getZoneNames(session), "Zone");
  return applyAction(session, {
    action: {
      type: "zone.add",
      input: {
        variantIndex: session.selectedVariantIndex,
        zone: { name: zoneName, size: 1 },
      },
    },
    label: `Add ${zoneName}`,
    selectedZoneName: zoneName,
  });
}

export function removeSelectedZoneFromSession(session: EditorSession): EditorSession {
  const selectedZoneName = session.selectedZoneName;
  if (!selectedZoneName) {
    return setSessionMessage(session, "No selected zone to remove.");
  }
  const result = applyAction(session, {
    action: {
      type: "zone.remove",
      input: {
        variantIndex: session.selectedVariantIndex,
        zone: { zoneName: selectedZoneName },
        cascadeConnections: true,
        cleanupReferences: true,
      },
    },
    label: `Remove ${selectedZoneName}`,
  });
  const nextCanvasPositions = { ...result.canvasPositions };
  const nextZoneObjectPositions = { ...result.zoneObjectPositions };
  delete nextCanvasPositions[selectedZoneName];
  delete nextZoneObjectPositions[selectedZoneName];
  return {
    ...result,
    selectedZoneName: selectFirstZoneName(result.template, result.selectedVariantIndex),
    canvasPositions: nextCanvasPositions,
    zoneObjectPositions: nextZoneObjectPositions,
  };
}

export function addConnectionFromSelectedZone(session: EditorSession): EditorSession {
  const from = session.selectedZoneName;
  const zoneNames = getZoneNames(session);
  const to = zoneNames.find((zoneName) => zoneName !== from);
  if (!from || !to) {
    return setSessionMessage(session, "Add at least two named zones before adding a connection.");
  }
  const connectionName = nextUniqueName(getConnectionNames(session), `${from}-${to}`);
  return applyAction(session, {
    action: {
      type: "connection.add",
      input: {
        variantIndex: session.selectedVariantIndex,
        connection: {
          name: connectionName,
          from,
          to,
          connectionType: "Direct",
          length: 1,
        },
      },
    },
    label: `Add ${connectionName}`,
    selectedConnectionName: connectionName,
  });
}

export function addConnectionBetweenZones(session: EditorSession, from: string, to: string): EditorSession {
  if (from === to) {
    return setSessionMessage(session, "Cannot connect a zone to itself.");
  }
  const zoneNames = getZoneNames(session);
  if (!zoneNames.includes(from) || !zoneNames.includes(to)) {
    return setSessionMessage(session, "Connection endpoints must be existing zones.");
  }
  const connectionName = nextUniqueName(getConnectionNames(session), `${from}-${to}`);
  return applyAction(session, {
    action: {
      type: "connection.add",
      input: {
        variantIndex: session.selectedVariantIndex,
        connection: {
          name: connectionName,
          from,
          to,
          connectionType: "Direct",
          length: 1,
        },
      },
    },
    label: `Connect ${from} to ${to}`,
    selectedConnectionName: connectionName,
  });
}

export function addMainObjectToSelectedZone(session: EditorSession): EditorSession {
  const zoneName = session.selectedZoneName;
  if (!zoneName) {
    return setSessionMessage(session, "No selected zone for main object.");
  }
  return applyAction(session, {
    action: {
      type: "mainObject.add",
      input: {
        variantIndex: session.selectedVariantIndex,
        zone: { zoneName },
        mainObject: {
          type: "City",
          placement: "Uniform",
        },
      },
    },
    label: `Add main object to ${zoneName}`,
  });
}

export function addDefaultRoadToSelectedZone(session: EditorSession): EditorSession {
  const zoneName = session.selectedZoneName;
  if (!zoneName) {
    return setSessionMessage(session, "No selected zone for road.");
  }
  const variant = session.template.variants?.[session.selectedVariantIndex];
  const zone = variant?.zones?.find((item) => item.name === zoneName);
  if ((zone?.mainObjects?.length ?? 0) === 0) {
    return setSessionMessage(session, "Add a main object before adding a road.");
  }
  const connection = (variant?.connections ?? []).find((item) =>
    item.connectionType !== "Proximity" &&
    item.name &&
    (item.from === zoneName || item.to === zoneName)
  );
  if (!connection?.name) {
    return setSessionMessage(session, "Add an incident non-proximity connection before adding a road.");
  }
  return applyAction(session, {
    action: {
      type: "road.add",
      input: {
        variantIndex: session.selectedVariantIndex,
        zone: { zoneName },
        road: {
          type: "Stone",
          from: { type: "MainObject", args: ["0"] },
          to: { type: "Connection", args: [connection.name] },
        },
      },
    },
    label: `Add road in ${zoneName}`,
  });
}

export function updateSelectedZoneRoadInSession(session: EditorSession, draft: RoadUpdateDraft): EditorSession {
  const zoneName = session.selectedZoneName;
  if (!zoneName) {
    return setSessionMessage(session, "No selected zone for road update.");
  }
  if (!Number.isInteger(draft.roadIndex) || draft.roadIndex < 0) {
    return setSessionMessage(session, "Select a valid road to update.");
  }
  const from = toRoadTargetConfig(draft.from);
  const to = toRoadTargetConfig(draft.to);
  if (!from || !to) {
    return setSessionMessage(session, "Road targets need a target type.");
  }
  return applyAction(session, {
    action: {
      type: "road.update",
      input: {
        variantIndex: session.selectedVariantIndex,
        zone: { zoneName },
        roadIndex: draft.roadIndex,
        settings: {
          type: draft.type as RoadType,
          from,
          to,
        },
      },
    },
    label: `Update road ${draft.roadIndex + 1} in ${zoneName}`,
  });
}

export function updateSelectedZoneMainObjectInSession(session: EditorSession, draft: MainObjectUpdateDraft): EditorSession {
  const zoneName = session.selectedZoneName;
  if (!zoneName) {
    return setSessionMessage(session, "No selected zone for main object update.");
  }
  if (!Number.isInteger(draft.objectIndex) || draft.objectIndex < 0) {
    return setSessionMessage(session, "Select a valid main object.");
  }
  return applyAction(session, {
    action: {
      type: "mainObject.update",
      input: {
        variantIndex: session.selectedVariantIndex,
        zone: { zoneName },
        mainObject: { mainObjectIndex: draft.objectIndex },
        settings: {
          type: draft.type as MainObjectType,
          spawn: draft.spawn.trim().length > 0 ? (draft.spawn as PlayerRef) : null,
          owner: draft.owner.trim().length > 0 ? (draft.owner as PlayerRef) : null,
          isKeyObject: draft.isKeyObject,
          holdCityWinCon: draft.holdCityWinCon,
          placement: draft.placement as MainObjectPlacement,
          placementArgs: [...draft.placementArgs],
          faction: toFactionRule(draft),
          enableWeeklyUnitIncrement: draft.enableWeeklyUnitIncrement,
          ...(draft.initialUnitIncrement !== undefined ? { initialUnitIncrement: draft.initialUnitIncrement } : {}),
          ...(draft.guardChance !== undefined ? { guardChance: draft.guardChance } : {}),
          ...(draft.guardValue !== undefined ? { guardValue: draft.guardValue } : {}),
          ...(draft.guardWeeklyIncrement !== undefined ? { guardWeeklyIncrement: draft.guardWeeklyIncrement } : {}),
          ...(draft.guardRandomization !== undefined ? { guardRandomization: draft.guardRandomization } : {}),
          removeGuardIfHasOwner: draft.removeGuardIfHasOwner,
          buildingsConstructionSid: draft.buildingsConstructionSid.trim().length > 0 ? draft.buildingsConstructionSid.trim() : null,
          buildingsBanSid: draft.buildingsBanSid.trim().length > 0 ? draft.buildingsBanSid.trim() : null,
        },
      },
    },
    label: `Update main object ${draft.objectIndex} in ${zoneName}`,
  });
}

export function addLocalContentPoolToSession(session: EditorSession, draft: ContentPoolCreateDraft): EditorSession {
  const name = draft.name.trim();
  if (!name) {
    return setSessionMessage(session, "Content pool name cannot be empty.");
  }
  return applyAction(session, {
    action: {
      type: "contentPool.add",
      input: {
        pool: {
          name,
          groups: [{ weight: 100, content: [] }],
        },
      },
    },
    label: `Add content pool ${name}`,
  });
}

export function addContentPoolGroupToSession(session: EditorSession, draft: ContentPoolGroupCreateDraft): EditorSession {
  if (!Number.isInteger(draft.poolIndex) || draft.poolIndex < 0) {
    return setSessionMessage(session, "Select a valid local content pool.");
  }
  return applyAction(session, {
    action: {
      type: "contentPool.group.add",
      input: {
        pool: { poolIndex: draft.poolIndex },
        group: {
          weight: 100,
          content: [],
        },
      },
    },
    label: `Add group to content pool ${draft.poolIndex}`,
  });
}

export function updateContentPoolGroupInSession(session: EditorSession, draft: ContentPoolGroupUpdateDraft): EditorSession {
  if (!Number.isInteger(draft.poolIndex) || draft.poolIndex < 0) {
    return setSessionMessage(session, "Select a valid local content pool.");
  }
  if (!Number.isInteger(draft.groupIndex) || draft.groupIndex < 0) {
    return setSessionMessage(session, "Select a valid content pool group.");
  }
  return applyAction(session, {
    action: {
      type: "contentPool.group.update",
      input: {
        pool: { poolIndex: draft.poolIndex },
        groupIndex: draft.groupIndex,
        settings: {
          weight: draft.weight ?? null,
          includeLists: draft.includeLists.length > 0 ? [...draft.includeLists] : null,
          content: [...draft.content],
        },
      },
    },
    label: `Update content pool ${draft.poolIndex} group ${draft.groupIndex}`,
  });
}

export function cloneCorePoolToLocalAndRewriteZone(
  session: EditorSession,
  corePoolName: string,
  zoneField: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool",
): EditorSession {
  const poolIndex = session.coreArchive?.contentPoolIndex;
  if (!poolIndex) {
    return setSessionMessage(session, "Core.zip must be uploaded to clone pools. Upload Core.zip first.");
  }
  const sourcePool = poolIndex.get(corePoolName);
  if (!sourcePool) {
    return setSessionMessage(session, `Core pool '${corePoolName}' not found.`);
  }
  const pools = session.template.contentPools ?? [];
  const existingNames = new Set(pools.map((p) => p.name).filter(Boolean));
  let localName = `${corePoolName}_local`;
  let suffix = 2;
  while (existingNames.has(localName)) {
    localName = `${corePoolName}_local${suffix++}`;
  }
  // Clone the pool to local via contentPool.add action
  let next = applyAction(session, {
    action: {
      type: "contentPool.add",
      input: {
        pool: JSON.parse(JSON.stringify({ ...sourcePool, name: localName })),
      },
    },
    label: `Clone pool '${corePoolName}' to local '${localName}'`,
  });
  if (next.lastActionFailed) return next;
  // Rewrite the zone's pool reference to use the local name
  const zoneName = next.selectedZoneName;
  if (!zoneName) return next;
  const zone = next.template.variants?.[next.selectedVariantIndex]?.zones?.find((z) => z.name === zoneName);
  if (!zone) return next;
  const currentRefs = (zone[zoneField] ?? []) as string[];
  const idx = currentRefs.indexOf(corePoolName);
  if (idx === -1) return next;
  const newRefs = [...currentRefs];
  newRefs[idx] = localName;
  next = applyAction(next, {
    action: {
      type: "zone.setContentPools",
      input: {
        variantIndex: next.selectedVariantIndex,
        zone: { zoneName },
        field: zoneField,
        poolIds: newRefs,
      },
    },
    label: `Rewrite zone '${zoneField}' to use local pool '${localName}'`,
    selectedZoneName: zoneName,
  });
  return next;
}

export function addContentToPoolGroupInSession(
  session: EditorSession,
  poolIndex: number,
  groupIndex: number,
  sid: string,
  variant?: number,
): EditorSession {
  const pool = session.template.contentPools?.[poolIndex];
  if (!pool) return setSessionMessage(session, "Pool not found.");
  const group = pool.groups?.[groupIndex];
  if (!group) return setSessionMessage(session, "Group not found.");
  const existingContent = [...(group.content ?? [])];
  existingContent.push({ sid, ...(variant !== undefined ? { variant } : {}) });
  return applyAction(session, {
    action: {
      type: "contentPool.group.update",
      input: {
        pool: { poolIndex },
        groupIndex,
        settings: { content: existingContent },
      },
    },
    label: `Add '${sid}' to pool group`,
  });
}

export function removeContentFromPoolGroupInSession(
  session: EditorSession,
  poolIndex: number,
  groupIndex: number,
  contentIndex: number,
): EditorSession {
  const pool = session.template.contentPools?.[poolIndex];
  if (!pool) return setSessionMessage(session, "Pool not found.");
  const group = pool.groups?.[groupIndex];
  if (!group) return setSessionMessage(session, "Group not found.");
  const existingContent = [...(group.content ?? [])];
  existingContent.splice(contentIndex, 1);
  return applyAction(session, {
    action: {
      type: "contentPool.group.update",
      input: {
        pool: { poolIndex },
        groupIndex,
        settings: { content: existingContent },
      },
    },
    label: `Remove content from pool group`,
  });
}

export function updateContentWeightInSession(
  session: EditorSession,
  poolIndex: number,
  groupIndex: number,
  contentIndex: number,
  weight: number | undefined,
): EditorSession {
  const pool = session.template.contentPools?.[poolIndex];
  if (!pool) return setSessionMessage(session, "Pool not found.");
  const group = pool.groups?.[groupIndex];
  if (!group) return setSessionMessage(session, "Group not found.");
  const existingContent = [...(group.content ?? [])];
  const item = existingContent[contentIndex];
  if (!item) return setSessionMessage(session, "Content item not found.");
  existingContent[contentIndex] = { ...item, weight };
  return applyAction(session, {
    action: {
      type: "contentPool.group.update",
      input: {
        pool: { poolIndex },
        groupIndex,
        settings: { content: existingContent },
      },
    },
    label: `Update content weight`,
  });
}

export function addBanToPoolInSession(session: EditorSession, poolIndex: number, sid: string): EditorSession {
  return applyAction(session, {
    action: {
      type: "contentPool.ban.add",
      input: {
        pool: { poolIndex },
        ban: { sid },
      },
    },
    label: `Add ban '${sid}' to pool`,
  });
}

export function removeBanFromPoolInSession(session: EditorSession, poolIndex: number, banIndex: number): EditorSession {
  return applyAction(session, {
    action: {
      type: "contentPool.ban.remove",
      input: {
        pool: { poolIndex },
        banIndex,
      },
    },
    label: `Remove ban from pool`,
  });
}

export function removeGroupFromPoolInSession(session: EditorSession, poolIndex: number, groupIndex: number): EditorSession {
  return applyAction(session, {
    action: {
      type: "contentPool.group.remove",
      input: {
        pool: { poolIndex },
        groupIndex,
      },
    },
    label: `Remove group from pool`,
  });
}

export function updateSelectedZoneInSession(session: EditorSession, draft: ZoneUpdateDraft): EditorSession {
  const currentZoneName = session.selectedZoneName;
  if (!currentZoneName) {
    return setSessionMessage(session, "No selected zone to update.");
  }
  if (draft.name.trim().length === 0) {
    return setSessionMessage(session, "Zone name cannot be empty.");
  }
  if (!Number.isFinite(draft.size) || draft.size <= 0) {
    return setSessionMessage(session, "Zone size must be a positive number.");
  }
  if (draft.guardedPools.length === 0 || draft.unguardedPools.length === 0 || draft.resourcesPools.length === 0) {
    return setSessionMessage(session, "Each content pool field needs at least one pool id.");
  }

  let next = session;
  let nextZoneName = currentZoneName;
  const trimmedName = draft.name.trim();
  if (trimmedName !== currentZoneName) {
    const previousPosition = next.canvasPositions[currentZoneName];
    next = applyAction(next, {
      action: {
        type: "field.update",
        fieldId: "zone.name",
        value: trimmedName,
        selection: {
          variantIndex: next.selectedVariantIndex,
          zone: { zoneName: currentZoneName },
        },
      },
      label: `Rename ${currentZoneName}`,
      selectedZoneName: trimmedName,
    });
    if (next.selectedZoneName !== trimmedName) {
      return next;
    }
    if (previousPosition) {
      const nextCanvasPositions = { ...next.canvasPositions };
      const nextZoneObjectPositions = { ...next.zoneObjectPositions };
      delete nextCanvasPositions[currentZoneName];
      nextCanvasPositions[trimmedName] = previousPosition;
      if (nextZoneObjectPositions[currentZoneName]) {
        nextZoneObjectPositions[trimmedName] = nextZoneObjectPositions[currentZoneName];
        delete nextZoneObjectPositions[currentZoneName];
      }
      next = {
        ...next,
        canvasPositions: nextCanvasPositions,
        zoneObjectPositions: nextZoneObjectPositions,
      };
      persistLayout(next);
    }
    nextZoneName = trimmedName;
  }

  next = applyAction(next, {
    action: {
      type: "zone.updateSettings",
      input: {
        variantIndex: next.selectedVariantIndex,
        zone: { zoneName: nextZoneName },
        settings: {
          size: draft.size,
          ...(draft.layout.trim().length > 0 ? { layout: draft.layout.trim() } : {}),
          ...(draft.zoneBiomeType.trim().length > 0 ? { zoneBiome: { type: draft.zoneBiomeType.trim(), args: [...draft.zoneBiomeArgs] } } : {}),
          ...(draft.contentBiomeType.trim().length > 0 ? { contentBiome: { type: draft.contentBiomeType.trim(), args: [...draft.contentBiomeArgs] } } : {}),
          ...(draft.metaObjectsBiomeType.trim().length > 0 ? { metaObjectsBiome: { type: draft.metaObjectsBiomeType.trim(), args: [...draft.metaObjectsBiomeArgs] } } : {}),
          ...(draft.crossroadsPosition !== undefined ? { crossroadsPosition: draft.crossroadsPosition } : {}),
          ...(draft.diplomacyModifier !== undefined ? { diplomacyModifier: draft.diplomacyModifier } : {}),
          ...(draft.guardCutoffValue !== undefined ? { guardCutoffValue: draft.guardCutoffValue } : {}),
          ...(draft.guardMultiplier !== undefined ? { guardMultiplier: draft.guardMultiplier } : {}),
          ...(draft.guardRandomization !== undefined ? { guardRandomization: draft.guardRandomization } : {}),
          ...(draft.guardWeeklyIncrement !== undefined ? { guardWeeklyIncrement: draft.guardWeeklyIncrement } : {}),
          ...(draft.guardReactionDistribution !== undefined ? { guardReactionDistribution: [...draft.guardReactionDistribution] } : {}),
        },
      },
    },
    label: "Update zone settings",
    selectedZoneName: nextZoneName,
  });
  const budgets = compactNumberRecord({
    guardedContentValue: draft.guardedContentValue,
    guardedContentValuePerArea: draft.guardedContentValuePerArea,
    unguardedContentValue: draft.unguardedContentValue,
    unguardedContentValuePerArea: draft.unguardedContentValuePerArea,
    resourcesValue: draft.resourcesValue,
    resourcesValuePerArea: draft.resourcesValuePerArea,
  });
  if (Object.keys(budgets).length > 0) {
    next = applyAction(next, {
      action: {
        type: "zone.setContentBudgets",
        input: {
          variantIndex: next.selectedVariantIndex,
          zone: { zoneName: nextZoneName },
          budgets,
        },
      },
      label: "Update zone budgets",
      selectedZoneName: nextZoneName,
    });
  }
  next = applyZoneField(next, nextZoneName, "zone.guardedContentPool", [...draft.guardedPools], "Update guarded pools");
  next = applyZoneField(next, nextZoneName, "zone.unguardedContentPool", [...draft.unguardedPools], "Update unguarded pools");
  next = applyZoneField(next, nextZoneName, "zone.resourcesContentPool", [...draft.resourcesPools], "Update resource pools");
  const currentZone = getZoneByName(next, nextZoneName);
  if (!sameStringArray(currentZone?.mandatoryContent ?? [], draft.mandatoryContent)) {
    next = applyAction(next, {
      action: {
        type: "zone.setMandatoryContentPresets",
        input: {
          variantIndex: next.selectedVariantIndex,
          zone: { zoneName: nextZoneName },
          presetIds: [...draft.mandatoryContent],
        },
      },
      label: "Update mandatory presets",
      selectedZoneName: nextZoneName,
    });
  }
  if (!sameStringArray(currentZone?.contentCountLimits ?? [], draft.contentCountLimits)) {
    next = applyAction(next, {
      action: {
        type: "zone.setContentCountLimitPresets",
        input: {
          variantIndex: next.selectedVariantIndex,
          zone: { zoneName: nextZoneName },
          presetIds: [...draft.contentCountLimits],
        },
      },
      label: "Update count limit presets",
      selectedZoneName: nextZoneName,
    });
  }
  return next;
}

function compactNumberRecord<T extends string>(input: Record<T, number | undefined>): Partial<Record<T, number>> {
  const result: Partial<Record<T, number>> = {};
  for (const [key, value] of Object.entries(input) as Array<[T, number | undefined]>) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function toRoadTargetConfig(target: RoadUpdateDraft["from"]): RoadTargetConfig | undefined {
  const type = target.type.trim();
  if (!type) {
    return undefined;
  }
  return {
    type: type as RoadTargetType,
    args: type === "Crossroads" ? [] : target.args.map((arg) => arg.trim()).filter(Boolean),
  };
}

function toFactionRule(draft: MainObjectUpdateDraft): FactionRule | null {
  const type = draft.factionType.trim();
  if (!type) {
    return null;
  }
  return {
    type,
    args: draft.factionArgs.map((arg) => arg.trim()).filter(Boolean),
  };
}

export function updateSelectedConnectionInSession(session: EditorSession, draft: ConnectionUpdateDraft): EditorSession {
  if (draft.name.trim().length === 0) {
    return setSessionMessage(session, "Connection name cannot be empty.");
  }
  if (draft.from === draft.to) {
    return setSessionMessage(session, "Connection endpoints must be different zones.");
  }
  const next = applyAction(session, {
    action: {
      type: "connection.updateSettings",
      input: {
        variantIndex: session.selectedVariantIndex,
        connection: { connectionName: draft.originalName },
        normalizePortalDefaults: true,
        settings: {
          name: draft.name.trim(),
          from: draft.from,
          to: draft.to,
          connectionType: draft.connectionType as ConnectionType,
          length: draft.length ?? null,
          portalFromEnabled: draft.portalFromEnabled,
          portalToEnabled: draft.portalToEnabled,
          guardZone: draft.guardZone.trim().length > 0 ? draft.guardZone.trim() : null,
          guardValue: draft.guardValue ?? null,
          guardWeeklyIncrement: draft.guardWeeklyIncrement ?? null,
          guardReaction: draft.guardReaction.trim().length > 0 ? (draft.guardReaction as GuardReaction) : null,
          guardEscape: draft.guardEscape,
          gatePlacement: draft.gatePlacement.trim().length > 0 ? (draft.gatePlacement as GatePlacement) : null,
          road: draft.road,
          simTurnSquad: draft.simTurnSquad,
          guardRandomization: draft.guardRandomization ?? null,
        },
      },
    },
    label: `Update ${draft.originalName}`,
  });
  if (next.lastActionFailed) {
    return next;
  }
  return {
    ...next,
    selectedConnectionName: draft.name.trim(),
  };
}

export function updateTemplateGameMode(session: EditorSession, gameMode: string): EditorSession {
  return applyAction(session, {
    action: {
      type: "field.update",
      fieldId: "template.gameMode",
      value: gameMode,
    },
    label: `Set game mode ${gameMode}`,
  });
}

export function updateGlobalSettingsInSession(session: EditorSession, draft: GlobalSettingsDraft): EditorSession {
  const effectiveDraft = draft.gameMode === "SingleHero"
    ? {
        ...draft,
        heroCountMin: 1,
        heroCountMax: 1,
        heroCountIncrement: 1,
        heroHireBan: true,
        encounterHoles: false,
        lostStartHero: true,
      }
    : draft;
  return applyAction(session, {
    action: {
      type: "template.update",
      input: {
        gameMode: effectiveDraft.gameMode as GameMode,
        applyGameModeDefaults: true,
        sizeX: effectiveDraft.sizeX,
        displayWinCondition: effectiveDraft.displayWinCondition.trim().length > 0 ? effectiveDraft.displayWinCondition : null,
        sizeZ: effectiveDraft.sizeZ,
        gameRules: {
          heroCountMin: effectiveDraft.heroCountMin,
          heroCountMax: effectiveDraft.heroCountMax,
          heroCountIncrement: effectiveDraft.heroCountIncrement,
          heroHireBan: effectiveDraft.heroHireBan,
          encounterHoles: effectiveDraft.encounterHoles,
          disableFactionLaws: effectiveDraft.disableFactionLaws,
          disableMagicGuild: effectiveDraft.disableMagicGuild,
          disableMagicCustomLearning: effectiveDraft.disableMagicCustomLearning,
          tournamentRules: effectiveDraft.tournamentRules,
          ...(effectiveDraft.factionLawsExpModifier !== undefined ? { factionLawsExpModifier: effectiveDraft.factionLawsExpModifier } : {}),
          ...(effectiveDraft.astrologyExpModifier !== undefined ? { astrologyExpModifier: effectiveDraft.astrologyExpModifier } : {}),
        },
        winConditions: {
          classic: effectiveDraft.classic,
          desertion: effectiveDraft.desertion,
          ...(effectiveDraft.desertionDay !== undefined ? { desertionDay: effectiveDraft.desertionDay } : {}),
          ...(effectiveDraft.desertionValue !== undefined ? { desertionValue: effectiveDraft.desertionValue } : {}),
          heroLighting: effectiveDraft.heroLighting,
          ...(effectiveDraft.heroLightingDay !== undefined ? { heroLightingDay: effectiveDraft.heroLightingDay } : {}),
          lostStartCity: effectiveDraft.lostStartCity,
          ...(effectiveDraft.lostStartCityDay !== undefined ? { lostStartCityDay: effectiveDraft.lostStartCityDay } : {}),
          lostStartHero: effectiveDraft.lostStartHero,
          gladiatorArena: effectiveDraft.gladiatorArena,
          ...(effectiveDraft.gladiatorArenaDaysDelayStart !== undefined ? { gladiatorArenaDaysDelayStart: effectiveDraft.gladiatorArenaDaysDelayStart } : {}),
          ...(effectiveDraft.gladiatorArenaCountDay !== undefined ? { gladiatorArenaCountDay: effectiveDraft.gladiatorArenaCountDay } : {}),
          ...(effectiveDraft.championSelectRule.trim().length > 0 ? { championSelectRule: effectiveDraft.championSelectRule.trim() } : {}),
          cityHold: effectiveDraft.cityHold,
          ...(effectiveDraft.cityHoldDays !== undefined ? { cityHoldDays: effectiveDraft.cityHoldDays } : {}),
          tournament: effectiveDraft.tournament,
          ...(effectiveDraft.tournamentPointsToWin !== undefined ? { tournamentPointsToWin: effectiveDraft.tournamentPointsToWin } : {}),
        },
      },
    },
    label: "Update global settings",
  });
}

export function focusPlayer(session: EditorSession, playerRef: string | undefined): EditorSession {
  return { ...session, focusedPlayer: playerRef };
}

const PLAYER_ZONE_SUFFIXES = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

function getMaxPlayerIndex(template: RmgTemplate, variantIndex: number): number {
  const variant = template.variants?.[variantIndex];
  let max = 0;
  for (const zone of variant?.zones ?? []) {
    for (const mo of zone.mainObjects ?? []) {
      if (mo.spawn) {
        const idx = PLAYER_REFS.indexOf(mo.spawn as PlayerRef);
        if (idx >= 0 && idx + 1 > max) {
          max = idx + 1;
        }
      }
    }
  }
  return max;
}

function findPlayerSpawnZoneName(template: RmgTemplate, variantIndex: number, playerRef: PlayerRef): string | undefined {
  const variant = template.variants?.[variantIndex];
  for (const zone of variant?.zones ?? []) {
    for (const mo of zone.mainObjects ?? []) {
      if (mo.spawn === playerRef) {
        return zone.name;
      }
    }
  }
  return undefined;
}

function createSpawnMainObject(playerRef: PlayerRef): MainObject {
  return {
    type: "Spawn",
    spawn: playerRef,
    removeGuardIfHasOwner: true,
    guardChance: 0.5,
    guardValue: 2500,
    guardWeeklyIncrement: 0.1,
    buildingsConstructionSid: "default_buildings_construction",
    placement: "Uniform",
    placementArgs: ["true", "0.7", "0"],
  };
}

export function addPlayerToSession(session: EditorSession): EditorSession {
  const maxIndex = getMaxPlayerIndex(session.template, session.selectedVariantIndex);
  if (maxIndex >= PLAYER_REFS.length) {
    return setSessionMessage(session, "Maximum 8 players reached.");
  }
  const nextIndex = maxIndex;
  const playerRef = PLAYER_REFS[nextIndex]!;
  const zoneName = `Spawn-${PLAYER_ZONE_SUFFIXES[nextIndex]}`;
  const connectionName = `${zoneName}-Center`;

  const variant = session.template.variants?.[session.selectedVariantIndex];
  const centerZone = variant?.zones?.find((z) => z.name === "Center");
  if (!centerZone) {
    return setSessionMessage(session, "No Center zone found. Add a Center zone first.");
  }

  const spawnZone: Zone = {
    ...createDefaultZone({ name: zoneName, size: 1 }),
    guardedContentValue: 50000,
    unguardedContentValue: 25000,
    resourcesValue: 20000,
    mainObjects: [createSpawnMainObject(playerRef)],
    zoneBiome: { type: "MatchMainObject", args: ["0"] },
    contentBiome: { type: "MatchZone", args: [] },
    metaObjectsBiome: { type: "MatchZone", args: [] },
    roads: [
      {
        type: "Stone",
        from: { type: "MainObject", args: ["0"] },
        to: { type: "Connection", args: [connectionName] },
      },
    ],
  };

  let nextSession = applyAction(session, {
    action: {
      type: "zone.add",
      input: { variantIndex: session.selectedVariantIndex, zone: spawnZone },
    },
    label: `Add spawn zone for ${playerRef}`,
    selectedZoneName: zoneName,
  });

  if (nextSession.lastActionFailed) {
    return nextSession;
  }

  const connection = createDefaultConnection({
    name: connectionName,
    from: zoneName,
    to: "Center",
    connectionType: "Default",
    length: 1,
  });

  nextSession = applyAction(nextSession, {
    action: {
      type: "connection.add",
      input: { variantIndex: nextSession.selectedVariantIndex, connection },
    },
    label: `Add connection ${connectionName}`,
  });

  return nextSession;
}

export function removePlayerFromSession(session: EditorSession, playerRef: PlayerRef): EditorSession {
  const zoneName = findPlayerSpawnZoneName(session.template, session.selectedVariantIndex, playerRef);
  if (!zoneName) {
    return setSessionMessage(session, `No spawn zone found for ${playerRef}.`);
  }
  return applyAction(session, {
    action: {
      type: "zone.remove",
      input: { variantIndex: session.selectedVariantIndex, zone: { zoneName } },
    },
    label: `Remove ${playerRef} spawn zone`,
  });
}

export function deleteZoneByName(session: EditorSession, zoneName: string): EditorSession {
  return applyAction(session, {
    action: {
      type: "zone.remove",
      input: { variantIndex: session.selectedVariantIndex, zone: { zoneName } },
    },
    label: `Delete ${zoneName}`,
  });
}

export function deleteConnectionByName(session: EditorSession, connectionName: string): EditorSession {
  return applyAction(session, {
    action: {
      type: "connection.remove",
      input: { variantIndex: session.selectedVariantIndex, connection: { connectionName } },
    },
    label: `Delete ${connectionName}`,
  });
}

export function updateConnectionTypeByName(session: EditorSession, connectionName: string, connectionType: string): EditorSession {
  return applyAction(session, {
    action: {
      type: "connection.updateType",
      input: { variantIndex: session.selectedVariantIndex, connection: { connectionName }, connectionType: connectionType as ConnectionType },
    },
    label: `Change ${connectionName} to ${connectionType}`,
  });
}

export function reassignZoneOwner(session: EditorSession, zoneName: string, newOwner: string): EditorSession {
  const variant = session.template.variants?.[session.selectedVariantIndex];
  if (!variant) return session;
  let nextSession = session;
  for (const zone of variant.zones ?? []) {
    if (zone.name !== zoneName) continue;
    const mainObjects = zone.mainObjects ?? [];
    for (let i = 0; i < mainObjects.length; i++) {
      const mo = mainObjects[i];
      if (!mo || (!mo.spawn && !mo.owner)) continue;
      const ownerValue = newOwner === "Neutral" ? null : (newOwner as PlayerRef);
      const spawnValue = mo.spawn ? ownerValue : null;
      nextSession = applyAction(nextSession, {
        action: {
          type: "mainObject.update",
          input: {
            variantIndex: session.selectedVariantIndex,
            zone: { zoneName },
            mainObject: { mainObjectIndex: i },
            settings: { owner: ownerValue, spawn: spawnValue },
          },
        },
        label: `Reassign ${zoneName} to ${newOwner}`,
      });
    }
  }
  return nextSession;
}

export function computePlayerValidationErrors(template: RmgTemplate, variantIndex: number): string[] {
  const variant = template.variants?.[variantIndex];
  if (!variant) {
    return [];
  }
  let maxPlayerIndex = 0;
  for (const zone of variant.zones ?? []) {
    for (const mo of zone.mainObjects ?? []) {
      if (mo.spawn && PLAYER_REFS.includes(mo.spawn as PlayerRef)) {
        const idx = PLAYER_REFS.indexOf(mo.spawn as PlayerRef) + 1;
        if (idx > maxPlayerIndex) {
          maxPlayerIndex = idx;
        }
      }
    }
  }
  const errors: string[] = [];
  for (let i = 0; i < maxPlayerIndex; i += 1) {
    const playerRef = PLAYER_REFS[i];
    const hasZone = variant.zones?.some((zone) =>
      (zone.mainObjects ?? []).some((mo) => mo.spawn === playerRef || mo.owner === playerRef),
    );
    if (!hasZone) {
      errors.push(`${playerRef} has no zone!`);
    }
  }
  return errors;
}

export function updateConnectionTypeInSession(
  session: EditorSession,
  connectionName: string,
  connectionType: ConnectionType,
): EditorSession {
  return applyAction(session, {
    action: {
      type: "connection.updateType",
      input: {
        variantIndex: session.selectedVariantIndex,
        connection: { connectionName },
        connectionType,
        normalizePortalDefaults: true,
      },
    },
    label: `Set ${connectionName} to ${connectionType}`,
  });
}

export function undoSession(session: EditorSession): EditorSession {
  const result = undo(session.history);
  if (!result) {
    return setSessionMessage(session, "Nothing to undo.");
  }
  return {
    ...session,
    template: result.template,
    history: result.history,
    dirty: true,
    selectedZoneName: keepExistingZoneSelection(result.template, session),
    selectedConnectionName: keepExistingConnectionSelection(result.template, session),
    lastMessage: "Undo.",
    lastActionFailed: false,
  };
}

export function redoSession(session: EditorSession): EditorSession {
  const result = redo(session.history);
  if (!result) {
    return setSessionMessage(session, "Nothing to redo.");
  }
  return {
    ...session,
    template: result.template,
    history: result.history,
    dirty: true,
    selectedZoneName: keepExistingZoneSelection(result.template, session),
    selectedConnectionName: keepExistingConnectionSelection(result.template, session),
    lastMessage: "Redo.",
    lastActionFailed: false,
  };
}

export function canUndoSession(session: EditorSession): boolean {
  return canUndo(session.history);
}

export function canRedoSession(session: EditorSession): boolean {
  return canRedo(session.history);
}

function createSessionFromTemplate(
  template: RmgTemplate,
  options: {
    sourceFileName?: string;
    lastMessage: string;
  },
): EditorSession {
  const layoutStorageKey = createLayoutStorageKey({
    sourceFileName: options.sourceFileName,
    templateName: template.name,
  });
  const layout = loadEditorLayout(layoutStorageKey);
  return {
    template,
    history: createTransactionHistory(),
    sourceFileName: options.sourceFileName,
    coreArchive: undefined,
    dirty: false,
    lastMessage: options.lastMessage,
    lastActionFailed: false,
    selectedVariantIndex: 0,
    selectedZoneName: selectFirstZoneName(template, 0),
    selectedConnectionName: undefined,
    layoutStorageKey,
    canvasPositions: layout.canvasPositions,
    zoneObjectPositions: layout.zoneObjectPositions,
    focusedPlayer: undefined,
  };
}

function applyZoneField(
  session: EditorSession,
  zoneName: string,
  fieldId: string,
  value: unknown,
  label: string,
): EditorSession {
  if (session.lastActionFailed) {
    return session;
  }
  return applyAction(session, {
    action: {
      type: "field.update",
      fieldId,
      value,
      selection: {
        variantIndex: session.selectedVariantIndex,
        zone: { zoneName },
      },
    },
    label,
    selectedZoneName: zoneName,
  });
}

function applyRootField(session: EditorSession, fieldId: string, value: unknown, label: string): EditorSession {
  if (session.lastActionFailed) {
    return session;
  }
  return applyAction(session, {
    action: {
      type: "field.update",
      fieldId,
      value,
    },
    label,
  });
}

function applyOptionalRootField(
  session: EditorSession,
  fieldId: string,
  value: unknown | undefined,
  label: string,
): EditorSession {
  if (value === undefined) {
    return session;
  }
  return applyRootField(session, fieldId, value, label);
}

function applyAction(
  session: EditorSession,
  input: {
    action: EditorAction;
    label: string;
    selectedZoneName?: string;
    selectedConnectionName?: string;
  },
): EditorSession {
  const result = applyEditorAction({
    template: session.template,
    history: session.history,
    transactionLabel: input.label,
    action: input.action,
    options: {
      applyGameModeDefaults: true,
      normalizePortalDefaults: true,
    },
  });
  if (!result.ok) {
    return {
      ...session,
      lastMessage: formatDiagnostics(result.diagnostics),
      lastActionFailed: true,
    };
  }
  const next: EditorSession = {
    ...session,
    template: result.value,
    history: result.history ?? session.history,
    dirty: session.dirty || result.changes.length > 0,
    lastMessage: `${input.label}: ${result.changes.length} change(s).`,
    lastActionFailed: false,
  };
  if (input.selectedZoneName !== undefined) {
    next.selectedZoneName = input.selectedZoneName;
  }
  if (input.selectedConnectionName !== undefined) {
    next.selectedConnectionName = input.selectedConnectionName;
  }
  if (next.selectedZoneName && !getZoneNames(next).includes(next.selectedZoneName)) {
    next.selectedZoneName = selectFirstZoneName(next.template, next.selectedVariantIndex);
  }
  if (next.selectedConnectionName && !getConnectionNames(next).includes(next.selectedConnectionName)) {
    next.selectedConnectionName = undefined;
  }
  return next;
}

function persistLayout(session: EditorSession): void {
  saveEditorLayout(session.layoutStorageKey, {
    canvasPositions: session.canvasPositions,
    zoneObjectPositions: session.zoneObjectPositions,
  });
}

function keepExistingZoneSelection(template: RmgTemplate, session: EditorSession): string | undefined {
  if (session.selectedZoneName && template.variants?.[session.selectedVariantIndex]?.zones?.some((zone) => zone.name === session.selectedZoneName)) {
    return session.selectedZoneName;
  }
  return selectFirstZoneName(template, session.selectedVariantIndex);
}

function keepExistingConnectionSelection(template: RmgTemplate, session: EditorSession): string | undefined {
  if (
    session.selectedConnectionName &&
    template.variants?.[session.selectedVariantIndex]?.connections?.some((connection) => connection.name === session.selectedConnectionName)
  ) {
    return session.selectedConnectionName;
  }
  return undefined;
}

function getZoneNames(session: EditorSession): string[] {
  return (session.template.variants?.[session.selectedVariantIndex]?.zones ?? [])
    .map((zone) => zone.name)
    .filter((name): name is string => Boolean(name));
}

function getZoneByName(session: EditorSession, zoneName: string): Zone | undefined {
  return session.template.variants?.[session.selectedVariantIndex]?.zones?.find((zone) => zone.name === zoneName);
}

function getConnectionNames(session: EditorSession): string[] {
  return (session.template.variants?.[session.selectedVariantIndex]?.connections ?? [])
    .map((connection) => connection.name)
    .filter((name): name is string => Boolean(name));
}

function selectFirstZoneName(template: RmgTemplate, variantIndex: number): string | undefined {
  return template.variants?.[variantIndex]?.zones?.find((zone) => zone.name)?.name;
}

function nextUniqueName(existingNames: readonly string[], baseName: string): string {
  const existing = new Set(existingNames);
  if (!existing.has(baseName)) {
    return baseName;
  }
  let index = 2;
  while (existing.has(`${baseName}-${index}`)) {
    index += 1;
  }
  return `${baseName}-${index}`;
}

function sanitizeFileName(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized.length > 0 ? sanitized : "untitled";
}

function isTemplateObject(value: unknown): value is RmgTemplate {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDiagnostics(diagnostics: readonly { code: string; message: string }[]): string {
  if (diagnostics.length === 0) {
    return "Action failed without diagnostics.";
  }
  return diagnostics.map((item) => `${item.code}: ${item.message}`).join(" ");
}

function clampCanvasPosition(position: CanvasPosition): CanvasPosition {
  return {
    x: Math.max(2, Math.min(88, Number(position.x.toFixed(2)))),
    y: Math.max(2, Math.min(88, Number(position.y.toFixed(2)))),
  };
}
