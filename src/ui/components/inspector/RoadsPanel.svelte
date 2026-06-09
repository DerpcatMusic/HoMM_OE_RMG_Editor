<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  let zone = $derived(editor.selectedZone);
  let roads = $derived(zone.zoneRoads ?? []);
</script>

<div class="roads-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its roads.</p>
  {:else}
    <div class="panel-header">
      <span class="count">{roads.length} road(s)</span>
      <button class="add-btn" onclick={() => editor.addRoad()}>+ Add road</button>
    </div>
    {#if roads.length === 0}
      <p class="placeholder">No roads defined for this zone.</p>
    {:else}
      <ul class="road-list">
        {#each roads as road (road.id)}
          <li class="road-item">
            <span class="road-type">{road.type}</span>
            <span class="road-from">{road.fromType}</span>
            <span class="road-arrow">→</span>
            <span class="road-to">{road.toType}</span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .roads-panel { display: grid; gap: var(--space-2); }
  .placeholder { color: var(--color-muted); font-size: 0.75rem; }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.6875rem;
  }
  .count { color: var(--color-muted); font-family: var(--font-mono); font-size: 0.625rem; }
  .add-btn {
    height: 1.5rem;
    padding: 0 var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
    cursor: pointer;
  }
  .add-btn:hover { background: var(--color-panel-2); }
  .road-list { list-style: none; margin: 0; padding: 0; }
  .road-item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) 0;
    border-bottom: var(--line) solid var(--color-line);
    font-size: 0.6875rem;
  }
  .road-type { font-weight: 500; min-width: 3rem; }
  .road-from, .road-to { font-family: var(--font-mono); font-size: 0.625rem; }
  .road-arrow { color: var(--color-muted); }
</style>
