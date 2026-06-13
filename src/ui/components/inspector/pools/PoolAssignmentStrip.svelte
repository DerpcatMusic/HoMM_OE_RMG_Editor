<script lang="ts">
  import type { ContentPoolConfig, MandatoryContentPreset } from "../../../../core/rmg/rmgTypes.js";
  import type { ShellCatalogOption, ShellZoneItem } from "../../../data/shellData.js";

  type PoolField = "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool";
  type PoolScope = "zone" | "global";

  interface Props {
    zone: ShellZoneItem;
    poolScope: PoolScope;
    poolFilter: string;
    panelStyle: string;
    activePoolName: string | undefined;
    activePresetName: string | undefined;
    globalGuardedPools: readonly ShellCatalogOption[];
    globalUnguardedPools: readonly ShellCatalogOption[];
    globalResourcePools: readonly ShellCatalogOption[];
    globalMandatoryPresets: readonly MandatoryContentPreset[];
    globalLocalPools: readonly ContentPoolConfig[];
    onAddToolbarPool: () => void;
    onInspectPool: (poolName: string) => void;
    onInspectLocalPool: (poolName: string) => void;
    onInspectMandatoryPreset: (presetName: string) => void;
    onRemovePoolFromZone: (field: PoolField, index: number) => void;
    onRemoveMandatoryPreset: (index: number) => void;
    onRemoveGlobalMandatoryPreset: (presetName: string) => void;
    onRemoveCountLimit: (index: number) => void;
    onRemoveLocalPool: (poolName: string) => void;
    onPoolDragOver: (event: DragEvent) => void;
    onPoolDrop: (event: DragEvent, field: PoolField) => void;
    onResizeStart: (event: PointerEvent) => void;
  }

  let {
    zone,
    poolScope = $bindable(),
    poolFilter = $bindable(),
    panelStyle,
    activePoolName,
    activePresetName,
    globalGuardedPools,
    globalUnguardedPools,
    globalResourcePools,
    globalMandatoryPresets,
    globalLocalPools,
    onAddToolbarPool,
    onInspectPool,
    onInspectLocalPool,
    onInspectMandatoryPreset,
    onRemovePoolFromZone,
    onRemoveMandatoryPreset,
    onRemoveGlobalMandatoryPreset,
    onRemoveCountLimit,
    onRemoveLocalPool,
    onPoolDragOver,
    onPoolDrop,
    onResizeStart,
  }: Props = $props();
</script>

<section class="top-editor" aria-label="Pool assignment editor" style={panelStyle}>
  <div class="scope-bar">
    <strong>Pool scope</strong>
    <select aria-label="Scope selector" bind:value={poolScope}>
      <option value="zone">Selected zone ({zone.label})</option>
      <option value="global">Global template</option>
    </select>
    <div class="toolbar-actions">
      <input aria-label="Filter pool assignments" bind:value={poolFilter} placeholder="Filter assignments" />
      <button class="btn primary" onclick={onAddToolbarPool} disabled={!poolFilter.trim()}>New local pool</button>
    </div>
  </div>

  <div class="assignment-strip">
    {#if poolScope === "zone"}
      <section class="assignment-col" role="group" aria-label="Guarded pool alternatives drop target" ondragover={onPoolDragOver} ondrop={(event) => onPoolDrop(event, "guardedContentPool")}>
        <div class="assignment-head"><strong>Guarded</strong><span>{zone.guardedPools.length} alternatives</span></div>
        <div class="pill-list">
          {#each zone.guardedPools as pool, i (pool)}
            <div class="pill" class:active={activePoolName === pool}>
              <button class="pill-main" onclick={() => onInspectPool(pool)} title={pool}><span>{pool}</span></button>
              <button class="pill-remove" onclick={() => onRemovePoolFromZone("guardedContentPool", i)} title="Remove {pool}">x</button>
            </div>
          {/each}
          {#if zone.guardedPools.length === 0}<div class="pill ghost"><span>Drop guarded pool here</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col" role="group" aria-label="Unguarded pool alternatives drop target" ondragover={onPoolDragOver} ondrop={(event) => onPoolDrop(event, "unguardedContentPool")}>
        <div class="assignment-head"><strong>Unguarded</strong><span>{zone.unguardedPools.length} alternatives</span></div>
        <div class="pill-list">
          {#each zone.unguardedPools as pool, i (pool)}
            <div class="pill" class:active={activePoolName === pool}>
              <button class="pill-main" onclick={() => onInspectPool(pool)} title={pool}><span>{pool}</span></button>
              <button class="pill-remove" onclick={() => onRemovePoolFromZone("unguardedContentPool", i)} title="Remove {pool}">x</button>
            </div>
          {/each}
          {#if zone.unguardedPools.length === 0}<div class="pill ghost"><span>Drop unguarded pool here</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col" role="group" aria-label="Resource pool alternatives drop target" ondragover={onPoolDragOver} ondrop={(event) => onPoolDrop(event, "resourcesContentPool")}>
        <div class="assignment-head"><strong>Resources</strong><span>{zone.resourcesPools.length} alternatives</span></div>
        <div class="pill-list">
          {#each zone.resourcesPools as pool, i (pool)}
            <div class="pill" class:active={activePoolName === pool}>
              <button class="pill-main" onclick={() => onInspectPool(pool)} title={pool}><span>{pool}</span></button>
              <button class="pill-remove" onclick={() => onRemovePoolFromZone("resourcesContentPool", i)} title="Remove {pool}">x</button>
            </div>
          {/each}
          {#if zone.resourcesPools.length === 0}<div class="pill ghost"><span>Drop resource pool here</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col">
        <div class="assignment-head"><strong>Mandatory</strong><span>{zone.mandatoryContent.length} presets</span></div>
        <div class="pill-list">
          {#each zone.mandatoryContent as preset, i (preset)}
            <div class="pill" class:active={activePresetName === preset}>
              <button class="pill-main" onclick={() => onInspectMandatoryPreset(preset)} title={preset}><span>{preset}</span></button>
              <button class="pill-remove" onclick={() => onRemoveMandatoryPreset(i)} title="Remove {preset}">x</button>
            </div>
          {/each}
          {#if zone.mandatoryContent.length === 0}<div class="pill ghost"><span>No mandatory preset</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col">
        <div class="assignment-head"><strong>Limits</strong><span>{zone.contentCountLimits.length ? `${zone.contentCountLimits.length} presets` : "empty"}</span></div>
        <div class="pill-list">
          {#each zone.contentCountLimits as limit, i (limit)}
            <div class="pill">
              <span>{limit}</span>
              <button class="pill-remove" onclick={() => onRemoveCountLimit(i)} title="Remove {limit}">x</button>
            </div>
          {/each}
          {#if zone.contentCountLimits.length === 0}<div class="pill ghost"><span>Drop count-limit preset here</span><button>+</button></div>{/if}
        </div>
      </section>
    {:else}
      <section class="assignment-col">
        <div class="assignment-head"><strong>Guarded</strong><span>{globalGuardedPools.length} pools</span></div>
        <div class="pill-list">
          {#each globalGuardedPools as pool (pool.id)}
            <div class="pill" class:active={activePoolName === pool.id}>
              <button class="pill-main" onclick={() => onInspectPool(pool.id)} title={pool.label}><span>{pool.id}</span></button>
            </div>
          {/each}
          {#if globalGuardedPools.length === 0}<div class="pill ghost"><span>No guarded pools</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col">
        <div class="assignment-head"><strong>Unguarded</strong><span>{globalUnguardedPools.length} pools</span></div>
        <div class="pill-list">
          {#each globalUnguardedPools as pool (pool.id)}
            <div class="pill" class:active={activePoolName === pool.id}>
              <button class="pill-main" onclick={() => onInspectPool(pool.id)} title={pool.label}><span>{pool.id}</span></button>
            </div>
          {/each}
          {#if globalUnguardedPools.length === 0}<div class="pill ghost"><span>No unguarded pools</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col">
        <div class="assignment-head"><strong>Resources</strong><span>{globalResourcePools.length} pools</span></div>
        <div class="pill-list">
          {#each globalResourcePools as pool (pool.id)}
            <div class="pill" class:active={activePoolName === pool.id}>
              <button class="pill-main" onclick={() => onInspectPool(pool.id)} title={pool.label}><span>{pool.id}</span></button>
            </div>
          {/each}
          {#if globalResourcePools.length === 0}<div class="pill ghost"><span>No resource pools</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col">
        <div class="assignment-head"><strong>Mandatory presets</strong><span>{globalMandatoryPresets.length} presets</span></div>
        <div class="pill-list">
          {#each globalMandatoryPresets as preset (preset.name)}
            {#if preset.name}
              <div class="pill" class:active={activePresetName === preset.name}>
                <button class="pill-main" onclick={() => onInspectMandatoryPreset(preset.name!)} title={preset.name}><span>{preset.name}</span></button>
                <button class="pill-remove" onclick={() => onRemoveGlobalMandatoryPreset(preset.name!)} title="Remove {preset.name}">x</button>
              </div>
            {/if}
          {/each}
          {#if globalMandatoryPresets.length === 0}<div class="pill ghost"><span>No mandatory presets yet</span><button>+</button></div>{/if}
        </div>
      </section>

      <section class="assignment-col">
        <div class="assignment-head"><strong>Local pools</strong><span>{globalLocalPools.length} local</span></div>
        <div class="pill-list">
          {#each globalLocalPools as pool (pool.name)}
            {#if pool.name}
              <div class="pill" class:active={activePoolName === pool.name}>
                <button class="pill-main" onclick={() => onInspectLocalPool(pool.name!)} title={pool.name}><span>{pool.name}</span></button>
                <button class="pill-remove" onclick={() => onRemoveLocalPool(pool.name!)} title="Remove {pool.name}">x</button>
              </div>
            {/if}
          {/each}
          {#if globalLocalPools.length === 0}<div class="pill ghost"><span>No local pools yet</span><button>+</button></div>{/if}
        </div>
      </section>
    {/if}
  </div>

  <button class="assignment-resize" type="button" onpointerdown={onResizeStart} title="Drag to resize pool lists">
    <span>Pool lists</span>
  </button>
</section>

<style>
  .top-editor {
    display: grid;
    grid-template-rows: 2rem minmax(0, 1fr) 0.45rem;
    block-size: var(--assignment-panel-height);
    min-block-size: 5rem;
    max-block-size: min(24rem, 42vh);
    border-bottom: var(--line-strong) solid var(--color-line-strong);
    min-width: 0;
    background: var(--color-panel);
  }
  .scope-bar {
    display: grid;
    grid-template-columns: max-content minmax(16rem, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    min-width: 0;
  }
  .scope-bar strong {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    white-space: nowrap;
  }
  .scope-bar select,
  .scope-bar input {
    min-width: 0;
    block-size: 1.45rem;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    padding: 0 var(--space-2);
    font: inherit;
  }
  .toolbar-actions {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
  }
  .btn {
    block-size: 1.45rem;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    padding: 0 var(--space-2);
    cursor: pointer;
    white-space: nowrap;
    font: inherit;
  }
  .btn:hover {
    background: var(--color-active);
  }
  .btn:disabled {
    color: var(--color-muted);
    border-color: var(--color-line);
    cursor: not-allowed;
  }
  .btn.primary {
    background: var(--color-ink);
    color: var(--color-panel);
  }
  .btn.primary:disabled {
    background: var(--color-panel-2);
    color: var(--color-muted);
  }
  .assignment-strip {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .assignment-col {
    display: grid;
    grid-template-rows: 1.35rem minmax(0, 1fr);
    border-right: var(--line) solid var(--color-line);
    min-width: 0;
    min-height: 0;
  }
  .assignment-col:last-child {
    border-right: 0;
  }
  .assignment-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1);
    padding: 0 var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    font-size: 0.6875rem;
  }
  .assignment-head strong {
    color: var(--color-ink);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
  }
  .pill-list {
    display: flex;
    align-content: start;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding: var(--space-1);
    min-height: 0;
    overflow: auto;
  }
  .pill {
    max-width: 100%;
    display: inline-grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    line-height: 1.35;
  }
  .pill.active {
    border-color: var(--color-line-strong);
    background: var(--color-active);
  }
  .pill.ghost {
    color: var(--color-muted);
    background: var(--color-panel);
  }
  .pill span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 var(--space-1);
  }
  .pill button,
  .pill-main {
    border: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    min-width: 0;
    font: inherit;
  }
  .pill-main {
    display: grid;
    text-align: left;
    padding: 0;
  }
  .pill-remove,
  .pill > button:last-child {
    border-left: var(--line) solid var(--color-line);
    color: var(--color-muted);
    padding: 0 var(--space-1);
  }
  .pill-remove:hover {
    color: #b00020;
    background: color-mix(in srgb, #b00020 8%, var(--color-panel));
  }
  .assignment-resize {
    display: grid;
    place-items: center;
    border: 0;
    border-top: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    color: var(--color-muted);
    cursor: row-resize;
    font: inherit;
    font-size: 0.625rem;
    line-height: 1;
  }
  .assignment-resize span {
    transform: translateY(-0.04rem);
  }
  .assignment-resize:hover {
    background: var(--color-active);
    color: var(--color-ink);
  }
  @media (max-width: 980px) {
    .assignment-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      overflow: auto;
    }
  }
  @container (max-width: 36rem) {
    .scope-bar {
      grid-template-columns: 1fr;
      block-size: auto;
      padding-block: var(--space-1);
    }
  }
</style>
