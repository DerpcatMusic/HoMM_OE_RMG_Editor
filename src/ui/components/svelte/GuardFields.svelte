<script lang="ts">
  /**
   * Shared guard fields panel.
   *
   * Used by ZoneForm, ConnectionForm, and ObjectsPanel.
   * Each consumer binds only the fields it needs; unused props stay undefined
   * and their controls are hidden.
   *
   * All multiplicative fields (guardWeeklyIncrement, guardRandomization,
   * guardMultiplier, guardChance) are displayed as percentages.
   */
  import PercentField from "./PercentField.svelte";
  import { GUARD_REACTIONS } from "../../../core/rmg/enums.js";

  let {
    // --- Shared across all contexts (percentage-based, multiplicative) ---
    guardWeeklyIncrement = $bindable(undefined as number | undefined),
    guardRandomization   = $bindable(undefined as number | undefined),

    // --- Zone context ---
    guardCutoffValue     = $bindable(undefined as number | undefined),
    guardMultiplier      = $bindable(undefined as number | undefined),
    guardReactionDistribution = $bindable(undefined as number[] | undefined),

    // --- Connection context ---
    guardValue           = $bindable(undefined as number | undefined),
    guardReaction        = $bindable(undefined as string | undefined),
    guardEscape          = $bindable(undefined as boolean | undefined),
    guardZone            = $bindable(undefined as string | undefined),
    guardMatchGroup      = $bindable(undefined as string | undefined),

    // --- Main object context ---
    guardChance          = $bindable(undefined as number | undefined),
    removeGuardIfHasOwner = $bindable(undefined as boolean | undefined),

    // --- Context flags ---
    showZoneFields       = false,
    showConnectionFields = false,
    showObjectFields     = false,

    // --- Callbacks ---
    onchange = () => {},
  }: {
    guardWeeklyIncrement?: number | undefined;
    guardRandomization?: number | undefined;
    guardCutoffValue?: number | undefined;
    guardMultiplier?: number | undefined;
    guardReactionDistribution?: number[] | undefined;
    guardValue?: number | undefined;
    guardReaction?: string | undefined;
    guardEscape?: boolean | undefined;
    guardZone?: string | undefined;
    guardMatchGroup?: string | undefined;
    guardChance?: number | undefined;
    removeGuardIfHasOwner?: boolean | undefined;
    showZoneFields?: boolean;
    showConnectionFields?: boolean;
    showObjectFields?: boolean;
    onchange?: () => void;
  } = $props();

  // Zone list for guardZone picker — consumers pass it or we show a text input
  import { editor } from "../../state/editor.svelte.js";
  let zones = $derived(editor.zones);

  // Reaction distribution textarea
  let reactionText = $state("");
  $effect(() => {
    if (guardReactionDistribution) {
      reactionText = guardReactionDistribution.join(", ");
    }
  });
</script>

<div class="guard-fields">
  <!-- Multiplicative percentage fields (always shown) -->
  <PercentField
    label="Guard weekly increment"
    bind:value={guardWeeklyIncrement}
    placeholder="15"
    hint="Multiplicative % per week on guard strength"
    step={1}
    min={0}
    max={100}
    {onchange}
  />
  <PercentField
    label="Guard randomization"
    bind:value={guardRandomization}
    placeholder="5"
    hint="Multiplicative % variance on base guard value"
    step={1}
    min={0}
    max={100}
    {onchange}
  />

  <!-- Zone-specific fields -->
  {#if showZoneFields}
    <label class="gf-field">
      <span class="gf-label">Guard cutoff value</span>
      <input type="number" class="gf-input"
        value={guardCutoffValue ?? ""}
        placeholder="500"
        oninput={(e) => { guardCutoffValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); }}
        onblur={onchange}
        onkeydown={(e) => { if (e.key === "Enter") { (e.currentTarget as HTMLInputElement).blur(); } }}
      />
    </label>
    <PercentField
      label="Guard multiplier"
      bind:value={guardMultiplier}
      placeholder="100"
      hint="Multiplicative % scaling of zone guard strength"
      step={1}
      min={0}
      max={1000}
      {onchange}
    />
    {#if guardReactionDistribution !== undefined}
      <label class="gf-field">
        <span class="gf-label">Reaction weights (6 values)</span>
        <span class="gf-hint">Aggressive, Negative, Common, Friendly, Peaceful, Docile</span>
        <textarea class="gf-textarea" rows="2"
          value={reactionText}
          oninput={(e) => { reactionText = e.currentTarget.value; }}
          onblur={(e) => {
            const nums = e.currentTarget.value.split(/[,\s]+/).map(s => Number(s.trim())).filter(n => !Number.isNaN(n));
            guardReactionDistribution = nums.length > 0 ? nums : undefined;
            onchange();
          }}
        ></textarea>
      </label>
    {/if}
  {/if}

  <!-- Connection-specific fields -->
  {#if showConnectionFields}
    <label class="gf-field">
      <span class="gf-label">Guard value</span>
      <input type="number" class="gf-input"
        value={guardValue ?? ""}
        placeholder="5000"
        min="0"
        oninput={(e) => { guardValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); }}
        onblur={onchange}
        onkeydown={(e) => { if (e.key === "Enter") { (e.currentTarget as HTMLInputElement).blur(); } }}
      />
    </label>
    {#if guardZone !== undefined}
      <label class="gf-field">
        <span class="gf-label">Guard zone</span>
        <select class="gf-select"
          value={guardZone ?? ""}
          onchange={(e) => { guardZone = e.currentTarget.value || undefined; onchange(); }}>
          <option value="">None</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {/if}
    {#if guardReaction !== undefined}
      <label class="gf-field">
        <span class="gf-label">Reaction</span>
        <select class="gf-select"
          value={guardReaction ?? "Common"}
          onchange={(e) => { guardReaction = e.currentTarget.value; onchange(); }}>
          {#each GUARD_REACTIONS as r}<option value={r}>{r}</option>{/each}
        </select>
      </label>
    {/if}
    {#if guardEscape !== undefined}
      <label class="gf-field gf-checkbox">
        <input type="checkbox"
          checked={guardEscape ?? true}
          onchange={(e) => { guardEscape = e.currentTarget.checked; onchange(); }}
        />
        <span class="gf-label">Guard escape</span>
      </label>
    {/if}
    {#if guardMatchGroup !== undefined}
      <label class="gf-field">
        <span class="gf-label">Match group</span>
        <input type="text" class="gf-input"
          value={guardMatchGroup ?? ""}
          placeholder="group_1"
          oninput={(e) => { guardMatchGroup = e.currentTarget.value || undefined; }}
          onblur={onchange}
        />
      </label>
    {/if}
  {/if}

  <!-- Object-specific fields -->
  {#if showObjectFields}
    <PercentField
      label="Guard chance"
      bind:value={guardChance}
      placeholder="100"
      hint="Multiplicative % chance guard spawns"
      step={1}
      min={0}
      max={100}
      {onchange}
    />
    <label class="gf-field">
      <span class="gf-label">Guard value</span>
      <input type="number" class="gf-input"
        value={guardValue ?? ""}
        placeholder="3000"
        min="0"
        oninput={(e) => { guardValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); }}
        onblur={onchange}
        onkeydown={(e) => { if (e.key === "Enter") { (e.currentTarget as HTMLInputElement).blur(); } }}
      />
    </label>
    {#if removeGuardIfHasOwner !== undefined}
      <label class="gf-field gf-checkbox">
        <input type="checkbox"
          checked={removeGuardIfHasOwner ?? false}
          onchange={(e) => { removeGuardIfHasOwner = e.currentTarget.checked; onchange(); }}
        />
        <span class="gf-label">Remove guard if has owner</span>
      </label>
    {/if}
  {/if}
</div>

<style>
  .guard-fields {
    display: grid;
    gap: var(--space-2, 0.5rem);
  }

  .gf-field {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    padding: var(--space-1, 0.25rem) 0;
  }
  .gf-field.gf-checkbox {
    display: flex;
    flex-direction: row;
    gap: var(--space-2, 0.5rem);
  }

  .gf-label {
    font-size: var(--font-size-sm);
    color: var(--color-muted, #888);
    white-space: nowrap;
  }

  .gf-hint {
    font-size: var(--font-size-xxs);
    color: var(--color-muted, #666);
    line-height: 1.3;
    grid-column: 1 / -1;
  }

  .gf-input,
  .gf-select {
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-sm);
    background: var(--color-panel, #1a1a1a);
    color: var(--color-ink, #eee);
    border: var(--line, 1px) solid var(--color-line, #333);
    border-radius: 0;
    min-height: 1.5rem;
    padding: 2px var(--space-2, 0.5rem);
  }
  .gf-input[type="number"] {
    width: fit-content;
    min-width: 3ch;
    max-width: 100%;
    box-sizing: border-box;
  }
  .gf-select,
  .gf-input[type="text"] {
    width: 100%;
    min-width: 0;
  }
  .gf-input::placeholder {
    font-size: var(--font-size-xs);
  }

  .gf-input:focus,
  .gf-select:focus,
  .gf-textarea:focus {
    outline: 1px solid var(--color-accent, #5a9);
    outline-offset: -1px;
  }

  .gf-textarea {
    font-family: var(--font-mono, monospace);
    font-size: var(--font-size-sm);
    background: var(--color-panel, #1a1a1a);
    color: var(--color-ink, #eee);
    border: var(--line, 1px) solid var(--color-line, #333);
    border-radius: 0;
    padding: 2px var(--space-2, 0.5rem);
    resize: vertical;
  }

  .gf-checkbox {
    display: flex;
    align-items: center;
    gap: var(--space-2, 0.5rem);
    flex-direction: row;
  }

  .gf-checkbox .gf-label {
    font-size: var(--font-size-sm);
  }
</style>
