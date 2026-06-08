import { FACTION_RULE_TYPES, MAIN_OBJECT_PLACEMENTS, MAIN_OBJECT_TYPES, PLAYER_REFS } from "../../../core/rmg/enums.js";
import { getMainObjectConditionalState } from "../../conditionals/mainObjectConditionals.js";
import type { ShellZoneItem } from "../../data/shellData.js";
import { el } from "../../dom.js";
import { createButton, createValueRow } from "../primitives.js";
import {
  applyConditionalState,
  createCheckbox,
  createControlRow,
  createKnownSelect,
  createMultiSelect,
  createOptionalNumberInput,
  createSelectWithLabels,
  createTextarea,
  createTextInput,
  optionalNumber,
  parseStringList,
  type LabeledOption,
} from "./controls.js";
import type { InspectorProps } from "./types.js";

export function createMainObjectSettingsForm(props: InspectorProps): HTMLElement {
  const mainObjects = props.selectedZone.zoneObjects.filter((object) => object.id.startsWith("main:") && object.index !== undefined);
  if (mainObjects.length === 0) {
    return el("div", { className: "inspector-body" }, [
      el("h3", { text: "Main objects" }),
      createValueRow("Count", "0"),
      createValueRow("Hint", "Use Zone edit > Add main object, then edit it here."),
    ]);
  }

  const initialObject = mainObjects[0];
  const objectSelect = createSelectWithLabels(String(initialObject?.index ?? 0), mainObjects.map((object) => ({
    value: String(object.index),
    label: `${object.index}: ${object.type}${object.detail ? ` (${object.detail})` : ""}`,
  })));
  const typeInput = createKnownSelect(initialObject?.type ?? "City", MAIN_OBJECT_TYPES);
  const spawnInput = createKnownSelect(initialObject?.spawn ?? "", ["", ...PLAYER_REFS]);
  const ownerInput = createKnownSelect(initialObject?.owner ?? "", ["", ...PLAYER_REFS]);
  const keyObjectInput = createCheckbox(initialObject?.isKeyObject ?? false);
  const holdCityInput = createCheckbox(initialObject?.holdCityWinCon ?? false);
  const placementInput = createKnownSelect(initialObject?.placement ?? "Uniform", MAIN_OBJECT_PLACEMENTS);
  const placementArgsInput = createTextarea((initialObject?.placementArgs ?? []).join("\n"));
  const factionTypeInput = createKnownSelect(initialObject?.faction.type ?? "", ["", ...FACTION_RULE_TYPES]);
  const factionArgsInput = createFactionRuleArgsControl(factionTypeInput, initialObject?.faction.args ?? [], props);
  const weeklyIncrementInput = createCheckbox(initialObject?.enableWeeklyUnitIncrement ?? false);
  const initialIncrementInput = createOptionalNumberInput(initialObject?.initialUnitIncrement);
  const guardChanceInput = createOptionalNumberInput(initialObject?.guardChance);
  const guardValueInput = createOptionalNumberInput(initialObject?.guardValue);
  const guardWeeklyInput = createOptionalNumberInput(initialObject?.guardWeeklyIncrement);
  const guardRandomInput = createOptionalNumberInput(initialObject?.guardRandomization);
  const removeGuardInput = createCheckbox(initialObject?.removeGuardIfHasOwner ?? false);
  const constructionSidInput = createTextInput(initialObject?.buildingsConstructionSid ?? "");
  const banSidInput = createTextInput(initialObject?.buildingsBanSid ?? "");
  const summary = el("p", { className: "conditional-note" });
  const spawnRow = createControlRow("Spawn", spawnInput);
  const ownerRow = createControlRow("Owner", ownerInput);
  const holdCityRow = createControlRow("City hold win", holdCityInput);
  const placementArgsRow = createControlRow("Placement args", placementArgsInput);
  const factionTypeRow = createControlRow("Faction type", factionTypeInput);
  const factionArgsRow = createControlRow("Faction args", factionArgsInput.element);
  const factionSection = el("section", { className: "conditional-section" }, [
    factionTypeRow,
    factionArgsRow,
  ]);
  const growthSection = el("section", { className: "conditional-section" }, [
    el("h3", { text: "Growth" }),
    createControlRow("Weekly units", weeklyIncrementInput),
    createControlRow("Initial increment", initialIncrementInput),
  ]);
  const guardSection = el("section", { className: "conditional-section" }, [
    el("h3", { text: "Guards" }),
    createControlRow("Guard chance", guardChanceInput),
    createControlRow("Guard value", guardValueInput),
    createControlRow("Guard weekly", guardWeeklyInput),
    createControlRow("Guard random", guardRandomInput),
    createControlRow("Remove guard if owned", removeGuardInput),
  ]);
  const cityBuildingsSection = el("section", { className: "conditional-section" }, [
    el("h3", { text: "City building SIDs" }),
    createControlRow("Construction", constructionSidInput),
    createControlRow("Ban", banSidInput),
  ]);

  const renderConditionalState = () => {
    const state = getMainObjectConditionalState({
      objectType: typeInput.value,
      placement: placementInput.value,
      hasSpawn: spawnInput.value.trim().length > 0,
      hasOwner: ownerInput.value.trim().length > 0,
      hasHoldCity: holdCityInput.checked,
      hasPlacementArgs: placementArgsInput.value.trim().length > 0,
      hasFaction: factionTypeInput.value.trim().length > 0 || factionArgsInput.hasArgs(),
      hasGrowthValues: weeklyIncrementInput.checked || initialIncrementInput.value.trim().length > 0,
      hasGuardValues: guardChanceInput.value.trim().length > 0 || guardValueInput.value.trim().length > 0 || guardWeeklyInput.value.trim().length > 0 || guardRandomInput.value.trim().length > 0 || removeGuardInput.checked,
      hasBuildingValues: constructionSidInput.value.trim().length > 0 || banSidInput.value.trim().length > 0,
    });
    summary.textContent = state.summary;
    applyConditionalState(spawnRow, [spawnInput], state.spawn);
    applyConditionalState(ownerRow, [ownerInput], state.owner);
    applyConditionalState(holdCityRow, [holdCityInput], state.holdCity);
    applyConditionalState(placementArgsRow, [placementArgsInput], state.placementArgs);
    applyConditionalState(factionSection, [factionTypeInput, factionArgsInput.element], state.faction);
    applyConditionalState(factionTypeRow, [factionTypeInput], state.faction);
    applyConditionalState(factionArgsRow, [factionArgsInput.element], state.faction);
    applyConditionalState(growthSection, [weeklyIncrementInput, initialIncrementInput], state.growth);
    applyConditionalState(guardSection, [guardChanceInput, guardValueInput, guardWeeklyInput, guardRandomInput, removeGuardInput], state.guards);
    applyConditionalState(cityBuildingsSection, [constructionSidInput, banSidInput], state.cityBuildings);
  };

  const applyObjectToControls = (object: ShellZoneItem["zoneObjects"][number]) => {
    typeInput.value = object.type;
    spawnInput.value = object.spawn ?? "";
    ownerInput.value = object.owner ?? "";
    keyObjectInput.checked = object.isKeyObject ?? false;
    holdCityInput.checked = object.holdCityWinCon ?? false;
    placementInput.value = object.placement ?? "Uniform";
    placementArgsInput.value = object.placementArgs.join("\n");
    factionTypeInput.value = object.faction.type ?? "";
    factionArgsInput.setArgs(object.faction.args);
    weeklyIncrementInput.checked = object.enableWeeklyUnitIncrement ?? false;
    initialIncrementInput.value = object.initialUnitIncrement === undefined ? "" : String(object.initialUnitIncrement);
    guardChanceInput.value = object.guardChance === undefined ? "" : String(object.guardChance);
    guardValueInput.value = object.guardValue === undefined ? "" : String(object.guardValue);
    guardWeeklyInput.value = object.guardWeeklyIncrement === undefined ? "" : String(object.guardWeeklyIncrement);
    guardRandomInput.value = object.guardRandomization === undefined ? "" : String(object.guardRandomization);
    removeGuardInput.checked = object.removeGuardIfHasOwner ?? false;
    constructionSidInput.value = object.buildingsConstructionSid ?? "";
    banSidInput.value = object.buildingsBanSid ?? "";
    renderConditionalState();
  };
  objectSelect.addEventListener("change", () => {
    const selectedObject = mainObjects.find((object) => String(object.index) === objectSelect.value) ?? mainObjects[0];
    if (selectedObject) {
      applyObjectToControls(selectedObject);
    }
  });
  typeInput.addEventListener("change", renderConditionalState);
  placementInput.addEventListener("change", renderConditionalState);
  factionTypeInput.addEventListener("change", renderConditionalState);
  renderConditionalState();

  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Main object" }),
    createControlRow("Object", objectSelect),
    createControlRow("Type", typeInput),
    summary,
    spawnRow,
    ownerRow,
    createControlRow("Key object", keyObjectInput),
    holdCityRow,
    el("h3", { text: "Rules" }),
    createControlRow("Placement", placementInput),
    placementArgsRow,
    factionSection,
    el("p", { className: "conditional-note", text: "Placement args are newline-separated. Faction controls preserve Match and differentFrom references." }),
    growthSection,
    guardSection,
    cityBuildingsSection,
    el("div", { className: "inspector-actions" }, [
      createButton("Apply main object", { variant: "primary", icon: "check", onClick: () => props.onApplyMainObjectSettings({
        objectIndex: Number(objectSelect.value),
        type: typeInput.value,
        spawn: spawnInput.value,
        owner: ownerInput.value,
        isKeyObject: keyObjectInput.checked,
        holdCityWinCon: holdCityInput.checked,
        placement: placementInput.value,
        placementArgs: parseStringList(placementArgsInput.value),
        factionType: factionTypeInput.value,
        factionArgs: factionArgsInput.getArgs(),
        enableWeeklyUnitIncrement: weeklyIncrementInput.checked,
        initialUnitIncrement: optionalNumber(initialIncrementInput),
        guardChance: optionalNumber(guardChanceInput),
        guardValue: optionalNumber(guardValueInput),
        guardWeeklyIncrement: optionalNumber(guardWeeklyInput),
        guardRandomization: optionalNumber(guardRandomInput),
        removeGuardIfHasOwner: removeGuardInput.checked,
        buildingsConstructionSid: constructionSidInput.value,
        buildingsBanSid: banSidInput.value,
      })}),
    ]),
  ]);
}

interface MutableStringArgsControl {
  element: HTMLElement;
  getArgs: () => string[];
  hasArgs: () => boolean;
  setArgs: (args: readonly string[]) => void;
}

function createFactionRuleArgsControl(
  typeInput: HTMLSelectElement,
  initialArgs: readonly string[],
  props: InspectorProps,
): MutableStringArgsControl {
  const container = el("div", { className: "rule-args-control" });
  let currentArgs = [...initialArgs];
  let currentGetArgs = () => [...currentArgs];

  const render = () => {
    container.replaceChildren();
    if (typeInput.value === "FromList") {
      const { factionArgs, exclusionArgs } = splitFactionFromListArgs(currentArgs);
      if (props.catalogOptions.factions.length > 0) {
        const select = createMultiSelect(factionArgs, props.catalogOptions.factions);
        const exclusions = createTextarea(exclusionArgs.join("\n"));
        exclusions.rows = 2;
        currentGetArgs = () => [
          ...Array.from(select.selectedOptions).map((option) => option.value),
          ...parseStringList(exclusions.value),
        ];
        container.append(
          createControlStack("Faction candidates", select),
          createControlStack("differentFrom exclusions", exclusions),
          createRulePreview("Rolls from selected factions. Empty candidates mean any faction."),
        );
        return;
      }
      const textarea = createTextarea(currentArgs.join("\n"));
      currentGetArgs = () => parseStringList(textarea.value);
      container.append(textarea, createRulePreview("Add Core.zip to populate faction choices."));
      return;
    }
    if (typeInput.value === "Match") {
      const zoneSelect = createSelectWithLabels(currentArgs[1] ?? "", [
        { value: "", label: `current zone (${props.selectedZone.label})` },
        ...props.zones.map((zone) => ({ value: zone.label, label: zone.label })),
      ]);
      const objectSlot = el("div");
      const preview = createRulePreview("");
      let objectSelect = createSelectWithLabels(currentArgs[0] ?? "", []);
      const refreshObjectSelect = () => {
        const zone = props.zones.find((item) => item.label === zoneSelect.value) ?? props.selectedZone;
        const currentIndex = objectSelect.value || currentArgs[0] || "";
        objectSelect = createSelectWithLabels(currentIndex, mainObjectOptionsForZone(zone));
        objectSelect.addEventListener("change", () => {
          preview.textContent = factionMatchPreview(objectSelect.value, zoneSelect.value, props.selectedZone.label);
        });
        objectSlot.replaceChildren(objectSelect);
        preview.textContent = factionMatchPreview(objectSelect.value, zoneSelect.value, props.selectedZone.label);
      };
      zoneSelect.addEventListener("change", refreshObjectSelect);
      refreshObjectSelect();
      currentGetArgs = () => {
        const index = objectSelect.value.trim();
        return index ? [index, ...(zoneSelect.value ? [zoneSelect.value] : [])] : [];
      };
      container.append(
        createControlStack("Zone", zoneSelect),
        createControlStack("Main object index", objectSlot),
        preview,
      );
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
    hasArgs: () => currentGetArgs().length > 0,
    setArgs: (args) => {
      currentArgs = [...args];
      render();
    },
  };
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

function mainObjectOptionsForZone(zone: ShellZoneItem | undefined): LabeledOption[] {
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

function factionMatchPreview(mainObjectIndex: string, zoneName: string, selectedZoneName: string): string {
  const zoneLabel = zoneName || selectedZoneName;
  return mainObjectIndex
    ? `Copies faction from main object ${mainObjectIndex} in '${zoneLabel}'.`
    : "Requires a main-object index. Optional zone defaults to current zone.";
}

function createRulePreview(text: string): HTMLElement {
  return el("p", { className: "control-note rule-preview", text });
}

function createControlStack(label: string, control: HTMLElement): HTMLElement {
  return el("div", { className: "control-stack" }, [
    el("span", { className: "control-stack-label", text: label }),
    control,
  ]);
}
