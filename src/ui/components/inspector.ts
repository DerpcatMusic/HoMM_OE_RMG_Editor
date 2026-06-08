import { el } from "../dom.js";
import { createMainObjectSettingsForm } from "./inspector/mainObjectPanel.js";
import { createContentPoolEditor } from "./inspector/poolPanel.js";
import { createRoadSettingsForm } from "./inspector/roadPanel.js";
import type { InspectorProps, InspectorTab } from "./inspector/types.js";
import { createRawFieldsPanel, createZoneContentPanel } from "./inspector/zonePanels.js";
import { createTabButton } from "./primitives.js";

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
      createTabButton("Objects", "objects", props.activeTab, props.onTabChange, { icon: "category", iconOnly: true }),
      createTabButton("Content", "content", props.activeTab, props.onTabChange, { icon: "inventory_2", iconOnly: true }),
      createTabButton("Pools", "pools", props.activeTab, props.onTabChange, { icon: "database", iconOnly: true }),
      createTabButton("Roads", "roads", props.activeTab, props.onTabChange, { icon: "route", iconOnly: true }),
      createTabButton("Raw", "raw", props.activeTab, props.onTabChange, { icon: "data_object", iconOnly: true }),
    ]),
    createInspectorBody(props),
  ]);
}

function createInspectorBody(props: InspectorProps): HTMLElement {
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
  return createRawFieldsPanel(props.fields);
}

function inspectorTitle(props: InspectorProps): string {
  if (props.activeTab === "pools") {
    return props.activeContentPoolName || "Content pools";
  }
  return props.selectedZone.label;
}
