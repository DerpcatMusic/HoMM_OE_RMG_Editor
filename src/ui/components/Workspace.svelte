<script lang="ts">
  import { Tabs } from "bits-ui";
  import { editor, type WorkspaceTab } from "../state/editor.svelte.js";
  import GraphCanvas from "./canvas/GraphCanvas.svelte";
  import ZoneCanvas from "./canvas/ZoneCanvas.svelte";

  let workspaceTab = $derived(editor.workspaceTab);

  function setWorkspaceTab(value: string) {
    editor.setWorkspaceTab(value as WorkspaceTab);
  }
</script>

<Tabs.Root class="workspace" value={workspaceTab} onValueChange={setWorkspaceTab} activationMode="manual">
  <Tabs.List class="workspace-tabs" aria-label="Workspace mode">
    <Tabs.Trigger class="tab-button" value="canvas">
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">globe</span>
      <span class="tab-label">Canvas</span>
    </Tabs.Trigger>
    <Tabs.Trigger class="tab-button" value="zoneEdit">
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">edit_square</span>
      <span class="tab-label">Zone edit</span>
    </Tabs.Trigger>
  </Tabs.List>

  {#if workspaceTab === "canvas"}
    <GraphCanvas />
  {:else}
    <ZoneCanvas />
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
    grid-template-rows: auto minmax(0, 1fr);
  }
  :global(.workspace-panel) {
    min-height: 0;
    overflow: hidden;
    display: grid;
  }
</style>
