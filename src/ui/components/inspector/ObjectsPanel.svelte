<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { MAIN_OBJECT_TYPES, MAIN_OBJECT_PLACEMENTS, PLAYER_REFS, FACTION_RULE_TYPES } from "../../../core/rmg/enums.js";
  import type { MainObjectUpdateDraft } from "../../state/editorSession.js";
  import GuardFields from "../svelte/GuardFields.svelte";

  let zone = $derived(editor.selectedZone);
  let objects = $derived(zone.zoneObjects.filter((o) => o.id.startsWith("main:")));
  let activeIndex = $derived(editor.activeObjectIndex);
  let activeObj = $derived(objects.find((o) => o.index === activeIndex));

  // Edit state (synced from activeObj)
  let editType = $state("City");
  let editSpawn = $state("");
  let editOwner = $state("");
  let editIsKeyObject = $state(false);
  let editHoldCityWinCon = $state(false);
  let editPlacement = $state("Uniform");
  let editPlacementArgs = $state<string[]>([]);
  let editFactionType = $state("");
  let editFactionArgs = $state<string[]>([]);
  let editEnableWeeklyUnitIncrement = $state(false);
  let editInitialUnitIncrement = $state<number | undefined>(undefined);
  let editGuardChance = $state<number | undefined>(undefined);
  let editGuardValue = $state<number | undefined>(undefined);
  let editGuardWeeklyIncrement = $state<number | undefined>(undefined);
  let editGuardRandomization = $state<number | undefined>(undefined);
  let editRemoveGuardIfHasOwner = $state(false);
  let editBuildingsConstructionSid = $state("");
  let editBuildingsBanSid = $state("");

  // Sync edit state when active object changes
  let lastSyncedIndex = $state(-1);
  $effect(() => {
    const obj = activeObj;
    const idx = activeIndex;
    if (idx === lastSyncedIndex) return;
    lastSyncedIndex = idx;
    if (!obj) return;
    editType = obj.type || "City";
    editSpawn = obj.spawn ?? "";
    editOwner = obj.owner ?? "";
    editIsKeyObject = obj.isKeyObject ?? false;
    editHoldCityWinCon = obj.holdCityWinCon ?? false;
    editPlacement = obj.placement ?? "Uniform";
    editPlacementArgs = [...(obj.placementArgs ?? [])];
    editFactionType = obj.faction?.type ?? "";
    editFactionArgs = [...(obj.faction?.args ?? [])];
    editEnableWeeklyUnitIncrement = obj.enableWeeklyUnitIncrement ?? false;
    editInitialUnitIncrement = obj.initialUnitIncrement;
    editGuardChance = obj.guardChance;
    editGuardValue = obj.guardValue;
    editGuardWeeklyIncrement = obj.guardWeeklyIncrement;
    editGuardRandomization = obj.guardRandomization;
    editRemoveGuardIfHasOwner = obj.removeGuardIfHasOwner ?? false;
    editBuildingsConstructionSid = obj.buildingsConstructionSid ?? "";
    editBuildingsBanSid = obj.buildingsBanSid ?? "";
  });

  function apply() {
    if (activeIndex < 0) return;
    const draft: MainObjectUpdateDraft = {
      objectIndex: activeIndex,
      type: editType,
      spawn: editSpawn,
      owner: editOwner,
      isKeyObject: editIsKeyObject,
      holdCityWinCon: editHoldCityWinCon,
      placement: editPlacement,
      placementArgs: editPlacementArgs,
      factionType: editFactionType,
      factionArgs: editFactionArgs,
      enableWeeklyUnitIncrement: editEnableWeeklyUnitIncrement,
      initialUnitIncrement: editInitialUnitIncrement,
      guardChance: editGuardChance,
      guardValue: editGuardValue,
      guardWeeklyIncrement: editGuardWeeklyIncrement,
      guardRandomization: editGuardRandomization,
      removeGuardIfHasOwner: editRemoveGuardIfHasOwner,
      buildingsConstructionSid: editBuildingsConstructionSid,
      buildingsBanSid: editBuildingsBanSid,
    };
    editor.updateMainObject(draft);
  }

  function parseArgs(value: string): string[] {
    return value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }
</script>

<div class="objects-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its objects.</p>
  {:else}
    <!-- Object list -->
    <div class="panel-header">
      <span class="count">{objects.length} object(s)</span>
      <button class="add-btn" onclick={() => editor.addMainObject()}>+ Add object</button>
    </div>
    {#if objects.length === 0}
      <p class="placeholder">No main objects. Double-click the zone on the canvas or click + Add.</p>
    {:else}
      <ul class="object-list">
        {#each objects as obj (obj.id)}
          {@const isActive = obj.index === activeIndex}
          <li class="object-item" class:is-active={isActive}>
            <button class="obj-btn" onclick={() => editor.selectObject(obj.index ?? 0)}>
              <span class="obj-type">{obj.type}</span>
              <span class="obj-label">{obj.label}</span>
              {#if obj.detail}<span class="obj-detail">{obj.detail}</span>{/if}
            </button>
            <button class="button-icon danger" onclick={() => editor.removeMainObject(obj.index ?? 0)} title="Remove">✕</button>
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Object editor (when selected) -->
    {#if activeObj}
      <div class="object-editor">
        <div class="editor-header">
          <span class="editor-title">{activeObj.type} [{activeIndex}]</span>
          <span class="editor-subtitle">{activeObj.label}</span>
        </div>

        <!-- Type & Placement -->
        <div class="editor-section">
          <h4 class="section-title">Type & Placement</h4>
          <label class="field">
            <span class="field-label">Type</span>
            <select class="input-sm" bind:value={editType} onchange={apply}>
              {#each MAIN_OBJECT_TYPES as t}<option value={t}>{t}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Placement</span>
            <select class="input-sm" bind:value={editPlacement} onchange={apply}>
              {#each MAIN_OBJECT_PLACEMENTS as p}<option value={p}>{p}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Placement args</span>
            <input type="text" class="input-sm" value={editPlacementArgs.join(", ")}
              onchange={(e) => { editPlacementArgs = parseArgs(e.currentTarget.value); apply(); }}
              placeholder="arg1, arg2" />
          </label>
        </div>

        <!-- Ownership -->
        <div class="editor-section">
          <h4 class="section-title">Ownership</h4>
          <label class="field">
            <span class="field-label">Spawn</span>
            <select class="input-sm" bind:value={editSpawn} onchange={apply}>
              <option value="">None</option>
              {#each PLAYER_REFS as p}<option value={p}>{p}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Owner</span>
            <select class="input-sm" bind:value={editOwner} onchange={apply}>
              <option value="">None</option>
              {#each PLAYER_REFS as p}<option value={p}>{p}</option>{/each}
            </select>
          </label>
          <label class="field checkbox">
            <input type="checkbox" bind:checked={editIsKeyObject} onchange={apply} />
            <span class="field-label">Key object</span>
          </label>
          <label class="field checkbox">
            <input type="checkbox" bind:checked={editHoldCityWinCon} onchange={apply} />
            <span class="field-label">Hold city win condition</span>
          </label>
        </div>

        <!-- Guards -->
        <div class="editor-section">
          <h4 class="section-title">Guards</h4>
          <GuardFields
            showObjectFields={true}
            bind:guardWeeklyIncrement={editGuardWeeklyIncrement}
            bind:guardRandomization={editGuardRandomization}
            bind:guardChance={editGuardChance}
            bind:guardValue={editGuardValue}
            bind:removeGuardIfHasOwner={editRemoveGuardIfHasOwner}
            onchange={apply}
          />
        </div>

        <!-- Faction -->
        <div class="editor-section">
          <h4 class="section-title">Faction</h4>
          <label class="field">
            <span class="field-label">Faction rule type</span>
            <select class="input-sm" bind:value={editFactionType} onchange={apply}>
              <option value="">None</option>
              {#each FACTION_RULE_TYPES as t}<option value={t}>{t}</option>{/each}
            </select>
          </label>
          {#if editFactionType}
            <label class="field">
              <span class="field-label">Faction args</span>
              <input type="text" class="input-sm" value={editFactionArgs.join(", ")}
                onchange={(e) => { editFactionArgs = parseArgs(e.currentTarget.value); apply(); }}
                placeholder="faction_1, faction_2" />
            </label>
          {/if}
        </div>

        <!-- Units -->
        <div class="editor-section">
          <h4 class="section-title">Units</h4>
          <label class="field checkbox">
            <input type="checkbox" bind:checked={editEnableWeeklyUnitIncrement} onchange={apply} />
            <span class="field-label">Enable weekly unit increment</span>
          </label>
          {#if editEnableWeeklyUnitIncrement}
            <label class="field">
              <span class="field-label">Initial unit increment</span>
              <input type="number" class="input-xs" bind:value={editInitialUnitIncrement}
                onchange={apply} step="1" min="0" placeholder="0" />
            </label>
          {/if}
        </div>

        <!-- Buildings -->
        <div class="editor-section">
          <h4 class="section-title">Buildings</h4>
          <label class="field">
            <span class="field-label">Construction SID</span>
            <input type="text" class="input-sm" bind:value={editBuildingsConstructionSid}
              onchange={apply} placeholder="building_sid" />
          </label>
          <label class="field">
            <span class="field-label">Ban SID</span>
            <input type="text" class="input-sm" bind:value={editBuildingsBanSid}
              onchange={apply} placeholder="building_ban_sid" />
          </label>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .objects-panel { display: grid; gap: var(--space-2); }
  .placeholder { color: var(--color-muted); font-size: 0.75rem; }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 0.6875rem;
  }
  .count { color: var(--color-muted); font-family: var(--font-mono); font-size: 0.625rem; }
  .add-btn {
    height: 1.5rem; padding: 0 var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); font: inherit; font-size: 0.6875rem; cursor: pointer;
  }
  .add-btn:hover { background: var(--color-panel-2); }
  .object-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }
  .object-item {
    display: flex; align-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
  }
  .object-item.is-active { border-color: var(--color-accent); background: var(--color-active); }
  .obj-btn {
    flex: 1; display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: 0; background: transparent; font: inherit; font-size: 0.6875rem;
    cursor: pointer; text-align: left; color: inherit;
  }
  .obj-btn:hover { background: var(--color-panel-2); }
  .obj-type { font-weight: 600; min-width: 3rem; }
  .obj-label { font-family: var(--font-mono); font-size: 0.5625rem; }
  .obj-detail { font-size: 0.5625rem; color: var(--color-muted); }

  /* Object editor */
  .object-editor {
    border: var(--line) solid var(--color-accent);
    border-radius: 4px;
    display: grid; gap: 0;
    max-height: 60vh; overflow-y: auto;
  }
  .editor-header {
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2);
    background: var(--color-panel-2);
    border-bottom: var(--line) solid var(--color-line);
  }
  .editor-title { font-weight: 600; font-size: 0.75rem; }
  .editor-subtitle { font-family: var(--font-mono); font-size: 0.5625rem; color: var(--color-muted); }
  .editor-section {
    padding: var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    display: grid; gap: var(--space-1);
  }
  .editor-section:last-child { border-bottom: 0; }
  .section-title {
    font-size: 0.5625rem; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--color-muted); margin: 0;
  }
  .field { display: grid; gap: 2px; }
  .field.checkbox { display: flex; align-items: center; gap: var(--space-1); flex-direction: row; }
  .field.checkbox input { margin: 0; }
  .field-label { font-size: 0.5625rem; color: var(--color-muted); }
  .input-sm {
    font-size: 0.625rem; padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); color: inherit; font-family: inherit;
  }
  .input-xs {
    font-size: 0.5625rem; padding: 1px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); color: inherit; font-family: var(--font-mono);
    width: 100%;
    min-width: 0;
  }
  .input-xs[type="number"] {
    width: fit-content;
    min-width: 3ch;
  }
  .button-icon { border: 0; background: transparent; cursor: pointer; font-size: 0.75rem; padding: 2px; color: var(--color-muted); line-height: 1; }
  .button-icon:hover { color: var(--color-text); }
  .button-icon.danger:hover { color: #e55; }
</style>
