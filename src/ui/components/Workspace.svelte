<script lang="ts">
  import { Tabs } from "bits-ui";
  import { editor, type WorkspaceTab } from "../state/editor.svelte.js";
  import GraphCanvas from "./canvas/GraphCanvas.svelte";
  import ZoneCanvas from "./canvas/ZoneCanvas.svelte";
  import PoolsPanel from "./inspector/PoolsPanel.svelte";

  let workspaceTab = $derived(editor.workspaceTab);

  function setWorkspaceTab(value: string) {
    editor.setWorkspaceTab(value as WorkspaceTab);
  }
</script>

<Tabs.Root class="workspace" value={workspaceTab} onValueChange={setWorkspaceTab} activationMode="manual">
  <Tabs.List class="workspace-tabs" aria-label="Workspace mode">
    <Tabs.Trigger class="tab-button" value="canvas">
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">globe</span>
      <span class="tab-label">Template graph</span>
    </Tabs.Trigger>
    <Tabs.Trigger class="tab-button" value="zoneEdit">
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">edit_square</span>
      <span class="tab-label">Zone edit</span>
    </Tabs.Trigger>
    <Tabs.Trigger class="tab-button" value="poolEdit">
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">database</span>
      <span class="tab-label">Pool edit</span>
    </Tabs.Trigger>
  </Tabs.List>

  {#if workspaceTab === "canvas"}
    <GraphCanvas />
  {:else if workspaceTab === "zoneEdit"}
    <ZoneCanvas />
  {:else}
    <section class="workspace-panel pool-workspace">
      <PoolsPanel />
    </section>
  {/if}
</Tabs.Root>

<style>
  :global(.workspace) {
    min-width: 0;
    min-height: 0;
    grid-column: 3;
    grid-row: 1;
    overflow: hidden;
    background: var(--color-panel);
    display: grid;
    grid-template-rows: 2rem minmax(0, 1fr);
  }
  :global(.workspace-panel) {
    min-height: 0;
    overflow: hidden;
    display: grid;
  }
  :global(.workspace-tabs) {
    min-height: 2rem;
  }
  :global(.workspace .tab-button) {
    min-height: 2rem;
    padding: 0 var(--space-3);
    font-size: 0.8125rem;
  }
  :global(.workspace .tab-button[data-state="active"]),
  :global(.workspace .tab-button.is-active) {
    border-bottom-width: var(--line-strong);
    background: var(--color-active);
    box-shadow: inset 0 calc(var(--line-strong) * -1) 0 var(--color-line-strong);
  }
  :global(.workspace .tab-icon) {
    font-size: 0.8125rem;
  }
  :global(.workspace .tab-label) {
    font-size: 0.8125rem;
  }
  .pool-workspace {
    block-size: 100%;
    min-block-size: 0;
    grid-template-rows: minmax(0, 1fr);
    overflow: hidden;
    background: var(--color-panel);
  }
</style>
