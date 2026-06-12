<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import type { ContentPoolConfig, ContentList, ContentWeight, MandatoryContent } from "../../../core/rmg/rmgTypes.js";

  let zone = $derived(editor.selectedZone);
  let session = $derived(editor.session);
  let activePoolName = $derived(editor.activeContentPoolName);
  let catalogOptions = $derived(editor.catalogOptions);

  // --- Pool browser state (existing) ---
  let activePool = $derived.by((): { pool: ContentPoolConfig; source: "template-local" | "core"; poolIndex: number } | undefined => {
    if (!activePoolName) return undefined;
    const pools = session.template.contentPools ?? [];
    const li = pools.findIndex((p) => p.name === activePoolName);
    if (li !== -1) return { pool: pools[li], source: "template-local", poolIndex: li };
    const corePool = session.coreArchive?.contentPoolIndex?.get(activePoolName);
    if (corePool) return { pool: corePool, source: "core", poolIndex: -1 };
    const isCore = catalogOptions.contentPools.some((p) => p.id === activePoolName);
    if (isCore) return { pool: { name: activePoolName, groups: [] }, source: "core", poolIndex: -1 };
    return undefined;
  });
  let isEditable = $derived(activePool?.source === "template-local");
  let focusedGroup = $state(0);
  let contentSearch = $state("");
  let banSearch = $state("");
  let groups = $derived(activePool?.pool.groups ?? []);
  $effect(() => {
    const g = groups.length;
    if (g === 0) focusedGroup = 0;
    else if (focusedGroup >= g) focusedGroup = g - 1;
  });
  let focusedGroupData = $derived(groups[focusedGroup]);
  let resolvedIncludedLists = $derived.by((): { name: string; items: ContentWeight[] }[] => {
    if (!focusedGroupData) return [];
    const listNames = focusedGroupData.includeLists ?? [];
    const listIndex = session.coreArchive?.contentListIndex;
    if (!listIndex || listNames.length === 0) return [];
    return listNames.map((name) => ({
      name,
      items: (listIndex.get(name)?.content ?? []) as ContentWeight[],
    }));
  });
  let allGroupContent = $derived.by(() => {
    const direct = (focusedGroupData?.content ?? []) as ContentWeight[];
    const included = resolvedIncludedLists.flatMap((l) => l.items);
    return { direct, included };
  });
  let filteredContentOptions = $derived.by(() => {
    const q = contentSearch.trim().toLowerCase();
    const base = catalogOptions.rmgContent;
    if (!q) return base.slice(0, 30);
    return base.filter((o) => o.id.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)).slice(0, 30);
  });

  // --- Zone assignment multi-picker state ---
  let guardedInput = $state("");
  let unguardedInput = $state("");
  let resourceInput = $state("");
  let mandatoryInput = $state("");
  let countLimitInput = $state("");

  // --- Template-local list filter state ---
  let poolFilter = $state("");
  let presetFilter = $state("");
  let newPoolName = $state("");
  let newPresetName = $state("");

  let filteredLocalPools = $derived.by(() => {
    const pools = session.template.contentPools ?? [];
    const q = poolFilter.trim().toLowerCase();
    if (!q) return pools;
    return pools.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  });

  let filteredLocalPresets = $derived.by(() => {
    const presets = session.template.mandatoryContent ?? [];
    const q = presetFilter.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  });

  // --- Pool browser functions ---
  function inspectPoolTag(poolName: string) {
    const resolved = editor.resolvePool(poolName);
    editor.inspectPool(poolName, resolved?.source ?? "core");
    focusedGroup = 0;
  }

  function cloneAndEdit() {
    if (!activePoolName) return;
    const field = getPoolZoneField(activePoolName);
    editor.cloneCorePoolToEdit(activePoolName, field as any ?? "guardedContentPool");
  }

  function swapPool(newPoolName: string) {
    if (!activePoolName || !newPoolName.trim()) return;
    const field = getPoolZoneField(activePoolName);
    if (!field) return;
    const currentPools = getZonePools(field);
    const idx = currentPools.indexOf(activePoolName);
    if (idx === -1) return;
    const next = [...currentPools];
    next[idx] = newPoolName.trim();
    editor.setZonePoolField(field, next);
    editor.inspectPool(newPoolName.trim(), editor.resolvePool(newPoolName.trim())?.source ?? "core");
    focusedGroup = 0;
  }

  function getPoolZoneField(poolName: string): "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool" | undefined {
    if (zone.guardedPools.includes(poolName)) return "guardedContentPool";
    if (zone.unguardedPools.includes(poolName)) return "unguardedContentPool";
    if (zone.resourcesPools.includes(poolName)) return "resourcesContentPool";
    return undefined;
  }

  function getZonePools(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool"): string[] {
    if (field === "guardedContentPool") return [...zone.guardedPools];
    if (field === "unguardedContentPool") return [...zone.unguardedPools];
    return [...zone.resourcesPools];
  }

  function addContent() {
    if (!activePool || activePool.source !== "template-local" || !contentSearch.trim()) return;
    editor.addContentToPoolGroup(activePool.poolIndex, focusedGroup, contentSearch.trim());
    contentSearch = "";
  }

  function removeContent(ci: number) {
    if (!activePool || activePool.source !== "template-local") return;
    editor.removeContentFromPoolGroup(activePool.poolIndex, focusedGroup, ci);
  }

  function updateContentWeight(ci: number, weight: number | undefined) {
    if (!activePool || activePool.source !== "template-local") return;
    editor.updateContentWeight(activePool.poolIndex, focusedGroup, ci, weight);
  }

  function addBan() {
    if (!activePool || activePool.source !== "template-local" || !banSearch.trim()) return;
    editor.addBanToPool(activePool.poolIndex, banSearch.trim());
    banSearch = "";
  }

  function removeBan(bi: number) {
    if (!activePool || activePool.source !== "template-local") return;
    editor.removeBanFromPool(activePool.poolIndex, bi);
  }

  function addGroup() {
    if (!activePool || activePool.source !== "template-local") return;
    editor.addGroupToPool(activePool.poolIndex);
  }

  function removeGroup(gi: number) {
    if (!activePool || activePool.source !== "template-local") return;
    editor.removeGroupFromPool(activePool.poolIndex, gi);
  }

  function updateGroupWeight(weight: number) {
    if (!activePool || activePool.source !== "template-local" || !focusedGroupData) return;
    editor.updatePoolGroup(activePool.poolIndex, focusedGroup, weight, focusedGroupData.includeLists ?? [], focusedGroupData.content ?? []);
  }

  function updateGroupIncludeLists(value: string) {
    if (!activePool || activePool.source !== "template-local" || !focusedGroupData) return;
    const lists = value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    editor.updatePoolGroup(activePool.poolIndex, focusedGroup, focusedGroupData.weight, lists, focusedGroupData.content ?? []);
  }

  // --- Zone assignment multi-picker helpers ---
  function addPoolToZone(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool", input: string) {
    const name = input.trim();
    if (!name) return;
    const current = getZonePools(field);
    if (current.includes(name)) return;
    editor.setZonePoolField(field, [...current, name]);
  }

  function removePoolFromZone(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool", index: number) {
    const current = getZonePools(field);
    editor.setZonePoolField(field, current.filter((_, i) => i !== index));
  }

  function addMandatoryPreset() {
    const name = mandatoryInput.trim();
    if (!name) return;
    const current = [...zone.mandatoryContent];
    if (current.includes(name)) return;
    editor.setZoneMandatoryPresets([...current, name]);
    mandatoryInput = "";
  }

  function removeMandatoryPreset(index: number) {
    editor.setZoneMandatoryPresets(zone.mandatoryContent.filter((_, i) => i !== index));
  }

  function addCountLimit() {
    const name = countLimitInput.trim();
    if (!name) return;
    const current = [...zone.contentCountLimits];
    if (current.includes(name)) return;
    editor.setZoneCountLimitPresets([...current, name]);
    countLimitInput = "";
  }

  function removeCountLimit(index: number) {
    editor.setZoneCountLimitPresets(zone.contentCountLimits.filter((_, i) => i !== index));
  }
  // --- Mandatory content preset browser ---
  let activePresetName = $derived(editor.activeMandatoryContentPresetName);
  let activePreset = $derived.by((): { preset: import("../../../core/rmg/rmgTypes.js").MandatoryContentPreset; presetIndex: number } | undefined => {
    if (!activePresetName) return undefined;
    const presets = session.template.mandatoryContent ?? [];
    const idx = presets.findIndex((p) => p.name === activePresetName);
    if (idx !== -1) return { preset: presets[idx], presetIndex: idx };
    return undefined;
  });
  let presetEntries = $derived(activePreset?.preset.content ?? []);
  let focusedEntry = $state(0);
  let mcSid = $state("");
  let mcName = $state("");
  let mcVariant = $state<number | undefined>(undefined);
  let mcDesignated = $state(false);
  let mcSolo = $state(false);
  let mcGuarded = $state(false);
  let mcMine = $state(false);
  $effect(() => {
    const n = presetEntries.length;
    if (n === 0) focusedEntry = 0;
    else if (focusedEntry >= n) focusedEntry = n - 1;
  });
  function addPresetEntry() {
    if (!activePreset || !mcSid.trim()) return;
    const newEntry: MandatoryContent = {
      name: mcName.trim() || undefined,
      sid: mcSid.trim(),
      variant: mcVariant,
      designatedEncounter: mcDesignated || undefined,
      soloEncounter: mcSolo || undefined,
      isGuarded: mcGuarded || undefined,
      isMine: mcMine || undefined,
    };
    const nextContent = [...presetEntries, newEntry];
    editor.updateMandatoryContentPreset(activePreset.presetIndex, nextContent);
    mcSid = ""; mcName = ""; mcVariant = undefined;
    mcDesignated = false; mcSolo = false; mcGuarded = false; mcMine = false;
  }
  function removePresetEntry(entryIndex: number) {
    if (!activePreset) return;
    const nextContent = presetEntries.filter((_, i) => i !== entryIndex);
    editor.updateMandatoryContentPreset(activePreset.presetIndex, nextContent);
  }
  function updateEntryField(entryIndex: number, field: keyof MandatoryContent, value: unknown) {
    if (!activePreset) return;
    const nextContent = presetEntries.map((entry, i) => {
      if (i !== entryIndex) return entry;
      return { ...entry, [field]: value };
    });
    editor.updateMandatoryContentPreset(activePreset.presetIndex, nextContent);
  }
  function toggleEntryFlag(entryIndex: number, field: "designatedEncounter" | "soloEncounter" | "isGuarded" | "isMine") {
    if (!activePreset) return;
    const current = presetEntries[entryIndex]?.[field];
    updateEntryField(entryIndex, field, current ? undefined : true);
  }
  // --- Rule management ---
  const RULE_TYPES = ["Random", "Sid", "MainObject", "Crossroads", "Connection", "Road", "MandatoryContent"] as const;
  const OWNER_REFS = ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6", "Player7", "Player8"] as const;
  let newRuleType = $state("Road");
  function ruleNeedsArgs(type: string): boolean {
    return type === "Sid" || type === "MainObject" || type === "Connection" || type === "MandatoryContent";
  }
  function ruleArgLabel(type: string): string {
    switch (type) {
      case "Sid": return "Object SID";
      case "MainObject": return "Main object index (0-based)";
      case "Connection": return "Connection name";
      case "MandatoryContent": return "Entry name";
      default: return "";
    }
  }
  function ruleArgOptions(type: string): { id: string; label: string }[] {
    switch (type) {
      case "Sid": return catalogOptions.rmgContent;
      case "MandatoryContent": return presetEntries.map((e, i) => ({ id: e.name ?? `E${i}`, label: e.sid ?? e.name ?? `Entry ${i}` }));
      default: return [];
    }
  }
  function addRule(entryIndex: number) {
    if (!activePreset) return;
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const newRule: import("../../../core/rmg/rmgTypes.js").PlacementRule = { type: newRuleType as any };
    if (ruleNeedsArgs(newRuleType)) newRule.args = [""];
    const nextRules = [...(entry.rules ?? []), newRule];
    updateEntryField(entryIndex, "rules", nextRules);
  }
  function removeRule(entryIndex: number, ruleIndex: number) {
    if (!activePreset) return;
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const nextRules = (entry.rules ?? []).filter((_, i) => i !== ruleIndex);
    updateEntryField(entryIndex, "rules", nextRules.length > 0 ? nextRules : undefined);
  }
  function updateRuleArg(entryIndex: number, ruleIndex: number, argIndex: number, value: string) {
    if (!activePreset) return;
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const nextRules = (entry.rules ?? []).map((rule, i) => {
      if (i !== ruleIndex) return rule;
      const nextArgs = [...(rule.args ?? [])];
      nextArgs[argIndex] = value;
      return { ...rule, args: nextArgs };
    });
    updateEntryField(entryIndex, "rules", nextRules);
  }
  function updateRuleField(entryIndex: number, ruleIndex: number, field: string, value: unknown) {
    if (!activePreset) return;
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const nextRules = (entry.rules ?? []).map((rule, i) => {
      if (i !== ruleIndex) return rule;
      return { ...rule, [field]: value };
    });
    updateEntryField(entryIndex, "rules", nextRules);
  }

  // --- Template-local entity management ---
  function addNewPool() {
    const name = newPoolName.trim();
    if (!name) return;
    editor.addLocalPool(name);
    newPoolName = "";
  }

  function removeLocalPool(index: number) {
    const pool = (session.template.contentPools ?? [])[index];
    if (!pool?.name) return;
    editor.removeLocalPool(pool.name);
  }

  function addNewPreset() {
    const name = newPresetName.trim();
    if (!name) return;
    editor.addMandatoryContentPreset(name);
    newPresetName = "";
  }

  function removeLocalPreset(index: number) {
    editor.removeMandatoryContentPreset(index);
  }
</script>

<div class="pools-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to manage its content pools.</p>
  {:else}

    <!-- ═══ Zone content assignments ═══ -->
    <details open class="form-section">
      <summary class="section-title">Zone content assignments</summary>

      <!-- Guarded pools -->
      <div class="picker-row">
        <span class="picker-label">Guarded</span>
        <div class="multi-picker">
          <datalist id="guarded-pool-opts">
            {#each catalogOptions.guardedContentPools as p}<option value={p.id} label={p.label}></option>{/each}
          </datalist>
          <div class="picker-entry">
            <input type="search" class="input-sm" list="guarded-pool-opts" bind:value={guardedInput}
              onkeydown={(e) => { if (e.key === 'Enter') { addPoolToZone("guardedContentPool", guardedInput); guardedInput = ""; } }}
              placeholder="Search pool..." />
            <button class="button button-secondary button-sm" onclick={() => { addPoolToZone("guardedContentPool", guardedInput); guardedInput = ""; }}>Add</button>
          </div>
          <div class="picker-tokens">
            {#each zone.guardedPools as pool, i}
              <span class="picker-token">
                <button class="token-btn" onclick={() => inspectPoolTag(pool)} title="Inspect">{pool}</button>
                <button class="token-remove" onclick={() => removePoolFromZone("guardedContentPool", i)} title="Remove">✕</button>
              </span>
            {/each}
            {#if zone.guardedPools.length === 0}<span class="muted">—</span>{/if}
          </div>
        </div>
      </div>

      <!-- Unguarded pools -->
      <div class="picker-row">
        <span class="picker-label">Unguarded</span>
        <div class="multi-picker">
          <datalist id="unguarded-pool-opts">
            {#each catalogOptions.unguardedContentPools as p}<option value={p.id} label={p.label}></option>{/each}
          </datalist>
          <div class="picker-entry">
            <input type="search" class="input-sm" list="unguarded-pool-opts" bind:value={unguardedInput}
              onkeydown={(e) => { if (e.key === 'Enter') { addPoolToZone("unguardedContentPool", unguardedInput); unguardedInput = ""; } }}
              placeholder="Search pool..." />
            <button class="button button-secondary button-sm" onclick={() => { addPoolToZone("unguardedContentPool", unguardedInput); unguardedInput = ""; }}>Add</button>
          </div>
          <div class="picker-tokens">
            {#each zone.unguardedPools as pool, i}
              <span class="picker-token">
                <button class="token-btn" onclick={() => inspectPoolTag(pool)} title="Inspect">{pool}</button>
                <button class="token-remove" onclick={() => removePoolFromZone("unguardedContentPool", i)} title="Remove">✕</button>
              </span>
            {/each}
            {#if zone.unguardedPools.length === 0}<span class="muted">—</span>{/if}
          </div>
        </div>
      </div>

      <!-- Resource pools -->
      <div class="picker-row">
        <span class="picker-label">Resources</span>
        <div class="multi-picker">
          <datalist id="resource-pool-opts">
            {#each catalogOptions.resourceContentPools as p}<option value={p.id} label={p.label}></option>{/each}
          </datalist>
          <div class="picker-entry">
            <input type="search" class="input-sm" list="resource-pool-opts" bind:value={resourceInput}
              onkeydown={(e) => { if (e.key === 'Enter') { addPoolToZone("resourcesContentPool", resourceInput); resourceInput = ""; } }}
              placeholder="Search pool..." />
            <button class="button button-secondary button-sm" onclick={() => { addPoolToZone("resourcesContentPool", resourceInput); resourceInput = ""; }}>Add</button>
          </div>
          <div class="picker-tokens">
            {#each zone.resourcesPools as pool, i}
              <span class="picker-token">
                <button class="token-btn" onclick={() => inspectPoolTag(pool)} title="Inspect">{pool}</button>
                <button class="token-remove" onclick={() => removePoolFromZone("resourcesContentPool", i)} title="Remove">✕</button>
              </span>
            {/each}
            {#if zone.resourcesPools.length === 0}<span class="muted">—</span>{/if}
          </div>
        </div>
      </div>

      <!-- Mandatory presets -->
      <div class="picker-row">
        <span class="picker-label">Mandatory</span>
        <div class="multi-picker">
          <datalist id="mandatory-preset-opts">
            {#each (session.template.mandatoryContent ?? []) as p}{#if p.name}<option value={p.name}></option>{/if}{/each}
          </datalist>
          <div class="picker-entry">
            <input type="search" class="input-sm" list="mandatory-preset-opts" bind:value={mandatoryInput}
              onkeydown={(e) => { if (e.key === 'Enter') addMandatoryPreset(); }}
              placeholder="Search preset..." />
            <button class="button button-secondary button-sm" onclick={addMandatoryPreset}>Add</button>
          </div>
          <div class="picker-tokens">
            {#each zone.mandatoryContent as preset, i}
              <span class="picker-token">
                <button class="token-btn" onclick={() => editor.inspectMandatoryContentPreset(preset)} title="Inspect">{preset}</button>
                <button class="token-remove" onclick={() => removeMandatoryPreset(i)} title="Remove">✕</button>
              </span>
            {/each}
            {#if zone.mandatoryContent.length === 0}<span class="muted">—</span>{/if}
          </div>
        </div>
      </div>

      <!-- Count limits -->
      <div class="picker-row">
        <span class="picker-label">Count limits</span>
        <div class="multi-picker">
          <datalist id="count-limit-opts">
            {#each (session.template.contentCountLimits ?? []) as p}{#if p.name}<option value={p.name}></option>{/if}{/each}
          </datalist>
          <div class="picker-entry">
            <input type="search" class="input-sm" list="count-limit-opts" bind:value={countLimitInput}
              onkeydown={(e) => { if (e.key === 'Enter') addCountLimit(); }}
              placeholder="Search preset..." />
            <button class="button button-secondary button-sm" onclick={addCountLimit}>Add</button>
          </div>
          <div class="picker-tokens">
            {#each zone.contentCountLimits as limit, i}
              <span class="picker-token">
                <span class="token-label">{limit}</span>
                <button class="token-remove" onclick={() => removeCountLimit(i)} title="Remove">✕</button>
              </span>
            {/each}
            {#if zone.contentCountLimits.length === 0}<span class="muted">—</span>{/if}
          </div>
        </div>
      </div>

    </details>

    <!-- ═══ Pool browser (when inspecting) ═══ -->
    {#if activePool}
      {@const pool = activePool.pool}

      <section class="pool-browser">
        <div class="browser-header">
          <span class="browser-title">{activePoolName}</span>
          <span class="pool-source-badge" class:is-local={isEditable} class:is-core={!isEditable}>
            {isEditable ? "Local" : "Core"}
          </span>
          {#if !isEditable}
            <button class="button button-secondary button-sm" onclick={cloneAndEdit}>Clone to local</button>
          {/if}
          <button class="button-icon" onclick={() => editor.clearPoolInspection()} title="Close">✕</button>
        </div>

        <!-- Split pane: groups left, content right -->
        <div class="browser-split">
          <div class="browser-left">
            <div class="pane-header">
              <span class="pane-title">Groups ({groups.length})</span>
              {#if isEditable}
                <button class="button-icon" onclick={addGroup} title="Add group">+</button>
              {/if}
            </div>
            <div class="pane-list">
              {#each groups as group, gi}
                <button class="group-row" class:is-focused={focusedGroup === gi} onclick={() => focusedGroup = gi}>
                  <span class="group-row-name">G{gi}</span>
                  <span class="group-row-meta">w:{group.weight ?? 100} · {(group.content ?? []).length}c</span>
                  {#if isEditable}
                    <button class="button-icon danger" onclick={(e) => { e.stopPropagation(); removeGroup(gi); }} title="Remove">✕</button>
                  {/if}
                </button>
              {/each}
              {#if groups.length === 0}
                <p class="placeholder pane-empty">No groups</p>
              {/if}
            </div>
          </div>

          <div class="browser-right">
            {#if focusedGroupData}
              {@const group = focusedGroupData}
              <div class="pane-header">
                <span class="pane-title">Group {focusedGroup}</span>
                {#if isEditable}
                  <label class="inline-field">
                    W:<input type="number" class="input-sm" value={group.weight ?? 100}
                      onchange={(e) => updateGroupWeight(Number(e.currentTarget.value))} min="0" step="1" />
                  </label>
                {:else}
                  <span class="inline-field-ro">weight: {group.weight ?? 100}</span>
                {/if}
              </div>

              {#if isEditable}
                <label class="pane-field">
                  <span class="field-label">Include lists</span>
                  <textarea rows="2" class="input-sm"
                    value={(group.includeLists ?? []).join("\n")}
                    onchange={(e) => updateGroupIncludeLists(e.currentTarget.value)}
                    placeholder="list_name_1\nlist_name_2"></textarea>
                </label>
              {:else if (group.includeLists ?? []).length > 0}
                <div class="pane-field">
                  <span class="field-label">Include lists</span>
                  <span class="field-value">{(group.includeLists ?? []).join(", ")}</span>
                </div>
              {/if}

              <div class="pane-field content-area">
                <span class="field-label">Content ({allGroupContent.direct.length} direct + {allGroupContent.included.length} included)</span>
                <div class="content-scroll">
                  {#each resolvedIncludedLists as list}
                    <div class="list-header">
                      <span class="list-header-name">📋 {list.name}</span>
                      <span class="list-header-count">{list.items.length} items</span>
                    </div>
                    {#each list.items as item}
                      <div class="content-row included">
                        <span class="content-sid">{item.sid}</span>
                        {#if item.variant !== undefined}<span class="content-meta">v{item.variant}</span>{/if}
                        {#if item.weight !== undefined}<span class="content-meta">w:{item.weight}</span>{/if}
                        {#if item.biome !== undefined}<span class="content-meta">🌍{item.biome}</span>{/if}
                      </div>
                    {/each}
                  {/each}
                  {#if allGroupContent.direct.length > 0}
                    <div class="list-header">
                      <span class="list-header-name">Direct content</span>
                      <span class="list-header-count">{allGroupContent.direct.length}</span>
                    </div>
                    {#each allGroupContent.direct as item, ci}
                      <div class="content-row">
                        <span class="content-sid">{item.sid}</span>
                        {#if item.variant !== undefined}<span class="content-meta">v{item.variant}</span>{/if}
                        {#if isEditable}
                          <label class="weight-edit">
                            w:<input type="number" class="input-xs" value={item.weight ?? ""}
                              placeholder="100"
                              onchange={(e) => updateContentWeight(ci, e.currentTarget.value ? Number(e.currentTarget.value) : undefined)} min="0" step="1" />
                          </label>
                          <button class="button-icon danger" onclick={() => removeContent(ci)} title="Remove">✕</button>
                        {:else if item.weight !== undefined}
                          <span class="content-meta">w:{item.weight}</span>
                        {/if}
                      </div>
                    {/each}
                  {/if}
                  {#if allGroupContent.direct.length === 0 && resolvedIncludedLists.length === 0}
                    <p class="placeholder pane-empty">No content items</p>
                  {/if}
                </div>
                {#if isEditable}
                  <div class="add-row">
                    <input type="search" class="input-sm" list="pool-content-options"
                      placeholder="Search SID..." bind:value={contentSearch} />
                    <button class="button button-secondary button-sm" onclick={addContent}>+ Add</button>
                  </div>
                {/if}
              </div>
            {:else}
              <p class="placeholder pane-empty">Select a group</p>
            {/if}
          </div>
        </div>

        {#if isEditable}
          <div class="browser-footer">
            <div class="footer-section">
              <span class="field-label">Bans ({(pool.bans ?? []).length})</span>
              {#if (pool.bans ?? []).length > 0}
                <div class="ban-strip">
                  {#each (pool.bans ?? []) as ban, bi}
                    <span class="ban-chip">
                      {ban.sid ?? "?"}
                      <button class="button-icon danger" onclick={() => removeBan(bi)}>✕</button>
                    </span>
                  {/each}
                </div>
              {/if}
              <div class="add-row">
                <input type="search" class="input-sm" placeholder="SID to ban..." bind:value={banSearch} />
                <button class="button button-secondary button-sm" onclick={addBan}>+ Ban</button>
              </div>
            </div>

            {#if pool.valueDistribution}
              <div class="footer-section">
                <span class="field-label">Value distribution</span>
                <span class="field-value">bounds: [{(pool.valueDistribution.priceBounds ?? []).join(", ")}]</span>
                <span class="field-value">weights: [{(pool.valueDistribution.weights ?? []).join(", ")}]</span>
              </div>
            {/if}
          </div>
        {/if}
      </section>
    {/if}
    <!-- ═══ Mandatory content preset browser ═══ -->
    {#if activePreset}
      {@const preset = activePreset.preset}
      <section class="pool-browser mc-browser">
        <div class="browser-header">
          <span class="browser-title">{activePresetName}</span>
          <span class="pool-source-badge is-local">Preset</span>
          <button class="button-icon" onclick={() => editor.clearMandatoryContentInspection()} title="Close">✕</button>
        </div>
        <div class="browser-split">
          <!-- LEFT: entry list -->
          <div class="browser-left">
            <div class="pane-header">
              <span class="pane-title">Entries ({presetEntries.length})</span>
            </div>
            <div class="pane-list">
              {#each presetEntries as entry, ei}
                {@const hasName = !!entry.name}
                {@const hasRules = (entry.rules ?? []).length > 0}
                <div class="group-row" class:is-focused={focusedEntry === ei} class:unnamed={!hasName && hasRules} onclick={() => focusedEntry = ei} onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') focusedEntry = ei; }} role="button" tabindex="0">
                  <span class="group-row-name">E{ei}</span>
                  <span class="group-row-meta">{entry.name ?? entry.sid ?? "?"}</span>
                  {#if !hasName && hasRules}<span class="unnamed-warn" title="Has rules but no name — cannot be road target">⚠</span>{/if}
                  <button class="button-icon danger" onclick={(e) => { e.stopPropagation(); removePresetEntry(ei); }} title="Remove">✕</button>
                </div>
              {/each}
              {#if presetEntries.length === 0}
                <p class="placeholder pane-empty">No entries</p>
              {/if}
            </div>
          </div>
          <!-- RIGHT: entry detail + add form -->
          <div class="browser-right">
            <datalist id="mc-sid-options">
              {#each catalogOptions.rmgContent as opt}<option value={opt.id} label={opt.label}></option>{/each}
            </datalist>
            {#if presetEntries.length > 0 && focusedEntry < presetEntries.length}
              {@const entry = presetEntries[focusedEntry]}
              {@const hasSid = !!entry.sid}
              {@const isMine = !!entry.isMine}
              <div class="pane-header">
                <span class="pane-title">Entry {focusedEntry}</span>
                {#if hasSid}
                  <span class="mode-badge direct">Direct</span>
                {:else}
                  <span class="mode-badge random">Random</span>
                {/if}
              </div>
              <!-- SID + variant (direct mode) -->
              <div class="pane-field">
                <span class="field-label">Content ID (SID)</span>
                <input type="search" class="input-sm" list="mc-sid-options" value={entry.sid ?? ""}
                  onchange={(e) => updateEntryField(focusedEntry, "sid", e.currentTarget.value || undefined)} />
              </div>
              {#if hasSid}
                <div class="pane-field">
                  <span class="field-label">Variant</span>
                  <input type="number" class="input-xs" value={entry.variant ?? ""}
                    onchange={(e) => updateEntryField(focusedEntry, "variant", e.currentTarget.value ? Number(e.currentTarget.value) : undefined)} min="-1" step="1" />
                  <span class="field-hint">-1 = generator default</span>
                </div>
              {/if}
              <!-- Name (always, important for road/rule targeting) -->
              <div class="pane-field">
                <span class="field-label">Entry name</span>
                <input type="text" class="input-sm" value={entry.name ?? ""}
                  onchange={(e) => updateEntryField(focusedEntry, "name", e.currentTarget.value || undefined)} />
                {#if !entry.name}<span class="field-hint warn">Name needed for road/rule targeting</span>{/if}
              </div>
              <!-- Random mode: includeLists + content (hidden when sid present) -->
              {#if !hasSid}
                <div class="pane-field">
                  <span class="field-label">Include lists</span>
                  <textarea rows="2" class="input-sm" value={(entry.includeLists ?? []).join("\n")}
                    onchange={(e) => updateEntryField(focusedEntry, "includeLists", e.currentTarget.value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean))}
                    placeholder="content_list_1\ncontent_list_2"></textarea>
                </div>
                <div class="pane-field">
                  <span class="field-label">Inline content ({(entry.content ?? []).length})</span>
                  {#if (entry.content ?? []).length > 0}
                    <div class="content-scroll mini">
                      {#each entry.content ?? [] as cw}
                        <div class="content-row">
                          <span class="content-sid">{cw.sid}</span>
                          {#if cw.variant !== undefined}<span class="content-meta">v{cw.variant}</span>{/if}
                          {#if cw.weight !== undefined}<span class="content-meta">w:{cw.weight}</span>{/if}
                          {#if cw.biome !== undefined}<span class="content-meta">🌍{cw.biome}</span>{/if}
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <span class="field-hint">No inline content (uses include lists only)</span>
                  {/if}
                </div>
              {/if}
              <!-- Flags -->
              <div class="pane-field">
                <span class="field-label">Placement flags</span>
                <div class="flag-strip">
                  <label class="flag-chip"><input type="checkbox" checked={!!entry.designatedEncounter} onchange={() => toggleEntryFlag(focusedEntry, "designatedEncounter")} /> designated</label>
                  <label class="flag-chip"><input type="checkbox" checked={!!entry.soloEncounter} onchange={() => toggleEntryFlag(focusedEntry, "soloEncounter")} /> solo</label>
                  <label class="flag-chip"><input type="checkbox" checked={!!entry.isGuarded} onchange={() => toggleEntryFlag(focusedEntry, "isGuarded")} /> guarded</label>
                  <label class="flag-chip"><input type="checkbox" checked={isMine} onchange={() => toggleEntryFlag(focusedEntry, "isMine")} /> mine</label>
                </div>
                <div class="flag-hints">
                  {#if entry.designatedEncounter}<span class="field-hint">Reserves dedicated encounter slot</span>{/if}
                  {#if entry.soloEncounter}<span class="field-hint">Separate encounter (not packed)</span>{/if}
                  {#if isMine}<span class="field-hint">Routed through mine placement</span>{/if}
                  {#if !entry.isGuarded}<span class="field-hint">Unguarded/hobo placement</span>{/if}
                </div>
              </div>
              <!-- Owner (always visible, prominent for mines) -->
              <div class="pane-field">
                <span class="field-label">Owner</span>
                <datalist id="owner-opts">
                  {#each OWNER_REFS as p}<option value={p}></option>{/each}
                </datalist>
                <input type="search" class="input-sm" list="owner-opts" value={entry.owner ?? ""}
                  onchange={(e) => updateEntryField(focusedEntry, "owner", e.currentTarget.value || undefined)}
                  placeholder={isMine ? "Player1..Player8" : "optional"} />
                {#if entry.owner}<span class="field-hint">Parsed as spawn enum</span>{/if}
              </div>
              <!-- Rules (always visible, editable) -->
              <div class="pane-field">
                <span class="field-label">Placement rules ({(entry.rules ?? []).length})</span>
                {#if (entry.rules ?? []).length > 0}
                  <div class="rules-list">
                    {#each entry.rules ?? [] as rule, ri}
                      <div class="rule-row">
                        <div class="rule-header">
                          <span class="rule-type">{rule.type ?? "?"}</span>
                          <button class="button-icon danger" onclick={() => removeRule(focusedEntry, ri)} title="Remove rule">✕</button>
                        </div>
                        {#if rule.args?.length}
                          <div class="rule-args">
                            {#each rule.args as arg, ai}
                              {#if rule.type === "Sid"}
                                <input type="search" class="input-sm" list="mc-sid-options" value={arg}
                                  onchange={(e) => updateRuleArg(focusedEntry, ri, ai, e.currentTarget.value)} />
                              {:else if rule.type === "MandatoryContent"}
                                <input type="text" class="input-sm" value={arg}
                                  onchange={(e) => updateRuleArg(focusedEntry, ri, ai, e.currentTarget.value)}
                                  placeholder="entry name" />
                              {:else}
                                <input type="text" class="input-sm" value={arg}
                                  onchange={(e) => updateRuleArg(focusedEntry, ri, ai, e.currentTarget.value)}
                                  placeholder={ruleArgLabel(rule.type ?? "")} />
                              {/if}
                            {/each}
                          </div>
                        {/if}
                        <div class="rule-tuning">
                          <label class="rule-tune"><span>w:</span><input type="number" class="input-xs" value={rule.weight ?? ""}
                            onchange={(e) => updateRuleField(focusedEntry, ri, "weight", e.currentTarget.value ? Number(e.currentTarget.value) : undefined)} step="0.1" /></label>
                          <label class="rule-tune"><span>t:</span><input type="number" class="input-xs" value={rule.target ?? ""}
                            onchange={(e) => updateRuleField(focusedEntry, ri, "target", e.currentTarget.value ? Number(e.currentTarget.value) : undefined)} step="0.1" min="0" max="1" /></label>
                          <label class="rule-tune"><span>min:</span><input type="number" class="input-xs" value={rule.targetMin ?? ""}
                            onchange={(e) => updateRuleField(focusedEntry, ri, "targetMin", e.currentTarget.value ? Number(e.currentTarget.value) : undefined)} step="0.1" min="0" max="1" /></label>
                          <label class="rule-tune"><span>max:</span><input type="number" class="input-xs" value={rule.targetMax ?? ""}
                            onchange={(e) => updateRuleField(focusedEntry, ri, "targetMax", e.currentTarget.value ? Number(e.currentTarget.value) : undefined)} step="0.1" min="0" max="1" /></label>
                        </div>
                      </div>
                    {/each}
                  </div>
                {:else}
                  <span class="field-hint">No rules (shuffled placement)</span>
                {/if}
                <div class="add-rule-row">
                  <select class="input-sm" bind:value={newRuleType}>
                    {#each RULE_TYPES as rt}<option value={rt}>{rt}</option>{/each}
                  </select>
                  <button class="button button-secondary button-sm" onclick={() => addRule(focusedEntry)}>+ Rule</button>
                </div>
              </div>
            {:else}
              <div class="pane-header">
                <span class="pane-title">Add entry</span>
              </div>
            {/if}
            <div class="pane-field add-entry-form">
              <span class="field-label">Quick add</span>
              <input type="search" class="input-sm" list="mc-sid-options" bind:value={mcSid} placeholder="Search SID..." />
              <input type="text" class="input-sm" bind:value={mcName} placeholder="name (optional)" />
              <div class="flag-strip">
                <label class="flag-chip"><input type="checkbox" bind:checked={mcDesignated} /> designated</label>
                <label class="flag-chip"><input type="checkbox" bind:checked={mcSolo} /> solo</label>
                <label class="flag-chip"><input type="checkbox" bind:checked={mcGuarded} /> guarded</label>
                <label class="flag-chip"><input type="checkbox" bind:checked={mcMine} /> mine</label>
              </div>
              <button class="button button-secondary button-sm" onclick={addPresetEntry}>+ Add entry</button>
            </div>
          </div>
        </div>
      </section>
    {/if}

    <!-- Shared datalist -->
    <datalist id="pool-content-options">
      {#each filteredContentOptions as opt}
        <option value={opt.id} label={opt.label}></option>
      {/each}
    </datalist>

    <!-- ═══ Template-local pools ═══ -->
    <details open class="form-section">
      <summary class="section-title">Template-local pools ({(session.template.contentPools ?? []).length})</summary>
      <div class="local-filter">
        <input type="search" class="input-sm" placeholder="Filter pools..." bind:value={poolFilter} />
      </div>
      {#if filteredLocalPools.length > 0}
        <ul class="entity-list">
          {#each filteredLocalPools as pool}
            {#if pool.name}
              <li class="entity-item" class:is-active={activePoolName === pool.name}>
                <button class="entity-btn" onclick={() => { editor.inspectPool(pool.name!, "template-local"); focusedGroup = 0; }}>
                  <span class="entity-name">{pool.name}</span>
                  <span class="entity-meta">{(pool.groups ?? []).length}g · {(pool.bans ?? []).length}b</span>
                </button>
                <button class="button-icon danger" onclick={() => editor.removeLocalPool(pool.name!)} title="Remove">✕</button>
              </li>
            {/if}
          {/each}
        </ul>
      {:else}
        <p class="placeholder">No local pools. Clone a Core pool or add one below.</p>
      {/if}
      <div class="add-entity-row">
        <input type="search" class="input-sm" list="pool-content-options" placeholder="New pool name..." bind:value={newPoolName}
          onkeydown={(e) => { if (e.key === 'Enter') addNewPool(); }} />
        <button class="button button-secondary button-sm" onclick={addNewPool}>+ Add pool</button>
      </div>
    </details>

    <!-- ═══ Template-local mandatory presets ═══ -->
    <details open class="form-section">
      <summary class="section-title">Mandatory presets ({(session.template.mandatoryContent ?? []).length})</summary>
      <div class="local-filter">
        <input type="search" class="input-sm" placeholder="Filter presets..." bind:value={presetFilter} />
      </div>
      {#if filteredLocalPresets.length > 0}
        <ul class="entity-list">
          {#each filteredLocalPresets as preset}
            {#if preset.name}
              <li class="entity-item" class:is-active={editor.activeMandatoryContentPresetName === preset.name}>
                <button class="entity-btn" onclick={() => editor.inspectMandatoryContentPreset(preset.name!)}>
                  <span class="entity-name">{preset.name}</span>
                  <span class="entity-meta">{(preset.content ?? []).length} entries</span>
                </button>
                <button class="button-icon danger" onclick={() => editor.removeMandatoryContentPreset((session.template.mandatoryContent ?? []).findIndex((p) => p.name === preset.name))} title="Remove">✕</button>
              </li>
            {/if}
          {/each}
        </ul>
      {:else}
        <p class="placeholder">No mandatory presets. Add one below or assign from the zone assignments above.</p>
      {/if}
      <div class="add-entity-row">
        <input type="search" class="input-sm" placeholder="New preset name..." bind:value={newPresetName}
          onkeydown={(e) => { if (e.key === 'Enter') addNewPreset(); }} />
        <button class="button button-secondary button-sm" onclick={addNewPreset}>+ Add preset</button>
      </div>
    </details>

  {/if}
</div>

<style>
  .pools-panel { display: grid; gap: 0; }
  .placeholder { color: var(--color-muted); font-size: var(--font-size-sm); margin: 0; padding: var(--space-2); }
  .muted { color: var(--color-muted); }
  .form-section { border-bottom: var(--line) solid var(--color-line); }
  .form-section summary { list-style: none; cursor: pointer; user-select: none; }
  .form-section summary::-webkit-details-marker { display: none; }
  .section-title {
    display: flex; align-items: center; justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: var(--font-size-xs); font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--color-muted); margin: 0;
    position: sticky; top: 0; z-index: 1;
  }
  .section-title::after {
    content: "expand_more";
    font-family: var(--font-icon);
    font-size: var(--font-size-m);
    transition: transform 0.15s;
  }
  .form-section[open] > .section-title::after { transform: rotate(180deg); }

  /* Multi-picker rows */
  .picker-row {
    display: grid;
    grid-template-columns: minmax(5rem, max-content) 1fr;
    align-items: start;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    font-size: var(--font-size-sm);
  }
  .picker-label {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding-top: 2px;
  }
  .multi-picker { display: grid; gap: var(--space-1); }
  .picker-entry { display: flex; gap: var(--space-1); }
  .picker-entry input { flex: 1; }
  .picker-tokens { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .picker-token {
    display: inline-flex; align-items: center; gap: 1px;
    padding: 1px var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font-size: var(--font-size-xs);
  }
  .token-btn {
    border: 0; background: transparent; cursor: pointer;
    font-family: var(--font-mono); font-size: var(--font-size-xs);
    color: inherit; padding: 0;
  }
  .token-btn:hover { text-decoration: underline; }
  .token-label { font-family: var(--font-mono); font-size: var(--font-size-xs); }
  .token-remove {
    border: 0; background: transparent; cursor: pointer;
    font-size: var(--font-size-xs); color: var(--color-muted); padding: 0 2px;
    line-height: 1;
  }
  .token-remove:hover { color: #e55; }

  /* Pool browser */
  .pool-browser {
    border: var(--line) solid var(--color-accent);
    border-radius: 4px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    max-height: 50vh;
    overflow: hidden;
    margin: var(--space-2) var(--space-3);
  }
  .browser-header {
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: var(--font-size-sm);
  }
  .browser-title {
    font-family: var(--font-mono); font-weight: 600;
    flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .pool-source-badge {
    font-size: var(--font-size-xxs); padding: 0 var(--space-1);
    border-radius: 2px; text-transform: uppercase;
    font-weight: 600; letter-spacing: 0.04em;
  }
  .pool-source-badge.is-local { background: var(--color-accent); color: var(--color-panel); }
  .pool-source-badge.is-core { background: var(--color-panel-2); color: var(--color-muted); border: var(--line) solid var(--color-line); }
  .browser-split {
    display: grid;
    grid-template-columns: minmax(100px, 0.4fr) 1fr;
    min-height: 0; overflow: hidden;
  }
  .browser-left, .browser-right {
    display: grid; grid-template-rows: auto 1fr;
    min-height: 0; overflow: hidden;
  }
  .browser-left { border-right: var(--line) solid var(--color-line); }
  .pane-header {
    display: flex; align-items: center; gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font-size: var(--font-size-xs); font-weight: 600;
    min-height: 1.5rem;
  }
  .pane-title { flex: 1; }
  .pane-list { overflow-y: auto; display: flex; flex-direction: column; }
  .pane-empty { padding: var(--space-2); }
  .group-row {
    display: flex; align-items: center; gap: var(--space-1);
    padding: 2px var(--space-2);
    border: 0; background: var(--color-panel);
    font: inherit; font-size: var(--font-size-xs);
    cursor: pointer; text-align: left;
    border-bottom: var(--line) solid var(--color-line);
    color: inherit;
  }
  .group-row:hover { background: var(--color-panel-2); }
  .group-row.is-focused { background: var(--color-active); }
  .group-row-name { font-weight: 600; min-width: 1.5rem; }
  .group-row-meta { font-family: var(--font-mono); font-size: var(--font-size-xxs); color: var(--color-muted); flex: 1; }
  .inline-field { display: flex; align-items: center; gap: 2px; font-size: var(--font-size-xxs); font-weight: 400; color: var(--color-muted); margin-left: auto; }
  .inline-field-ro { font-size: var(--font-size-xxs); color: var(--color-muted); margin-left: auto; }
  .pane-field { display: grid; gap: 2px; padding: var(--space-1) var(--space-2); }
  .content-area { grid-template-rows: auto 1fr auto; min-height: 0; overflow: hidden; }
  .field-label { font-size: var(--font-size-xxs); color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  .field-value { font-family: var(--font-mono); font-size: var(--font-size-xxs); color: var(--color-muted); }
  .content-scroll { overflow-y: auto; display: flex; flex-direction: column; gap: 1px; min-height: 0; }
  .content-row {
    display: flex; align-items: center; gap: var(--space-1);
    padding: 1px var(--space-1);
    background: var(--color-panel-2);
    font-size: var(--font-size-xs); flex-shrink: 0;
  }
  .content-sid {
    font-family: var(--font-mono); font-size: var(--font-size-xxs);
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;
  }
  .content-meta { font-size: var(--font-size-xxs); color: var(--color-muted); white-space: nowrap; }
  .content-row.included { background: var(--color-panel); opacity: 0.85; }
  .list-header {
    display: flex; align-items: center; gap: var(--space-1);
    padding: 2px var(--space-1);
    background: var(--color-active);
    font-size: var(--font-size-xxs); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .list-header-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .list-header-count { font-family: var(--font-mono); font-weight: 400; color: var(--color-muted); }
  .add-row { display: flex; gap: var(--space-1); padding-top: 2px; }
  .add-row input { flex: 1; }
  .browser-footer {
    border-top: var(--line) solid var(--color-line);
    padding: var(--space-1) var(--space-2);
    display: grid; gap: var(--space-2);
    background: var(--color-panel);
  }
  .footer-section { display: grid; gap: 2px; }
  .ban-strip { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .ban-chip {
    display: flex; align-items: center; gap: 2px;
    padding: 0 var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font-family: var(--font-mono); font-size: var(--font-size-xxs);
  }
  .weight-edit {
    display: flex; align-items: center; gap: 1px;
    font-size: var(--font-size-xxs); color: var(--color-muted);
    white-space: nowrap; margin-left: auto;
  }

  /* Template-local entity lists */
  .local-filter { padding: var(--space-1) var(--space-3); }
  .local-filter input { width: 100%; }
  .entity-list { list-style: none; margin: 0; padding: 0; }
  .entity-item {
    display: flex; align-items: center;
    border-bottom: var(--line) solid var(--color-line);
  }
  .entity-item.is-active .entity-btn { background: var(--color-active); }
  .entity-btn {
    flex: 1;
    padding: var(--space-1) var(--space-3);
    border: 0; background: var(--color-panel);
    font: inherit; font-size: var(--font-size-sm);
    cursor: pointer; text-align: left;
    display: flex; justify-content: space-between; align-items: center;
    gap: var(--space-2);
  }
  .entity-btn:hover { background: var(--color-panel-2); }
  .entity-name { font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .entity-meta { font-size: var(--font-size-xxs); color: var(--color-muted); white-space: nowrap; }
  .rules-list { display: flex; flex-direction: column; gap: 2px; }
  .rule-row {
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    padding: 2px var(--space-1);
    display: grid; gap: 2px;
  }
  .rule-header { display: flex; align-items: center; gap: var(--space-1); }
  .rule-type { font-family: var(--font-mono); font-size: var(--font-size-xxs); font-weight: 600; flex: 1; }
  .rule-args { display: flex; gap: 2px; }
  .rule-args input { flex: 1; }
  .rule-tuning { display: flex; gap: var(--space-1); flex-wrap: wrap; }
  .rule-tune { display: flex; align-items: center; gap: 1px; font-size: var(--font-size-xxs); color: var(--color-muted); }
  .rule-tune span { white-space: nowrap; }
  .add-rule-row { display: flex; gap: var(--space-1); padding-top: 2px; }
  .add-rule-row select { flex: 1; }
  .add-entity-row {
    display: flex; gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
  }
  .add-entity-row input { flex: 1; }

  /* Shared */
  .button-icon {
    border: 0; background: transparent; cursor: pointer;
    font-size: var(--font-size-sm); padding: 2px; color: var(--color-muted); line-height: 1;
  }
  .button-icon:hover { color: var(--color-text); }
  .button-icon.danger:hover { color: #e55; }
  .button-sm { font-size: var(--font-size-xxs); padding: 1px var(--space-1); }
  .input-sm {
    font-size: var(--font-size-xs);
    padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit; font-family: inherit;
    width: 60px;
  }
  textarea.input-sm { width: 100%; resize: vertical; font-family: var(--font-mono); }
  input[type="search"].input-sm { width: auto; flex: 1; }
  .input-xs {
    font-size: var(--font-size-xxs);
    padding: 0 2px;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit; font-family: var(--font-mono);
    width: 3rem; text-align: right;
  }
  /* Mandatory content browser */
  .mc-browser { border-color: var(--color-line-strong); }
  .group-row.unnamed { background: color-mix(in srgb, #c90 10%, transparent); }
  .unnamed-warn { font-size: var(--font-size-xxs); color: #c90; flex-shrink: 0; }
  .flag-strip { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .flag-chip {
    display: flex; align-items: center; gap: 2px;
    font-size: var(--font-size-xxs); color: var(--color-muted);
    cursor: pointer;
  }
  .flag-chip input { margin: 0; }
  .add-entry-form { display: grid; gap: 2px; }
  .add-entry-form input { width: 100%; }
  .content-scroll.mini { max-height: 4rem; overflow-y: auto; }
  .mode-badge {
    font-size: var(--font-size-xxs); padding: 0 var(--space-1);
    border-radius: 2px; text-transform: uppercase;
    font-weight: 600; letter-spacing: 0.04em;
  }
  .mode-badge.direct { background: var(--color-accent); color: var(--color-panel); }
  .mode-badge.random { background: var(--color-panel-2); color: var(--color-muted); border: var(--line) solid var(--color-line); }
  .field-hint { font-size: var(--font-size-xxs); color: var(--color-muted); font-style: italic; }
  .field-hint.warn { color: #c90; }
  .flag-hints { display: flex; flex-wrap: wrap; gap: var(--space-1); }
</style>