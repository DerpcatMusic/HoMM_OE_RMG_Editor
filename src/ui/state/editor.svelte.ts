import type { RmgTemplate } from "../../core/rmg/rmgTypes.js";
import type { ShellMetrics, ShellZoneItem, ShellConnectionItem, ShellPlayerItem, ShellCatalogOptions } from "../data/shellData.js";
import { getShellSections, getSectionFields, getShellMetrics } from "../data/shellData.js";
import { isMineRoutedContent } from "../data/rmgContentSemantics.js";
import { projectTemplateToShellData } from "../data/templateProjection.js";
import type { MainObjectType, PlayerRef } from "../../core/rmg/enums.js";
import {
  loadTemplateAutosave,
  saveTemplateAutosave,
  loadCachedCoreArchiveFile,
  pickCoreArchiveFile,
  pickTemplateFile,
  cacheCoreArchiveFile,
  rememberCoreArchiveFile,
  loadRememberedCoreArchive,
  type RememberedCoreArchive,
} from "./browserFiles.js";
import { attachCoreArchiveProgram, loadTemplateProgram, saveTemplateProgram } from "../effect/editorPrograms.js";
import { formatUiEffectError } from "../effect/errors.js";
import { runUiEffect } from "../effect/runtime.js";
import { getBundledCatalogSummary, getBundledContentPoolIndex, getBundledContentListIndex } from "../data/bundledCatalogService.js";
import {
  createInitialEditorSession,
  type EditorSession,
  type ZoneUpdateDraft,
  type ConnectionUpdateDraft,
  type GlobalSettingsDraft,
  type CanvasPosition,
  selectZone,
  selectConnection,
  addZoneToSession,
  removeSelectedZoneFromSession,
  addConnectionFromSelectedZone,
  addConnectionBetweenZones,
  addMainObjectToSelectedZone,
  addMandatoryContentToSelectedZone as addMandatoryContentObjectToSelectedZone,
  removeMainObjectFromSession,
  addDefaultRoadToSelectedZone,
  addRoadBetweenInSession,
  moveZoneInSession,
  moveZoneObjectInSession,
  updateSelectedZoneInSession,
  updateSelectedConnectionInSession,
  updateSelectedZoneMainObjectInSession,
  updateSelectedZoneRoadInSession,
  removeZoneRoadInSession,
  updateGlobalSettingsInSession,
  updateTemplateNameInSession,
  updateTemplateGameMode,
  addPlayerToSession,
  removePlayerFromSession,
  focusPlayer,
  reassignZoneOwner,
  duplicateZoneByName,
  deleteZoneByName,
  deleteConnectionByName,
  updateConnectionTypeByName,
  undoSession,
  redoSession,
  canUndoSession,
  canRedoSession,
  setSessionMessage,
  setSessionStatusMessage,
  computePlayerValidationErrors,
  addLocalContentPoolToSession,
  localizeCorePoolForEditing,
  addContentPoolGroupToSession,
  updateContentPoolGroupInSession,
  cloneCorePoolToLocalAndRewriteZone,
  addContentToPoolGroupInSession,
  removeContentFromPoolGroupInSession,
  addBanToPoolInSession,
  removeBanFromPoolInSession,
  removeGroupFromPoolInSession,
  updateContentWeightInSession,
  addMandatoryContentPresetToSession,
  removeMandatoryContentPresetFromSession,
  updateMandatoryContentPresetInSession,
  setZonePoolFieldInSession,
  setZoneMandatoryPresetsInSession,
  setZoneCountLimitPresetsInSession,
  removeLocalPoolFromSession,
  updateZoneLayoutInSession,
  createLocalLayoutForZone,
  pasteZoneClipboardIntoSelectedZone,
  serializeSessionTemplate,
  getSessionSaveFileName,
  setBundledCoreArchiveCatalogSummary,
} from "./editorSession.js";
import {
  copyZone,
  copyConnection,
  applyConnectionClipboard,
  buildConnectionDraft,
  getClipboard,
} from "./clipboard.js";
export type InspectorTab = "zone" | "connection" | "objects" | "pools" | "roads" | "raw" | "validation";
export type WorkspaceTab = "canvas" | "zoneEdit" | "poolEdit";
export type RightDockTab = "inspector" | "browser";
export type SidebarTab = "settings" | "generation";
export interface SidebarSectionFlex {
  settings: number;
  zones: number;
  players: number;
}
const EMPTY_ZONE: ShellZoneItem = {
  id: "__no_zone__",
  label: "No zone selected",
  owner: "Neutral",
  role: "neutral",
  index: -1,
  x: 46,
  y: 42,
  size: 1,
  layout: "",
  zoneBiome: { type: "", args: [] },
  contentBiome: { type: "", args: [] },
  metaObjectsBiome: { type: "", args: [] },
  guardReactionDistribution: [],
  guardedPool: "none",
  guardedPools: [],
  unguardedPools: [],
  resourcesPools: [],
  mandatoryContent: [],
  contentCountLimits: [],
  mainObjectCount: 0,
  roadCount: 0,
  zoneObjects: [],
  zoneRoads: [],
};

function sanitizeMandatoryEntryName(value: string): string {
  const sanitized = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return sanitized.length > 0 ? sanitized : "mandatory_content";
}



class EditorState {
  session: EditorSession = $state(createInitialEditorSession());
  inspectorTab: InspectorTab = $state("zone");
  workspaceTab: WorkspaceTab = $state("canvas");
  rightDockTab: RightDockTab = $state("inspector");
  sidebarTab: SidebarTab = $state("settings");
  activeContentPoolName: string = $state("");
  activePoolSource: "template-local" | "core" | "" = $state("");
  activeMandatoryContentPresetName: string = $state("");
  activeMandatoryContentName: string = $state("");
  activeObjectIndex: number = $state(-1);
  activeRoadIndex: number = $state(-1);
  sidebarSections: SidebarSectionFlex = $state({ settings: 6, zones: 2.5, players: 1.5 });
  focusedPlayer: string | undefined = $state(undefined);

  autosaveTimer: ReturnType<typeof setTimeout> | undefined;

  // --- Derived projections ---
  get projection() {
    return projectTemplateToShellData(
      this.session.template,
      this.session.selectedVariantIndex,
      this.session.selectedZoneName,
      this.session.selectedConnectionName,
      this.session.canvasPositions,
      this.session.zoneObjectPositions,
    );
  }

  get selectedZone(): ShellZoneItem {
    return this.projection.selectedZone ?? EMPTY_ZONE;
  }

  get selectedConnection(): ShellConnectionItem | undefined {
    return this.projection.selectedConnection;
  }

  get zones(): readonly ShellZoneItem[] {
    return this.projection.zones;
  }

  get connections(): readonly ShellConnectionItem[] {
    return this.projection.connections;
  }

  get templateName(): string {
    return this.projection.templateName;
  }

  get validationErrors(): readonly string[] {
    return computePlayerValidationErrors(this.session.template, this.session.selectedVariantIndex);
  }

  get canUndo(): boolean {
    return canUndoSession(this.session);
  }

  get canRedo(): boolean {
    return canRedoSession(this.session);
  }

  get catalogOptions(): ShellCatalogOptions {
    const corePools = this.session.coreArchive?.catalogSummary?.contentPoolOptions ?? [];
    const localPools = (this.session.template.contentPools ?? [])
      .map(p => ({ id: p.name ?? "", label: p.name ?? "", source: "template-local" as const, detail: "Local pool" }))
      .filter(p => p.id);
    const allPools = [...localPools, ...corePools];

    // For guarded/unguarded/resource, also include local pools so they appear in pickers
    const coreGuarded = this.session.coreArchive?.catalogSummary?.guardedContentPoolOptions ?? [];
    const coreUnguarded = this.session.coreArchive?.catalogSummary?.unguardedContentPoolOptions ?? [];
    const coreResource = this.session.coreArchive?.catalogSummary?.resourceContentPoolOptions ?? [];

    return {
      biomes: this.session.coreArchive?.catalogSummary?.biomeOptions ?? [],
      factions: this.session.coreArchive?.catalogSummary?.factionOptions ?? [],
      contentPools: allPools,
      guardedContentPools: [...localPools, ...coreGuarded],
      unguardedContentPools: [...localPools, ...coreUnguarded],
      resourceContentPools: [...localPools, ...coreResource],
      rmgContent: this.session.coreArchive?.catalogSummary?.rmgContentOptions ?? [],
    };
  }

  get sections() {
    return getShellSections();
  }

  get metrics(): ShellMetrics {
    return getShellMetrics();
  }

  get sourceFileName(): string | undefined {
    return this.session.sourceFileName;
  }

  get coreArchiveLabel(): string {
    const ca = this.session.coreArchive;
    if (!ca) return "";
    return ca.source === "bundled" ? "Core (bundled)" : ca.name;
  }

  get coreArchiveLoaded(): boolean {
    return Boolean(this.session.coreArchive);
  }

  get activeZoneObjectId(): string {
    if (this.activeObjectIndex >= 0) return `main:${this.activeObjectIndex}`;
    if (this.activeMandatoryContentName.startsWith("mandatory-preview:")) return this.activeMandatoryContentName;
    if (this.activeMandatoryContentName) return `mandatory:${this.activeMandatoryContentName}`;
    if (this.activeMandatoryContentPresetName) return `mandatory-preset:${this.activeMandatoryContentPresetName}`;
    return "";
  }

  get dirty(): boolean {
    return this.session.dirty;
  }

  get lastMessage(): string {
    return this.session.lastMessage;
  }

  get rememberCoreArchive(): RememberedCoreArchive | undefined {
    return loadRememberedCoreArchive();
  }

  // --- Mutations ---
  selectZoneByName(zoneName: string) {
    this.session = selectZone(this.session, zoneName);
    this.inspectorTab = "zone";
    this.rightDockTab = "inspector";
    this.activeObjectIndex = -1;
    this.activeMandatoryContentName = "";
    this.activeRoadIndex = -1;
    this.scheduleAutosave();
  }

  selectConnectionById(connectionId: string) {
    this.session = selectConnection(this.session, connectionId);
    this.inspectorTab = "connection";
    this.rightDockTab = "inspector";
    this.activeRoadIndex = -1;
    this.scheduleAutosave();
  }

  addZone() {
    this.session = addZoneToSession(this.session);
    this.inspectorTab = "zone";
    this.rightDockTab = "inspector";
    this.scheduleAutosave();
  }

  removeSelectedZone() {
    this.session = removeSelectedZoneFromSession(this.session);
    this.workspaceTab = "canvas";
    this.inspectorTab = "zone";
    this.scheduleAutosave();
  }

  addConnection() {
    this.session = addConnectionFromSelectedZone(this.session);
    this.scheduleAutosave();
  }
  setWorkspaceTab(tab: WorkspaceTab) {
    this.workspaceTab = tab;
  }
  setInspectorTab(tab: InspectorTab) {
    this.inspectorTab = tab;
  }

  addConnectionBetween(from: string, to: string) {
    this.session = addConnectionBetweenZones(this.session, from, to);
    this.scheduleAutosave();
  }

  addMainObject(type: MainObjectType = "City", position?: CanvasPosition) {
    const zoneName = this.session.selectedZoneName;
    const objectIndex = this.selectedZone.mainObjectCount;
    this.session = addMainObjectToSelectedZone(this.session, type);
    if (!this.session.lastActionFailed) {
      const addMessage = this.session.lastMessage;
      if (zoneName && position) {
        this.session = moveZoneObjectInSession(this.session, zoneName, `main:${objectIndex}`, position);
        this.session = { ...this.session, lastMessage: addMessage, lastActionFailed: false };
      }
      this.activeObjectIndex = objectIndex;
      this.activeMandatoryContentName = "";
      this.activeRoadIndex = -1;
      this.workspaceTab = "zoneEdit";
      this.inspectorTab = "objects";
      this.rightDockTab = "inspector";
    }
    this.scheduleAutosave();
  }
  addMandatoryContentToSelectedZone(contentSid: string, position?: CanvasPosition) {
    const entryName = this.nextMandatoryContentEntryName(contentSid);
    const zoneName = this.session.selectedZoneName;
    const catalogObject = this.catalogOptions.rmgContent.find((object) => object.id === contentSid);
    this.session = addMandatoryContentObjectToSelectedZone(this.session, {
      sid: contentSid,
      name: entryName,
      isMine: isMineRoutedContent(catalogObject, contentSid),
    });
    if (!this.session.lastActionFailed) {
      const addMessage = this.session.lastMessage;
      if (zoneName && position) {
        this.session = moveZoneObjectInSession(this.session, zoneName, `mandatory:${entryName}`, position);
        this.session = { ...this.session, lastMessage: addMessage, lastActionFailed: false };
      }
      this.activeObjectIndex = -1;
      this.activeMandatoryContentName = entryName;
      this.activeRoadIndex = -1;
      this.workspaceTab = "zoneEdit";
      this.inspectorTab = "objects";
      this.rightDockTab = "inspector";
    }
    this.scheduleAutosave();
  }
  selectObject(index: number) {
    this.activeObjectIndex = index;
    this.activeMandatoryContentName = "";
    this.activeRoadIndex = -1;
    this.inspectorTab = "objects";
    this.rightDockTab = "inspector";
  }
  selectMandatoryContent(entryName: string) {
    this.activeMandatoryContentName = entryName;
    this.activeObjectIndex = -1;
    this.activeRoadIndex = -1;
    this.inspectorTab = "objects";
    this.rightDockTab = "inspector";
  }
  updateMainObject(draft: import("./editorSession.js").MainObjectUpdateDraft) {
    this.session = updateSelectedZoneMainObjectInSession(this.session, draft);
    this.scheduleAutosave();
  }
  removeMainObject(index: number) {
    this.session = removeMainObjectFromSession(this.session, index);
    if (this.activeObjectIndex === index) this.activeObjectIndex = -1;
    this.scheduleAutosave();
  }

  nextMandatoryContentEntryName(contentSid: string): string {
    const baseName = sanitizeMandatoryEntryName(contentSid);
    const existingNames = new Set(
      this.selectedZone.zoneObjects
        .filter((object) => object.id.startsWith("mandatory:"))
        .map((object) => object.id.replace("mandatory:", ""))
        .filter(Boolean),
    );
    if (!existingNames.has(baseName)) return baseName;
    let suffix = 2;
    while (existingNames.has(`${baseName}_${suffix}`)) {
      suffix += 1;
    }
    return `${baseName}_${suffix}`;
  }

  addRoad() {
    const roadIndex = this.selectedZone.roadCount;
    this.session = addDefaultRoadToSelectedZone(this.session);
    if (!this.session.lastActionFailed) {
      this.activeRoadIndex = roadIndex;
      this.activeObjectIndex = -1;
      this.activeMandatoryContentName = "";
      this.workspaceTab = "zoneEdit";
      this.inspectorTab = "roads";
      this.rightDockTab = "inspector";
    }
    this.scheduleAutosave();
  }
  addRoadBetween(from: { type: string; args: readonly string[] }, to: { type: string; args: readonly string[] }, roadType: string) {
    const roadIndex = this.selectedZone.roadCount;
    this.session = addRoadBetweenInSession(this.session, from, to, roadType);
    if (!this.session.lastActionFailed) {
      this.activeRoadIndex = roadIndex;
      this.activeObjectIndex = -1;
      this.activeMandatoryContentName = "";
      this.inspectorTab = "roads";
      this.rightDockTab = "inspector";
    }
    this.scheduleAutosave();
  }
  selectRoad(index: number) {
    this.activeRoadIndex = index;
    this.activeObjectIndex = -1;
    this.activeMandatoryContentName = "";
    this.inspectorTab = "roads";
    this.rightDockTab = "inspector";
  }
  clearRoadSelection() {
    this.activeRoadIndex = -1;
  }
  updateRoad(roadIndex: number, draft: import("./editorSession.js").RoadUpdateDraft) {
    this.session = updateSelectedZoneRoadInSession(this.session, { ...draft, roadIndex });
    this.scheduleAutosave();
  }
  removeRoad(roadIndex: number) {
    this.session = removeZoneRoadInSession(this.session, roadIndex);
    if (this.activeRoadIndex === roadIndex) this.activeRoadIndex = -1;
    this.scheduleAutosave();
  }

  moveZone(zoneName: string, position: CanvasPosition) {
    this.session = moveZoneInSession(this.session, zoneName, position);
    this.scheduleAutosave();
  }

  moveZoneObject(zoneName: string, objectId: string, position: CanvasPosition) {
    this.session = moveZoneObjectInSession(this.session, zoneName, objectId, position);
    this.workspaceTab = "zoneEdit";
    this.scheduleAutosave();
  }

  applyZoneChanges(draft: ZoneUpdateDraft) {
    this.session = updateSelectedZoneInSession(this.session, draft);
    this.scheduleAutosave();
  }

  applyConnectionSettings(draft: ConnectionUpdateDraft) {
    this.session = updateSelectedConnectionInSession(this.session, draft);
    this.scheduleAutosave();
  }

  applyGlobalSettings(draft: GlobalSettingsDraft) {
    this.session = updateGlobalSettingsInSession(this.session, draft);
    this.scheduleAutosave();
  }

  renameTemplate(name: string) {
    this.session = updateTemplateNameInSession(this.session, name);
    if (!this.session.lastActionFailed) {
      this.scheduleAutosave();
    }
  }

  deleteZone(zoneName: string) {
    this.session = deleteZoneByName(this.session, zoneName);
    this.scheduleAutosave();
  }

  duplicateZone(zoneName: string) {
    const zone = this.zones.find((item) => item.label === zoneName);
    this.session = duplicateZoneByName(
      this.session,
      zoneName,
      zone ? { x: zone.x, y: zone.y } : undefined,
    );
    this.activeObjectIndex = -1;
    this.activeMandatoryContentName = "";
    this.activeRoadIndex = -1;
    this.workspaceTab = "canvas";
    this.inspectorTab = "zone";
    this.rightDockTab = "inspector";
    this.scheduleAutosave();
  }

  deleteConnection(connectionName: string) {
    this.session = deleteConnectionByName(this.session, connectionName);
    this.scheduleAutosave();
  }

  reassignOwner(zoneName: string, owner: string) {
    this.session = reassignZoneOwner(this.session, zoneName, owner);
    this.scheduleAutosave();
  }

  changeConnectionType(connectionName: string, connectionType: string) {
    this.session = updateConnectionTypeByName(this.session, connectionName, connectionType);
    this.scheduleAutosave();
  }

  undo() {
    this.session = undoSession(this.session);
  }

  redo() {
    this.session = redoSession(this.session);
  }

  addPlayer() {
    this.session = addPlayerToSession(this.session);
    this.scheduleAutosave();
  }

  removePlayer(playerId: string) {
    this.session = removePlayerFromSession(this.session, playerId as PlayerRef);
    if (this.session.focusedPlayer === playerId) {
      this.session = focusPlayer(this.session, undefined);
      this.focusedPlayer = undefined;
    }
    this.scheduleAutosave();
  }

  setFocusedPlayer(playerId: string | undefined) {
    this.session = focusPlayer(this.session, playerId);
    this.focusedPlayer = playerId;
  }

  setMessage(message: string) {
    this.session = setSessionMessage(this.session, message);
  }

  setStatusMessage(message: string) {
    this.session = setSessionStatusMessage(this.session, message);
  }

  // --- Pool management ---
  inspectPool(poolName: string, source: "template-local" | "core") {
    this.activeContentPoolName = poolName;
    this.activePoolSource = source;
    this.activeMandatoryContentPresetName = "";
    this.workspaceTab = "poolEdit";
    this.rightDockTab = "inspector";
  }

  clearPoolInspection() {
    this.activeContentPoolName = "";
    this.activePoolSource = "";
  }

  cloneCorePoolToEdit(corePoolName: string, zoneField: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool") {
    this.session = cloneCorePoolToLocalAndRewriteZone(this.session, corePoolName, zoneField);
    const zoneName = this.session.selectedZoneName;
    const zone = this.session.template.variants?.[this.session.selectedVariantIndex]?.zones?.find((item) => item.name === zoneName);
    const rewritten = ((zone?.[zoneField] ?? []) as string[]).find((name) => name !== corePoolName && name.startsWith(`${corePoolName}_`));
    if (rewritten) {
      this.activeContentPoolName = rewritten;
      this.activePoolSource = "template-local";
    }
    this.scheduleAutosave();
  }

  addContentToPoolGroup(poolIndex: number, groupIndex: number, sid: string) {
    this.session = addContentToPoolGroupInSession(this.session, poolIndex, groupIndex, sid);
    this.scheduleAutosave();
  }

  removeContentFromPoolGroup(poolIndex: number, groupIndex: number, contentIndex: number) {
    this.session = removeContentFromPoolGroupInSession(this.session, poolIndex, groupIndex, contentIndex);
    this.scheduleAutosave();
  }

  addBanToPool(poolIndex: number, sid: string) {
    this.session = addBanToPoolInSession(this.session, poolIndex, sid);
    this.scheduleAutosave();
  }

  removeBanFromPool(poolIndex: number, banIndex: number) {
    this.session = removeBanFromPoolInSession(this.session, poolIndex, banIndex);
    this.scheduleAutosave();
  }

  addGroupToPool(poolIndex: number) {
    this.session = addContentPoolGroupToSession(this.session, { poolIndex });
    this.scheduleAutosave();
  }

  removeGroupFromPool(poolIndex: number, groupIndex: number) {
    this.session = removeGroupFromPoolInSession(this.session, poolIndex, groupIndex);
    this.scheduleAutosave();
  }

  updatePoolGroup(poolIndex: number, groupIndex: number, weight: number | undefined, includeLists: readonly string[], content: readonly import("../../core/rmg/rmgTypes.js").ContentWeight[]) {
    this.session = updateContentPoolGroupInSession(this.session, { poolIndex, groupIndex, weight, includeLists, content });
    this.scheduleAutosave();
  }

  updateContentWeight(poolIndex: number, groupIndex: number, contentIndex: number, weight: number | undefined) {
    this.session = updateContentWeightInSession(this.session, poolIndex, groupIndex, contentIndex, weight);
    this.scheduleAutosave();
  }

  /** Resolve a pool by name from template-local first, then Core. */
  resolvePool(poolName: string): { source: "template-local" | "core"; poolIndex: number } | undefined {
    const localIndex = (this.session.template.contentPools ?? []).findIndex((p) => p.name === poolName);
    if (localIndex !== -1) return { source: "template-local", poolIndex: localIndex };
    // Check if it's a known Core pool name from catalog options
    const isCorePool = this.catalogOptions.contentPools.some((p) => p.id === poolName);
    if (isCorePool) return { source: "core", poolIndex: -1 };
    return undefined;
  }
  // --- Mandatory content preset management ---
  inspectMandatoryContentPreset(name: string) {
    this.activeMandatoryContentPresetName = name;
    this.activeContentPoolName = "";
    this.activePoolSource = "";
    this.activeMandatoryContentName = "";
    this.activeObjectIndex = -1;
    this.activeRoadIndex = -1;
    this.workspaceTab = "poolEdit";
    this.inspectorTab = "pools";
    this.rightDockTab = "inspector";
  }
  clearMandatoryContentInspection() {
    this.activeMandatoryContentPresetName = "";
  }
  addMandatoryContentPreset(name: string) {
    this.session = addMandatoryContentPresetToSession(this.session, name);
    this.scheduleAutosave();
  }
  removeMandatoryContentPreset(presetIndex: number) {
    this.session = removeMandatoryContentPresetFromSession(this.session, presetIndex);
    this.scheduleAutosave();
  }
  updateMandatoryContentPreset(presetIndex: number, content: readonly import("../../core/rmg/rmgTypes.js").MandatoryContent[]) {
    this.session = updateMandatoryContentPresetInSession(this.session, presetIndex, { content: [...content] });
    this.scheduleAutosave();
  }
  resolveMandatoryContentPreset(name: string): { presetIndex: number } | undefined {
    const presets = this.session.template.mandatoryContent ?? [];
    const index = presets.findIndex((p) => p.name === name);
    if (index !== -1) return { presetIndex: index };
    return undefined;
  }
  // --- Zone assignment management ---
  setZonePoolField(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool", poolNames: readonly string[]) {
    this.session = setZonePoolFieldInSession(this.session, field, poolNames);
    this.scheduleAutosave();
  }
  setZoneMandatoryPresets(presetNames: readonly string[]) {
    this.session = setZoneMandatoryPresetsInSession(this.session, presetNames);
    this.scheduleAutosave();
  }
  setZoneCountLimitPresets(presetNames: readonly string[]) {
    this.session = setZoneCountLimitPresetsInSession(this.session, presetNames);
    this.scheduleAutosave();
  }
  addLocalPool(name: string) {
    this.session = addLocalContentPoolToSession(this.session, { name });
    this.scheduleAutosave();
  }
  localizeCorePoolForEditing(poolName: string) {
    this.session = localizeCorePoolForEditing(this.session, poolName);
    this.scheduleAutosave();
  }
  removeLocalPool(poolName: string) {
    this.session = removeLocalPoolFromSession(this.session, poolName);
    this.scheduleAutosave();
  }
  // --- Zone layout management ---
  updateZoneLayout(layoutIndex: number, settings: Record<string, unknown>) {
    this.session = updateZoneLayoutInSession(this.session, layoutIndex, settings);
    this.scheduleAutosave();
  }
  createLocalLayoutForZone(zoneName: string) {
    this.session = createLocalLayoutForZone(this.session, zoneName);
    this.scheduleAutosave();
  }


  // --- Copy/Paste ---
  copySelectedZone() {
    const variant = this.session.template.variants?.[this.session.selectedVariantIndex];
    const zoneName = this.session.selectedZoneName;
    if (!variant || !zoneName) return;
    const zone = variant.zones?.find((z) => z.name === zoneName);
    if (zone) {
      copyZone(zone, {
        mandatoryPresets: this.session.template.mandatoryContent ?? [],
        contentCountLimitPresets: this.session.template.contentCountLimits ?? [],
        incidentConnections: (variant.connections ?? []).filter((connection) =>
          connection.from === zoneName || connection.to === zoneName
        ),
        zoneObjectPositions: Object.fromEntries(
          this.selectedZone.zoneObjects.map((object) => [object.id, { x: object.x, y: object.y }]),
        ),
      });
      this.setStatusMessage(`Copied zone "${zoneName}" structure`);
    }
  }

  copySelectedConnection() {
    const variant = this.session.template.variants?.[this.session.selectedVariantIndex];
    const connName = this.session.selectedConnectionName;
    if (!variant || !connName) return;
    const conn = variant.connections?.find((c) => c.name === connName);
    if (conn) {
      copyConnection(conn);
      this.setStatusMessage(`Copied connection settings`);
    }
  }

  pasteOntoSelectedZone() {
    const entry = getClipboard();
    if (entry?.kind === "zone") {
      this.session = pasteZoneClipboardIntoSelectedZone(this.session, entry.data);
      if (!this.session.lastActionFailed) {
        this.activeObjectIndex = -1;
        this.activeMandatoryContentName = "";
        this.activeRoadIndex = -1;
        this.inspectorTab = "zone";
        this.rightDockTab = "inspector";
      }
      this.scheduleAutosave();
    }
  }

  pasteOntoSelectedConnection() {
    const variant = this.session.template.variants?.[this.session.selectedVariantIndex];
    const connName = this.session.selectedConnectionName;
    if (!variant || !connName) return;
    const conn = variant.connections?.find((c) => c.name === connName);
    if (conn) {
      const draft = applyConnectionClipboard(buildConnectionDraft(conn, connName));
      this.session = updateSelectedConnectionInSession(this.session, draft);
      this.scheduleAutosave();
    }
  }

  // --- File operations ---
  async newTemplate() {
    if (this.session.dirty && !window.confirm("Discard unsaved changes and create a new template?")) return;
    const newSession = createInitialEditorSession();
    this.session = { ...newSession, coreArchive: this.session.coreArchive };
    this.activeContentPoolName = "";
    this.activePoolSource = "";
    this.activeObjectIndex = -1;
    this.activeMandatoryContentName = "";
    this.activeMandatoryContentPresetName = "";
    this.activeRoadIndex = -1;
    this.workspaceTab = "canvas";
    this.inspectorTab = "zone";
    this.rightDockTab = "inspector";
  }

  async loadTemplate() {
    if (this.session.dirty && !window.confirm("Discard unsaved changes and load another template?")) return;
    try {
      const nextSession = await runUiEffect(loadTemplateProgram(this.session));
      if (nextSession) {
        this.session = nextSession;
        this.activeContentPoolName = "";
        this.activePoolSource = "";
        this.activeObjectIndex = -1;
        this.activeMandatoryContentName = "";
        this.activeMandatoryContentPresetName = "";
        this.activeRoadIndex = -1;
        this.workspaceTab = "canvas";
        this.inspectorTab = "zone";
        this.rightDockTab = "inspector";
      }
    } catch (error: unknown) {
      this.session = setSessionMessage(this.session, formatUiEffectError(error));
    }
  }

  async saveTemplate() {
    if (this.validationErrors.length > 0) {
      this.session = setSessionMessage(this.session, `Cannot save: ${this.validationErrors.join(" ")}`);
      return;
    }
    try {
      this.session = await runUiEffect(saveTemplateProgram(this.session));
    } catch (error: unknown) {
      this.session = setSessionMessage(this.session, formatUiEffectError(error));
    }
  }

  async loadCoreArchive(file: File) {
    this.session = setSessionStatusMessage(this.session, `Parsing ${file.name}...`);
    try {
      const nextSession = await runUiEffect(attachCoreArchiveProgram(this.session, file));
      if (nextSession) {
        this.session = nextSession;
        await cacheCoreArchiveFile(file);
      }
    } catch (error: unknown) {
      this.session = setSessionMessage(this.session, formatUiEffectError(error));
    }
  }

  async addCoreArchive() {
    const file = await pickCoreArchiveFile();
    if (file) await this.loadCoreArchive(file);
  }

  // --- Autosave ---
  scheduleAutosave() {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = undefined;
      void saveTemplateAutosave(JSON.stringify(this.session.template, null, 2));
    }, 500);
  }

  // --- Startup ---
  async init() {
    // Load autosaved template
    try {
      const templateJson = await loadTemplateAutosave();
      if (templateJson && !this.session.dirty) {
        try {
          const template = JSON.parse(templateJson) as RmgTemplate;
          this.session = { ...this.session, template, dirty: false };
        } catch {
          // corrupted autosave
        }
      }
    } catch {
      // ignore
    }
    // Load bundled catalogs (default) — synchronous, no zip parsing needed
    try {
      const bundledSummary = getBundledCatalogSummary();
      const bundledPoolIndex = getBundledContentPoolIndex();
      const bundledListIndex = getBundledContentListIndex();
      if (!this.session.coreArchive) {
        this.session = setBundledCoreArchiveCatalogSummary(this.session, bundledSummary, bundledPoolIndex, bundledListIndex);
        console.log("[editor] Bundled catalogs loaded:", bundledSummary.contentPools, "pools,", bundledSummary.rmgContent, "content,", bundledPoolIndex.size, "pool configs,", bundledListIndex.size, "list configs");
      }
    } catch (err) {
      console.warn("[editor] Failed to load bundled catalogs:", err);
    }
    // Restore cached Core.zip upload if present (overrides bundled)
    try {
      const cachedFile = await loadCachedCoreArchiveFile();
      if (cachedFile && !this.session.coreArchive?.catalogSummary) {
        await this.loadCoreArchive(cachedFile);
      }
    } catch (err) {
      console.warn("[editor] Failed to load cached Core.zip:", err);
    }
  }
}

export const editor = new EditorState();
