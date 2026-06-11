<script lang="ts">
  import { Tabs } from "bits-ui";
  import { editor, type InspectorTab } from "../state/editor.svelte.js";
  import ZoneForm from "./inspector/ZoneForm.svelte";
  import ConnectionForm from "./inspector/ConnectionForm.svelte";
  import ObjectsPanel from "./inspector/ObjectsPanel.svelte";
  import ContentPanel from "./inspector/ContentPanel.svelte";
  import PoolsPanel from "./inspector/PoolsPanel.svelte";
  import RoadsPanel from "./inspector/RoadsPanel.svelte";
  import RawPanel from "./inspector/RawPanel.svelte";
  import ValidationPanel from "./inspector/ValidationPanel.svelte";

  const TABS: Array<{ label: string; value: InspectorTab; icon: string }> = [
    { label: "Zone", value: "zone", icon: "target" },
    { label: "Connection", value: "connection", icon: "cable" },
    { label: "Objects", value: "objects", icon: "category" },
    { label: "Content", value: "content", icon: "inventory_2" },
    { label: "Pools", value: "pools", icon: "database" },
    { label: "Roads", value: "roads", icon: "route" },
    { label: "Raw", value: "raw", icon: "data_object" },
    { label: "Validation", value: "validation", icon: "verified" },
  ];

  let title = $derived.by(() => {
    switch (editor.inspectorTab) {
      case "zone": return editor.selectedZone.label;
      case "connection": return editor.selectedConnection?.label ?? "No connection";
      case "pools": return editor.activeContentPoolName || "Content pools";
      case "validation": return editor.validationErrors.length === 0 ? "All clear" : `${editor.validationErrors.length} error(s)`;
      default: return editor.selectedZone.label;
    }
  });

  function setInspectorTab(value: string) {
    editor.inspectorTab = value as InspectorTab;
  }
</script>

<Tabs.Root class="inspector" value={editor.inspectorTab} onValueChange={setInspectorTab} activationMode="manual">
  <div class="inspector-header">
    <h2>Inspector</h2>
    <strong class="inspector-title">{title}</strong>
  </div>
  <Tabs.List class="inspector-tabs" aria-label="Inspector tabs">
    {#each TABS as tab (tab.value)}
      <Tabs.Trigger
        class="tab-button"
        value={tab.value}
        title={tab.label}
        aria-label={tab.label}
      >
        <span class="material-symbols-outlined tab-icon" aria-hidden="true">{tab.icon}</span>
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
  <div class="inspector-body">
    {#if editor.inspectorTab === "zone"}
      <ZoneForm />
    {:else if editor.inspectorTab === "connection"}
      <ConnectionForm />
    {:else if editor.inspectorTab === "objects"}
      <ObjectsPanel />
    {:else if editor.inspectorTab === "content"}
      <ContentPanel />
    {:else if editor.inspectorTab === "pools"}
      <PoolsPanel />
    {:else if editor.inspectorTab === "roads"}
      <RoadsPanel />
    {:else if editor.inspectorTab === "raw"}
      <RawPanel />
    {:else if editor.inspectorTab === "validation"}
      <ValidationPanel />
    {/if}
  </div>
</Tabs.Root>

<style>
  :global(.inspector) {
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    overflow: hidden;
    background: var(--color-panel);
  }
  .inspector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-1) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
  }
  .inspector-header h2 { font-size: 0.8125rem; font-weight: 500; margin: 0; }
  .inspector-title {
    font-size: 0.8125rem;
    font-weight: 400;
    color: var(--color-muted);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.inspector-tabs) {
    display: flex;
    border-bottom: var(--line-strong) solid var(--color-line-strong);
    overflow-x: auto;
    scrollbar-width: none;
  }
  :global(.inspector-tabs::-webkit-scrollbar) { display: none; }
  :global(.inspector .tab-button) {
    min-width: 2.25rem;
    height: 2rem;
    display: grid;
    place-items: center;
    border: 0;
    border-right: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    cursor: pointer;
  }
  :global(.inspector .tab-button:hover) { background: var(--color-panel-2); color: var(--color-ink); }
  :global(.inspector .tab-button[data-state="active"]) {
    background: var(--color-active);
    color: var(--color-ink);
    box-shadow: inset 0 calc(var(--line-strong) * -1) 0 var(--color-line-strong);
  }
  :global(.inspector .tab-icon) { font-size: 1rem; }
  .inspector-body {
    align-content: start;
    min-height: 0;
    overflow: auto;
    padding: var(--space-3);
  }
  .material-symbols-outlined {
    font-family: var(--font-icon);
    font-weight: 400;
    font-size: 1.25rem;
    line-height: 1;
  }
</style>
