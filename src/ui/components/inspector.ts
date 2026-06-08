import { el } from "../dom.js";
import { createConnectionPanel } from "./inspector/connectionPanel.js";
import { createMainObjectSettingsForm } from "./inspector/mainObjectPanel.js";
import { createContentPoolEditor } from "./inspector/poolPanel.js";
import { createRoadSettingsForm } from "./inspector/roadPanel.js";
import type { InspectorProps, InspectorTab } from "./inspector/types.js";
import { createRawFieldsPanel, createZoneContentPanel } from "./inspector/zonePanels.js";
import { createTabButton } from "./primitives.js";
import { createZoneEditForm } from "./zoneFormHelpers.js";

export type { InspectorProps, InspectorTab } from "./inspector/types.js";
export { createContentBrowserPanel } from "./inspector/poolPanel.js";
export { createGlobalSettingsForm } from "./inspector/globalSettingsPanel.js";

export function createInspector(props: InspectorProps): HTMLElement {
  return el("aside", { className: "inspector", attrs: { "aria-label": "Template inspector" } }, [
    el("div", { className: "inspector-header" }, [
      el("h2", { text: "Inspector" }),
      el("strong", { text: inspectorTitle(props) }),
    ]),
    el("div", { className: "inspector-tabs", attrs: { role: "tablist", "aria-label": "Inspector tabs" } }, [
      createTabButton("Zone", "zone", props.activeTab, props.onTabChange, { icon: "target", iconOnly: true }),
      createTabButton("Connection", "connection", props.activeTab, props.onTabChange, { icon: "cable", iconOnly: true }),
      createTabButton("Objects", "objects", props.activeTab, props.onTabChange, { icon: "category", iconOnly: true }),
      createTabButton("Content", "content", props.activeTab, props.onTabChange, { icon: "inventory_2", iconOnly: true }),
      createTabButton("Pools", "pools", props.activeTab, props.onTabChange, { icon: "database", iconOnly: true }),
      createTabButton("Roads", "roads", props.activeTab, props.onTabChange, { icon: "route", iconOnly: true }),
      createTabButton("Raw", "raw", props.activeTab, props.onTabChange, { icon: "data_object", iconOnly: true }),
      createTabButton("Validation", "validation", props.activeTab, props.onTabChange, { icon: "verified", iconOnly: true }),
    ]),
    createInspectorBody(props),
  ]);
}
function createInspectorBody(props: InspectorProps): HTMLElement {
  if (props.activeTab === "zone") {
    return createZoneEditForm({
      section: props.section,
      fields: props.fields,
      selectedZone: props.selectedZone,
      zones: props.zones,
      connections: props.connections,
      catalogOptions: props.catalogOptions,
      onApplyZoneChanges: props.onApplyZoneChanges,
      onRemoveSelectedZone: props.onRemoveSelectedZone,
    });
  }
  if (props.activeTab === "connection") {
    return createConnectionPanel(props);
  }
  if (props.activeTab === "pools") {
    return createContentPoolEditor(props);
  }
  if (props.activeTab === "objects") {
    return createMainObjectSettingsForm(props);
  }
  if (props.activeTab === "content") {
    return createZoneContentPanel(props);
  }
  if (props.activeTab === "roads") {
    return createRoadSettingsForm(props);
  }
  if (props.activeTab === "validation") {
    return createValidationPanel(props);
  }
  return createRawFieldsPanel(props.fields);
}

function createValidationPanel(props: InspectorProps): HTMLElement {
  if (props.validationErrors.length === 0) {
    return el("div", { className: "inspector-body" }, [
      el("p", { className: "conditional-note", text: "No player errors." }),
    ]);
  }
  return el("div", { className: "inspector-body" }, props.validationErrors.map((message) =>
    el("p", { className: "validation-error", text: message }),
  ));
}

function inspectorTitle(props: InspectorProps): string {
  if (props.activeTab === "pools") {
    return props.activeContentPoolName || "Content pools";
  }
  if (props.activeTab === "zone") {
    return props.selectedZone.label;
  }
  if (props.activeTab === "connection") {
    return props.selectedConnection?.label ?? "No connection";
  }
  if (props.activeTab === "validation") {
    return props.validationErrors.length === 0 ? "All clear" : `${props.validationErrors.length} error(s)`;
  }
  return props.selectedZone.label;
}
