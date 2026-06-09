import type { RmgTemplate } from "../../core/rmg/rmgTypes.js";
import type { ShellCatalogOptions, ShellConnectionItem, ShellZoneItem } from "../data/shellData.js";
import { getShellSections, getShellMetrics, getSectionFields, type ShellMetrics } from "../data/shellData.js";
import { projectTemplateToShellData } from "../data/templateProjection.js";
import type { PlayerRef } from "../../core/rmg/enums.js";
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
  addDefaultRoadToSelectedZone,
  moveZoneInSession,
  moveZoneObjectInSession,
  updateSelectedZoneInSession,
  updateSelectedConnectionInSession,
  updateSelectedZoneMainObjectInSession,
  updateSelectedZoneRoadInSession,
  updateGlobalSettingsInSession,
  updateTemplateGameMode,
  addPlayerToSession,
  removePlayerFromSession,
  focusPlayer,
  reassignZoneOwner,
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
  addContentPoolGroupToSession,
  updateContentPoolGroupInSession,
  serializeSessionTemplate,
  getSessionSaveFileName,
  setBundledCoreArchiveCatalogSummary,
} from "./editorSession.js";
import {
  loadTemplateAutosave,
  saveTemplateAutosave,
  saveTextFile,
  type RememberedCoreArchive,
  loadRememberedCoreArchive,
  cacheCoreArchiveFile,
  loadCachedCoreArchiveFile,
  pickCoreArchiveFile,
  pickTemplateFile,
  rememberCoreArchiveFile,
} from "./browserFiles.js";
import { attachCoreArchiveProgram, loadTemplateProgram, saveTemplateProgram } from "../effect/editorPrograms.js";
import { formatUiEffectError } from "../effect/errors.js";
import { runUiEffect } from "../effect/runtime.js";
import type { CoreArchiveCatalogSummary, CoreArchiveRef } from "./editorSession.js";
import {
  copyZone,
  copyConnection,
  applyZoneClipboard,
  applyConnectionClipboard,
  buildZoneDraft,
  buildConnectionDraft,
} from "./clipboard.js";
import { fetchBundledCatalogSummary } from "../data/bundledCatalogService.js";

export type InspectorTab = "zone" | "connection" | "objects" | "content" | "pools" | "roads" | "raw" | "validation";
export type WorkspaceTab = "canvas" | "zoneEdit";
export type RightDockTab = "inspector" | "browser";

export interface SidebarSectionFlex {
  settings: number;
  zones: number;
  players: number;
}

const EMPTY_ZONE: ShellZoneItem = {
  id: "__no_zone__",
  label: "No zone",
  owner: "Neutral",
  role: "neutral",
  index: -1,
  x: 0,
  y: 0,
  size: 1,
  layout: "",
  zoneBiome: { type: "", args: [] },
  contentBiome: { type: "", args: [] },
  metaObjectsBiome: { type: "", args: [] },
  guardReactionDistribution: [],
  guardedPool: "",
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

class EditorState {
  session: EditorSession = $state(createInitialEditorSession());
  inspectorTab: InspectorTab = $state("zone");
  workspaceTab: WorkspaceTab = $state("canvas");
  rightDockTab: RightDockTab = $state("inspector");
  activeContentPoolName: string = $state("");
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
    return {
      biomes: this.session.coreArchive?.catalogSummary?.biomeOptions ?? [],
      factions: this.session.coreArchive?.catalogSummary?.factionOptions ?? [],
      contentPools: this.session.coreArchive?.catalogSummary?.contentPoolOptions ?? [],
      guardedContentPools: this.session.coreArchive?.catalogSummary?.guardedContentPoolOptions ?? [],
      unguardedContentPools: this.session.coreArchive?.catalogSummary?.unguardedContentPoolOptions ?? [],
      resourceContentPools: this.session.coreArchive?.catalogSummary?.resourceContentPoolOptions ?? [],
      rmgContent: this.session.coreArchive?.catalogSummary?.rmgContentOptions ?? [],
    };
  }

  get sections() {
    return getShellSections();
  }

  get metrics(): ShellMetrics {
    return getShellMetrics(this.session.template);
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
    this.scheduleAutosave();
  }

  selectConnectionById(connectionId: string) {
    this.session = selectConnection(this.session, connectionId);
    this.inspectorTab = "connection";
    this.rightDockTab = "inspector";
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

  addConnectionBetween(from: string, to: string) {
    this.session = addConnectionBetweenZones(this.session, from, to);
    this.scheduleAutosave();
  }

  addMainObject() {
    this.session = addMainObjectToSelectedZone(this.session);
    this.workspaceTab = "zoneEdit";
    this.inspectorTab = "objects";
    this.rightDockTab = "inspector";
    this.scheduleAutosave();
  }

  addRoad() {
    this.session = addDefaultRoadToSelectedZone(this.session);
    this.workspaceTab = "zoneEdit";
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

  deleteZone(zoneName: string) {
    this.session = deleteZoneByName(this.session, zoneName);
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

  // --- Copy/Paste ---
  copySelectedZone() {
    const variant = this.session.template.variants?.[this.session.selectedVariantIndex];
    const zoneName = this.session.selectedZoneName;
    if (!variant || !zoneName) return;
    const zone = variant.zones?.find((z) => z.name === zoneName);
    if (zone) {
      copyZone(zone);
      this.setStatusMessage(`Copied zone "${zoneName}" settings`);
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
    const variant = this.session.template.variants?.[this.session.selectedVariantIndex];
    const zoneName = this.session.selectedZoneName;
    if (!variant || !zoneName) return;
    const zone = variant.zones?.find((z) => z.name === zoneName);
    if (zone) {
      const draft = applyZoneClipboard(buildZoneDraft(zone, zoneName));
      this.session = updateSelectedZoneInSession(this.session, draft);
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
    // Load bundled catalogs (default) — fast, no zip parsing needed
    try {
      const bundledSummary = await fetchBundledCatalogSummary();
      if (!this.session.coreArchive) {
        this.session = setBundledCoreArchiveCatalogSummary(this.session, bundledSummary);
      }
    } catch {
      // Bundled catalogs unavailable, fall through to cached upload
    }
    // Restore cached Core.zip upload if present (overrides bundled)
    try {
      const cachedFile = await loadCachedCoreArchiveFile();
      if (cachedFile && !this.session.coreArchive?.catalogSummary) {
        await this.loadCoreArchive(cachedFile);
      }
    } catch {
      // ignore
    }
  }
}

export const editor = new EditorState();
