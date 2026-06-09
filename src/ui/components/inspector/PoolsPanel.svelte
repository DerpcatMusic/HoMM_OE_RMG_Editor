<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";

  let zone = $derived(editor.selectedZone);
  let session = $derived(editor.session);
  let poolNames = $derived(
    (session.template.contentLists ?? []).map((p) => p.name).filter(Boolean) as string[]
  );
  let activePool = $derived(editor.activeContentPoolName);
</script>

<div class="pools-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to manage its content pools.</p>
  {:else}
    <section class="form-section">
      <h3 class="section-title">Zone pool assignments</h3>
      <div class="pool-group">
        <span class="pool-label">Guarded</span>
        {#if zone.guardedPools.length > 0}
          {#each zone.guardedPools as p}<span class="pool-tag">{p}</span>{/each}
        {:else}
          <span class="muted">—</span>
        {/if}
      </div>
      <div class="pool-group">
        <span class="pool-label">Unguarded</span>
        {#if zone.unguardedPools.length > 0}
          {#each zone.unguardedPools as p}<span class="pool-tag">{p}</span>{/each}
        {:else}
          <span class="muted">—</span>
        {/if}
      </div>
      <div class="pool-group">
        <span class="pool-label">Resources</span>
        {#if zone.resourcesPools.length > 0}
          {#each zone.resourcesPools as p}<span class="pool-tag">{p}</span>{/each}
        {:else}
          <span class="muted">—</span>
        {/if}
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">Available pools</h3>
      {#if poolNames.length > 0}
        <ul class="pool-list">
          {#each poolNames as name}
            <li class="pool-item" class:is-active={activePool === name}>
              <button class="pool-btn" onclick={() => editor.activeContentPoolName = activePool === name ? "" : name}>
                {name}
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="placeholder">No content pools defined. Attach Core.zip to load pool definitions.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .pools-panel { display: grid; gap: var(--space-3); }
  .placeholder { color: var(--color-muted); font-size: 0.75rem; }
  .form-section { display: grid; gap: var(--space-2); }
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
  .pool-group { display: flex; flex-wrap: wrap; gap: var(--space-1); align-items: center; font-size: 0.6875rem; }
  .pool-label { color: var(--color-muted); font-size: 0.625rem; min-width: 4rem; }
  .pool-tag {
    padding: 1px var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font-family: var(--font-mono);
    font-size: 0.625rem;
  }
  .muted { color: var(--color-muted); }
  .pool-list { list-style: none; margin: 0; padding: 0; }
  .pool-item { border-bottom: var(--line) solid var(--color-line); }
  .pool-item.is-active .pool-btn { background: var(--color-active); }
  .pool-btn {
    width: 100%;
    padding: var(--space-1) var(--space-2);
    border: 0;
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
    cursor: pointer;
    text-align: left;
  }
  .pool-btn:hover { background: var(--color-panel-2); }
</style>
