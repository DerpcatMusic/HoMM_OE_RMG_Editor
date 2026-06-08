import type { EditorFieldMetadata } from "../../core/editor-schema/index.js";
import { BIOME_RULE_TYPES, FACTION_RULE_TYPES, MAIN_OBJECT_PLACEMENTS, MAIN_OBJECT_TYPES, PLAYER_REFS } from "../../core/rmg/enums.js";
import { el, svgEl } from "../dom.js";
import { PLAYER_COLORS, type ShellCatalogOptions, type ShellConnectionItem, type ShellSectionSummary, type ShellZoneItem, type ShellZoneObjectItem } from "../data/shellData.js";
import type { CanvasPosition, ZoneUpdateDraft } from "../state/editorSession.js";
import { createButton, createTabButton, createValueRow } from "./primitives.js";

export type WorkspaceTab = "canvas" | "selection" | "zoneEdit";

export interface WorkspaceProps {
  section: ShellSectionSummary;
  fields: readonly EditorFieldMetadata[];
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
  onRemoveSelectedZone: () => void;
  onAddConnection: () => void;
  onAddMainObject: () => void;
  onAddRoad: () => void;
  onApplyZoneChanges: (draft: ZoneUpdateDraft) => void;
}

export function createWorkspace(props: WorkspaceProps): HTMLElement {
  return el("main", { className: "workspace", attrs: { tabindex: "-1" } }, [
    el("div", { className: "workspace-tabs", attrs: { role: "tablist", "aria-label": "Workspace mode" } }, [
      createTabButton("Canvas", "canvas", props.activeTab, props.onTabChange, { icon: "globe", iconOnly: true }),
      createTabButton("Selected zone", "selection", props.activeTab, props.onTabChange, { icon: "target", iconOnly: true }),
      createTabButton("Zone edit", "zoneEdit", props.activeTab, props.onTabChange, { icon: "edit_square", iconOnly: true }),
    ]),
    createActiveWorkspace(props),
  ]);
}

function createActiveWorkspace(props: WorkspaceProps): HTMLElement {
  if (props.activeTab === "canvas") {
    return createCanvasWorkspace(props);
  }
  if (props.activeTab === "zoneEdit") {
    return createZoneEditWorkspace(props);
  }
  return createSelectionWorkspace(props);
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

function createSelectionWorkspace(props: WorkspaceProps): HTMLElement {
  const editableFields = props.fields.filter((field) => field.editLevel === "firstClass").slice(0, 10);
  const nameInput = createInput("text", props.selectedZone.label);
  const sizeInput = createInput("number", String(props.selectedZone.size), "0.1");
  const layoutInput = createInput("text", props.selectedZone.layout);
  const zoneBiomeTypeInput = createSelect(props.selectedZone.zoneBiome.type, ["", ...BIOME_RULE_TYPES]);
  const zoneBiomeArgsInput = createBiomeRuleArgsControl(zoneBiomeTypeInput, props.selectedZone.zoneBiome.args, props, "zoneBiome");
  const contentBiomeTypeInput = createSelect(props.selectedZone.contentBiome.type, ["", ...BIOME_RULE_TYPES]);
  const contentBiomeArgsInput = createBiomeRuleArgsControl(contentBiomeTypeInput, props.selectedZone.contentBiome.args, props, "contentBiome");
  const metaObjectsBiomeTypeInput = createSelect(props.selectedZone.metaObjectsBiome.type, ["", ...BIOME_RULE_TYPES]);
  const metaObjectsBiomeArgsInput = createBiomeRuleArgsControl(metaObjectsBiomeTypeInput, props.selectedZone.metaObjectsBiome.args, props, "metaObjectsBiome");
  const crossroadsInput = createOptionalNumberInput(props.selectedZone.crossroadsPosition, "0.01");
  const diplomacyInput = createOptionalNumberInput(props.selectedZone.diplomacyModifier, "0.01");
  const guardCutoffInput = createOptionalNumberInput(props.selectedZone.guardCutoffValue, "1");
  const guardMultiplierInput = createOptionalNumberInput(props.selectedZone.guardMultiplier, "0.01");
  const guardRandomizationInput = createOptionalNumberInput(props.selectedZone.guardRandomization, "0.01");
  const guardWeeklyIncrementInput = createOptionalNumberInput(props.selectedZone.guardWeeklyIncrement, "0.01");
  const guardReactionDistributionInput = createTextarea(props.selectedZone.guardReactionDistribution.join("\n"));
  const guardedValueInput = createOptionalNumberInput(props.selectedZone.guardedContentValue, "1");
  const guardedPerAreaInput = createOptionalNumberInput(props.selectedZone.guardedContentValuePerArea, "1");
  const unguardedValueInput = createOptionalNumberInput(props.selectedZone.unguardedContentValue, "1");
  const unguardedPerAreaInput = createOptionalNumberInput(props.selectedZone.unguardedContentValuePerArea, "1");
  const resourcesValueInput = createOptionalNumberInput(props.selectedZone.resourcesValue, "1");
  const resourcesPerAreaInput = createOptionalNumberInput(props.selectedZone.resourcesValuePerArea, "1");
  const guardedInput = createPoolMultiPicker(props.selectedZone.guardedPools, props.catalogOptions.guardedContentPools);
  const unguardedInput = createPoolMultiPicker(props.selectedZone.unguardedPools, props.catalogOptions.unguardedContentPools);
  const resourcesInput = createPoolMultiPicker(props.selectedZone.resourcesPools, props.catalogOptions.resourceContentPools);
  const mandatoryInput = createTextarea(props.selectedZone.mandatoryContent.join("\n"));
  const countLimitsInput = createTextarea(props.selectedZone.contentCountLimits.join("\n"));
  return el("section", { className: "workspace-panel selection-panel" }, [
    el("div", { className: "workspace-bar" }, [
      el("div", {}, [
        el("h2", { text: props.selectedZone.label }),
        el("span", { text: `${props.selectedZone.owner} / ${props.selectedZone.role}` }),
      ]),
      el("div", { className: "bar-actions" }, [
        createButton("Remove zone", { variant: "secondary", icon: "delete", onClick: props.onRemoveSelectedZone }),
        createButton("Apply changes", { variant: "primary", icon: "check", onClick: () => props.onApplyZoneChanges({
          name: nameInput.value,
          size: Number(sizeInput.value),
          layout: layoutInput.value,
          zoneBiomeType: zoneBiomeTypeInput.value,
          zoneBiomeArgs: zoneBiomeArgsInput.getArgs(),
          contentBiomeType: contentBiomeTypeInput.value,
          contentBiomeArgs: contentBiomeArgsInput.getArgs(),
          metaObjectsBiomeType: metaObjectsBiomeTypeInput.value,
          metaObjectsBiomeArgs: metaObjectsBiomeArgsInput.getArgs(),
          crossroadsPosition: optionalNumber(crossroadsInput),
          diplomacyModifier: optionalNumber(diplomacyInput),
          guardCutoffValue: optionalNumber(guardCutoffInput),
          guardMultiplier: optionalNumber(guardMultiplierInput),
          guardRandomization: optionalNumber(guardRandomizationInput),
          guardWeeklyIncrement: optionalNumber(guardWeeklyIncrementInput),
          guardReactionDistribution: parseOptionalNumberList(guardReactionDistributionInput.value),
          guardedContentValue: optionalNumber(guardedValueInput),
          guardedContentValuePerArea: optionalNumber(guardedPerAreaInput),
          unguardedContentValue: optionalNumber(unguardedValueInput),
          unguardedContentValuePerArea: optionalNumber(unguardedPerAreaInput),
          resourcesValue: optionalNumber(resourcesValueInput),
          resourcesValuePerArea: optionalNumber(resourcesPerAreaInput),
          guardedPools: guardedInput.getValues(),
          unguardedPools: unguardedInput.getValues(),
          resourcesPools: resourcesInput.getValues(),
          mandatoryContent: parseStringList(mandatoryInput.value),
          contentCountLimits: parseStringList(countLimitsInput.value),
        })}),
      ]),
    ]),
    el("div", { className: "edit-form" }, [
      el("h3", { text: "Identity and layout" }),
      createControlRow("Name", nameInput),
      createControlRow("Size", sizeInput),
      createControlRow("Layout", layoutInput),
      createControlRow("Crossroads pos", crossroadsInput),
      createControlRow("Diplomacy mod", diplomacyInput),
      el("h3", { text: "Biome rules" }),
      createControlRow("Zone biome type", zoneBiomeTypeInput),
      createControlRow("Zone biome args", zoneBiomeArgsInput.element),
      createControlRow("Content biome type", contentBiomeTypeInput),
      createControlRow("Content biome args", contentBiomeArgsInput.element),
      createControlRow("Meta biome type", metaObjectsBiomeTypeInput),
      createControlRow("Meta biome args", metaObjectsBiomeArgsInput.element),
      el("h3", { text: "Guard settings" }),
      createControlRow("Guard cutoff", guardCutoffInput),
      createControlRow("Guard multiplier", guardMultiplierInput),
      createControlRow("Guard random", guardRandomizationInput),
      createControlRow("Guard weekly", guardWeeklyIncrementInput),
      createControlRow("Reaction weights", guardReactionDistributionInput),
      el("h3", { text: "Content budgets" }),
      createControlRow("Guarded value", guardedValueInput),
      createControlRow("Guarded per area", guardedPerAreaInput),
      createControlRow("Unguarded value", unguardedValueInput),
      createControlRow("Unguarded per area", unguardedPerAreaInput),
      createControlRow("Resources value", resourcesValueInput),
      createControlRow("Resources per area", resourcesPerAreaInput),
      el("h3", { text: "Pool and preset alternatives" }),
      createControlRow("Guarded pools", guardedInput.element),
      createControlRow("Unguarded pools", unguardedInput.element),
      createControlRow("Resource pools", resourcesInput.element),
      createControlRow("Mandatory presets", mandatoryInput),
      createControlRow("Count limits", countLimitsInput),
    ]),
    el("div", { className: "bare-table" }, [
      createValueRow("Owner", props.selectedZone.owner),
      createValueRow("Role", props.selectedZone.role),
      createValueRow("Main objects", String(props.selectedZone.mainObjectCount)),
      createValueRow("Roads", String(props.selectedZone.roadCount)),
    ]),
    el("h3", { text: `${props.section.label} fields` }),
    el("div", { className: "field-list" }, editableFields.map((field) => createFieldLine(field))),
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
  const ownerColor = isFocusedOwner ? (PLAYER_COLORS[zone.owner] ?? "#888") : undefined;
  const style = ownerColor
    ? `left:${zone.x}%;top:${zone.y}%;--player-color:${ownerColor}`
    : `left:${zone.x}%;top:${zone.y}%;`;
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

function createFieldLine(field: EditorFieldMetadata): HTMLElement {
  return el("button", { className: "field-line", attrs: { type: "button" } }, [
    el("span", { text: field.label }),
    el("code", { text: field.id }),
  ]);
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

function createInput(type: "text" | "number", value: string, step?: string): HTMLInputElement {
  const attrs: Record<string, string> = { type, value };
  if (step) {
    attrs.step = step;
  }
  return el("input", { className: "text-input", attrs });
}

function createOptionalNumberInput(value: number | undefined, step = "1"): HTMLInputElement {
  return createInput("number", value === undefined ? "" : String(value), step);
}

interface RuleArgsControl {
  element: HTMLElement;
  getArgs: () => string[];
}

interface MutableRuleArgsControl extends RuleArgsControl {
  setArgs: (args: readonly string[]) => void;
}

type BiomeRuleRole = "zoneBiome" | "contentBiome" | "metaObjectsBiome";

function createBiomeRuleArgsControl(
  typeInput: HTMLSelectElement,
  initialArgs: readonly string[],
  props: WorkspaceProps,
  role: BiomeRuleRole,
): RuleArgsControl {
  const container = el("div", { className: "rule-args-control" });
  let currentGetArgs = () => [...initialArgs];

  const render = (args: readonly string[]) => {
    container.replaceChildren();
    if (typeInput.value === "FromList") {
      renderBiomeFromListControl(container, args, props, (getArgs) => {
        currentGetArgs = getArgs;
      });
      container.append(createRulePreview("FromList", getBiomeFromListPreview(role)));
      return;
    }
    if (typeInput.value === "MatchZone") {
      const zoneSelect = createOptionSelect(args[0] ?? "", [
        { value: "", label: matchZoneBlankLabel(role, props.selectedZone.label) },
        ...props.zones.map((zone) => ({ value: zone.label, label: zone.label })),
      ]);
      currentGetArgs = () => zoneSelect.value ? [zoneSelect.value] : [];
      container.append(zoneSelect, createRulePreview("MatchZone", matchZonePreview(role, zoneSelect.value, props.selectedZone.label)));
      zoneSelect.addEventListener("change", () => {
        const preview = container.querySelector<HTMLElement>(".rule-preview");
        if (preview) {
          preview.textContent = matchZonePreview(role, zoneSelect.value, props.selectedZone.label);
        }
      });
      return;
    }
    if (typeInput.value === "MatchMainObject") {
      renderMatchMainObjectControl(container, args, props, (getArgs) => {
        currentGetArgs = getArgs;
      });
      return;
    }
    const textarea = createTextarea(args.join("\n"));
    currentGetArgs = () => parseStringList(textarea.value);
    container.append(textarea);
  };

  typeInput.addEventListener("change", () => render(currentGetArgs()));
  render(initialArgs);
  return {
    element: container,
    getArgs: () => currentGetArgs(),
  };
}

function createFactionRuleArgsControl(
  typeInput: HTMLSelectElement,
  initialArgs: readonly string[],
  props: WorkspaceProps,
): MutableRuleArgsControl {
  const container = el("div", { className: "rule-args-control" });
  let currentArgs = [...initialArgs];
  let currentGetArgs = () => [...currentArgs];

  const render = () => {
    container.replaceChildren();
    if (typeInput.value === "FromList") {
      renderFactionFromListControl(container, currentArgs, props, (getArgs) => {
        currentGetArgs = getArgs;
      });
      container.append(createRulePreview("FromList", "Rolls a faction from selected candidates, excluding any differentFrom main-object references. Empty candidates mean any faction."));
      return;
    }
    if (typeInput.value === "Match") {
      renderFactionMatchControl(container, currentArgs, props, (getArgs) => {
        currentGetArgs = getArgs;
      });
      return;
    }
    const textarea = createTextarea(currentArgs.join("\n"));
    currentGetArgs = () => parseStringList(textarea.value);
    container.append(textarea);
  };

  typeInput.addEventListener("change", () => {
    currentArgs = currentGetArgs();
    render();
  });
  render();
  return {
    element: container,
    getArgs: () => currentGetArgs(),
    setArgs: (args) => {
      currentArgs = [...args];
      render();
    },
  };
}

function renderFactionFromListControl(
  container: HTMLElement,
  args: readonly string[],
  props: WorkspaceProps,
  setGetter: (getArgs: () => string[]) => void,
): void {
  const { factionArgs, exclusionArgs } = splitFactionFromListArgs(args);
  if (props.catalogOptions.factions.length > 0) {
    const select = createMultiSelect(factionArgs, props.catalogOptions.factions);
    const exclusions = createTextarea(exclusionArgs.join("\n"));
    exclusions.rows = 2;
    setGetter(() => [
      ...Array.from(select.selectedOptions).map((option) => option.value),
      ...parseStringList(exclusions.value),
    ]);
    container.append(
      createControlStack("Faction candidates", select),
      createControlStack("differentFrom exclusions", exclusions),
    );
    return;
  }
  const textarea = createTextarea(args.join("\n"));
  setGetter(() => parseStringList(textarea.value));
  container.append(textarea, el("p", { className: "control-note", text: "Add Core.zip to populate faction choices. Use differentFrom: <mainObjectIndex> [zoneName]." }));
}

function renderFactionMatchControl(
  container: HTMLElement,
  args: readonly string[],
  props: WorkspaceProps,
  setGetter: (getArgs: () => string[]) => void,
): void {
  const initialZone = args[1] ?? "";
  const zoneSelect = createOptionSelect(initialZone, [
    { value: "", label: `current zone (${props.selectedZone.label})` },
    ...props.zones.map((zone) => ({ value: zone.label, label: zone.label })),
  ]);
  const objectSlot = el("div");
  const preview = createRulePreview("Match", "");
  let objectSelect = createOptionSelect(args[0] ?? "", []);

  const renderObjectSelect = () => {
    const zone = zoneSelect.value ? props.zones.find((item) => item.label === zoneSelect.value) : props.selectedZone;
    const currentIndex = objectSelect.value || args[0] || "";
    objectSelect = createOptionSelect(currentIndex, mainObjectOptionsForZone(zone));
    objectSelect.addEventListener("change", () => {
      preview.textContent = factionMatchPreview(objectSelect.value, zoneSelect.value, props.selectedZone.label);
    });
    objectSlot.replaceChildren(objectSelect);
    preview.textContent = factionMatchPreview(objectSelect.value, zoneSelect.value, props.selectedZone.label);
  };

  zoneSelect.addEventListener("change", renderObjectSelect);
  renderObjectSelect();
  setGetter(() => {
    const index = objectSelect.value.trim();
    if (!index) {
      return [];
    }
    return zoneSelect.value ? [index, zoneSelect.value] : [index];
  });
  container.append(
    createControlStack("Main object index", objectSlot),
    createControlStack("Optional zone", zoneSelect),
    preview,
  );
}

function createMainObjectPlacementArgsControl(
  placementInput: HTMLSelectElement,
  initialArgs: readonly string[],
  props: WorkspaceProps,
): MutableRuleArgsControl {
  const container = el("div", { className: "rule-args-control" });
  let currentArgs = [...initialArgs];
  let currentGetArgs = () => [...currentArgs];

  const render = () => {
    container.replaceChildren();
    if (placementInput.value === "Uniform" || placementInput.value === "Center") {
      currentGetArgs = () => [];
      container.append(el("span", { className: "control-note", text: "No args" }));
      return;
    }
    if (placementInput.value === "Connection") {
      const connections = props.connections
        .filter((connection) => connection.type !== "Proximity" && (connection.from === props.selectedZone.label || connection.to === props.selectedZone.label))
        .map((connection) => ({ value: connection.label, label: `${connection.label} (${connection.type})` }));
      const select = createOptionSelect(currentArgs[0] ?? "", [{ value: "", label: "" }, ...connections]);
      currentGetArgs = () => select.value.trim().length > 0 ? [select.value] : [];
      container.append(select, el("p", { className: "control-note", text: "Connection placement uses an incident non-proximity connection name." }));
      return;
    }
    if (placementInput.value === "NearZone") {
      const select = createOptionSelect(currentArgs[0] ?? "", [{ value: "", label: "" }, ...props.zones.map((zone) => ({ value: zone.label, label: zone.label }))]);
      currentGetArgs = () => select.value.trim().length > 0 ? [select.value] : [];
      container.append(select, el("p", { className: "control-note", text: "NearZone uses a zone name." }));
      return;
    }
    const textarea = createTextarea(currentArgs.join("\n"));
    currentGetArgs = () => parseStringList(textarea.value);
    container.append(textarea);
  };

  placementInput.addEventListener("change", () => {
    currentArgs = currentGetArgs();
    render();
  });
  render();
  return {
    element: container,
    getArgs: () => currentGetArgs(),
    setArgs: (args) => {
      currentArgs = [...args];
      render();
    },
  };
}

function renderBiomeFromListControl(
  container: HTMLElement,
  args: readonly string[],
  props: WorkspaceProps,
  setGetter: (getArgs: () => string[]) => void,
): void {
  const { biomeArgs, exclusionArgs } = splitBiomeFromListArgs(args);
  if (props.catalogOptions.biomes.length > 0) {
    const select = createMultiSelect(biomeArgs, props.catalogOptions.biomes);
    const exclusions = createTextarea(exclusionArgs.join("\n"));
    exclusions.rows = 2;
    setGetter(() => [
      ...Array.from(select.selectedOptions).map((option) => option.value),
      ...parseStringList(exclusions.value),
    ]);
    container.append(
      createControlStack("Biome candidates", select),
      createControlStack("differentFrom exclusions", exclusions),
    );
    return;
  }
  const textarea = createTextarea(args.join("\n"));
  setGetter(() => parseStringList(textarea.value));
  container.append(textarea, el("p", { className: "control-note", text: "Add Core.zip to populate biome choices. Use differentFrom: entries one per line." }));
}

function renderMatchMainObjectControl(
  container: HTMLElement,
  args: readonly string[],
  props: WorkspaceProps,
  setGetter: (getArgs: () => string[]) => void,
): void {
  const initialZone = args[1] ?? "";
  const zoneSelect = createOptionSelect(initialZone, [
    { value: "", label: `current zone (${props.selectedZone.label})` },
    ...props.zones.map((zone) => ({ value: zone.label, label: zone.label })),
  ]);
  const objectSlot = el("div");
  const preview = createRulePreview("MatchMainObject", "");
  let objectSelect = createOptionSelect(args[0] ?? "", []);

  const renderObjectSelect = () => {
    const zone = zoneSelect.value ? props.zones.find((item) => item.label === zoneSelect.value) : props.selectedZone;
    const currentIndex = objectSelect.value || args[0] || "";
    objectSelect = createOptionSelect(currentIndex, mainObjectOptionsForZone(zone));
    objectSelect.addEventListener("change", () => {
      preview.textContent = matchMainObjectPreview(objectSelect.value, zoneSelect.value, props.selectedZone.label);
    });
    objectSlot.replaceChildren(objectSelect);
    preview.textContent = matchMainObjectPreview(objectSelect.value, zoneSelect.value, props.selectedZone.label);
  };

  zoneSelect.addEventListener("change", renderObjectSelect);
  renderObjectSelect();
  setGetter(() => {
    const index = objectSelect.value.trim();
    if (!index) {
      return [];
    }
    return zoneSelect.value ? [index, zoneSelect.value] : [index];
  });
  container.append(
    createControlStack("Main object index", objectSlot),
    createControlStack("Optional zone", zoneSelect),
    preview,
  );
}

function splitBiomeFromListArgs(args: readonly string[]): { biomeArgs: string[]; exclusionArgs: string[] } {
  const biomeArgs: string[] = [];
  const exclusionArgs: string[] = [];
  for (const arg of args) {
    if (arg.trim().startsWith("differentFrom:")) {
      exclusionArgs.push(arg);
    } else {
      biomeArgs.push(arg);
    }
  }
  return { biomeArgs, exclusionArgs };
}

function splitFactionFromListArgs(args: readonly string[]): { factionArgs: string[]; exclusionArgs: string[] } {
  const factionArgs: string[] = [];
  const exclusionArgs: string[] = [];
  for (const arg of args) {
    if (arg.trim().startsWith("differentFrom:")) {
      exclusionArgs.push(arg);
    } else {
      factionArgs.push(arg);
    }
  }
  return { factionArgs, exclusionArgs };
}

function mainObjectOptionsForZone(zone: ShellZoneItem | undefined): Array<{ value: string; label: string }> {
  if (!zone || zone.mainObjectCount <= 0) {
    return [];
  }
  return Array.from({ length: zone.mainObjectCount }, (_, index) => {
    const object = zone.zoneObjects.find((item) => item.id === `main:${index}`);
    return {
      value: String(index),
      label: object ? `${index}: ${object.label}` : String(index),
    };
  });
}

function getBiomeFromListPreview(role: BiomeRuleRole): string {
  if (role === "zoneBiome") {
    return "Rolls terrain biome from selected candidates, excluding any differentFrom references. Empty candidates mean any biome.";
  }
  return "Rolls content/meta biome from selected candidates, excluding any differentFrom references. Empty candidates mean any biome.";
}

function matchZoneBlankLabel(role: BiomeRuleRole, selectedZoneName: string): string {
  return role === "zoneBiome" ? "no arg: roll random biome" : `no arg: match current zone (${selectedZoneName})`;
}

function matchZonePreview(role: BiomeRuleRole, zoneName: string, selectedZoneName: string): string {
  if (zoneName) {
    return `Copies biome from zone '${zoneName}'.`;
  }
  return role === "zoneBiome"
    ? "No args on zoneBiome MatchZone rolls a random biome in the generator."
    : `No args on ${role} MatchZone copies '${selectedZoneName}' terrain biome.`;
}

function matchMainObjectPreview(mainObjectIndex: string, zoneName: string, selectedZoneName: string): string {
  const zoneLabel = zoneName || selectedZoneName;
  return mainObjectIndex
    ? `Uses the faction-derived biome of main object ${mainObjectIndex} in '${zoneLabel}'.`
    : "Requires a main-object index. Optional zone defaults to the current zone.";
}

function factionMatchPreview(mainObjectIndex: string, zoneName: string, selectedZoneName: string): string {
  const zoneLabel = zoneName || selectedZoneName;
  return mainObjectIndex
    ? `Copies faction from main object ${mainObjectIndex} in '${zoneLabel}'.`
    : "Requires a main-object index. Optional zone defaults to the current zone.";
}

function createRulePreview(_type: string, text: string): HTMLElement {
  return el("p", { className: "control-note rule-preview", text });
}

function createControlStack(label: string, control: HTMLElement): HTMLElement {
  return el("div", { className: "control-stack" }, [
    el("span", { className: "control-stack-label", text: label }),
    control,
  ]);
}

interface LabeledOption {
  value: string;
  label: string;
}

interface MultiPickerControl {
  element: HTMLElement;
  getValues: () => string[];
}

let pickerId = 0;

function createPoolMultiPicker(
  initialValues: readonly string[],
  options: readonly { id: string; label: string }[],
): MultiPickerControl {
  const values = [...initialValues];
  const listId = `pool-picker-${pickerId++}`;
  const input = el("input", {
    className: "text-input",
    attrs: {
      type: "search",
      list: listId,
      placeholder: options.length > 0 ? "Search pool ID" : "Attach Core.zip or type pool ID",
      autocomplete: "off",
    },
  });
  const datalist = el("datalist", { attrs: { id: listId } }, options.map((option) =>
    el("option", { attrs: { value: option.id, label: option.label } })
  ));
  const list = el("div", { className: "picker-token-list" });

  const renderValues = () => {
    list.replaceChildren(...values.map((value, index) => el("button", {
      className: "picker-token",
      attrs: {
        type: "button",
        title: `Remove ${value}`,
        "aria-label": `Remove ${value}`,
      },
      onClick: () => {
        values.splice(index, 1);
        renderValues();
      },
    }, [
      el("strong", { text: value }),
      el("span", { className: "material-symbols-outlined picker-token-remove", text: "close", attrs: { "aria-hidden": "true" } }),
    ])));
  };
  const addCurrentValue = () => {
    const value = input.value.trim();
    if (!value || values.includes(value)) {
      input.value = "";
      return;
    }
    values.push(value);
    input.value = "";
    renderValues();
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCurrentValue();
    }
  });
  const addButton = createButton("Add pool", { variant: "secondary", icon: "add", onClick: addCurrentValue });
  renderValues();
  return {
    element: el("div", { className: "multi-picker" }, [
      datalist,
      el("div", { className: "multi-picker-entry" }, [input, addButton]),
      list,
    ]),
    getValues: () => [...values],
  };
}

function createOptionSelect(value: string, options: readonly LabeledOption[]): HTMLSelectElement {
  const select = el("select", { className: "text-input" });
  const hasValue = value.trim().length > 0;
  const hasKnownValue = options.some((option) => option.value === value);
  const mergedOptions = hasValue && !hasKnownValue
    ? [{ value, label: `${value} (not in current context)` }, ...options]
    : options;
  for (const optionValue of mergedOptions) {
    select.append(el("option", { text: optionValue.label, attrs: { value: optionValue.value } }));
  }
  select.value = value;
  return select;
}

function createSelect(value: string, options: readonly string[]): HTMLSelectElement {
  const select = el("select", { className: "text-input" });
  for (const optionValue of options) {
    select.append(el("option", { text: optionValue, attrs: { value: optionValue } }));
  }
  select.value = value;
  return select;
}

function createMultiSelect(
  selectedValues: readonly string[],
  options: readonly { id: string; label: string }[],
): HTMLSelectElement {
  const selected = new Set(selectedValues);
  const select = el("select", { className: "text-input multi-input", attrs: { multiple: true, size: Math.min(7, Math.max(3, options.length)) } });
  const mergedOptions = [
    ...options,
    ...selectedValues
      .filter((id) => !options.some((option) => option.id === id))
      .map((id) => ({ id, label: `${id} (not in catalog)` })),
  ];
  for (const optionValue of mergedOptions) {
    const option = el("option", { text: optionValue.label, attrs: { value: optionValue.id } });
    option.selected = selected.has(optionValue.id);
    select.append(option);
  }
  return select;
}

function createCheckbox(checked: boolean): HTMLInputElement {
  const checkbox = el("input", { className: "check-input", attrs: { type: "checkbox" } });
  checkbox.checked = checked;
  return checkbox;
}

function createTextarea(value: string): HTMLTextAreaElement {
  const textarea = el("textarea", { className: "text-input", attrs: { rows: 3 } });
  textarea.value = value;
  return textarea;
}

function createControlRow(label: string, control: HTMLElement): HTMLElement {
  return el("label", { className: "control-row" }, [
    el("span", { text: label }),
    control,
  ]);
}

function parseStringList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptionalNumberList(value: string): number[] | undefined {
  const rawItems = parseStringList(value);
  if (rawItems.length === 0) {
    return undefined;
  }
  return rawItems.map((item) => Number(item));
}

function optionalNumber(input: HTMLInputElement): number | undefined {
  return input.value.trim().length === 0 ? undefined : Number(input.value);
}
