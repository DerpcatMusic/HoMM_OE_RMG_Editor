<script lang="ts">
  import { Tabs } from "bits-ui";
  import { editor, type InspectorTab } from "../state/editor.svelte.js";
  import ZoneForm from "./inspector/ZoneForm.svelte";
  import ConnectionForm from "./inspector/ConnectionForm.svelte";
  import ObjectsPanel from "./inspector/ObjectsPanel.svelte";
  import RoadsPanel from "./inspector/RoadsPanel.svelte";
  import RawPanel from "./inspector/RawPanel.svelte";
  import ValidationPanel from "./inspector/ValidationPanel.svelte";

  const TABS: Array<{ label: string; value: InspectorTab; icon: string }> = [
    { label: "Zone", value: "zone", icon: "target" },
    { label: "Connection", value: "connection", icon: "cable" },
    { label: "Objects", value: "objects", icon: "category" },
    { label: "Roads", value: "roads", icon: "route" },
    { label: "Pools", value: "pools", icon: "database" },
    { label: "Checks", value: "validation", icon: "verified" },
    { label: "JSON", value: "raw", icon: "data_object" },
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
    if (value === "pools") {
      editor.setWorkspaceTab("poolEdit");
    }
  }

  function openPoolWorkspace() {
    editor.setWorkspaceTab("poolEdit");
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
        <span class="tab-label">{tab.label}</span>
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
    {:else if editor.inspectorTab === "pools"}
      <section class="inspector-launcher">
        <button class="button button-secondary" onclick={openPoolWorkspace}>
          <span class="material-symbols-outlined tab-icon" aria-hidden="true">open_in_full</span>
          <span>Open pool editor</span>
        </button>
        <div class="launcher-grid">
          <div><strong>{editor.selectedZone.guardedPools.length}</strong><span>Guarded</span></div>
          <div><strong>{editor.selectedZone.unguardedPools.length}</strong><span>Unguarded</span></div>
          <div><strong>{editor.selectedZone.resourcesPools.length}</strong><span>Resources</span></div>
          <div><strong>{editor.selectedZone.mandatoryContent.length}</strong><span>Mandatory</span></div>
        </div>
      </section>
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
  .inspector-header h2 { font-size: var(--font-size-m); font-weight: 500; margin: 0; }
  .inspector-title {
    font-size: var(--font-size-m);
    font-weight: 400;
    color: var(--color-muted);
    font-family: var(--font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  :global(.inspector-tabs) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-bottom: var(--line-strong) solid var(--color-line-strong);
    overflow: hidden;
  }
  :global(.inspector .tab-button) {
    min-width: 0;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: 0 var(--space-1);
    border: 0;
    border-right: var(--line) solid var(--color-line);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    cursor: pointer;
    font: inherit;
  }
  :global(.inspector .tab-button:nth-child(2n)) { border-right: 0; }
  :global(.inspector .tab-button:hover) { background: var(--color-panel-2); color: var(--color-ink); }
  :global(.inspector .tab-button[data-state="active"]) {
    background: var(--color-active);
    color: var(--color-ink);
    box-shadow: inset 0 calc(var(--line-strong) * -1) 0 var(--color-line-strong);
  }
  :global(.inspector .tab-icon) { font-size: var(--font-size-m); }
  :global(.inspector .tab-label) {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--font-size-xs);
  }
  .inspector-body {
    align-content: start;
    min-height: 0;
    overflow: auto;
    padding: var(--space-3);
  }
  .inspector-launcher {
    display: grid;
    gap: var(--space-2);
  }
  .inspector-launcher .button {
    min-height: 2rem;
    justify-content: center;
  }
  .launcher-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: var(--line) solid var(--color-line);
  }
  .launcher-grid div {
    display: grid;
    gap: var(--line);
    padding: var(--space-2);
    border-right: var(--line) solid var(--color-line);
    border-bottom: var(--line) solid var(--color-line);
  }
  .launcher-grid div:nth-child(2n) { border-right: 0; }
  .launcher-grid div:nth-last-child(-n + 2) { border-bottom: 0; }
  .launcher-grid strong {
    font-family: var(--font-mono);
    font-size: var(--font-size-l);
  }
  .launcher-grid span {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
  }
  .material-symbols-outlined {
    font-family: var(--font-icon);
    font-weight: 400;
    font-size: var(--font-size-xl);
    line-height: 1;
  }
</style>
