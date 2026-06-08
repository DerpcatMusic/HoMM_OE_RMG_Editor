import { CONNECTION_TYPES, GUARD_REACTIONS, GATE_PLACEMENTS } from "../../../core/rmg/enums.js";
import { el } from "../../dom.js";
import type { ConnectionUpdateDraft } from "../../state/editorSession.js";
import {
  createCheckbox,
  createControlRow,
  createInstantField,
  createNumberInput,
  createOptionalNumberInput,
  createSelect,
  createTextInput,
  optionalNumber,
} from "./controls.js";
import type { InspectorProps } from "./types.js";

export function createConnectionPanel(props: InspectorProps): HTMLElement {
  const conn = props.selectedConnection;
  if (!conn) {
    return el("div", { className: "inspector-body" }, [
      el("p", { className: "conditional-note", text: "No connection selected. Click a connection on the canvas." }),
    ]);
  }

  const nameInput = createTextInput(conn.label);
  const fromInput = createTextInput(conn.from);
  const toInput = createTextInput(conn.to);
  const typeInput = createSelect(conn.type, [...CONNECTION_TYPES]);
  const lengthInput = createOptionalNumberInput(conn.length);
  const portalFromInput = createCheckbox(conn.portalFromEnabled ?? true);
  const portalToInput = createCheckbox(conn.portalToEnabled ?? true);
  const guardZoneInput = createSelect(conn.guardZone ?? "", ["", ...props.zones.map((z) => z.label)]);
  const guardValueInput = createOptionalNumberInput(conn.guardValue);
  const guardWeeklyInput = createOptionalNumberInput(conn.guardWeeklyIncrement);
  const guardReactionInput = createSelect(conn.guardReaction ?? "Common", [...GUARD_REACTIONS]);
  const guardEscapeInput = createCheckbox(conn.guardEscape ?? true);
  const gatePlacementInput = createSelect(conn.gatePlacement ?? "Random", [...GATE_PLACEMENTS]);
  const guardRandomizationInput = createOptionalNumberInput(conn.guardRandomization);

  const collectDraft = (): ConnectionUpdateDraft => ({
    originalName: conn.id,
    name: nameInput.value,
    from: fromInput.value,
    to: toInput.value,
    connectionType: typeInput.value,
    length: optionalNumber(lengthInput),
    portalFromEnabled: portalFromInput.checked,
    portalToEnabled: portalToInput.checked,
    guardZone: guardZoneInput.value,
    guardValue: optionalNumber(guardValueInput),
    guardWeeklyIncrement: optionalNumber(guardWeeklyInput),
    guardReaction: guardReactionInput.value,
    guardEscape: guardEscapeInput.checked,
    gatePlacement: gatePlacementInput.value,
    road: conn.road ?? false,
    simTurnSquad: conn.simTurnSquad ?? false,
    guardRandomization: optionalNumber(guardRandomizationInput),
  });

  const commit = () => props.onApplyConnectionSettings(collectDraft());

  for (const input of [nameInput, fromInput, toInput, typeInput, lengthInput, portalFromInput, portalToInput, guardZoneInput, guardValueInput, guardWeeklyInput, guardReactionInput, guardEscapeInput, gatePlacementInput, guardRandomizationInput]) {
    input.addEventListener("change", commit);
  }

  const num = (input: HTMLInputElement) => String(optionalNumber(input) ?? "");

  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Identity" }),
    createInstantField("Name", nameInput, { initialValue: conn.label, onCommit: () => commit(), onReset: () => { nameInput.value = conn.label; commit(); } }),
    createInstantField("From", fromInput, { initialValue: conn.from, onCommit: () => commit(), onReset: () => { fromInput.value = conn.from; commit(); } }),
    createInstantField("To", toInput, { initialValue: conn.to, onCommit: () => commit(), onReset: () => { toInput.value = conn.to; commit(); } }),
    el("h3", { text: "Type and layout" }),
    createInstantField("Type", typeInput, { initialValue: conn.type, onCommit: () => commit(), onReset: () => { typeInput.value = conn.type; commit(); } }),
    createInstantField("Length", lengthInput, { initialValue: num(lengthInput), onCommit: () => commit(), onReset: () => { lengthInput.value = num(lengthInput); commit(); } }),
    el("h3", { text: "Portals" }),
    createInstantField("Portal from", portalFromInput, { initialValue: String(conn.portalFromEnabled ?? true), onCommit: () => commit(), onReset: () => { portalFromInput.checked = conn.portalFromEnabled ?? true; commit(); } }),
    createInstantField("Portal to", portalToInput, { initialValue: String(conn.portalToEnabled ?? true), onCommit: () => commit(), onReset: () => { portalToInput.checked = conn.portalToEnabled ?? true; commit(); } }),
    el("h3", { text: "Guards" }),
    createInstantField("Guard zone", guardZoneInput, { initialValue: conn.guardZone ?? "", onCommit: () => commit(), onReset: () => { guardZoneInput.value = conn.guardZone ?? ""; commit(); } }),
    createInstantField("Guard value", guardValueInput, { initialValue: num(guardValueInput), onCommit: () => commit(), onReset: () => { guardValueInput.value = num(guardValueInput); commit(); } }),
    createInstantField("Guard weekly", guardWeeklyInput, { initialValue: num(guardWeeklyInput), onCommit: () => commit(), onReset: () => { guardWeeklyInput.value = num(guardWeeklyInput); commit(); } }),
    createInstantField("Reaction", guardReactionInput, { initialValue: conn.guardReaction ?? "Common", onCommit: () => commit(), onReset: () => { guardReactionInput.value = conn.guardReaction ?? "Common"; commit(); } }),
    createInstantField("Guard escape", guardEscapeInput, { initialValue: String(conn.guardEscape ?? true), onCommit: () => commit(), onReset: () => { guardEscapeInput.checked = conn.guardEscape ?? true; commit(); } }),
    createInstantField("Guard random", guardRandomizationInput, { initialValue: num(guardRandomizationInput), onCommit: () => commit(), onReset: () => { guardRandomizationInput.value = num(guardRandomizationInput); commit(); } }),
    el("h3", { text: "Gate" }),
    createInstantField("Placement", gatePlacementInput, { initialValue: conn.gatePlacement ?? "Random", onCommit: () => commit(), onReset: () => { gatePlacementInput.value = conn.gatePlacement ?? "Random"; commit(); } }),
  ]);
}
