import { ROAD_TARGET_TYPES, ROAD_TYPES } from "../../../core/rmg/enums.js";
import { getRoadTargetConditionalState } from "../../conditionals/roadConditionals.js";
import type { ShellRoadTargetItem } from "../../data/shellData.js";
import { el } from "../../dom.js";
import { createButton, createValueRow } from "../primitives.js";
import { applyConditionalState, createControlRow, createSelect, createSelectWithLabels, createTextInput, type LabeledOption } from "./controls.js";
import type { InspectorProps } from "./types.js";

export function createRoadSettingsForm(props: InspectorProps): HTMLElement {
  const roads = props.selectedZone.zoneRoads;
  if (roads.length === 0) {
    return el("div", { className: "inspector-body" }, [
      el("h3", { text: "Roads" }),
      createValueRow("Authored roads", "0"),
      createValueRow("Hint", "Use Zone edit > Add road after the zone has a main object and incident connection."),
    ]);
  }

  const roadSelect = createSelectWithLabels(roads[0]?.id ?? "", roads.map((road) => ({
    value: road.id,
    label: `${road.label}: ${road.type} ${road.fromId} -> ${road.toId}`,
  })));
  const typeInput = createSelect(roads[0]?.type ?? "Dirt", ROAD_TYPES);
  const fromTypeInput = createSelect(roads[0]?.fromTarget.type ?? "Crossroads", ROAD_TARGET_TYPES);
  const fromArgsInput = createRoadTargetArgsControl(fromTypeInput, roads[0]?.fromTarget, props);
  const toTypeInput = createSelect(roads[0]?.toTarget.type ?? "Crossroads", ROAD_TARGET_TYPES);
  const toArgsInput = createRoadTargetArgsControl(toTypeInput, roads[0]?.toTarget, props);
  const fromArgsRow = createControlRow("From arg", fromArgsInput.element);
  const toArgsRow = createControlRow("To arg", toArgsInput.element);
  const fromSummary = el("p", { className: "conditional-note" });
  const toSummary = el("p", { className: "conditional-note" });

  const renderConditionalState = () => {
    const fromState = getRoadTargetConditionalState(fromTypeInput.value, fromArgsInput.hasArgs());
    const toState = getRoadTargetConditionalState(toTypeInput.value, toArgsInput.hasArgs());
    fromSummary.textContent = fromState.summary;
    toSummary.textContent = toState.summary;
    applyConditionalState(fromArgsRow, [fromArgsInput.element], fromState.args);
    applyConditionalState(toArgsRow, [toArgsInput.element], toState.args);
  };

  const syncSelectedRoad = () => {
    const road = roads.find((item) => item.id === roadSelect.value) ?? roads[0];
    if (!road) {
      return;
    }
    typeInput.value = road.type;
    fromTypeInput.value = road.fromTarget.type || "Crossroads";
    fromArgsInput.setTarget(road.fromTarget);
    toTypeInput.value = road.toTarget.type || "Crossroads";
    toArgsInput.setTarget(road.toTarget);
    renderConditionalState();
  };
  roadSelect.addEventListener("change", syncSelectedRoad);
  fromTypeInput.addEventListener("change", renderConditionalState);
  toTypeInput.addEventListener("change", renderConditionalState);
  renderConditionalState();

  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Road editor" }),
    createControlRow("Road", roadSelect),
    createControlRow("Type", typeInput),
    el("h3", { text: "From target" }),
    createControlRow("From type", fromTypeInput),
    fromSummary,
    fromArgsRow,
    el("h3", { text: "To target" }),
    createControlRow("To type", toTypeInput),
    toSummary,
    toArgsRow,
    el("p", { className: "conditional-note", text: "Target args are derived from selected-zone context. Crossroads uses no args." }),
    el("div", { className: "inspector-actions" }, [
      createButton("Apply road settings", { variant: "primary", icon: "check", onClick: () => {
        const selectedRoad = roads.find((item) => item.id === roadSelect.value) ?? roads[0];
        if (!selectedRoad) {
          return;
        }
        props.onApplyRoadSettings({
          roadIndex: selectedRoad.index,
          type: typeInput.value,
          from: {
            type: fromTypeInput.value,
            args: fromArgsInput.getArgs(),
          },
          to: {
            type: toTypeInput.value,
            args: toArgsInput.getArgs(),
          },
        });
      }}),
    ]),
    el("h3", { text: "Current roads" }),
    ...roads.map((road, index) =>
      createValueRow(`Road ${index + 1}`, `${road.type}: ${road.fromId} -> ${road.toId}`)
    ),
  ]);
}

interface RoadTargetArgsControl {
  element: HTMLElement;
  getArgs: () => string[];
  hasArgs: () => boolean;
  setTarget: (target: ShellRoadTargetItem) => void;
}

function createRoadTargetArgsControl(
  typeInput: HTMLSelectElement,
  initialTarget: ShellRoadTargetItem | undefined,
  props: InspectorProps,
): RoadTargetArgsControl {
  const container = el("div", { className: "rule-args-control" });
  let currentTarget = initialTarget ?? { type: typeInput.value, args: [] };
  let currentGetArgs = () => [...currentTarget.args];

  const render = () => {
    container.replaceChildren();
    const type = typeInput.value;
    if (type === "Crossroads") {
      currentGetArgs = () => [];
      container.append(el("span", { className: "control-note", text: "No argument" }));
      return;
    }
    const options = getRoadTargetArgOptions(type, props);
    const selected = currentTarget.type === type ? currentTarget.args[0] ?? "" : "";
    if (options.length > 0) {
      const select = createSelectWithLabels(selected, options);
      currentGetArgs = () => select.value.trim().length > 0 ? [select.value] : [];
      container.append(select);
      return;
    }
    const input = createTextInput(selected);
    currentGetArgs = () => input.value.trim().length > 0 ? [input.value.trim()] : [];
    container.append(input, el("p", { className: "control-note", text: `No ${type} options in selected zone context.` }));
  };

  typeInput.addEventListener("change", () => {
    currentTarget = { type: typeInput.value, args: currentGetArgs() };
    render();
  });
  render();
  return {
    element: container,
    getArgs: () => currentGetArgs(),
    hasArgs: () => currentGetArgs().length > 0,
    setTarget: (target) => {
      currentTarget = target;
      render();
    },
  };
}

function getRoadTargetArgOptions(type: string, props: InspectorProps): LabeledOption[] {
  if (type === "MainObject") {
    return props.selectedZone.zoneObjects
      .filter((object) => object.id.startsWith("main:"))
      .map((object) => ({
        value: object.id.slice("main:".length),
        label: `${object.id.slice("main:".length)}: ${object.label}`,
      }));
  }
  if (type === "Connection") {
    return props.connections
      .filter((connection) => connection.label && connection.type !== "Proximity" && (connection.from === props.selectedZone.label || connection.to === props.selectedZone.label))
      .map((connection) => ({
        value: connection.label,
        label: `${connection.label} (${connection.from} -> ${connection.to})`,
      }));
  }
  if (type === "MandatoryContent") {
    const presetIds = new Set(props.selectedZone.mandatoryContent);
    return (props.template.mandatoryContent ?? [])
      .filter((preset) => preset.name && presetIds.has(preset.name))
      .flatMap((preset) => (preset.content ?? [])
        .filter((content) => content.name)
        .map((content) => ({
          value: content.name ?? "",
          label: `${content.name} (${preset.name})`,
        })));
  }
  return [];
}
