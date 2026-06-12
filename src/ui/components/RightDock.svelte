<script lang="ts">
  import { Tabs } from "bits-ui";
  import { editor, type RightDockTab } from "../state/editor.svelte.js";
  import Inspector from "./Inspector.svelte";
  import ContentBrowser from "./ContentBrowser.svelte";

  function setRightDockTab(value: string) {
    editor.rightDockTab = value as RightDockTab;
  }
</script>
<Tabs.Root
  class="right-dock"
  value={editor.rightDockTab}
  onValueChange={setRightDockTab}
  orientation="vertical"
  activationMode="manual"
  aria-label="Right tools"
>
  <div class="right-dock-panel">
    {#if editor.rightDockTab === "browser"}
      <ContentBrowser />
    {:else}
      <Inspector />
    {/if}
  </div>
  <Tabs.List class="right-dock-rail" aria-label="Right tool panels">
    <Tabs.Trigger
      class="right-dock-tab"
      value="inspector"
      title="Inspector"
    >
      <span class="material-symbols-outlined">tune</span>
      <span class="right-dock-tab-label">Inspector</span>
    </Tabs.Trigger>
    <Tabs.Trigger
      class="right-dock-tab"
      value="browser"
      title="Browser"
    >
      <span class="material-symbols-outlined">manage_search</span>
      <span class="right-dock-tab-label">Browser</span>
    </Tabs.Trigger>
  </Tabs.List>
</Tabs.Root>

<style>
  :global(.right-dock) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) var(--rail-width);
    border-left: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel);
    min-width: 0;
    min-height: 0;
    grid-column: 5;
    grid-row: 1;
    overflow: hidden;
  }
  :global(.right-dock-rail) {
    min-height: 0;
    display: grid;
    align-content: start;
    border-left: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel-2);
  }
  :global(.right-dock-tab) {
    min-width: 0;
    min-height: 3.5rem;
    display: grid;
    place-items: center;
    gap: 2px;
    padding: var(--space-1) 0;
    border: 0;
    border-bottom: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    color: var(--color-ink);
    cursor: pointer;
  }
  :global(.right-dock-tab:hover) { background: var(--color-panel-2); }
  :global(.right-dock-tab[data-state="active"]) {
    background: var(--color-active);
    box-shadow: inset calc(var(--line-strong) * -1) 0 0 var(--color-line-strong);
  }
  :global(.right-dock-tab-label) {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: var(--font-size-sm);
    letter-spacing: 0.04em;
  }
  .right-dock-panel {
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
  }
  .material-symbols-outlined {
    font-family: var(--font-icon);
    font-weight: 400;
    font-size: var(--font-size-xl);
    line-height: 1;
  }
</style>
