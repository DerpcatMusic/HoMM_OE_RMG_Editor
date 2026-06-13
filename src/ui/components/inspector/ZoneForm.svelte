<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { FIELD_PLACEHOLDERS } from "./fieldPlaceholders.js";
  const ph = FIELD_PLACEHOLDERS;
  import { BIOME_RULE_TYPES } from "../../../core/rmg/enums.js";
  import type { ZoneUpdateDraft } from "../../state/editorSession.js";
  import GuardFields from "../svelte/GuardFields.svelte";
  import NumberField from "../ui/NumberField.svelte";

  let zone = $derived(editor.selectedZone);
  let zones = $derived(editor.zones);
  let catalogOptions = $derived(editor.catalogOptions);

  // Form state
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
  let guardReactionDistribution = $state<number[]>([]);
  let guardedContentValue = $state<number | undefined>(undefined);
  let guardedContentValuePerArea = $state<number | undefined>(undefined);
  let unguardedContentValue = $state<number | undefined>(undefined);
  let unguardedContentValuePerArea = $state<number | undefined>(undefined);
  let resourcesValue = $state<number | undefined>(undefined);
  let resourcesValuePerArea = $state<number | undefined>(undefined);
  let guardedPools = $state<string[]>([]);
  let unguardedPools = $state<string[]>([]);
  let resourcesPools = $state<string[]>([]);
  // mandatoryContent and contentCountLimits now managed in Pools tab

  // Pool picker inputs
  let guardedPoolInput = $state("");
  let unguardedPoolInput = $state("");
  let resourcesPoolInput = $state("");

  // Sync form state when the selected zone projection changes. Paste can update
  // the same zone id, so this must not key only on zone.id.
  $effect(() => {
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
    guardReactionDistribution = zone.guardReactionDistribution ?? [];
    guardedContentValue = zone.guardedContentValue;
    guardedContentValuePerArea = zone.guardedContentValuePerArea;
    unguardedContentValue = zone.unguardedContentValue;
    unguardedContentValuePerArea = zone.unguardedContentValuePerArea;
    resourcesValue = zone.resourcesValue;
    resourcesValuePerArea = zone.resourcesValuePerArea;
    guardedPools = [...(zone.guardedPools ?? [])];
    unguardedPools = [...(zone.unguardedPools ?? [])];
    resourcesPools = [...(zone.resourcesPools ?? [])];
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
      guardReactionDistribution: guardReactionDistribution.length > 0 ? guardReactionDistribution : undefined,
      guardedContentValue,
      guardedContentValuePerArea,
      unguardedContentValue,
      unguardedContentValuePerArea,
      resourcesValue,
      resourcesValuePerArea,
      guardedPools,
      unguardedPools,
      resourcesPools,
      mandatoryContent: zone.mandatoryContent ?? [],
      contentCountLimits: zone.contentCountLimits ?? [],
    };
  }

  function apply() {
    editor.applyZoneChanges(buildDraft());
  }

  function paste() {
    editor.pasteOntoSelectedZone();
  }

  function parseStringList(value: string): string[] {
    return value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }

  function parseNumberList(value: string): number[] | undefined {
    const items = parseStringList(value);
    if (items.length === 0) return undefined;
    return items.map((s) => Number(s));
  }

  // Biome args helpers
  function splitBiomeArgs(args: string[]): { biomes: string[]; exclusions: string[] } {
    const biomes: string[] = [];
    const exclusions: string[] = [];
    for (const arg of args) {
      if (arg.trim().startsWith("differentFrom:")) exclusions.push(arg);
      else biomes.push(arg);
    }
    return { biomes, exclusions };
  }

  function buildBiomeArgs(biomes: string[], exclusions: string[]): string[] {
    return [...biomes, ...exclusions];
  }

  function biomeFromListCandidates(args: string[]): string[] {
    return splitBiomeArgs(args).biomes;
  }

  function biomeFromListExclusions(args: string[]): string[] {
    return splitBiomeArgs(args).exclusions;
  }

  function mainObjectOptionsForZone(z: typeof zone): Array<{ value: string; label: string }> {
    if (!z || z.mainObjectCount <= 0) return [];
    return Array.from({ length: z.mainObjectCount }, (_, i) => {
      const obj = z.zoneObjects.find((o) => o.id === `main:${i}`);
      return { value: String(i), label: obj ? `${i}: ${obj.label}` : String(i) };
    });
  }

  // Pool picker helpers
  function addPool(list: string[], input: string): string[] {
    const v = input.trim();
    if (!v || list.includes(v)) return list;
    return [...list, v];
  }
  function removePool(list: string[], index: number): string[] {
    return list.filter((_, i) => i !== index);
  }

  function poolLabel(poolId: string, options: typeof catalogOptions.contentPools): string {
    const option = options.find((entry) => entry.id === poolId);
    if (!option || option.label === poolId) return "";
    return option.label;
  }
</script>

{#if zone.id === "__no_zone__"}
  <p class="placeholder">Select a zone on the canvas to edit its properties.</p>
{:else}
  <div class="zone-form">
    <div class="form-actions-bar">
      <button class="button button-secondary" onclick={() => editor.removeSelectedZone()}>Remove zone</button>
    </div>

    <!-- Identity and layout -->
  <details open class="form-section editor-section" id="identity-and-layout">
    <summary class="form-section-title editor-section-title">Identity and layout</summary>
    <label class="control-row">
      <span>Name</span>
      <input type="text" bind:value={name} onchange={apply} placeholder={ph["zf-name"]} />
    </label>
    <label class="control-row">
      <span>Size</span>
      <NumberField bind:value={size} oncommit={apply} min={1} max={10} step={0.1} placeholder={ph["zf-size"]} allowEmpty={false} />
    </label>
    <label class="control-row">
      <span>Layout</span>
      <input type="text" bind:value={layout} onchange={apply} placeholder={ph["zf-layout"]} />
    </label>
    <label class="control-row">
      <span>Crossroads pos</span>
      <NumberField bind:value={crossroadsPosition} oncommit={apply} placeholder={ph["zf-crossroads"]} step={0.01} />
    </label>
    <label class="control-row">
      <span>Diplomacy mod</span>
      <NumberField bind:value={diplomacyModifier} oncommit={apply} placeholder={ph["zf-diplomacy"]} step={0.01} />
    </label>

    <!-- Biome rules -->
  </details>
  <details open class="form-section editor-section" id="biome-rules">
    <summary class="form-section-title editor-section-title">Biome rules</summary>
    <label class="control-row">
      <span>Zone biome type</span>
      <select bind:value={zoneBiomeType} onchange={apply}>
        <option value="">None</option>
        {#each BIOME_RULE_TYPES as t (t)}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    {#if zoneBiomeType === "FromList"}
      <div class="control-row stack">
        <span>Zone biome candidates</span>
        <select multiple class="multi-select" size={Math.min(7, Math.max(3, catalogOptions.biomes.length))}
          onchange={(e) => {
            const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
            const exclusions = biomeFromListExclusions(zoneBiomeArgs);
            zoneBiomeArgs = buildBiomeArgs(selected, exclusions);
            apply();
          }}>
          {#each catalogOptions.biomes as b (b.id)}
            <option value={b.id} selected={biomeFromListCandidates(zoneBiomeArgs).includes(b.id)}>{b.label}</option>
          {/each}
          {#each biomeFromListCandidates(zoneBiomeArgs).filter((id) => !catalogOptions.biomes.some((b) => b.id === id)) as orphan (orphan)}
            <option value={orphan} selected>{orphan} (not in catalog)</option>
          {/each}
        </select>
      </div>
      <label class="control-row stack">
        <span>differentFrom exclusions</span>
        <textarea rows="2" value={biomeFromListExclusions(zoneBiomeArgs).join("\n")}
          onchange={(e) => {
            const candidates = biomeFromListCandidates(zoneBiomeArgs);
            const exclusions = parseStringList(e.currentTarget.value).map((s) => s.startsWith("differentFrom:") ? s : `differentFrom:${s}`);
            zoneBiomeArgs = buildBiomeArgs(candidates, exclusions);
            apply();
          }}></textarea>
      </label>
      <p class="control-note">Rolls terrain biome from selected candidates, excluding any differentFrom references. Empty candidates mean any biome.</p>
    {:else if zoneBiomeType === "MatchZone"}
      <label class="control-row">
        <span>Match zone</span>
        <select value={zoneBiomeArgs[0] ?? ""} onchange={(e) => { zoneBiomeArgs = e.currentTarget.value ? [e.currentTarget.value] : []; apply(); }}>
          <option value="">no arg: roll random biome</option>
          {#each zones as z (z.id)}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
      <p class="control-note">Copies biome from the selected zone. No args rolls a random biome.</p>
    {:else if zoneBiomeType === "MatchMainObject"}
      <label class="control-row">
        <span>Main object index</span>
        <select value={zoneBiomeArgs[0] ?? ""} onchange={(e) => { zoneBiomeArgs = e.currentTarget.value ? [e.currentTarget.value, zoneBiomeArgs[1] ?? ""].filter(Boolean) : []; apply(); }}>
          <option value="">—</option>
          {#each mainObjectOptionsForZone(zone) as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="control-row">
        <span>Optional zone</span>
        <select value={zoneBiomeArgs[1] ?? ""} onchange={(e) => { zoneBiomeArgs = zoneBiomeArgs[0] ? [zoneBiomeArgs[0], e.currentTarget.value].filter(Boolean) : []; apply(); }}>
          <option value="">current zone ({zone.label})</option>
          {#each zones as z (z.id)}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
      <p class="control-note">Uses the faction-derived biome of the selected main object. Optional zone defaults to current zone.</p>
    {:else if zoneBiomeType}
      <label class="control-row stack">
        <span>Zone biome args</span>
        <textarea rows="3" value={zoneBiomeArgs.join("\n")} onchange={(e) => { zoneBiomeArgs = parseStringList(e.currentTarget.value); apply(); }}></textarea>
      </label>
    {/if}

    <label class="control-row">
      <span>Content biome type</span>
      <select bind:value={contentBiomeType} onchange={apply}>
        <option value="">None</option>
        {#each BIOME_RULE_TYPES as t (t)}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    {#if contentBiomeType === "FromList"}
      <div class="control-row stack">
        <span>Content biome candidates</span>
        <select multiple class="multi-select" size={Math.min(7, Math.max(3, catalogOptions.biomes.length))}
          onchange={(e) => {
            const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
            const exclusions = biomeFromListExclusions(contentBiomeArgs);
            contentBiomeArgs = buildBiomeArgs(selected, exclusions);
            apply();
          }}>
          {#each catalogOptions.biomes as b (b.id)}
            <option value={b.id} selected={biomeFromListCandidates(contentBiomeArgs).includes(b.id)}>{b.label}</option>
          {/each}
        </select>
      </div>
      <label class="control-row stack">
        <span>differentFrom exclusions</span>
        <textarea rows="2" value={biomeFromListExclusions(contentBiomeArgs).join("\n")}
          onchange={(e) => {
            const candidates = biomeFromListCandidates(contentBiomeArgs);
            const exclusions = parseStringList(e.currentTarget.value).map((s) => s.startsWith("differentFrom:") ? s : `differentFrom:${s}`);
            contentBiomeArgs = buildBiomeArgs(candidates, exclusions);
            apply();
          }}></textarea>
      </label>
    {:else if contentBiomeType === "MatchZone"}
      <label class="control-row">
        <span>Match zone</span>
        <select value={contentBiomeArgs[0] ?? ""} onchange={(e) => { contentBiomeArgs = e.currentTarget.value ? [e.currentTarget.value] : []; apply(); }}>
          <option value="">no arg: match current zone</option>
          {#each zones as z (z.id)}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if contentBiomeType === "MatchMainObject"}
      <label class="control-row">
        <span>Main object index</span>
        <select value={contentBiomeArgs[0] ?? ""} onchange={(e) => { contentBiomeArgs = e.currentTarget.value ? [e.currentTarget.value, contentBiomeArgs[1] ?? ""].filter(Boolean) : []; apply(); }}>
          <option value="">—</option>
          {#each mainObjectOptionsForZone(zone) as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="control-row">
        <span>Optional zone</span>
        <select value={contentBiomeArgs[1] ?? ""} onchange={(e) => { contentBiomeArgs = contentBiomeArgs[0] ? [contentBiomeArgs[0], e.currentTarget.value].filter(Boolean) : []; apply(); }}>
          <option value="">current zone ({zone.label})</option>
          {#each zones as z (z.id)}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if contentBiomeType}
      <label class="control-row stack">
        <span>Content biome args</span>
        <textarea rows="3" value={contentBiomeArgs.join("\n")} onchange={(e) => { contentBiomeArgs = parseStringList(e.currentTarget.value); apply(); }}></textarea>
      </label>
    {/if}

    <label class="control-row">
      <span>Meta biome type</span>
      <select bind:value={metaObjectsBiomeType} onchange={apply}>
        <option value="">None</option>
        {#each BIOME_RULE_TYPES as t (t)}<option value={t}>{t}</option>{/each}
      </select>
    </label>
    {#if metaObjectsBiomeType === "FromList"}
      <div class="control-row stack">
        <span>Meta biome candidates</span>
        <select multiple class="multi-select" size={Math.min(7, Math.max(3, catalogOptions.biomes.length))}
          onchange={(e) => {
            const selected = Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
            const exclusions = biomeFromListExclusions(metaObjectsBiomeArgs);
            metaObjectsBiomeArgs = buildBiomeArgs(selected, exclusions);
            apply();
          }}>
          {#each catalogOptions.biomes as b (b.id)}
            <option value={b.id} selected={biomeFromListCandidates(metaObjectsBiomeArgs).includes(b.id)}>{b.label}</option>
          {/each}
        </select>
      </div>
      <label class="control-row stack">
        <span>differentFrom exclusions</span>
        <textarea rows="2" value={biomeFromListExclusions(metaObjectsBiomeArgs).join("\n")}
          onchange={(e) => {
            const candidates = biomeFromListCandidates(metaObjectsBiomeArgs);
            const exclusions = parseStringList(e.currentTarget.value).map((s) => s.startsWith("differentFrom:") ? s : `differentFrom:${s}`);
            metaObjectsBiomeArgs = buildBiomeArgs(candidates, exclusions);
            apply();
          }}></textarea>
      </label>
    {:else if metaObjectsBiomeType === "MatchZone"}
      <label class="control-row">
        <span>Match zone</span>
        <select value={metaObjectsBiomeArgs[0] ?? ""} onchange={(e) => { metaObjectsBiomeArgs = e.currentTarget.value ? [e.currentTarget.value] : []; apply(); }}>
          <option value="">no arg: match current zone</option>
          {#each zones as z (z.id)}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if metaObjectsBiomeType === "MatchMainObject"}
      <label class="control-row">
        <span>Main object index</span>
        <select value={metaObjectsBiomeArgs[0] ?? ""} onchange={(e) => { metaObjectsBiomeArgs = e.currentTarget.value ? [e.currentTarget.value, metaObjectsBiomeArgs[1] ?? ""].filter(Boolean) : []; apply(); }}>
          <option value="">—</option>
          {#each mainObjectOptionsForZone(zone) as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="control-row">
        <span>Optional zone</span>
        <select value={metaObjectsBiomeArgs[1] ?? ""} onchange={(e) => { metaObjectsBiomeArgs = metaObjectsBiomeArgs[0] ? [metaObjectsBiomeArgs[0], e.currentTarget.value].filter(Boolean) : []; apply(); }}>
          <option value="">current zone ({zone.label})</option>
          {#each zones as z (z.id)}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if metaObjectsBiomeType}
      <label class="control-row stack">
        <span>Meta biome args</span>
        <textarea rows="3" value={metaObjectsBiomeArgs.join("\n")} onchange={(e) => { metaObjectsBiomeArgs = parseStringList(e.currentTarget.value); apply(); }}></textarea>
      </label>
    {/if}

    <!-- Guard settings -->
  </details>
  <details open class="form-section editor-section" id="guard-settings">
    <summary class="form-section-title editor-section-title">Guard settings</summary>
    <GuardFields
      showZoneFields={true}
      bind:guardCutoffValue={guardCutoffValue}
      bind:guardMultiplier={guardMultiplier}
      bind:guardRandomization={guardRandomization}
      bind:guardWeeklyIncrement={guardWeeklyIncrement}
      bind:guardReactionDistribution={guardReactionDistribution}
      onchange={apply}
    />

    <!-- Content budgets -->
  </details>
  <details open class="form-section editor-section" id="content-budgets">
    <summary class="form-section-title editor-section-title">Content budgets</summary>
    <label class="control-row">
      <span>Guarded value</span>
      <NumberField bind:value={guardedContentValue} oncommit={apply} placeholder={ph["zf-guarded-value"]} min={0} />
    </label>
    <label class="control-row">
      <span>Guarded per area</span>
      <NumberField bind:value={guardedContentValuePerArea} oncommit={apply} placeholder={ph["zf-guarded-per-area"]} min={0} step={0.1} />
    </label>
    <label class="control-row">
      <span>Unguarded value</span>
      <NumberField bind:value={unguardedContentValue} oncommit={apply} placeholder={ph["zf-unguarded-value"]} min={0} />
    </label>
    <label class="control-row">
      <span>Unguarded per area</span>
      <NumberField bind:value={unguardedContentValuePerArea} oncommit={apply} placeholder={ph["zf-unguarded-per-area"]} min={0} step={0.1} />
    </label>
    <label class="control-row">
      <span>Resources value</span>
      <NumberField bind:value={resourcesValue} oncommit={apply} placeholder={ph["zf-resources-value"]} min={0} />
    </label>
    <label class="control-row">
      <span>Resources per area</span>
      <NumberField bind:value={resourcesValuePerArea} oncommit={apply} placeholder={ph["zf-resources-per-area"]} min={0} step={0.1} />
    </label>

    <!-- Pool and preset alternatives -->
  </details>
  <details open class="form-section editor-section" id="pool-and-preset-alternatives">
    <summary class="form-section-title editor-section-title">Pool and preset alternatives</summary>

    <!-- Guarded pools -->
    <div class="control-row stack">
      <span>Guarded pool alternatives</span>
      <div class="multi-picker">
        <datalist id="guarded-pool-options">
          {#each catalogOptions.guardedContentPools as p (p.id)}<option value={p.id} label={p.label}></option>{/each}
        </datalist>
        <div class="multi-picker-entry">
          <input type="search" list="guarded-pool-options" bind:value={guardedPoolInput} placeholder="Search guarded pool id" />
          <button class="button button-secondary" onclick={() => { guardedPools = addPool(guardedPools, guardedPoolInput); guardedPoolInput = ""; apply(); }}>Add</button>
        </div>
        <div class="pool-alternative-list" aria-label="Guarded pool alternatives">
          {#each guardedPools as pool, i (pool)}
            {@const label = poolLabel(pool, catalogOptions.guardedContentPools)}
            <div class="pool-alternative">
              <span class="pool-alternative-index">Alt {i + 1}</span>
              <span class="pool-alternative-main">
                <strong>{pool}</strong>
                {#if label}<small>{label}</small>{/if}
              </span>
              <button type="button" class="pool-remove-button" onclick={() => { guardedPools = removePool(guardedPools, i); apply(); }} title="Remove {pool}" aria-label="Remove {pool}">
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Unguarded pools -->
    <div class="control-row stack">
      <span>Unguarded pool alternatives</span>
      <div class="multi-picker">
        <datalist id="unguarded-pool-options">
          {#each catalogOptions.unguardedContentPools as p (p.id)}<option value={p.id} label={p.label}></option>{/each}
        </datalist>
        <div class="multi-picker-entry">
          <input type="search" list="unguarded-pool-options" bind:value={unguardedPoolInput} placeholder="Search unguarded pool id" />
          <button class="button button-secondary" onclick={() => { unguardedPools = addPool(unguardedPools, unguardedPoolInput); unguardedPoolInput = ""; apply(); }}>Add</button>
        </div>
        <div class="pool-alternative-list" aria-label="Unguarded pool alternatives">
          {#each unguardedPools as pool, i (pool)}
            {@const label = poolLabel(pool, catalogOptions.unguardedContentPools)}
            <div class="pool-alternative">
              <span class="pool-alternative-index">Alt {i + 1}</span>
              <span class="pool-alternative-main">
                <strong>{pool}</strong>
                {#if label}<small>{label}</small>{/if}
              </span>
              <button type="button" class="pool-remove-button" onclick={() => { unguardedPools = removePool(unguardedPools, i); apply(); }} title="Remove {pool}" aria-label="Remove {pool}">
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Resource pools -->
    <div class="control-row stack">
      <span>Resource pool alternatives</span>
      <div class="multi-picker">
        <datalist id="resources-pool-options">
          {#each catalogOptions.resourceContentPools as p (p.id)}<option value={p.id} label={p.label}></option>{/each}
        </datalist>
        <div class="multi-picker-entry">
          <input type="search" list="resources-pool-options" bind:value={resourcesPoolInput} placeholder="Search resource pool id" />
          <button class="button button-secondary" onclick={() => { resourcesPools = addPool(resourcesPools, resourcesPoolInput); resourcesPoolInput = ""; apply(); }}>Add</button>
        </div>
        <div class="pool-alternative-list" aria-label="Resource pool alternatives">
          {#each resourcesPools as pool, i (pool)}
            {@const label = poolLabel(pool, catalogOptions.resourceContentPools)}
            <div class="pool-alternative">
              <span class="pool-alternative-index">Alt {i + 1}</span>
              <span class="pool-alternative-main">
                <strong>{pool}</strong>
                {#if label}<small>{label}</small>{/if}
              </span>
              <button type="button" class="pool-remove-button" onclick={() => { resourcesPools = removePool(resourcesPools, i); apply(); }} title="Remove {pool}" aria-label="Remove {pool}">
                <span class="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
    <p class="control-note">Each field is a random alternative list. Generation selects one guarded pool, one unguarded pool, and one resource pool from this zone.</p>
    <div class="form-notice">
      <span class="material-symbols-outlined" style="font-size: var(--font-size-m)">open_in_new</span>
      <span>Mandatory presets & count limits are edited in the <strong>Pools</strong> tab.</span>
    </div>


  </details>
    <div class="form-actions">
      <button class="button button-secondary" onclick={paste}>Paste copied zone</button>
    </div>
  </div>
{/if}


<style>
  .placeholder { color: var(--color-muted); font-size: var(--font-size-sm); padding: var(--space-3); }
  .zone-form { display: grid; gap: 0; overflow-y: auto; }
  .form-actions-bar {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
  }
  .control-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    font-size: var(--font-size-sm);
  }
  .control-row.stack {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .control-row.stack > span:first-child {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .control-row > span:first-child {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .control-row input,
  .control-row select,
  .control-row textarea {
    min-height: 1.5rem;
    padding: var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    color: var(--color-ink);
    width: fit-content;
    min-width: 3ch;
    max-width: 100%;
    box-sizing: border-box;
  }
  .control-row :global(.number-field) {
    width: fit-content;
    min-width: 3ch;
    max-width: 100%;
    box-sizing: border-box;
  }
  .control-row input[type="text"],
  .control-row input[type="search"],
  .control-row textarea,
  .control-row select {
    width: 100%;
    min-width: 0;
  }
  .multi-select {
    min-height: 6rem;
  }
  .control-note {
    padding: var(--space-1) var(--space-3);
    margin: 0;
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    border-bottom: var(--line) solid var(--color-line);
  }
  .multi-picker { display: grid; gap: var(--space-1); }
  .multi-picker-entry { display: flex; gap: var(--space-1); }
  .multi-picker-entry input { flex: 1; }
  .pool-alternative-list {
    display: grid;
    gap: var(--space-1);
  }
  .pool-alternative {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: stretch;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
  }
  .pool-alternative-index {
    display: inline-flex;
    align-items: center;
    padding: 0 var(--space-2);
    border-right: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    white-space: nowrap;
  }
  .pool-alternative-main {
    min-width: 0;
    display: grid;
    gap: 1px;
    padding: var(--space-1) var(--space-2);
  }
  .pool-alternative-main strong,
  .pool-alternative-main small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pool-alternative-main strong {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    color: var(--color-ink);
  }
  .pool-alternative-main small {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
  }
  .pool-remove-button {
    width: 1.75rem;
    min-height: 100%;
    display: grid;
    place-items: center;
    border: 0;
    border-left: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    cursor: pointer;
    padding: 0;
  }
  .pool-remove-button:hover {
    background: var(--color-panel-2);
    color: var(--color-state-invalid);
  }
  .pool-remove-button .material-symbols-outlined {
    font-size: var(--font-size-m);
  }
  .form-actions {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
  }
  .button {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    color: var(--color-ink);
  }
  .button-secondary:hover { background: var(--color-panel-2); }
  .form-notice {
    display: flex; align-items: center; gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-xs); color: var(--color-muted);
    background: var(--color-panel-2);
    border-top: var(--line) solid var(--color-line);
  }
  .form-notice strong { color: var(--color-accent); }
</style>
