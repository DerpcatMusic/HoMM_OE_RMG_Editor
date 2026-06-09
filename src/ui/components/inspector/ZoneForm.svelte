<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { BIOME_RULE_TYPES, GUARD_REACTIONS } from "../../../core/rmg/enums.js";
  import { buildZoneDraft, applyZoneClipboard } from "../../state/clipboard.js";
  import type { ZoneUpdateDraft } from "../../state/editorSession.js";

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
  let mandatoryContent = $state<string>("");
  let contentCountLimits = $state<string>("");

  // Pool picker inputs
  let guardedPoolInput = $state("");
  let unguardedPoolInput = $state("");
  let resourcesPoolInput = $state("");

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
      mandatoryContent = (zone.mandatoryContent ?? []).join("\n");
      contentCountLimits = (zone.contentCountLimits ?? []).join("\n");
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
      mandatoryContent: parseStringList(mandatoryContent),
      contentCountLimits: parseStringList(contentCountLimits),
    };
  }

  function apply() {
    editor.applyZoneChanges(buildDraft());
  }

  function paste() {
    const draft = applyZoneClipboard(buildDraft());
    editor.applyZoneChanges(draft);
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
</script>

{#if zone.id === "__no_zone__"}
  <p class="placeholder">Select a zone on the canvas to edit its properties.</p>
{:else}
  <div class="zone-form">
    <div class="form-actions-bar">
      <button class="button button-secondary" onclick={() => editor.removeSelectedZone()}>Remove zone</button>
    </div>

    <!-- Identity and layout -->
  <details open class="form-section" id="identity-and-layout">
    <summary class="form-section-title">Identity and layout</summary>
    <label class="control-row">
      <span>Name</span>
      <input type="text" bind:value={name} onchange={apply} />
    </label>
    <label class="control-row">
      <span>Size</span>
      <input type="number" bind:value={size} onchange={apply} min="1" max="10" step="0.1" />
    </label>
    <label class="control-row">
      <span>Layout</span>
      <input type="text" bind:value={layout} onchange={apply} placeholder="Default" />
    </label>
    <label class="control-row">
      <span>Crossroads pos</span>
      <input type="number" value={crossroadsPosition ?? ""} onchange={(e) => { crossroadsPosition = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.01" />
    </label>
    <label class="control-row">
      <span>Diplomacy mod</span>
      <input type="number" value={diplomacyModifier ?? ""} onchange={(e) => { diplomacyModifier = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.01" />
    </label>

    <!-- Biome rules -->
  </details>
  <details open class="form-section" id="biome-rules">
    <summary class="form-section-title">Biome rules</summary>
    <label class="control-row">
      <span>Zone biome type</span>
      <select bind:value={zoneBiomeType} onchange={apply}>
        <option value="">None</option>
        {#each BIOME_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
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
          {#each catalogOptions.biomes as b}
            <option value={b.id} selected={biomeFromListCandidates(zoneBiomeArgs).includes(b.id)}>{b.label}</option>
          {/each}
          {#each biomeFromListCandidates(zoneBiomeArgs).filter((id) => !catalogOptions.biomes.some((b) => b.id === id)) as orphan}
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
          }} />
      </label>
      <p class="control-note">Rolls terrain biome from selected candidates, excluding any differentFrom references. Empty candidates mean any biome.</p>
    {:else if zoneBiomeType === "MatchZone"}
      <label class="control-row">
        <span>Match zone</span>
        <select value={zoneBiomeArgs[0] ?? ""} onchange={(e) => { zoneBiomeArgs = e.currentTarget.value ? [e.currentTarget.value] : []; apply(); }}>
          <option value="">no arg: roll random biome</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
      <p class="control-note">Copies biome from the selected zone. No args rolls a random biome.</p>
    {:else if zoneBiomeType === "MatchMainObject"}
      <label class="control-row">
        <span>Main object index</span>
        <select value={zoneBiomeArgs[0] ?? ""} onchange={(e) => { zoneBiomeArgs = e.currentTarget.value ? [e.currentTarget.value, zoneBiomeArgs[1] ?? ""].filter(Boolean) : []; apply(); }}>
          <option value="">—</option>
          {#each mainObjectOptionsForZone(zone) as o}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="control-row">
        <span>Optional zone</span>
        <select value={zoneBiomeArgs[1] ?? ""} onchange={(e) => { zoneBiomeArgs = zoneBiomeArgs[0] ? [zoneBiomeArgs[0], e.currentTarget.value].filter(Boolean) : []; apply(); }}>
          <option value="">current zone ({zone.label})</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
      <p class="control-note">Uses the faction-derived biome of the selected main object. Optional zone defaults to current zone.</p>
    {:else if zoneBiomeType}
      <label class="control-row stack">
        <span>Zone biome args</span>
        <textarea rows="3" value={zoneBiomeArgs.join("\n")} onchange={(e) => { zoneBiomeArgs = parseStringList(e.currentTarget.value); apply(); }} />
      </label>
    {/if}

    <label class="control-row">
      <span>Content biome type</span>
      <select bind:value={contentBiomeType} onchange={apply}>
        <option value="">None</option>
        {#each BIOME_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
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
          {#each catalogOptions.biomes as b}
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
          }} />
      </label>
    {:else if contentBiomeType === "MatchZone"}
      <label class="control-row">
        <span>Match zone</span>
        <select value={contentBiomeArgs[0] ?? ""} onchange={(e) => { contentBiomeArgs = e.currentTarget.value ? [e.currentTarget.value] : []; apply(); }}>
          <option value="">no arg: match current zone</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if contentBiomeType === "MatchMainObject"}
      <label class="control-row">
        <span>Main object index</span>
        <select value={contentBiomeArgs[0] ?? ""} onchange={(e) => { contentBiomeArgs = e.currentTarget.value ? [e.currentTarget.value, contentBiomeArgs[1] ?? ""].filter(Boolean) : []; apply(); }}>
          <option value="">—</option>
          {#each mainObjectOptionsForZone(zone) as o}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="control-row">
        <span>Optional zone</span>
        <select value={contentBiomeArgs[1] ?? ""} onchange={(e) => { contentBiomeArgs = contentBiomeArgs[0] ? [contentBiomeArgs[0], e.currentTarget.value].filter(Boolean) : []; apply(); }}>
          <option value="">current zone ({zone.label})</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if contentBiomeType}
      <label class="control-row stack">
        <span>Content biome args</span>
        <textarea rows="3" value={contentBiomeArgs.join("\n")} onchange={(e) => { contentBiomeArgs = parseStringList(e.currentTarget.value); apply(); }} />
      </label>
    {/if}

    <label class="control-row">
      <span>Meta biome type</span>
      <select bind:value={metaObjectsBiomeType} onchange={apply}>
        <option value="">None</option>
        {#each BIOME_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
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
          {#each catalogOptions.biomes as b}
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
          }} />
      </label>
    {:else if metaObjectsBiomeType === "MatchZone"}
      <label class="control-row">
        <span>Match zone</span>
        <select value={metaObjectsBiomeArgs[0] ?? ""} onchange={(e) => { metaObjectsBiomeArgs = e.currentTarget.value ? [e.currentTarget.value] : []; apply(); }}>
          <option value="">no arg: match current zone</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if metaObjectsBiomeType === "MatchMainObject"}
      <label class="control-row">
        <span>Main object index</span>
        <select value={metaObjectsBiomeArgs[0] ?? ""} onchange={(e) => { metaObjectsBiomeArgs = e.currentTarget.value ? [e.currentTarget.value, metaObjectsBiomeArgs[1] ?? ""].filter(Boolean) : []; apply(); }}>
          <option value="">—</option>
          {#each mainObjectOptionsForZone(zone) as o}<option value={o.value}>{o.label}</option>{/each}
        </select>
      </label>
      <label class="control-row">
        <span>Optional zone</span>
        <select value={metaObjectsBiomeArgs[1] ?? ""} onchange={(e) => { metaObjectsBiomeArgs = metaObjectsBiomeArgs[0] ? [metaObjectsBiomeArgs[0], e.currentTarget.value].filter(Boolean) : []; apply(); }}>
          <option value="">current zone ({zone.label})</option>
          {#each zones as z}<option value={z.label}>{z.label}</option>{/each}
        </select>
      </label>
    {:else if metaObjectsBiomeType}
      <label class="control-row stack">
        <span>Meta biome args</span>
        <textarea rows="3" value={metaObjectsBiomeArgs.join("\n")} onchange={(e) => { metaObjectsBiomeArgs = parseStringList(e.currentTarget.value); apply(); }} />
      </label>
    {/if}

    <!-- Guard settings -->
  </details>
  <details open class="form-section" id="guard-settings">
    <summary class="form-section-title">Guard settings</summary>
    <label class="control-row">
      <span>Guard cutoff</span>
      <input type="number" value={guardCutoffValue ?? ""} onchange={(e) => { guardCutoffValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
    </label>
    <label class="control-row">
      <span>Guard multiplier</span>
      <input type="number" value={guardMultiplier ?? ""} onchange={(e) => { guardMultiplier = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.01" />
    </label>
    <label class="control-row">
      <span>Guard random</span>
      <input type="number" value={guardRandomization ?? ""} onchange={(e) => { guardRandomization = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.01" />
    </label>
    <label class="control-row">
      <span>Guard weekly</span>
      <input type="number" value={guardWeeklyIncrement ?? ""} onchange={(e) => { guardWeeklyIncrement = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
    </label>
    <label class="control-row stack">
      <span>Reaction weights</span>
      <textarea rows="2" value={guardReactionDistribution.join("\n")}
        onchange={(e) => { guardReactionDistribution = parseNumberList(e.currentTarget.value) ?? []; apply(); }} />
    </label>

    <!-- Content budgets -->
  </details>
  <details open class="form-section" id="content-budgets">
    <summary class="form-section-title">Content budgets</summary>
    <label class="control-row">
      <span>Guarded value</span>
      <input type="number" value={guardedContentValue ?? ""} onchange={(e) => { guardedContentValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
    </label>
    <label class="control-row">
      <span>Guarded per area</span>
      <input type="number" value={guardedContentValuePerArea ?? ""} onchange={(e) => { guardedContentValuePerArea = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.1" />
    </label>
    <label class="control-row">
      <span>Unguarded value</span>
      <input type="number" value={unguardedContentValue ?? ""} onchange={(e) => { unguardedContentValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
    </label>
    <label class="control-row">
      <span>Unguarded per area</span>
      <input type="number" value={unguardedContentValuePerArea ?? ""} onchange={(e) => { unguardedContentValuePerArea = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.1" />
    </label>
    <label class="control-row">
      <span>Resources value</span>
      <input type="number" value={resourcesValue ?? ""} onchange={(e) => { resourcesValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
    </label>
    <label class="control-row">
      <span>Resources per area</span>
      <input type="number" value={resourcesValuePerArea ?? ""} onchange={(e) => { resourcesValuePerArea = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.1" />
    </label>

    <!-- Pool and preset alternatives -->
  </details>
  <details open class="form-section" id="pool-and-preset-alternatives">
    <summary class="form-section-title">Pool and preset alternatives</summary>

    <!-- Guarded pools -->
    <div class="control-row stack">
      <span>Guarded pools</span>
      <div class="multi-picker">
        <datalist id="guarded-pool-options">
          {#each catalogOptions.guardedContentPools as p}<option value={p.id} label={p.label} />{/each}
        </datalist>
        <div class="multi-picker-entry">
          <input type="search" list="guarded-pool-options" bind:value={guardedPoolInput} placeholder="Search pool ID" />
          <button class="button button-secondary" onclick={() => { guardedPools = addPool(guardedPools, guardedPoolInput); guardedPoolInput = ""; apply(); }}>Add</button>
        </div>
        <div class="picker-token-list">
          {#each guardedPools as pool, i}
            <button type="button" class="picker-token" onclick={() => { guardedPools = removePool(guardedPools, i); apply(); }} title="Remove {pool}">
              <strong>{pool}</strong>
              <span class="material-symbols-outlined picker-token-remove">close</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Unguarded pools -->
    <div class="control-row stack">
      <span>Unguarded pools</span>
      <div class="multi-picker">
        <datalist id="unguarded-pool-options">
          {#each catalogOptions.unguardedContentPools as p}<option value={p.id} label={p.label} />{/each}
        </datalist>
        <div class="multi-picker-entry">
          <input type="search" list="unguarded-pool-options" bind:value={unguardedPoolInput} placeholder="Search pool ID" />
          <button class="button button-secondary" onclick={() => { unguardedPools = addPool(unguardedPools, unguardedPoolInput); unguardedPoolInput = ""; apply(); }}>Add</button>
        </div>
        <div class="picker-token-list">
          {#each unguardedPools as pool, i}
            <button type="button" class="picker-token" onclick={() => { unguardedPools = removePool(unguardedPools, i); apply(); }} title="Remove {pool}">
              <strong>{pool}</strong>
              <span class="material-symbols-outlined picker-token-remove">close</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <!-- Resource pools -->
    <div class="control-row stack">
      <span>Resource pools</span>
      <div class="multi-picker">
        <datalist id="resources-pool-options">
          {#each catalogOptions.resourceContentPools as p}<option value={p.id} label={p.label} />{/each}
        </datalist>
        <div class="multi-picker-entry">
          <input type="search" list="resources-pool-options" bind:value={resourcesPoolInput} placeholder="Search pool ID" />
          <button class="button button-secondary" onclick={() => { resourcesPools = addPool(resourcesPools, resourcesPoolInput); resourcesPoolInput = ""; apply(); }}>Add</button>
        </div>
        <div class="picker-token-list">
          {#each resourcesPools as pool, i}
            <button type="button" class="picker-token" onclick={() => { resourcesPools = removePool(resourcesPools, i); apply(); }} title="Remove {pool}">
              <strong>{pool}</strong>
              <span class="material-symbols-outlined picker-token-remove">close</span>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <label class="control-row stack">
      <span>Mandatory presets</span>
      <textarea rows="3" bind:value={mandatoryContent} onchange={apply} />
    </label>
    <label class="control-row stack">
      <span>Count limits</span>
      <textarea rows="3" bind:value={contentCountLimits} onchange={apply} />
    </label>

  </details>
    <div class="form-actions">
      <button class="button button-secondary" onclick={paste}>Paste settings</button>
    </div>
  </div>
{/if}


<style>
  .placeholder { color: var(--color-muted); font-size: 0.75rem; padding: var(--space-3); }
  .zone-form { display: grid; gap: 0; overflow-y: auto; }
  .form-actions-bar {
    display: flex;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
  }
  .form-section {
    border-bottom: var(--line) solid var(--color-line);
  }
  .form-section summary {
    list-style: none;
    cursor: pointer;
    user-select: none;
  }
  .form-section summary::-webkit-details-marker {
    display: none;
  }
  .form-section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    font-weight: 500;
    margin: 0;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .form-section-title::after {
    content: "expand_more";
    font-family: var(--font-icon);
    font-size: 1rem;
    transition: transform 0.15s;
  }
  .form-section[open] > summary .form-section-title::after {
    transform: rotate(180deg);
  }
  .control-row {
    display: grid;
    grid-template-columns: minmax(5rem, max-content) 1fr;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    font-size: 0.6875rem;
  }
  .control-row.stack {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .control-row.stack > span:first-child {
    color: var(--color-muted);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .control-row > span:first-child {
    color: var(--color-muted);
    font-size: 0.625rem;
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
    font-size: 0.6875rem;
    color: var(--color-ink);
    width: 100%;
  }
  .control-row input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    justify-self: start;
  }
  .multi-select {
    min-height: 6rem;
  }
  .control-note {
    padding: var(--space-1) var(--space-3);
    margin: 0;
    color: var(--color-muted);
    font-size: 0.625rem;
    border-bottom: var(--line) solid var(--color-line);
  }
  .multi-picker { display: grid; gap: var(--space-1); }
  .multi-picker-entry { display: flex; gap: var(--space-1); }
  .multi-picker-entry input { flex: 1; }
  .picker-token-list { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .picker-token {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font: inherit;
    font-size: 0.625rem;
    cursor: pointer;
  }
  .picker-token:hover { background: var(--color-line); }
  .picker-token strong { font-family: var(--font-mono); }
  .picker-token-remove { font-size: 0.75rem; opacity: 0.6; }
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
    font-size: 0.6875rem;
    cursor: pointer;
    color: var(--color-ink);
  }
  .button-secondary:hover { background: var(--color-panel-2); }
</style>
