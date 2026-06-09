<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { BIOME_RULE_TYPES, GUARD_REACTIONS } from "../../../core/rmg/enums.js";
  import { buildZoneDraft, applyZoneClipboard } from "../../state/clipboard.js";
  import type { ZoneUpdateDraft } from "../../state/editorSession.js";

  let zone = $derived(editor.selectedZone);
  let catalogOptions = $derived(editor.catalogOptions);

  // Form state — synced from zone when it changes
  let name = $state("");
  let size = $state(1);
  let layout = $state("");
  let zoneBiomeType = $state("");
  let zoneBiomeArgs = $state<string[]>([]);
  let contentBiomeType = $state("");
  let contentBiomeArgs = $state<string[]>([]);
  let metaObjectsBiomeType = $state("");
  let metaObjectsBiomeArgs = $state<string[]>([]);
  let crossroadsPosition = $state<number | undefined>(undefined);
  let diplomacyModifier = $state<number | undefined>(undefined);
  let guardCutoffValue = $state<number | undefined>(undefined);
  let guardMultiplier = $state<number | undefined>(undefined);
  let guardRandomization = $state<number | undefined>(undefined);
  let guardWeeklyIncrement = $state<number | undefined>(undefined);
  let guardedContentValue = $state<number | undefined>(undefined);
  let guardedContentValuePerArea = $state<number | undefined>(undefined);
  let unguardedContentValue = $state<number | undefined>(undefined);
  let unguardedContentValuePerArea = $state<number | undefined>(undefined);
  let resourcesValue = $state<number | undefined>(undefined);
  let resourcesValuePerArea = $state<number | undefined>(undefined);

  // Sync form state when zone changes
  let lastZoneId = $state("");
  $effect(() => {
    if (zone.id !== lastZoneId) {
      lastZoneId = zone.id;
      name = zone.label;
      size = zone.size;
      layout = zone.layout ?? "";
      zoneBiomeType = zone.zoneBiome?.type ?? "";
      zoneBiomeArgs = [...(zone.zoneBiome?.args ?? [])];
      contentBiomeType = zone.contentBiome?.type ?? "";
      contentBiomeArgs = [...(zone.contentBiome?.args ?? [])];
      metaObjectsBiomeType = zone.metaObjectsBiome?.type ?? "";
      metaObjectsBiomeArgs = [...(zone.metaObjectsBiome?.args ?? [])];
      crossroadsPosition = zone.crossroadsPosition;
      diplomacyModifier = zone.diplomacyModifier;
      guardCutoffValue = zone.guardCutoffValue;
      guardMultiplier = zone.guardMultiplier;
      guardRandomization = zone.guardRandomization;
      guardWeeklyIncrement = zone.guardWeeklyIncrement;
      guardedContentValue = zone.guardedContentValue;
      guardedContentValuePerArea = zone.guardedContentValuePerArea;
      unguardedContentValue = zone.unguardedContentValue;
      unguardedContentValuePerArea = zone.unguardedContentValuePerArea;
      resourcesValue = zone.resourcesValue;
      resourcesValuePerArea = zone.resourcesValuePerArea;
    }
  });

  function buildDraft(): ZoneUpdateDraft {
    return {
      name,
      size,
      layout,
      zoneBiomeType,
      zoneBiomeArgs,
      contentBiomeType,
      contentBiomeArgs,
      metaObjectsBiomeType,
      metaObjectsBiomeArgs,
      crossroadsPosition,
      diplomacyModifier,
      guardCutoffValue,
      guardMultiplier,
      guardRandomization,
      guardWeeklyIncrement,
      guardReactionDistribution: zone.guardReactionDistribution,
      guardedContentValue,
      guardedContentValuePerArea,
      unguardedContentValue,
      unguardedContentValuePerArea,
      resourcesValue,
      resourcesValuePerArea,
      guardedPools: zone.guardedPools ?? [],
      unguardedPools: zone.unguardedPools ?? [],
      resourcesPools: zone.resourcesPools ?? [],
      mandatoryContent: zone.mandatoryContent ?? [],
      contentCountLimits: zone.contentCountLimits ?? [],
    };
  }

  function apply() {
    editor.applyZoneChanges(buildDraft());
  }

  function paste() {
    const draft = applyZoneClipboard(buildDraft());
    editor.applyZoneChanges(draft);
  }
</script>

{#if zone.id === "__no_zone__"}
  <p class="placeholder">Select a zone on the canvas to edit its properties.</p>
{:else}
  <div class="zone-form">
    <!-- Identity -->
    <section class="form-section">
      <h3 class="section-title">Identity</h3>
      <label class="field">
        <span class="field-label">Name</span>
        <input type="text" bind:value={name} onchange={apply} />
      </label>
      <label class="field">
        <span class="field-label">Size</span>
        <input type="number" bind:value={size} onchange={apply} min="1" max="10" />
      </label>
      <label class="field">
        <span class="field-label">Layout</span>
        <input type="text" bind:value={layout} onchange={apply} placeholder="Default" />
      </label>
      <label class="field">
        <span class="field-label">Crossroads pos</span>
        <input type="number" bind:value={crossroadsPosition} onchange={apply} min="0" max="100" />
      </label>
      <label class="field">
        <span class="field-label">Diplomacy mod</span>
        <input type="number" bind:value={diplomacyModifier} onchange={apply} min="-100" max="100" />
      </label>
    </section>

    <!-- Biome rules -->
    <section class="form-section">
      <h3 class="section-title">Biome rules</h3>
      <label class="field">
        <span class="field-label">Zone biome</span>
        <select bind:value={zoneBiomeType} onchange={apply}>
          <option value="">None</option>
          {#each BIOME_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Content biome</span>
        <select bind:value={contentBiomeType} onchange={apply}>
          <option value="">None</option>
          {#each BIOME_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Objects biome</span>
        <select bind:value={metaObjectsBiomeType} onchange={apply}>
          <option value="">None</option>
          {#each BIOME_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
        </select>
      </label>
    </section>

    <!-- Guard tuning -->
    <section class="form-section">
      <h3 class="section-title">Guard tuning</h3>
      <label class="field">
        <span class="field-label">Cutoff value</span>
        <input type="number" bind:value={guardCutoffValue} onchange={apply} min="0" />
      </label>
      <label class="field">
        <span class="field-label">Multiplier</span>
        <input type="number" bind:value={guardMultiplier} onchange={apply} min="0" step="0.1" />
      </label>
      <label class="field">
        <span class="field-label">Randomization</span>
        <input type="number" bind:value={guardRandomization} onchange={apply} min="0" max="100" />
      </label>
      <label class="field">
        <span class="field-label">Weekly increment</span>
        <input type="number" bind:value={guardWeeklyIncrement} onchange={apply} min="0" />
      </label>
    </section>

    <!-- Content budgets -->
    <section class="form-section">
      <h3 class="section-title">Content budgets</h3>
      <div class="field-grid">
        <label class="field">
          <span class="field-label">Guarded value</span>
          <input type="number" bind:value={guardedContentValue} onchange={apply} min="0" />
        </label>
        <label class="field">
          <span class="field-label">Guarded/area</span>
          <input type="number" bind:value={guardedContentValuePerArea} onchange={apply} min="0" step="0.1" />
        </label>
        <label class="field">
          <span class="field-label">Unguarded value</span>
          <input type="number" bind:value={unguardedContentValue} onchange={apply} min="0" />
        </label>
        <label class="field">
          <span class="field-label">Unguarded/area</span>
          <input type="number" bind:value={unguardedContentValuePerArea} onchange={apply} min="0" step="0.1" />
        </label>
        <label class="field">
          <span class="field-label">Resources value</span>
          <input type="number" bind:value={resourcesValue} onchange={apply} min="0" />
        </label>
        <label class="field">
          <span class="field-label">Resources/area</span>
          <input type="number" bind:value={resourcesValuePerArea} onchange={apply} min="0" step="0.1" />
        </label>
      </div>
    </section>

    <!-- Pool display (read-only for now) -->
    <section class="form-section">
      <h3 class="section-title">Pools</h3>
      {#if zone.guardedPools.length > 0}
        <p class="pool-list"><strong>Guarded:</strong> {zone.guardedPools.join(", ")}</p>
      {/if}
      {#if zone.unguardedPools.length > 0}
        <p class="pool-list"><strong>Unguarded:</strong> {zone.unguardedPools.join(", ")}</p>
      {/if}
      {#if zone.resourcesPools.length > 0}
        <p class="pool-list"><strong>Resources:</strong> {zone.resourcesPools.join(", ")}</p>
      {/if}
      {#if zone.mandatoryContent.length > 0}
        <p class="pool-list"><strong>Mandatory:</strong> {zone.mandatoryContent.join(", ")}</p>
      {/if}
      {#if zone.guardedPools.length === 0 && zone.unguardedPools.length === 0 && zone.resourcesPools.length === 0}
        <p class="pool-list muted">No pools assigned</p>
      {/if}
    </section>

    <div class="form-actions">
      <button class="action-btn" onclick={paste}>Paste settings</button>
    </div>
  </div>
{/if}

<style>
  .zone-form {
    display: grid;
    gap: var(--space-3);
  }
  .placeholder { color: var(--color-muted); font-size: 0.75rem; }
  .form-section {
    display: grid;
    gap: var(--space-2);
  }
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
  .field {
    display: grid;
    grid-template-columns: 6rem 1fr;
    align-items: center;
    gap: var(--space-2);
    font-size: 0.6875rem;
  }
  .field-label {
    color: var(--color-muted);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .field input, .field select {
    height: 1.5rem;
    padding: 0 var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
  }
  .field-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-1);
  }
  .pool-list { font-size: 0.6875rem; margin: 0; }
  .pool-list.muted { color: var(--color-muted); }
  .form-actions {
    display: flex;
    gap: var(--space-2);
    padding-top: var(--space-2);
    border-top: var(--line) solid var(--color-line);
  }
  .action-btn {
    height: 1.5rem;
    padding: 0 var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
    cursor: pointer;
  }
  .action-btn:hover { background: var(--color-panel-2); }
</style>
