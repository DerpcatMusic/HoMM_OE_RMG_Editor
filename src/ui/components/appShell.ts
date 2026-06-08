import { el } from "../dom.js";
import {
  getSectionFields,
  getShellMetrics,
  getShellSections,
} from "../data/shellData.js";
import { projectTemplateToShellData } from "../data/templateProjection.js";
import type { PlayerRef } from "../../core/rmg/enums.js";
import type { ShellCatalogOptions, ShellZoneItem } from "../data/shellData.js";
import {
  formatFileSize,
  loadRememberedCoreArchive,
  pickCoreArchiveFile,
  type RememberedCoreArchive,
} from "../state/browserFiles.js";
import { attachCoreArchiveProgram, loadTemplateProgram, saveTemplateProgram } from "../effect/editorPrograms.js";
import { formatUiEffectError } from "../effect/errors.js";
import { runUiEffect } from "../effect/runtime.js";
import {
  addConnectionBetweenZones,
  addConnectionFromSelectedZone,
  addContentPoolGroupToSession,
  addLocalContentPoolToSession,
  addDefaultRoadToSelectedZone,
  addMainObjectToSelectedZone,
  addPlayerToSession,
  addZoneToSession,
  canRedoSession,
  canUndoSession,
  computePlayerValidationErrors,
  deleteConnectionByName,
  deleteZoneByName,
  moveZoneInSession,
  moveZoneObjectInSession,
  createInitialEditorSession,
  focusPlayer,
  reassignZoneOwner,
  redoSession,
  removePlayerFromSession,
  removeSelectedZoneFromSession,
  selectConnection,
  selectZone,
  setSessionMessage,
  setSessionStatusMessage,
  undoSession,
  updateConnectionTypeByName,
  updateGlobalSettingsInSession,
  updateContentPoolGroupInSession,
  updateSelectedConnectionInSession,
  updateSelectedZoneMainObjectInSession,
  updateSelectedZoneRoadInSession,
  updateSelectedZoneInSession,
} from "../state/editorSession.js";
import { createShellHeader } from "./header.js";
import { createContentBrowserPanel, createInspector, type InspectorTab } from "./inspector.js";
import { createSidebar } from "./sidebar.js";
import { createWorkspace, type WorkspaceTab } from "./workspace.js";

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

interface ShellPanelLayout {
  sidebarWidth: number;
  inspectorWidth: number;
}

type RightDockTab = "inspector" | "browser";

const SHELL_PANEL_LAYOUT_KEY = "olden-era-rmg-editor:shell-panels";
const DEFAULT_SHELL_PANEL_LAYOUT: ShellPanelLayout = {
  sidebarWidth: 256,
  inspectorWidth: 416,
};

export function mountAppShell(root: HTMLElement): void {
  const sections = getShellSections();
  let session = createInitialEditorSession();
  let workspaceTab: WorkspaceTab = "canvas";
  let inspectorTab: InspectorTab = "zone";
  let rightDockTab: RightDockTab = "inspector";
  let activeContentPoolName = "";
  let rememberedCoreArchive: RememberedCoreArchive | undefined = loadRememberedCoreArchive();
  let shellPanelLayout = loadShellPanelLayout();
  let sidebarSections = { settings: 6, zones: 2.5, players: 1.5 };

  const render = () => {
    const projection = projectTemplateToShellData(
      session.template,
      session.selectedVariantIndex,
      session.selectedZoneName,
      session.selectedConnectionName,
      session.canvasPositions,
      session.zoneObjectPositions,
    );
    const selectedZone = projection.selectedZone ?? EMPTY_ZONE;
    const selectedConnection = projection.selectedConnection;
    const catalogOptions = getCatalogOptions(session);
    const activeSection = sections[0];
    if (!activeSection) {
      throw new Error("Editor schema did not provide sections.");
    }
    const fields = getSectionFields(activeSection.id);
    const shellElement = el("div", {
      className: "app-shell",
      attrs: { style: shellPanelLayoutStyle(shellPanelLayout) },
    });
    const validationErrors = computePlayerValidationErrors(session.template, session.selectedVariantIndex);
    const shellBody = el("div", { className: "shell-body" }, [
      createSidebar({
        template: session.template,
        zones: projection.zones,
        players: projection.players,
        focusedPlayer: session.focusedPlayer,
        validationErrors,
        selectedZoneId: selectedZone.id,
        statusMessage: session.lastMessage,
        sectionFlex: sidebarSections,
        onSectionResize: (section, flex) => {
          sidebarSections = { ...sidebarSections, [section]: flex };
        },
        onAddZone: () => {
          session = addZoneToSession(session);
          inspectorTab = "zone";
          render();
        },
        onApplyGlobalSettings: (draft) => {
          session = updateGlobalSettingsInSession(session, draft);
          requestAnimationFrame(render);
        },
        onSelectZone: (zone: ShellZoneItem) => {
          session = selectZone(session, zone.label);
          inspectorTab = "zone";
          rightDockTab = "inspector";
          render();
        },
        onAddPlayer: () => {
          session = addPlayerToSession(session);
          render();
        },
        onRemovePlayer: (playerId) => {
          session = removePlayerFromSession(session, playerId as PlayerRef);
          if (session.focusedPlayer === playerId) {
            session = focusPlayer(session, undefined);
          }
          render();
        },
        onFocusPlayer: (playerId) => {
          session = focusPlayer(session, playerId);
          render();
        },
      }),
      createShellResizeHandle("sidebar", shellElement, () => shellPanelLayout, (nextLayout) => {
        shellPanelLayout = nextLayout;
      }),
      createWorkspace({
        zones: projection.zones,
        connections: projection.connections,
        catalogOptions,
        selectedZone,
        selectedConnection,
        focusedPlayer: session.focusedPlayer,
        activeTab: workspaceTab,
        onTabChange: (tab) => {
          workspaceTab = tab;
          render();
        },
        onSelectZone: (zone) => {
          session = selectZone(session, zone.label);
          inspectorTab = "zone";
          rightDockTab = "inspector";
          render();
        },
        onSelectConnection: (connection) => {
          session = selectConnection(session, connection.id);
          inspectorTab = "connection";
          rightDockTab = "inspector";
          render();
        },
        onMoveZone: (zone, position) => {
          session = moveZoneInSession(selectZone(session, zone.label), zone.label, position);
          inspectorTab = "zone";
          rightDockTab = "inspector";
          render();
        },
        onMoveZoneObject: (zone, object, position) => {
          session = moveZoneObjectInSession(session, zone.label, object.id, position);
          workspaceTab = "zoneEdit";
          render();
        },
        onConnectZones: (fromZoneName, toZoneName) => {
          session = addConnectionBetweenZones(session, fromZoneName, toZoneName);
          render();
        },
        onAddZone: () => {
          session = addZoneToSession(session);
          inspectorTab = "zone";
          render();
        },
        onAddConnection: () => {
          session = addConnectionFromSelectedZone(session);
          render();
        },
        onAddMainObject: () => {
          session = addMainObjectToSelectedZone(session);
          workspaceTab = "zoneEdit";
          inspectorTab = "objects";
          rightDockTab = "inspector";
          render();
        },
        onAddRoad: () => {
          session = addDefaultRoadToSelectedZone(session);
          workspaceTab = "zoneEdit";
          render();
        },
        onDeleteZone: (zone) => {
          session = deleteZoneByName(session, zone.label);
          render();
        },
        onDeleteConnection: (connection) => {
          session = deleteConnectionByName(session, connection.id);
          render();
        },
        onReassignZoneOwner: (zone, owner) => {
          session = reassignZoneOwner(session, zone.label, owner);
          render();
        },
        onChangeConnectionType: (connection, connectionType) => {
          session = updateConnectionTypeByName(session, connection.id, connectionType);
          render();
        },
      }),
      createShellResizeHandle("inspector", shellElement, () => shellPanelLayout, (nextLayout) => {
        shellPanelLayout = nextLayout;
      }),
      createRightDock({
        activeTab: rightDockTab,
        onTabChange: (tab) => {
          rightDockTab = tab;
          render();
        },
        inspector: createInspector({
          template: session.template,
          section: activeSection,
          fields,
          selectedZone,
          selectedConnection,
          zones: projection.zones,
          connections: projection.connections,
          catalogOptions,
          validationErrors,
          activeContentPoolName,
          activeTab: inspectorTab,
          onTabChange: (tab) => {
            inspectorTab = tab;
            rightDockTab = "inspector";
            render();
          },
          onActiveContentPoolChange: (poolName) => {
            activeContentPoolName = poolName;
            inspectorTab = "pools";
            rightDockTab = "inspector";
            render();
          },
          onAddContentPool: (draft) => {
            session = addLocalContentPoolToSession(session, draft);
            activeContentPoolName = draft.name.trim();
            inspectorTab = "pools";
            rightDockTab = "inspector";
            render();
          },
          onAddContentPoolGroup: (draft) => {
            session = addContentPoolGroupToSession(session, draft);
            inspectorTab = "pools";
            rightDockTab = "inspector";
            render();
          },
          onApplyContentPoolGroup: (draft) => {
            session = updateContentPoolGroupInSession(session, draft);
            inspectorTab = "pools";
            rightDockTab = "inspector";
            render();
          },
          onApplyConnectionSettings: (draft) => {
            session = updateSelectedConnectionInSession(session, draft);
            requestAnimationFrame(render);
          },
          onApplyMainObjectSettings: (draft) => {
            session = updateSelectedZoneMainObjectInSession(session, draft);
            requestAnimationFrame(render);
          },
          onApplyRoadSettings: (draft) => {
            session = updateSelectedZoneRoadInSession(session, draft);
            requestAnimationFrame(render);
          },
          onApplyZoneChanges: (draft) => {
            session = updateSelectedZoneInSession(session, draft);
            requestAnimationFrame(render);
          },
          onRemoveSelectedZone: () => {
            session = removeSelectedZoneFromSession(session);
            workspaceTab = "canvas";
            inspectorTab = "zone";
            render();
          },
        }),
        browser: createContentBrowserPanel({ catalogOptions }),
      }),
    ]);
    shellElement.append(
        createShellHeader({
          metrics: getShellMetrics(),
          templateName: projection.templateName,
          sourceFileName: session.sourceFileName,
          coreArchiveLabel: formatCoreArchiveLabel(session),
          dirty: session.dirty,
          canUndo: canUndoSession(session),
          canRedo: canRedoSession(session),
          canSave: validationErrors.length === 0,
          onLoadTemplate: () => {
            void loadTemplate();
          },
          onNewTemplate: () => {
            createNewTemplate();
          },
          onSaveTemplate: () => {
            if (validationErrors.length > 0) {
              session = setSessionMessage(session, `Cannot save: ${validationErrors.join(" ")}`);
              render();
              return;
            }
            saveTemplate();
          },
          onAddCoreArchive: () => {
            void addCoreArchive();
          },
          onUndo: () => {
            session = undoSession(session);
            render();
          },
          onRedo: () => {
            session = redoSession(session);
            render();
          },
        }),
      shellBody,
    );
    root.replaceChildren(shellElement);
  };

  const createNewTemplate = () => {
    if (session.dirty && !window.confirm("Discard unsaved changes and create a new template?")) {
      return;
    }
    session = createInitialEditorSession();
    activeContentPoolName = "";
    workspaceTab = "canvas";
    inspectorTab = "zone";
    rightDockTab = "inspector";
    render();
  };

  const loadTemplate = async () => {
    if (session.dirty && !window.confirm("Discard unsaved changes and load another template?")) {
      return;
    }
    await runUiEffect(loadTemplateProgram())
      .then((nextSession) => {
        if (!nextSession) {
          return;
        }
        session = nextSession;
        activeContentPoolName = "";
        workspaceTab = "canvas";
        inspectorTab = "zone";
        rightDockTab = "inspector";
      })
      .catch((error: unknown) => {
        session = setSessionMessage(session, formatUiEffectError(error));
      });
    render();
  };

  const saveTemplate = () => {
    void runUiEffect(saveTemplateProgram(session))
      .then((nextSession) => {
        session = nextSession;
        render();
      })
      .catch((error: unknown) => {
        session = setSessionMessage(session, formatUiEffectError(error));
        render();
      });
  };
  const loadCoreArchiveFile = async (file: File) => {
    session = setSessionStatusMessage(session, `Parsing ${file.name}...`);
    render();
    await runUiEffect(attachCoreArchiveProgram(session, file))
      .then((nextSession) => {
        if (nextSession) {
          session = nextSession;
          rememberedCoreArchive = loadRememberedCoreArchive();
          if (coreArchiveModalOverlay) {
            coreArchiveModalOverlay.remove();
            coreArchiveModalOverlay = undefined;
          }
        }
      })
      .catch((error: unknown) => {
        session = setSessionMessage(session, formatUiEffectError(error));
      });
    render();
  };

  const addCoreArchive = async () => {
    const file = await pickCoreArchiveFile();
    if (file) {
      await loadCoreArchiveFile(file);
    }
  };

  let coreArchiveModalOverlay: HTMLElement | undefined;
  if (!session.coreArchive) {
    coreArchiveModalOverlay = showCoreArchiveModal(root, addCoreArchive, loadCoreArchiveFile);
  }
  render();
}

function getCatalogOptions(session: {
  coreArchive: {
    catalogSummary?: {
      biomeOptions: ShellCatalogOptions["biomes"];
      factionOptions: ShellCatalogOptions["factions"];
      contentPoolOptions: ShellCatalogOptions["contentPools"];
      guardedContentPoolOptions: ShellCatalogOptions["guardedContentPools"];
      unguardedContentPoolOptions: ShellCatalogOptions["unguardedContentPools"];
      resourceContentPoolOptions: ShellCatalogOptions["resourceContentPools"];
      rmgContentOptions: ShellCatalogOptions["rmgContent"];
    };
  } | undefined;
}): ShellCatalogOptions {
  return {
    biomes: session.coreArchive?.catalogSummary?.biomeOptions ?? [],
    factions: session.coreArchive?.catalogSummary?.factionOptions ?? [],
    contentPools: session.coreArchive?.catalogSummary?.contentPoolOptions ?? [],
    guardedContentPools: session.coreArchive?.catalogSummary?.guardedContentPoolOptions ?? [],
    unguardedContentPools: session.coreArchive?.catalogSummary?.unguardedContentPoolOptions ?? [],
    resourceContentPools: session.coreArchive?.catalogSummary?.resourceContentPoolOptions ?? [],
    rmgContent: session.coreArchive?.catalogSummary?.rmgContentOptions ?? [],
  };
}

function createRightDock(props: {
  activeTab: RightDockTab;
  inspector: HTMLElement;
  browser: HTMLElement;
  onTabChange: (tab: RightDockTab) => void;
}): HTMLElement {
  return el("aside", { className: "right-dock", attrs: { "aria-label": "Right tools" } }, [
    el("div", { className: "right-dock-panel" }, [
      props.activeTab === "browser" ? props.browser : props.inspector,
    ]),
    el("div", { className: "right-dock-rail", attrs: { role: "tablist", "aria-orientation": "vertical", "aria-label": "Right tool panels" } }, [
      createRightDockTab("Inspector", "tune", "inspector", props.activeTab, props.onTabChange),
      createRightDockTab("Browser", "manage_search", "browser", props.activeTab, props.onTabChange),
    ]),
  ]);
}

function createRightDockTab(
  label: string,
  icon: string,
  value: RightDockTab,
  activeValue: RightDockTab,
  onSelect: (tab: RightDockTab) => void,
): HTMLButtonElement {
  const isActive = value === activeValue;
  return el("button", {
    className: isActive ? "right-dock-tab is-active" : "right-dock-tab",
    attrs: {
      type: "button",
      role: "tab",
      "aria-selected": isActive ? "true" : "false",
      title: label,
    },
    onClick: () => onSelect(value),
  }, [
    el("span", { className: "material-symbols-outlined", text: icon, attrs: { "aria-hidden": "true" } }),
    el("span", { className: "right-dock-tab-label", text: label }),
  ]);
}

function createShellResizeHandle(
  panel: "sidebar" | "inspector",
  shellElement: HTMLElement,
  getLayout: () => ShellPanelLayout,
  setLayout: (layout: ShellPanelLayout) => void,
): HTMLElement {
  const handle = el("div", {
    className: `shell-resize-handle shell-resize-handle-${panel}`,
    attrs: {
      role: "separator",
      tabindex: "0",
      "aria-orientation": "vertical",
      "aria-label": panel === "sidebar" ? "Resize sidebar" : "Resize inspector",
    },
  });
  handle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const startX = event.clientX;
    const startLayout = getLayout();
    handle.setPointerCapture(event.pointerId);
    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextLayout = resizeShellPanelLayout(panel, startLayout, moveEvent.clientX - startX, shellElement);
      setLayout(nextLayout);
      applyShellPanelLayout(shellElement, nextLayout);
    };
    const onPointerUp = (upEvent: PointerEvent) => {
      handle.releasePointerCapture(upEvent.pointerId);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", onPointerUp);
      saveShellPanelLayout(getLayout());
    };
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", onPointerUp);
  });
  handle.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const delta = direction * (event.shiftKey ? 32 : 16);
    const nextLayout = resizeShellPanelLayout(panel, getLayout(), delta, shellElement);
    setLayout(nextLayout);
    applyShellPanelLayout(shellElement, nextLayout);
    saveShellPanelLayout(nextLayout);
  });
  return handle;
}

function resizeShellPanelLayout(
  panel: "sidebar" | "inspector",
  startLayout: ShellPanelLayout,
  deltaX: number,
  shellElement: HTMLElement,
): ShellPanelLayout {
  const bodyWidth = shellElement.querySelector<HTMLElement>(".shell-body")?.getBoundingClientRect().width ?? 1280;
  const minWorkspace = 440;
  const next: ShellPanelLayout = { ...startLayout };
  if (panel === "sidebar") {
    next.sidebarWidth = clampNumber(startLayout.sidebarWidth + deltaX, 192, Math.max(192, bodyWidth - startLayout.inspectorWidth - minWorkspace));
  } else {
    next.inspectorWidth = clampNumber(startLayout.inspectorWidth - deltaX, 320, Math.max(320, bodyWidth - startLayout.sidebarWidth - minWorkspace));
  }
  return next;
}

function applyShellPanelLayout(shellElement: HTMLElement, layout: ShellPanelLayout): void {
  shellElement.style.setProperty("--sidebar-width", `${layout.sidebarWidth}px`);
  shellElement.style.setProperty("--inspector-width", `${layout.inspectorWidth}px`);
}

function shellPanelLayoutStyle(layout: ShellPanelLayout): string {
  return `--sidebar-width:${layout.sidebarWidth}px;--inspector-width:${layout.inspectorWidth}px;`;
}

function loadShellPanelLayout(): ShellPanelLayout {
  try {
    const raw = globalThis.localStorage?.getItem(SHELL_PANEL_LAYOUT_KEY);
    if (!raw) {
      return DEFAULT_SHELL_PANEL_LAYOUT;
    }
    const parsed = JSON.parse(raw) as Partial<ShellPanelLayout>;
    return {
      sidebarWidth: clampNumber(Number(parsed.sidebarWidth), 192, 520) || DEFAULT_SHELL_PANEL_LAYOUT.sidebarWidth,
      inspectorWidth: clampNumber(Number(parsed.inspectorWidth), 320, 640) || DEFAULT_SHELL_PANEL_LAYOUT.inspectorWidth,
    };
  } catch {
    return DEFAULT_SHELL_PANEL_LAYOUT;
  }
}

function saveShellPanelLayout(layout: ShellPanelLayout): void {
  try {
    globalThis.localStorage?.setItem(SHELL_PANEL_LAYOUT_KEY, JSON.stringify(layout));
  } catch {
    // Browser storage can be disabled; resizing should still work for the current page.
  }
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatCoreArchiveLabel(session: { coreArchive: { name: string; size: number; catalogSummary?: { contentPools: number; rmgContent: number } } | undefined }): string {
  if (!session.coreArchive) {
    return "no core";
  }
  const summary = session.coreArchive.catalogSummary;
  return summary
    ? `${session.coreArchive.name} (${summary.contentPools}p / ${summary.rmgContent}c)`
    : session.coreArchive.name;
}
function showCoreArchiveModal(
  root: HTMLElement,
  onPickFile: () => void,
  onDropFile: (file: File) => void,
): HTMLElement {
  const overlay = el("div", { className: "modal-overlay" });
  const dropZone = el("div", { className: "modal-dropzone" }, [
    el("span", { className: "material-symbols-outlined modal-icon", text: "folder_zip", attrs: { "aria-hidden": "true" } }),
    el("h2", { text: "Load Core.zip" }),
    el("p", { text: "Drag and drop your Core.zip file here, or click to browse." }),
    el("p", { className: "modal-hint", text: "The core archive contains game data needed to edit templates." }),
  ]);
  const modal = el("div", { className: "modal-dialog" }, [dropZone]);
  overlay.append(modal);

  let dragCounter = 0;

  const handleFile = (file: File) => {
    if (file.name.endsWith(".zip") || file.type === "application/zip" || file.type === "application/x-zip-compressed") {
      overlay.remove();
      onDropFile(file);
    }
  };

  dropZone.addEventListener("click", async () => {
    const file = await pickCoreArchiveFile();
    if (file) {
      overlay.remove();
      onDropFile(file);
    }
  });

  overlay.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragCounter++;
    dropZone.classList.add("is-dragover");
  });
  overlay.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropZone.classList.remove("is-dragover");
    }
  });
  overlay.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  overlay.addEventListener("drop", (event) => {
    event.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove("is-dragover");
    const file = event.dataTransfer?.files[0];
    if (file) {
      handleFile(file);
    }
  });

  root.append(overlay);
  return overlay;
}
