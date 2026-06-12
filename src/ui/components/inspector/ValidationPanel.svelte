<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";

  let errors = $derived(editor.validationErrors);
</script>

<div class="validation-panel">
  {#if errors.length === 0}
    <p class="valid">✓ No validation errors. All players have spawn zones.</p>
  {:else}
    <ul class="error-list">
      {#each errors as error}
        <li class="error-item">{error}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .validation-panel { display: grid; gap: var(--space-2); }
  .valid { color: var(--color-role-connector); font-size: var(--font-size-sm); }
  .error-list { list-style: none; margin: 0; padding: 0; }
  .error-item {
    padding: var(--space-1) 0;
    border-bottom: var(--line) solid var(--color-line);
    color: var(--color-state-invalid);
    font-size: var(--font-size-sm);
  }
</style>
