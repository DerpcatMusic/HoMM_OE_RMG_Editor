<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import type { ContentPoolConfig, ContentList, ContentWeight } from "../../../core/rmg/rmgTypes.js";

  let zone = $derived(editor.selectedZone);
  let session = $derived(editor.session);
  let activePoolName = $derived(editor.activeContentPoolName);
  let catalogOptions = $derived(editor.catalogOptions);

  // Resolve active pool — template-local first, then synthesize a read-only view for Core
  let activePool = $derived.by((): { pool: ContentPoolConfig; source: "template-local" | "core"; poolIndex: number } | undefined => {
    if (!activePoolName) return undefined;
    const pools = session.template.contentPools ?? [];
    const li = pools.findIndex((p) => p.name === activePoolName);
    if (li !== -1) return { pool: pools[li], source: "template-local", poolIndex: li };
    // Core pool — look up full data from the indexed Core.zip content pool
    const corePool = session.coreArchive?.contentPoolIndex?.get(activePoolName);
    if (corePool) return { pool: corePool, source: "core", poolIndex: -1 };
    // Fallback: pool name in catalog but no indexed data (bundled-only, no Core.zip uploaded)
    const isCore = catalogOptions.contentPools.some((p) => p.id === activePoolName);
    if (isCore) return { pool: { name: activePoolName, groups: [] }, source: "core", poolIndex: -1 };
    return undefined;
  });

  let isEditable = $derived(activePool?.source === "template-local");

  // Focused group index (for split-pane right side)
  let focusedGroup = $state(0);
  let contentSearch = $state("");
  let banSearch = $state("");

  // Clamp focused group when pool changes
  let groups = $derived(activePool?.pool.groups ?? []);
  $effect(() => {
    const g = groups.length;
    if (g === 0) focusedGroup = 0;
    else if (focusedGroup >= g) focusedGroup = g - 1;
  });

  let focusedGroupData = $derived(groups[focusedGroup]);

  // Resolve included content lists for the focused group
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

  // Merge direct content + all included list items for display
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

  function getPoolZoneField(poolName: string): string | undefined {
    if (zone.guardedPools.includes(poolName)) return "guardedContentPool";
    if (zone.unguardedPools.includes(poolName)) return "unguardedContentPool";
    if (zone.resourcesPools.includes(poolName)) return "resourcesContentPool";
    return undefined;
  }

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

  function addContent() {
    if (!activePool || activePool.source !== "template-local" || !contentSearch.trim()) return;
    editor.addContentToPoolGroup(activePool.poolIndex, focusedGroup, contentSearch.trim());
    contentSearch = "";
  }

  function removeContent(ci: number) {
    if (!activePool || activePool.source !== "template-local") return;
    editor.removeContentFromPoolGroup(activePool.poolIndex, focusedGroup, ci);
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
</script>

<div class="pools-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to manage its content pools.</p>
  {:else}
    <!-- Zone pool assignments -->
    <section class="form-section">
      <h3 class="section-title">Zone pool assignments</h3>
      {#each [["Guarded", zone.guardedPools], ["Unguarded", zone.unguardedPools], ["Resources", zone.resourcesPools]] as [label, pools]}
        <div class="pool-group">
          <span class="pool-label">{label}</span>
          {#if (pools as string[]).length > 0}
            {#each pools as p}
              <button class="pool-tag-btn" class:is-active={activePoolName === p} onclick={() => inspectPoolTag(p)}>{p}</button>
            {/each}
          {:else}<span class="muted">—</span>{/if}
        </div>
      {/each}
    </section>

    <!-- Pool browser (split pane) -->
    {#if activePool}
      {@const pool = activePool.pool}
      {@const pi = activePool.poolIndex}

      <section class="pool-browser">
        <!-- Header -->
        <div class="browser-header">
          <span class="browser-title">{activePoolName}</span>
          <span class="pool-source-badge" class:is-local={isEditable} class:is-core={!isEditable}>
            {isEditable ? "Local" : "Core"}
          </span>
          {#if !isEditable}
            <button class="button button-secondary button-sm" onclick={cloneAndEdit}>Clone &amp; Edit</button>
          {/if}
          <button class="button-icon" onclick={() => editor.clearPoolInspection()} title="Close">✕</button>
        </div>

        <!-- Split pane: groups left, content right -->
        <div class="browser-split">
          <!-- LEFT: group list -->
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

          <!-- RIGHT: focused group detail -->
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

              <!-- Include lists -->
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

              <!-- Content list (direct + included) -->
              <div class="pane-field content-area">
                <span class="field-label">Content ({allGroupContent.direct.length} direct + {allGroupContent.included.length} included)</span>
                <div class="content-scroll">
                  <!-- Included list items -->
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
                  <!-- Direct content items -->
                  {#if allGroupContent.direct.length > 0}
                    <div class="list-header">
                      <span class="list-header-name">Direct content</span>
                      <span class="list-header-count">{allGroupContent.direct.length}</span>
                    </div>
                    {#each allGroupContent.direct as item, ci}
                      <div class="content-row">
                        <span class="content-sid">{item.sid}</span>
                        {#if item.variant !== undefined}<span class="content-meta">v{item.variant}</span>{/if}
                        {#if item.weight !== undefined}<span class="content-meta">w:{item.weight}</span>{/if}
                        {#if isEditable}
                          <button class="button-icon danger" onclick={() => removeContent(ci)} title="Remove">✕</button>
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

        <!-- Bans + value distribution (below browser) -->
        {#if isEditable}
          <div class="browser-footer">
            <!-- Bans -->
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

            <!-- Value distribution -->
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

    <!-- Shared datalist -->
    <datalist id="pool-content-options">
      {#each filteredContentOptions as opt}
        <option value={opt.id} label={opt.label}></option>
      {/each}
    </datalist>

    <!-- Template-local pools list -->
    <section class="form-section">
      <h3 class="section-title">Template-local pools ({(session.template.contentPools ?? []).length})</h3>
      {#if (session.template.contentPools ?? []).length > 0}
        <ul class="pool-list">
          {#each (session.template.contentPools ?? []) as pool}
            {#if pool.name}
              <li class="pool-item" class:is-active={activePoolName === pool.name}>
                <button class="pool-btn" onclick={() => { editor.inspectPool(pool.name!, "template-local"); focusedGroup = 0; }}>
                  <span class="pool-btn-name">{pool.name}</span>
                  <span class="pool-btn-meta">{(pool.groups ?? []).length}g · {(pool.bans ?? []).length}b</span>
                </button>
              </li>
            {/if}
          {/each}
        </ul>
      {:else}
        <p class="placeholder">No local pools. Clone a Core pool or add one from the sidebar browser.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .pools-panel { display: grid; gap: var(--space-3); }
  .placeholder { color: var(--color-muted); font-size: 0.75rem; margin: 0; }
  .muted { color: var(--color-muted); }
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

  /* Zone pool tags */
  .pool-group { display: flex; flex-wrap: wrap; gap: var(--space-1); align-items: center; font-size: 0.6875rem; }
  .pool-label { color: var(--color-muted); font-size: 0.625rem; min-width: 4rem; }
  .pool-tag-btn {
    padding: 1px var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    cursor: pointer;
    color: inherit;
  }
  .pool-tag-btn:hover { background: var(--color-active); }
  .pool-tag-btn.is-active { background: var(--color-active); border-color: var(--color-accent); }

  /* Pool browser shell */
  .pool-browser {
    border: var(--line) solid var(--color-accent);
    border-radius: 4px;
    display: grid;
    grid-template-rows: auto 1fr auto;
    max-height: 50vh;
    overflow: hidden;
  }
  .browser-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: 0.6875rem;
  }
  .browser-title {
    font-family: var(--font-mono);
    font-weight: 600;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pool-source-badge {
    font-size: 0.5rem;
    padding: 0 var(--space-1);
    border-radius: 2px;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.04em;
  }
  .pool-source-badge.is-local { background: var(--color-accent); color: var(--color-panel); }
  .pool-source-badge.is-core { background: var(--color-panel-2); color: var(--color-muted); border: var(--line) solid var(--color-line); }

  /* Split pane */
  .browser-split {
    display: grid;
    grid-template-columns: minmax(100px, 0.4fr) 1fr;
    min-height: 0;
    overflow: hidden;
  }
  .browser-left, .browser-right {
    display: grid;
    grid-template-rows: auto 1fr;
    min-height: 0;
    overflow: hidden;
  }
  .browser-left { border-right: var(--line) solid var(--color-line); }

  .pane-header {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font-size: 0.625rem;
    font-weight: 600;
    min-height: 1.5rem;
  }
  .pane-title { flex: 1; }
  .pane-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
  .pane-empty { padding: var(--space-2); }

  /* Group rows (left pane) */
  .group-row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px var(--space-2);
    border: 0;
    background: var(--color-panel);
    font: inherit;
    font-size: 0.625rem;
    cursor: pointer;
    text-align: left;
    border-bottom: var(--line) solid var(--color-line);
    color: inherit;
  }
  .group-row:hover { background: var(--color-panel-2); }
  .group-row.is-focused { background: var(--color-active); }
  .group-row-name { font-weight: 600; min-width: 1.5rem; }
  .group-row-meta { font-family: var(--font-mono); font-size: 0.5rem; color: var(--color-muted); flex: 1; }

  /* Right pane fields */
  .inline-field { display: flex; align-items: center; gap: 2px; font-size: 0.5625rem; font-weight: 400; color: var(--color-muted); margin-left: auto; }
  .inline-field-ro { font-size: 0.5625rem; color: var(--color-muted); margin-left: auto; }
  .pane-field { display: grid; gap: 2px; padding: var(--space-1) var(--space-2); }
  .content-area { grid-template-rows: auto 1fr auto; min-height: 0; overflow: hidden; }
  .field-label { font-size: 0.5rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  .field-value { font-family: var(--font-mono); font-size: 0.5625rem; color: var(--color-muted); }

  /* Content list (right pane) */
  .content-scroll {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 0;
  }
  .content-row {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 1px var(--space-1);
    background: var(--color-panel-2);
    font-size: 0.625rem;
    flex-shrink: 0;
  }
  .content-sid {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }
  .content-meta { font-size: 0.5rem; color: var(--color-muted); white-space: nowrap; }
  .content-row.included { background: var(--color-panel); opacity: 0.85; }
  .list-header {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px var(--space-1);
    background: var(--color-active);
    font-size: 0.5rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }
  .list-header-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .list-header-count { font-family: var(--font-mono); font-weight: 400; color: var(--color-muted); }

  /* Add row */
  .add-row {
    display: flex;
    gap: var(--space-1);
    padding-top: 2px;
  }
  .add-row input { flex: 1; }

  /* Browser footer */
  .browser-footer {
    border-top: var(--line) solid var(--color-line);
    padding: var(--space-1) var(--space-2);
    display: grid;
    gap: var(--space-2);
    background: var(--color-panel);
  }
  .footer-section { display: grid; gap: 2px; }
  .ban-strip { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .ban-chip {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font-family: var(--font-mono);
    font-size: 0.5rem;
  }

  /* Pool list (bottom) */
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
  }
  .pool-btn:hover { background: var(--color-panel-2); }
  .pool-btn-name { font-family: var(--font-mono); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pool-btn-meta { font-size: 0.5625rem; color: var(--color-muted); white-space: nowrap; }

  /* Shared */
  .button-icon {
    border: 0;
    background: transparent;
    cursor: pointer;
    font-size: 0.75rem;
    padding: 2px;
    color: var(--color-muted);
    line-height: 1;
  }
  .button-icon:hover { color: var(--color-text); }
  .button-icon.danger:hover { color: #e55; }
  .button-sm { font-size: 0.5625rem; padding: 1px var(--space-1); }
  .input-sm {
    font-size: 0.625rem;
    padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit;
    font-family: inherit;
    width: 60px;
  }
  textarea.input-sm { width: 100%; resize: vertical; font-family: var(--font-mono); }
  input[type="search"].input-sm { width: auto; flex: 1; }
</style>