<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  let zone = $derived(editor.selectedZone);
</script>

<div class="content-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its content settings.</p>
  {:else}
    <section class="form-section">
      <h3 class="section-title">Mandatory content</h3>
      {#if zone.mandatoryContent.length > 0}
        {#each zone.mandatoryContent as item}
          <p class="content-item">{item}</p>
        {/each}
      {:else}
        <p class="placeholder">No mandatory content assigned.</p>
      {/if}
    </section>
    <section class="form-section">
      <h3 class="section-title">Content count limits</h3>
      {#if zone.contentCountLimits.length > 0}
        {#each zone.contentCountLimits as limit}
          <p class="content-item">{limit}</p>
        {/each}
      {:else}
        <p class="placeholder">No content count limits set.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .content-panel { display: grid; gap: var(--space-3); }
  .placeholder { color: var(--color-muted); font-size: 0.75rem; }
  .form-section { display: grid; gap: var(--space-1); }
  .section-title {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    margin: 0;
    padding-bottom: var(--space-1);
    border-bottom: var(--line) solid var(--color-line);
  }
  .content-item { font-size: 0.6875rem; margin: 0; font-family: var(--font-mono); }
</style>
