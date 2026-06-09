<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { CONNECTION_TYPES, GATE_PLACEMENTS, GUARD_REACTIONS } from "../../../core/rmg/enums.js";
  import type { ConnectionUpdateDraft } from "../../state/editorSession.js";

  let conn = $derived(editor.selectedConnection);
  let zones = $derived(editor.zones);

  // Form state
  let name = $state("");
  let connectionType = $state("Direct");
  let length = $state<number | undefined>(undefined);
  let portalFromEnabled = $state(true);
  let portalToEnabled = $state(true);
  let guardZone = $state("");
  let guardValue = $state<number | undefined>(undefined);
  let guardWeeklyIncrement = $state<number | undefined>(undefined);
  let guardReaction = $state("Common");
  let guardEscape = $state(true);
  let gatePlacement = $state("Random");
  let road = $state(false);
  let simTurnSquad = $state(false);
  let guardRandomization = $state<number | undefined>(undefined);

  let lastConnId = $state("");
  $effect(() => {
    const c = conn;
    if (!c || c.id === lastConnId) return;
    lastConnId = c.id;
    name = c.label;
    connectionType = c.type ?? "Direct";
    length = c.length;
    portalFromEnabled = c.portalFromEnabled ?? true;
    portalToEnabled = c.portalToEnabled ?? true;
    guardZone = c.guardZone ?? "";
    guardValue = c.guardValue;
    guardWeeklyIncrement = c.guardWeeklyIncrement;
    guardReaction = c.guardReaction ?? "Common";
    guardEscape = c.guardEscape ?? true;
    gatePlacement = c.gatePlacement ?? "Random";
    road = c.road ?? false;
    simTurnSquad = c.simTurnSquad ?? false;
    guardRandomization = c.guardRandomization;
  });

  function buildDraft(): ConnectionUpdateDraft {
    return {
      originalName: conn?.label ?? "",
      name,
      from: conn?.from ?? "",
      to: conn?.to ?? "",
      connectionType,
      length,
      portalFromEnabled,
      portalToEnabled,
      guardZone,
      guardValue,
      guardWeeklyIncrement,
      guardReaction,
      guardEscape,
      gatePlacement,
      road,
      simTurnSquad,
      guardRandomization,
    };
  }

  function apply() {
    editor.applyConnectionSettings(buildDraft());
  }
</script>

{#if !conn}
  <p class="placeholder">Select a connection on the canvas to edit its properties.</p>
{:else}
  <div class="connection-form">
    <section class="form-section">
      <h3 class="section-title">Identity</h3>
      <div class="field">
        <span class="field-label">From</span>
        <span class="field-value">{conn.from}</span>
      </div>
      <div class="field">
        <span class="field-label">To</span>
        <span class="field-value">{conn.to}</span>
      </div>
    </section>

    <section class="form-section">
      <h3 class="section-title">Type &amp; length</h3>
      <label class="field">
        <span class="field-label">Type</span>
        <select bind:value={connectionType} onchange={apply}>
          {#each CONNECTION_TYPES as t}<option value={t}>{t}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Length</span>
        <input type="number" bind:value={length} onchange={apply} min="1" max="20" />
      </label>
      {#if connectionType === "Portal"}
        <label class="field">
          <span class="field-label">Portal from</span>
          <input type="checkbox" bind:checked={portalFromEnabled} onchange={apply} />
        </label>
        <label class="field">
          <span class="field-label">Portal to</span>
          <input type="checkbox" bind:checked={portalToEnabled} onchange={apply} />
        </label>
      {/if}
    </section>

    <section class="form-section">
      <h3 class="section-title">Guards</h3>
      <label class="field">
        <span class="field-label">Guard zone</span>
        <select bind:value={guardZone} onchange={apply}>
          <option value="">None</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Guard value</span>
        <input type="number" bind:value={guardValue} onchange={apply} min="0" />
      </label>
      <label class="field">
        <span class="field-label">Weekly +</span>
        <input type="number" bind:value={guardWeeklyIncrement} onchange={apply} min="0" />
      </label>
      <label class="field">
        <span class="field-label">Reaction</span>
        <select bind:value={guardReaction} onchange={apply}>
          {#each GUARD_REACTIONS as r}<option value={r}>{r}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Escape</span>
        <input type="checkbox" bind:checked={guardEscape} onchange={apply} />
      </label>
      <label class="field">
        <span class="field-label">Randomization</span>
        <input type="number" bind:value={guardRandomization} onchange={apply} min="0" max="100" />
      </label>
    </section>

    <section class="form-section">
      <h3 class="section-title">Gate &amp; road</h3>
      <label class="field">
        <span class="field-label">Gate placement</span>
        <select bind:value={gatePlacement} onchange={apply}>
          {#each GATE_PLACEMENTS as g}<option value={g}>{g}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span class="field-label">Road</span>
        <input type="checkbox" bind:checked={road} onchange={apply} />
      </label>
      <label class="field">
        <span class="field-label">Sim squad</span>
        <input type="checkbox" bind:checked={simTurnSquad} onchange={apply} />
      </label>
    </section>
  </div>
{/if}

<style>
  .connection-form {
    display: grid;
    gap: var(--space-3);
  }
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
  .field-value {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }
  .field input, .field select {
    height: 1.5rem;
    padding: 0 var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
  }
  .field input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    justify-self: start;
  }
</style>
