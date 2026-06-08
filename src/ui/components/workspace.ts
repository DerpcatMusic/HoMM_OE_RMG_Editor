import { CONNECTION_TYPES, FACTION_RULE_TYPES, MAIN_OBJECT_TYPES, PLAYER_REFS } from "../../core/rmg/enums.js";
import { el, svgEl } from "../dom.js";
import { PLAYER_COLORS, type ShellCatalogOptions, type ShellConnectionItem, type ShellZoneItem, type ShellZoneObjectItem } from "../data/shellData.js";
import type { CanvasPosition } from "../state/editorSession.js";
import { createButton, createTabButton } from "./primitives.js";

export type WorkspaceTab = "canvas" | "zoneEdit";

export interface WorkspaceProps {
  zones: readonly ShellZoneItem[];
  connections: readonly ShellConnectionItem[];
  catalogOptions: ShellCatalogOptions;
  selectedZone: ShellZoneItem;
  selectedConnection: ShellConnectionItem | undefined;
  focusedPlayer: string | undefined;
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onSelectZone: (zone: ShellZoneItem) => void;
  onSelectConnection: (connection: ShellConnectionItem) => void;
  onMoveZone: (zone: ShellZoneItem, position: CanvasPosition) => void;
  onMoveZoneObject: (zone: ShellZoneItem, object: ShellZoneObjectItem, position: CanvasPosition) => void;
  onConnectZones: (fromZoneName: string, toZoneName: string) => void;
  onAddZone: () => void;
  onAddConnection: () => void;
  onAddMainObject: () => void;
  onAddRoad: () => void;
  onDeleteZone: (zone: ShellZoneItem) => void;
  onDeleteConnection: (connection: ShellConnectionItem) => void;
  onReassignZoneOwner: (zone: ShellZoneItem, owner: string) => void;
  onChangeConnectionType: (connection: ShellConnectionItem, connectionType: string) => void;
}

export function createWorkspace(props: WorkspaceProps): HTMLElement {
  return el("main", { className: "workspace", attrs: { tabindex: "-1" } }, [
    el("div", { className: "workspace-tabs", attrs: { role: "tablist", "aria-label": "Workspace mode" } }, [
      createTabButton("Canvas", "canvas", props.activeTab, props.onTabChange, { icon: "globe", iconOnly: true }),
      createTabButton("Zone edit", "zoneEdit", props.activeTab, props.onTabChange, { icon: "edit_square", iconOnly: true }),
    ]),
    createActiveWorkspace(props),
  ]);
}

function createActiveWorkspace(props: WorkspaceProps): HTMLElement {
  if (props.activeTab === "zoneEdit") {
    return createZoneEditWorkspace(props);
  }
  return createCanvasWorkspace(props);
}

function createCanvasWorkspace(props: WorkspaceProps): HTMLElement {
  return el("section", { className: "workspace-panel canvas-panel" }, [
    el("div", { className: "workspace-bar" }, [
      el("div", {}, [
        el("h2", { text: "Zone graph" }),
        el("span", { text: `selected: ${props.selectedZone.label}` }),
      ]),
      el("div", { className: "bar-actions" }, [
        createButton("Add zone", { variant: "secondary", icon: "add_location", onClick: props.onAddZone }),
        createButton("Add connection", { variant: "secondary", icon: "timeline", onClick: props.onAddConnection }),
      ]),
    ]),
    createMapStage(props),
  ]);
}

function createZoneEditWorkspace(props: WorkspaceProps): HTMLElement {
  return el("section", { className: "workspace-panel zone-edit-panel" }, [
    el("div", { className: "workspace-bar" }, [
      el("div", {}, [
        el("h2", { text: `${props.selectedZone.label} internals` }),
        el("span", { text: `main objects ${props.selectedZone.mainObjectCount} / roads ${props.selectedZone.roadCount}` }),
      ]),
      el("div", { className: "bar-actions" }, [
        createButton("Add main object", { variant: "secondary", icon: "add_box", onClick: props.onAddMainObject }),
        createButton("Add road", { variant: "secondary", icon: "route", onClick: props.onAddRoad }),
      ]),
    ]),
    el("p", { className: "conditional-note", text: "Road lines are parsed from zone.roads[] targets: crossroads, main objects, connections, and mandatory content." }),
    createZoneStage(props),
    createZoneInternalsSummary(props),
  ]);
}
function createZoneInternalsSummary(props: WorkspaceProps): HTMLElement {
  const objects = props.selectedZone.zoneObjects.filter((object) => object.id.startsWith("main:"));
  return el("div", { className: "zone-internals-summary" }, [
    el("div", {}, [
      el("strong", { text: "Main objects" }),
      el("span", { text: objects.length === 0 ? "none" : objects.map((object) => `${object.index}: ${object.type}`).join(" / ") }),
    ]),
    el("div", {}, [
      el("strong", { text: "Roads" }),
      el("span", { text: props.selectedZone.zoneRoads.length === 0 ? "none" : props.selectedZone.zoneRoads.map((road) => `${road.type}: ${road.fromId} -> ${road.toId}`).join(" / ") }),
    ]),
    el("div", {}, [
      el("strong", { text: "Edit" }),
      el("span", { text: "Use Inspector > Objects or Inspector > Roads for properties." }),
    ]),
  ]);
}

function createMapStage(props: WorkspaceProps): HTMLElement {
  const linkLayer = svgEl("svg", {
    className: "stage-svg",
    attrs: { viewBox: "0 0 100 100", preserveAspectRatio: "none" },
  }, props.connections.map((connection) => createConnectionPath(connection, props)));
  const stage = el("div", { className: "map-stage" }, [
    el("div", { className: "stage-grid" }),
    linkLayer,
  ]);
  for (const zone of props.zones) {
    stage.append(createZoneNode(zone, props, stage));
  }
  requestAnimationFrame(() => syncMapStageLinks(stage));
  return stage;
}

function createZoneNode(zone: ShellZoneItem, props: WorkspaceProps, stage: HTMLElement): HTMLElement {
  const selected = zone.id === props.selectedZone.id;
  const isFocusedOwner = props.focusedPlayer !== undefined && zone.owner === props.focusedPlayer;
  const ownerColor = zone.owner === "Neutral" ? "#666" : (PLAYER_COLORS[zone.owner] ?? "#888");
  const style = `left:${zone.x}%;top:${zone.y}%;--zone-color:${ownerColor}`;
  const node = el("button", {
    className: selected ? "stage-node is-selected" : "stage-node",
    attrs: { type: "button", style },
  }, [
    el("strong", { text: zone.label }),
    el("span", { text: `${zone.owner} / size ${zone.size}` }),
  ]);
  node.dataset.zoneId = zone.id;
  node.dataset.zoneRole = zone.role;
  node.dataset.focusedOwner = String(isFocusedOwner);
  node.addEventListener("pointerdown", (event) => {
    if (event.ctrlKey) {
      startConnectionDrag(event, stage, node, zone, props);
      return;
    }
    startZoneDrag(event, stage, node, zone, props);
  });
  node.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showZoneContextMenu(event, zone, props, node);
  });
  return node;
}

function createConnectionPath(connection: ShellConnectionItem, props: WorkspaceProps): SVGGElement {
  const from = props.zones.find((zone) => zone.id === connection.from);
  const to = props.zones.find((zone) => zone.id === connection.to);
  const fallbackFrom = from ? projectedZoneCenter(from) : { x: 0, y: 0 };
  const fallbackTo = to ? projectedZoneCenter(to) : fallbackFrom;
  const d = createSplinePath(fallbackFrom, fallbackTo);
  const isSelected = props.selectedConnection?.id === connection.id;
  const hitPath = svgEl("path", {
    className: "stage-link-hit",
    attrs: { d },
    dataset: { connectionId: connection.id, fromZone: connection.from, toZone: connection.to },
    onClick: () => props.onSelectConnection(connection),
  });
  hitPath.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    showConnectionContextMenu(event, connection, props);
  });
  const visiblePath = svgEl("path", {
    className: isSelected ? "stage-link-path is-selected" : "stage-link-path",
    attrs: {
      "aria-label": `${connection.id} (${connection.type})`,
      role: "button",
      tabindex: "0",
      title: `${connection.id} (${connection.type})`,
      d,
    },
    dataset: {
      connectionId: connection.id,
      connectionType: connection.type,
      fromZone: connection.from,
      toZone: connection.to,
    },
  });
  visiblePath.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      props.onSelectConnection(connection);
    }
  });
  return svgEl("g", { className: "stage-link-group" }, [hitPath, visiblePath]);
}

function createZoneStage(props: WorkspaceProps): HTMLElement {
  const zone = props.selectedZone;
  const roadLayer = svgEl("svg", {
    className: "stage-svg",
    attrs: { viewBox: "0 0 100 100", preserveAspectRatio: "none", "aria-label": "Zone roads" },
  }, zone.zoneRoads.map((road) => createZoneRoadGroup(road, zone)));
  const stage = el("div", { className: "zone-stage" }, [
    el("div", { className: "stage-grid" }),
    roadLayer,
  ]);
  for (const object of zone.zoneObjects) {
    stage.append(createZoneObjectNode(object, zone, props, stage));
  }
  if (zone.zoneObjects.length === 0) {
    stage.append(el("div", { className: "empty-stage-note", text: "No main objects or road anchors in this zone." }));
  }
  requestAnimationFrame(() => syncZoneStageRoads(stage));
  return stage;
}

function createZoneObjectNode(
  object: ShellZoneItem["zoneObjects"][number],
  zone: ShellZoneItem,
  props: WorkspaceProps,
  stage: HTMLElement,
): HTMLElement {
  const node = el("button", {
    className: "zone-object-node",
    attrs: {
      type: "button",
      style: `left:${object.x}%;top:${object.y}%;`,
      title: object.detail,
    },
  }, [
    el("strong", { text: object.label }),
    el("span", { text: object.type }),
  ]);
  node.dataset.objectId = object.id;
  node.dataset.objectType = object.type;
  node.addEventListener("pointerdown", (event) => startZoneObjectDrag(event, stage, node, zone, object, props));
  return node;
}

function createZoneRoadGroup(road: ShellZoneItem["zoneRoads"][number], zone: ShellZoneItem): SVGGElement {
  const from = zone.zoneObjects.find((object) => object.id === road.fromId);
  const to = zone.zoneObjects.find((object) => object.id === road.toId);
  const fallbackFrom = from ? projectedObjectCenter(from) : { x: 0, y: 0 };
  const fallbackTo = to ? projectedObjectCenter(to) : fallbackFrom;
  const normalizedType = normalizeRoadType(road.type);
  return svgEl("g", {
    className: `zone-road-group zone-road-${normalizedType}`,
    dataset: {
      fromObject: road.fromId,
      toObject: road.toId,
      roadType: road.type,
    },
  }, [
    svgEl("path", {
      className: "zone-road-path",
      attrs: {
        "aria-label": `${road.label} ${road.type}`,
        title: `${road.label} (${road.type})`,
        d: createSplinePath(fallbackFrom, fallbackTo),
      },
    }),
    svgEl("text", {
      className: "zone-road-label",
      text: road.type,
      attrs: {
        x: (fallbackFrom.x + fallbackTo.x) / 2,
        y: (fallbackFrom.y + fallbackTo.y) / 2,
      },
    }),
  ]);
}

function normalizeRoadType(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-") || "unknown";
}

function startZoneDrag(
  event: PointerEvent,
  stage: HTMLElement,
  node: HTMLElement,
  zone: ShellZoneItem,
  props: WorkspaceProps,
): void {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  const start = pointerToStagePercent(event, stage);
  const offset = {
    x: start.x - zone.x,
    y: start.y - zone.y,
  };
  let latest = { x: zone.x, y: zone.y };
  stage.setPointerCapture(event.pointerId);
  const onPointerMove = (moveEvent: PointerEvent) => {
    const point = pointerToStagePercent(moveEvent, stage);
    latest = clampCanvasPosition({ x: point.x - offset.x, y: point.y - offset.y });
    node.style.left = `${latest.x}%`;
    node.style.top = `${latest.y}%`;
    syncMapStageLinks(stage);
  };
  const onPointerUp = (upEvent: PointerEvent) => {
    stage.releasePointerCapture(upEvent.pointerId);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerup", onPointerUp);
    props.onMoveZone(zone, latest);
  };
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
}

function startConnectionDrag(
  event: PointerEvent,
  stage: HTMLElement,
  node: HTMLElement,
  zone: ShellZoneItem,
  props: WorkspaceProps,
): void {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  const start = elementCenterToStagePercent(node, stage);
  const linkLayer = getStageSvg(stage);
  const draftLine = svgEl("path", {
    className: "stage-draft-path",
    attrs: { d: createSplinePath(start, start) },
  });
  linkLayer.append(draftLine);
  stage.setPointerCapture(event.pointerId);
  const onPointerMove = (moveEvent: PointerEvent) => {
    draftLine.setAttribute("d", createSplinePath(start, pointerToStagePercent(moveEvent, stage)));
  };
  const onPointerUp = (upEvent: PointerEvent) => {
    stage.releasePointerCapture(upEvent.pointerId);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerup", onPointerUp);
    draftLine.remove();
    const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest<HTMLElement>(".stage-node");
    const targetZoneId = target?.dataset.zoneId;
    if (targetZoneId && targetZoneId !== zone.id) {
      props.onConnectZones(zone.label, targetZoneId);
    }
  };
  draftLine.setAttribute("d", createSplinePath(start, pointerToStagePercent(event, stage)));
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
}

function startZoneObjectDrag(
  event: PointerEvent,
  stage: HTMLElement,
  node: HTMLElement,
  zone: ShellZoneItem,
  object: ShellZoneObjectItem,
  props: WorkspaceProps,
): void {
  if (event.button !== 0) {
    return;
  }
  event.preventDefault();
  const start = pointerToStagePercent(event, stage);
  const offset = {
    x: start.x - object.x,
    y: start.y - object.y,
  };
  let latest = { x: object.x, y: object.y };
  stage.setPointerCapture(event.pointerId);
  const onPointerMove = (moveEvent: PointerEvent) => {
    const point = pointerToStagePercent(moveEvent, stage);
    latest = clampCanvasPosition({ x: point.x - offset.x, y: point.y - offset.y });
    node.style.left = `${latest.x}%`;
    node.style.top = `${latest.y}%`;
    syncZoneStageRoads(stage);
  };
  const onPointerUp = (upEvent: PointerEvent) => {
    stage.releasePointerCapture(upEvent.pointerId);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerup", onPointerUp);
    props.onMoveZoneObject(zone, object, latest);
  };
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
}

function pointerToStagePercent(event: PointerEvent, stage: HTMLElement): CanvasPosition {
  const rect = stage.getBoundingClientRect();
  return clampCanvasPosition({
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  });
}

function syncMapStageLinks(stage: HTMLElement): void {
  for (const group of Array.from(stage.querySelectorAll<SVGGElement>(".stage-link-group"))) {
    const visible = group.querySelector<SVGPathElement>(".stage-link-path");
    if (!visible) {
      continue;
    }
    const from = findNodeByDataset(stage, ".stage-node", "zoneId", visible.dataset.fromZone);
    const to = findNodeByDataset(stage, ".stage-node", "zoneId", visible.dataset.toZone);
    if (!from || !to) {
      continue;
    }
    const d = createSplinePath(elementCenterToStagePercent(from, stage), elementCenterToStagePercent(to, stage));
    visible.setAttribute("d", d);
    const hit = group.querySelector<SVGPathElement>(".stage-link-hit");
    if (hit) {
      hit.setAttribute("d", d);
    }
  }
}

function syncZoneStageRoads(stage: HTMLElement): void {
  for (const group of Array.from(stage.querySelectorAll<SVGGElement>(".zone-road-group"))) {
    const from = findNodeByDataset(stage, ".zone-object-node", "objectId", group.dataset.fromObject);
    const to = findNodeByDataset(stage, ".zone-object-node", "objectId", group.dataset.toObject);
    const path = group.querySelector<SVGPathElement>(".zone-road-path");
    if (!from || !to || !path) {
      continue;
    }
    const fromPoint = elementCenterToStagePercent(from, stage);
    const toPoint = elementCenterToStagePercent(to, stage);
    path.setAttribute("d", createSplinePath(fromPoint, toPoint));
    const label = group.querySelector<SVGTextElement>(".zone-road-label");
    if (label) {
      label.setAttribute("x", String(roundPath((fromPoint.x + toPoint.x) / 2)));
      label.setAttribute("y", String(roundPath((fromPoint.y + toPoint.y) / 2)));
    }
  }
}

function elementCenterToStagePercent(element: HTMLElement, stage: HTMLElement): CanvasPosition {
  const elementRect = element.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  return {
    x: ((elementRect.left + elementRect.width / 2 - stageRect.left) / stageRect.width) * 100,
    y: ((elementRect.top + elementRect.height / 2 - stageRect.top) / stageRect.height) * 100,
  };
}

function createSplinePath(from: CanvasPosition, to: CanvasPosition): string {
  return `M ${roundPath(from.x)} ${roundPath(from.y)} L ${roundPath(to.x)} ${roundPath(to.y)}`;
}

function projectedZoneCenter(zone: ShellZoneItem): CanvasPosition {
  return { x: zone.x + 5, y: zone.y + 4 };
}

function projectedObjectCenter(object: ShellZoneObjectItem): CanvasPosition {
  return { x: object.x + 5, y: object.y + 4 };
}

function getStageSvg(stage: HTMLElement): SVGSVGElement {
  const svg = stage.querySelector<SVGSVGElement>(".stage-svg");
  if (!svg) {
    throw new Error("Stage SVG layer is missing.");
  }
  return svg;
}

function findNodeByDataset(stage: HTMLElement, selector: string, key: string, value: string | undefined): HTMLElement | undefined {
  if (!value) {
    return undefined;
  }
  return Array.from(stage.querySelectorAll<HTMLElement>(selector)).find((item) => item.dataset[key] === value);
}

function roundPath(value: number): number {
  return Number(value.toFixed(2));
}

function clampCanvasPosition(position: CanvasPosition): CanvasPosition {
  return {
    x: Math.max(2, Math.min(88, Number(position.x.toFixed(2)))),
    y: Math.max(2, Math.min(88, Number(position.y.toFixed(2)))),
  };
}

function removeActiveContextMenu(): void {
  document.querySelector(".context-menu")?.remove();
}

function createContextMenu(x: number, y: number, items: Array<{ label: string; icon?: string; onClick: () => void }>): HTMLElement {
  removeActiveContextMenu();
  const menu = el("div", { className: "context-menu", attrs: { style: `left:${x}px;top:${y}px` } },
    items.map((item) => {
      const row = el("button", { className: "context-menu-item", attrs: { type: "button" } }, [
        ...(item.icon ? [el("span", { className: "material-symbols-outlined", text: item.icon, attrs: { "aria-hidden": "true" } })] : []),
        el("span", { text: item.label }),
      ]);
      row.addEventListener("click", () => { removeActiveContextMenu(); item.onClick(); });
      return row;
    }),
  );
  document.body.append(menu);
  const close = (event: Event) => {
    if (!menu.contains(event.target as Node)) {
      removeActiveContextMenu();
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    }
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") { removeActiveContextMenu(); document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", onKey); }
  };
  requestAnimationFrame(() => {
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
  });
  return menu;
}

function showZoneContextMenu(event: MouseEvent, zone: ShellZoneItem, props: WorkspaceProps, _node: HTMLElement): void {
  const items = [
    { label: "Select", icon: "target", onClick: () => props.onSelectZone(zone) },
    ...PLAYER_REFS.map((playerRef) => ({
      label: `Assign ${playerRef}`,
      icon: "person",
      onClick: () => props.onReassignZoneOwner(zone, playerRef),
    })),
    { label: "Assign Neutral", icon: "remove_circle_outline", onClick: () => props.onReassignZoneOwner(zone, "Neutral") },
    { label: "Delete zone", icon: "delete", onClick: () => props.onDeleteZone(zone) },
  ];
  createContextMenu(event.clientX, event.clientY, items);
}

function showConnectionContextMenu(event: MouseEvent, connection: ShellConnectionItem, props: WorkspaceProps): void {
  const items = [
    { label: "Select", icon: "target", onClick: () => props.onSelectConnection(connection) },
    ...Array.from(CONNECTION_TYPES).map((type) => ({
      label: `Type: ${type}`,
      icon: "swap_horiz",
      onClick: () => props.onChangeConnectionType(connection, type),
    })),
    { label: "Delete connection", icon: "delete", onClick: () => props.onDeleteConnection(connection) },
  ];
  createContextMenu(event.clientX, event.clientY, items);
}
