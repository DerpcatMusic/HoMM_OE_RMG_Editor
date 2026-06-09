<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";

  let zone = $derived(editor.selectedZone);
  let objects = $derived(zone.zoneObjects ?? []);
</script>

<div class="objects-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its objects.</p>
  {:else}
    <div class="panel-header">
      <span class="count">{objects.length} object(s)</span>
      <button class="add-btn" onclick={() => editor.addMainObject()}>+ Add object</button>
    </div>
    {#if objects.length === 0}
      <p class="placeholder">No main objects. Double-click the zone on the canvas or click + Add.</p>
    {:else}
      <ul class="object-list">
        {#each objects as obj (obj.id)}
          <li class="object-item">
            <span class="obj-type">{obj.type}</span>
            <span class="obj-id">{obj.id}</span>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .objects-panel { display: grid; gap: var(--space-2); }
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
  .object-list { list-style: none; margin: 0; padding: 0; }
  .object-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    border-bottom: var(--line) solid var(--color-line);
    font-size: 0.6875rem;
  }
  .obj-type { font-weight: 500; }
  .obj-id { color: var(--color-muted); font-family: var(--font-mono); font-size: 0.625rem; }
</style>
