import type { EditorFieldMetadata } from "../../core/editor-schema/index.js";
import { BIOME_RULE_TYPES } from "../../core/rmg/enums.js";
import { el } from "../dom.js";
import type { ShellCatalogOptions, ShellConnectionItem, ShellSectionSummary, ShellZoneItem } from "../data/shellData.js";
import type { ZoneUpdateDraft } from "../state/editorSession.js";
import { createAccordionSection, createButton, createValueRow } from "./primitives.js";

export interface ZoneFormProps {
  section: ShellSectionSummary;
  fields: readonly EditorFieldMetadata[];
  selectedZone: ShellZoneItem;
  zones: readonly ShellZoneItem[];
  connections: readonly ShellConnectionItem[];
  catalogOptions: ShellCatalogOptions;
  onApplyZoneChanges: (draft: ZoneUpdateDraft) => void;
  onRemoveSelectedZone: () => void;
}

export function createZoneEditForm(props: ZoneFormProps): HTMLElement {
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

  const collectDraft = (): ZoneUpdateDraft => ({
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
  });

  const commit = () => props.onApplyZoneChanges(collectDraft());

  const simpleInputs = [nameInput, sizeInput, layoutInput, crossroadsInput, diplomacyInput,
    guardCutoffInput, guardMultiplierInput, guardRandomizationInput, guardWeeklyIncrementInput,
    guardReactionDistributionInput, guardedValueInput, guardedPerAreaInput,
    unguardedValueInput, unguardedPerAreaInput, resourcesValueInput, resourcesPerAreaInput,
    mandatoryInput, countLimitsInput];
  for (const input of simpleInputs) {
    input.addEventListener("change", () => commit());
  }
  for (const select of [zoneBiomeTypeInput, contentBiomeTypeInput, metaObjectsBiomeTypeInput]) {
    select.addEventListener("change", () => commit());
  }

  return el("div", { className: "inspector-body" }, [
    el("div", { className: "bar-actions" }, [
      createButton("Remove zone", { variant: "secondary", icon: "delete", onClick: props.onRemoveSelectedZone }),
    ]),
    el("div", { className: "edit-form" }, [
      createAccordionSection("Identity and layout", [
        createControlRow("Name", nameInput),
        createControlRow("Size", sizeInput),
        createControlRow("Layout", layoutInput),
        createControlRow("Crossroads pos", crossroadsInput),
        createControlRow("Diplomacy mod", diplomacyInput),
      ]),
      createAccordionSection("Biome rules", [
        createControlRow("Zone biome type", zoneBiomeTypeInput),
        createControlRow("Zone biome args", zoneBiomeArgsInput.element),
        createControlRow("Content biome type", contentBiomeTypeInput),
        createControlRow("Content biome args", contentBiomeArgsInput.element),
        createControlRow("Meta biome type", metaObjectsBiomeTypeInput),
        createControlRow("Meta biome args", metaObjectsBiomeArgsInput.element),
      ], false),
      createAccordionSection("Guard settings", [
        createControlRow("Guard cutoff", guardCutoffInput),
        createControlRow("Guard multiplier", guardMultiplierInput),
        createControlRow("Guard random", guardRandomizationInput),
        createControlRow("Guard weekly", guardWeeklyIncrementInput),
        createControlRow("Reaction weights", guardReactionDistributionInput),
        el("p", { className: "control-note", text: "Encounter guard reaction weights, one per line in order: Aggressive, Negative, Common, Friendly, Peaceful, Docile. The engine rolls weighted random; default is 1, 1, 1, 1, 1, 0." }),
      ]),
      createAccordionSection("Content budgets", [
        createControlRow("Guarded value", guardedValueInput),
        createControlRow("Guarded per area", guardedPerAreaInput),
        createControlRow("Unguarded value", unguardedValueInput),
        createControlRow("Unguarded per area", unguardedPerAreaInput),
        createControlRow("Resources value", resourcesValueInput),
        createControlRow("Resources per area", resourcesPerAreaInput),
      ], false),
      createAccordionSection("Pool and preset alternatives", [
        createControlRow("Guarded pools", guardedInput.element),
        createControlRow("Unguarded pools", unguardedInput.element),
        createControlRow("Resource pools", resourcesInput.element),
        createControlRow("Mandatory presets", mandatoryInput),
        createControlRow("Count limits", countLimitsInput),
      ], false),
    ]),
    el("div", { className: "bare-table" }, [
      createValueRow("Owner", props.selectedZone.owner),
      createValueRow("Role", props.selectedZone.role),
      createValueRow("Main objects", String(props.selectedZone.mainObjectCount)),
      createValueRow("Roads", String(props.selectedZone.roadCount)),
    ]),
  ]);
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
  props: ZoneFormProps,
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

function renderBiomeFromListControl(
  container: HTMLElement,
  args: readonly string[],
  props: ZoneFormProps,
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
  props: ZoneFormProps,
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
  for (const option of mergedOptions) {
    select.append(el("option", { text: option.label, attrs: { value: option.value } }));
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
