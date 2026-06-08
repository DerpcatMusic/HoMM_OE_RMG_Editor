import type { ContentWeight } from "../../../core/rmg/rmgTypes.js";
import type { ConditionalFieldState } from "../../conditionals/connectionConditionals.js";
import { el } from "../../dom.js";

export interface LabeledOption {
  value: string;
  label: string;
}

export function createControlRow(label: string, control: HTMLElement): HTMLElement {
  return el("label", { className: "control-row" }, [
    el("span", { text: label }),
    control,
  ]);
}
export function createInstantField(
  label: string,
  input: HTMLElement,
  opts: { initialValue: string; onCommit: (value: string) => void; onReset: () => void },
): HTMLElement {
  const resetBtn = el("button", {
    className: "field-reset",
    attrs: { type: "button", title: "Reset", "aria-label": `Reset ${label}`, style: "display:none" },
  }, [el("span", { className: "material-symbols-outlined", text: "undo", attrs: { "aria-hidden": "true" } })]);

  const getValue = () => {
    if (input instanceof HTMLInputElement && input.type === "checkbox") return String(input.checked);
    if (input instanceof HTMLSelectElement || input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) return input.value;
    return "";
  };

  const checkDirty = () => {
    const dirty = getValue() !== opts.initialValue;
    resetBtn.style.display = dirty ? "" : "none";
    row.classList.toggle("is-dirty", dirty);
  };

  const commit = () => opts.onCommit(getValue());

  const row = el("label", { className: "control-row" }, [
    el("span", { text: label }),
    input,
    resetBtn,
  ]);

  input.addEventListener("change", () => { commit(); checkDirty(); });
  input.addEventListener("input", checkDirty);
  resetBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    opts.onReset();
  });

  return row;
}

type BoundControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export function createBoundInstantField(
  label: string,
  input: BoundControl,
  initialValue: string,
  onCommit: () => void,
  options: { afterReset?: () => void } = {},
): HTMLElement {
  return createInstantField(label, input, {
    initialValue,
    onCommit: () => onCommit(),
    onReset: () => {
      setControlValue(input, initialValue);
      options.afterReset?.();
      onCommit();
    },
  });
}

function setControlValue(input: BoundControl, value: string): void {
  if (input instanceof HTMLInputElement && input.type === "checkbox") {
    input.checked = value === "true";
    return;
  }
  input.value = value;
}

export function createSelect(value: string, options: readonly string[]): HTMLSelectElement {
  const select = el("select", { className: "text-input" });
  for (const optionValue of options) {
    select.append(el("option", { text: optionValue, attrs: { value: optionValue } }));
  }
  select.value = value;
  return select;
}

export function createSelectWithLabels(value: string, options: readonly LabeledOption[]): HTMLSelectElement {
  const select = el("select", { className: "text-input" });
  const hasValue = value.trim().length > 0;
  if (!hasValue) {
    select.append(el("option", { text: "", attrs: { value: "" } }));
  }
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

export function createKnownSelect(value: string, options: readonly string[]): HTMLSelectElement {
  if (value && !options.includes(value)) {
    return createSelect(value, [value, ...options]);
  }
  return createSelect(value, options);
}

export function createOptionalSelect(value: string, options: readonly string[]): HTMLSelectElement {
  const select = createSelect(value, ["", ...options]);
  select.value = value;
  return select;
}

export function createTextInput(value: string): HTMLInputElement {
  return el("input", { className: "text-input", attrs: { type: "text", value } });
}

export function createTextarea(value: string): HTMLTextAreaElement {
  return el("textarea", { className: "text-input multi-input", text: value });
}

export function createNumberInput(value: number): HTMLInputElement {
  return el("input", { className: "text-input", attrs: { type: "number", step: "1", value } });
}

export function createOptionalNumberInput(value: number | undefined): HTMLInputElement {
  return el("input", {
    className: "text-input",
    attrs: { type: "number", step: "1", value: value === undefined ? "" : String(value) },
  });
}

export function createCheckbox(checked: boolean): HTMLInputElement {
  const checkbox = el("input", { className: "check-input", attrs: { type: "checkbox" } });
  checkbox.checked = checked;
  return checkbox;
}

export function optionalNumber(input: HTMLInputElement): number | undefined {
  return input.value.trim().length === 0 ? undefined : Number(input.value);
}

export function parseStringList(value: string): string[] {
  return value
    .split(/\r?\n|,/u)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createMultiSelect(
  selectedValues: readonly string[],
  options: readonly { id: string; label: string }[],
): HTMLSelectElement {
  const selected = new Set(selectedValues);
  const select = el("select", { className: "text-input multi-input", attrs: { multiple: true, size: String(Math.min(7, Math.max(3, options.length))) } });
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

export function safeParseContentWeights(value: string): ContentWeight[] {
  try {
    return parseContentWeights(value);
  } catch {
    return [];
  }
}

export function parseContentWeights(value: string): ContentWeight[] {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }
  const parsed = JSON.parse(trimmed) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Content JSON must be an array.");
  }
  return parsed.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`Content row ${index + 1} must be an object.`);
    }
    if (item.sid !== undefined && typeof item.sid !== "string") {
      throw new Error(`Content row ${index + 1} sid must be a string.`);
    }
    if (item.variant !== undefined && typeof item.variant !== "number") {
      throw new Error(`Content row ${index + 1} variant must be a number.`);
    }
    if (item.biome !== undefined && typeof item.biome !== "string") {
      throw new Error(`Content row ${index + 1} biome must be a string.`);
    }
    if (item.weight !== undefined && typeof item.weight !== "number") {
      throw new Error(`Content row ${index + 1} weight must be a number.`);
    }
    return item as ContentWeight;
  });
}

export function applyConditionalState(container: HTMLElement, controls: readonly HTMLElement[], state: ConditionalFieldState): void {
  container.hidden = !state.visible;
  container.dataset.conditionalState = state.state;
  container.title = state.reason;
  for (const control of controls) {
    if (isDisableableControl(control)) {
      control.disabled = !state.enabled;
    }
  }
}

export function mergeSectionState(...states: readonly ConditionalFieldState[]): ConditionalFieldState {
  const visibleStates = states.filter((state) => state.visible);
  if (visibleStates.length === 0) {
    return {
      state: "inactivePreserved",
      visible: false,
      enabled: false,
      required: false,
      reason: states.map((state) => state.reason).join(" "),
    };
  }
  const hasActive = visibleStates.some((state) => state.state === "active");
  return {
    state: hasActive ? "active" : visibleStates[0]?.state ?? "inactivePreserved",
    visible: true,
    enabled: visibleStates.some((state) => state.enabled),
    required: visibleStates.some((state) => state.required),
    reason: visibleStates.map((state) => state.reason).join(" "),
  };
}

function isDisableableControl(element: HTMLElement): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement {
  return element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement || element instanceof HTMLButtonElement;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
