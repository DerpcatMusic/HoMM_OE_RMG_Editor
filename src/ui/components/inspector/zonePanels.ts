import type { EditorFieldMetadata } from "../../../core/editor-schema/index.js";
import { el } from "../../dom.js";
import { createValueRow } from "../primitives.js";
import type { InspectorProps } from "./types.js";

export function createZonePropertiesPanel(props: InspectorProps): HTMLElement {
  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Zone" }),
    createValueRow("Name", props.selectedZone.label),
    createValueRow("Owner", props.selectedZone.owner),
    createValueRow("Role", props.selectedZone.role),
    createValueRow("Size", String(props.selectedZone.size)),
    createValueRow("Layout", props.selectedZone.layout || "none"),
    createValueRow("Zone biome", formatRule(props.selectedZone.zoneBiome)),
    createValueRow("Content biome", formatRule(props.selectedZone.contentBiome)),
    createValueRow("Meta biome", formatRule(props.selectedZone.metaObjectsBiome)),
    createValueRow("Crossroads", formatOptionalNumber(props.selectedZone.crossroadsPosition)),
    createValueRow("Diplomacy", formatOptionalNumber(props.selectedZone.diplomacyModifier)),
    createValueRow("Guard cutoff", formatOptionalNumber(props.selectedZone.guardCutoffValue)),
    createValueRow("Guard mult", formatOptionalNumber(props.selectedZone.guardMultiplier)),
    createValueRow("Guard random", formatOptionalNumber(props.selectedZone.guardRandomization)),
    createValueRow("Guard weekly", formatOptionalNumber(props.selectedZone.guardWeeklyIncrement)),
    createValueRow("Reaction weights", props.selectedZone.guardReactionDistribution.join(", ") || "none"),
    createValueRow("Main objects", String(props.selectedZone.mainObjectCount)),
  ]);
}

export function createZoneContentPanel(props: InspectorProps): HTMLElement {
  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Pools" }),
    createValueRow("Guarded", props.selectedZone.guardedPools.join(", ")),
    createValueRow("Unguarded", props.selectedZone.unguardedPools.join(", ")),
    createValueRow("Resources", props.selectedZone.resourcesPools.join(", ")),
    createValueRow("Guarded value", formatOptionalNumber(props.selectedZone.guardedContentValue)),
    createValueRow("Guarded per area", formatOptionalNumber(props.selectedZone.guardedContentValuePerArea)),
    createValueRow("Unguarded value", formatOptionalNumber(props.selectedZone.unguardedContentValue)),
    createValueRow("Unguarded per area", formatOptionalNumber(props.selectedZone.unguardedContentValuePerArea)),
    createValueRow("Resources value", formatOptionalNumber(props.selectedZone.resourcesValue)),
    createValueRow("Resources per area", formatOptionalNumber(props.selectedZone.resourcesValuePerArea)),
    createValueRow("Mandatory", props.selectedZone.mandatoryContent.join(", ") || "none"),
    createValueRow("Count limits", props.selectedZone.contentCountLimits.join(", ") || "none"),
  ]);
}

export function createRawFieldsPanel(fields: readonly EditorFieldMetadata[]): HTMLElement {
  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Schema fields" }),
    ...fields.slice(0, 12).map(createFieldRow),
  ]);
}

function formatRule(rule: { type: string; args: readonly string[] }): string {
  if (!rule.type) {
    return "none";
  }
  return rule.args.length > 0 ? `${rule.type}: ${rule.args.join(", ")}` : rule.type;
}

function formatOptionalNumber(value: number | undefined): string {
  return value === undefined ? "none" : String(value);
}

function createFieldRow(field: EditorFieldMetadata): HTMLElement {
  return el("button", { className: "raw-field-row", attrs: { type: "button" } }, [
    el("span", { text: field.label }),
    el("code", { text: field.id }),
  ]);
}
