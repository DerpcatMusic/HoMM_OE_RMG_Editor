<script lang="ts">
  import { editor } from "../state/editor.svelte.js";
  import Inspector from "./Inspector.svelte";
  import ContentBrowser from "./ContentBrowser.svelte";
</script>
<aside class="right-dock" aria-label="Right tools">
  <div class="right-dock-panel">
    {#if editor.rightDockTab === "browser"}
      <ContentBrowser />
    {:else}
      <Inspector />
    {/if}
  </div>
  <div class="right-dock-rail" role="tablist" aria-orientation="vertical" aria-label="Right tool panels">
    <button
      class="right-dock-tab"
      class:is-active={editor.rightDockTab === "inspector"}
      role="tab"
      aria-selected={editor.rightDockTab === "inspector"}
      title="Inspector"
      onclick={() => editor.rightDockTab = "inspector"}
    >
      <span class="material-symbols-outlined">tune</span>
      <span class="right-dock-tab-label">Inspector</span>
    </button>
    <button
      class="right-dock-tab"
      class:is-active={editor.rightDockTab === "browser"}
      role="tab"
      aria-selected={editor.rightDockTab === "browser"}
      title="Browser"
      onclick={() => editor.rightDockTab = "browser"}
    >
      <span class="material-symbols-outlined">manage_search</span>
      <span class="right-dock-tab-label">Browser</span>
    </button>
  </div>
</aside>

<style>
  .right-dock {
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
  .right-dock-rail {
    min-height: 0;
    display: grid;
    align-content: start;
    border-left: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel-2);
  }
  .right-dock-tab {
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
  .right-dock-tab:hover { background: var(--color-panel-2); }
  .right-dock-tab.is-active {
    background: var(--color-active);
    box-shadow: inset calc(var(--line-strong) * -1) 0 0 var(--color-line-strong);
  }
  .right-dock-tab-label {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 0.6875rem;
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
    font-size: 1.25rem;
    line-height: 1;
  }
</style>
