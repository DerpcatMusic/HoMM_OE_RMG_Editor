import { CONNECTION_TYPES, GATE_PLACEMENTS, GUARD_REACTIONS } from "../../../core/rmg/enums.js";
import { el } from "../../dom.js";
import type { ConnectionUpdateDraft } from "../../state/editorSession.js";
import { createAccordionSection } from "../primitives.js";
import {
  createBoundInstantField,
  createCheckbox,
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
  const gladiatorEnabled = props.template.gameRules?.winConditions?.gladiatorArena === true;
  const connectionTypes = CONNECTION_TYPES.filter((type) => type !== "GladiatorArena" || gladiatorEnabled || conn.type === "GladiatorArena");
  const typeInput = createSelect(conn.type, connectionTypes);
  const lengthInput = createOptionalNumberInput(conn.length);
  const portalFromInput = createCheckbox(conn.portalFromEnabled ?? true);
  const portalToInput = createCheckbox(conn.portalToEnabled ?? true);
  const guardZoneInput = createSelect(conn.guardZone ?? "", ["", ...props.zones.map((z) => z.label)]);
  const guardValueInput = createOptionalNumberInput(conn.guardValue);
  const guardWeeklyInput = createOptionalNumberInput(conn.guardWeeklyIncrement);
  const guardReactionInput = createSelect(conn.guardReaction ?? "Common", [...GUARD_REACTIONS]);
  const guardEscapeInput = createCheckbox(conn.guardEscape ?? true);
  const guardRandomizationInput = createOptionalNumberInput(conn.guardRandomization);
  const gatePlacementInput = createSelect(conn.gatePlacement ?? "Random", [...GATE_PLACEMENTS]);

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

  const num = (input: HTMLInputElement) => String(optionalNumber(input) ?? "");
  const bool = (input: HTMLInputElement) => String(input.checked);
  const field = (label: string, input: HTMLInputElement | HTMLSelectElement, initialValue: string) =>
    createBoundInstantField(label, input, initialValue, commit);

  return el("div", { className: "inspector-body" }, [
    createAccordionSection("Identity", [
      field("Name", nameInput, conn.label),
      field("From", fromInput, conn.from),
      field("To", toInput, conn.to),
      ...(!gladiatorEnabled && conn.type !== "GladiatorArena" ? [
        el("p", { className: "conditional-note", text: "GladiatorArena connections are available when Win conditions > Gladiator arena is enabled." }),
      ] : []),
    ]),
    createAccordionSection("Type and layout", [
      field("Type", typeInput, conn.type),
      field("Length", lengthInput, num(lengthInput)),
    ]),
    createAccordionSection("Portals", [
      field("Portal from", portalFromInput, bool(portalFromInput)),
      field("Portal to", portalToInput, bool(portalToInput)),
    ], conn.type === "Portal"),
    createAccordionSection("Guards", [
      field("Guard zone", guardZoneInput, conn.guardZone ?? ""),
      field("Guard value", guardValueInput, num(guardValueInput)),
      field("Guard weekly", guardWeeklyInput, num(guardWeeklyInput)),
      field("Reaction", guardReactionInput, conn.guardReaction ?? "Common"),
      el("p", { className: "control-note", text: "Connection guard reaction is fixed for this connection guard. Zone reaction weights only affect encounter guards inside zones." }),
      field("Guard escape", guardEscapeInput, bool(guardEscapeInput)),
      field("Guard random", guardRandomizationInput, num(guardRandomizationInput)),
    ]),
    createAccordionSection("Gate", [
      field("Placement", gatePlacementInput, conn.gatePlacement ?? "Random"),
    ], false),
  ]);
}
