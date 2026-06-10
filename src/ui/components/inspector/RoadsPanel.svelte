<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { ROAD_TYPES, ROAD_TARGET_TYPES } from "../../../core/rmg/enums.js";

  let zone = $derived(editor.selectedZone);
  let connections = $derived(editor.connections);
  let session = $derived(editor.session);
  let roads = $derived(zone.zoneRoads ?? []);

  // Main objects in this zone (from zoneObjects)
  let mainObjects = $derived(zone.zoneObjects.filter((o) => o.id.startsWith("main:")));

  // Connections touching this zone (non-Proximity)
  let touchingConnections = $derived(
    connections.filter((c) => c.type !== "Proximity" && (c.from === zone.label || c.to === zone.label))
  );

  // Mandatory content presets available for this zone
  let mandatoryPresets = $derived(zone.mandatoryContent ?? []);

  // Editing state
  let editingRoad = $state<number | null>(null);
  let editType = $state("Stone");
  let editFromType = $state("MainObject");
  let editFromArgs = $state<string[]>(["0"]);
  let editToType = $state("Connection");
  let editToArgs = $state<string[]>([]);

  function startEdit(index: number) {
    const road = roads[index];
    if (!road) return;
    editingRoad = index;
    editType = road.type || "Stone";
    editFromType = road.fromTarget.type || "Crossroads";
    editFromArgs = [...road.fromTarget.args];
    editToType = road.toTarget.type || "Crossroads";
    editToArgs = [...road.toTarget.args];
  }

  function cancelEdit() {
    editingRoad = null;
  }

  function saveEdit() {
    if (editingRoad === null) return;
    editor.updateRoad(editingRoad, {
      roadIndex: editingRoad,
      type: editType,
      from: { type: editFromType, args: editFromArgs },
      to: { type: editToType, args: editToArgs },
    });
    editingRoad = null;
  }

  function deleteRoad(index: number) {
    editor.removeRoad(index);
    if (editingRoad === index) editingRoad = null;
  }

  function targetTypeOptions(): string[] {
    return [...ROAD_TARGET_TYPES];
  }

  function targetArgOptions(targetType: string): { value: string; label: string }[] {
    switch (targetType) {
      case "MainObject":
        return mainObjects.map((o) => ({ value: String(o.index ?? 0), label: `${o.index}: ${o.label}` }));
      case "Connection":
        return touchingConnections.map((c) => ({ value: c.label, label: `${c.label} (${c.type})` }));
      case "MandatoryContent":
        return mandatoryPresets.map((name) => ({ value: name, label: name }));
      default:
        return [];
    }
  }

  function needsArgs(targetType: string): boolean {
    return targetType !== "Crossroads";
  }
</script>

<div class="roads-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its roads.</p>
  {:else}
    <!-- Datalists for road target autocomplete -->
    <datalist id="road-mainobject-args">
      {#each mainObjects as o}<option value={o.index ?? 0} label={o.label}></option>{/each}
    </datalist>
    <datalist id="road-connection-args">
      {#each touchingConnections as c}<option value={c.label} label="{c.type} ({c.from}↔{c.to})"></option>{/each}
    </datalist>
    <datalist id="road-mandatory-args">
      {#each mandatoryPresets as name}<option value={name}></option>{/each}
    </datalist>
    <div class="panel-header">
      <span class="count">{roads.length} road(s)</span>
      <button class="add-btn" onclick={() => editor.addRoad()}>+ Add road</button>
    </div>

    {#if roads.length === 0}
      <p class="placeholder">No roads defined for this zone.</p>
    {:else}
      <ul class="road-list">
        {#each roads as road, ri (road.id)}
          <li class="road-item" class:is-editing={editingRoad === ri}>
            {#if editingRoad === ri}
              <!-- Edit mode -->
              <div class="road-edit">
                <div class="edit-row">
                  <span class="edit-label">Type</span>
                  <select class="input-sm" bind:value={editType}>
                    {#each ROAD_TYPES as rt}<option value={rt}>{rt}</option>{/each}
                  </select>
                </div>
                <div class="edit-row">
                  <span class="edit-label">From</span>
                  <select class="input-sm" bind:value={editFromType}>
                    {#each targetTypeOptions() as tt}<option value={tt}>{tt}</option>{/each}
                  </select>
                  {#if needsArgs(editFromType)}
                    <input type="search" class="input-sm arg-input" bind:value={editFromArgs[0]}
                      list={editFromType === "MainObject" ? "road-mainobject-args" : editFromType === "Connection" ? "road-connection-args" : editFromType === "MandatoryContent" ? "road-mandatory-args" : undefined}
                      placeholder={editFromType === "MainObject" ? "index" : "name"} />
                  {/if}
                </div>
                <div class="edit-row">
                  <span class="edit-label">To</span>
                  <select class="input-sm" bind:value={editToType}>
                    {#each targetTypeOptions() as tt}<option value={tt}>{tt}</option>{/each}
                  {#if needsArgs(editToType)}
                    <input type="search" class="input-sm arg-input" bind:value={editToArgs[0]}
                      list={editToType === "MainObject" ? "road-mainobject-args" : editToType === "Connection" ? "road-connection-args" : editToType === "MandatoryContent" ? "road-mandatory-args" : undefined}
                      placeholder={editToType === "MainObject" ? "index" : "name"} />
                  {/if}
                </div>
                <div class="edit-actions">
                  <button class="button button-secondary button-sm" onclick={saveEdit}>Save</button>
                  <button class="button button-sm" onclick={cancelEdit}>Cancel</button>
                </div>
              </div>
            {:else}
              <!-- Display mode -->
              <button class="road-display" onclick={() => startEdit(ri)}>
                <span class="road-type">{road.type}</span>
                <span class="road-from">{road.fromTarget.type}:{road.fromTarget.args[0] ?? ""}</span>
                <span class="road-arrow">→</span>
                <span class="road-to">{road.toTarget.type}:{road.toTarget.args[0] ?? ""}</span>
              </button>
              <button class="button-icon danger" onclick={() => deleteRoad(ri)} title="Delete road">✕</button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    <!-- Quick reference -->
    <div class="road-reference">
      <span class="ref-title">Road targets</span>
      <div class="ref-grid">
        <span class="ref-type">MainObject</span>
        <span class="ref-desc">Zone-local main object index (0-based)</span>
        <span class="ref-type">Connection</span>
        <span class="ref-desc">Non-Proximity connection touching this zone</span>
        <span class="ref-type">Crossroads</span>
        <span class="ref-desc">Zone road hub (no args)</span>
        <span class="ref-type">MandatoryContent</span>
        <span class="ref-desc">Named entry from zone's mandatory preset</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .roads-panel { display: grid; gap: var(--space-2); padding: var(--space-2); }
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
  .road-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
  .road-item {
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    display: flex; align-items: center;
  }
  .road-item.is-editing { border-color: var(--color-accent); }
  .road-display {
    flex: 1;
    display: flex; align-items: center; gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border: 0; background: transparent;
    font: inherit; font-size: 0.6875rem; cursor: pointer; text-align: left;
    color: inherit;
  }
  .road-display:hover { background: var(--color-panel-2); }
  .road-type { font-weight: 600; min-width: 2.5rem; }
  .road-from, .road-to { font-family: var(--font-mono); font-size: 0.5625rem; color: var(--color-muted); }
  .road-arrow { color: var(--color-muted); font-size: 0.625rem; }
  .road-edit { flex: 1; display: grid; gap: 2px; padding: var(--space-1) var(--space-2); }
  .edit-row { display: flex; align-items: center; gap: var(--space-1); }
  .edit-label { font-size: 0.5625rem; color: var(--color-muted); min-width: 2rem; }
  .edit-actions { display: flex; gap: var(--space-1); padding-top: 2px; }
  .arg-input { flex: 1; }
  .button-icon {
    border: 0; background: transparent; cursor: pointer;
    font-size: 0.75rem; padding: 2px; color: var(--color-muted); line-height: 1;
  }
  .button-icon:hover { color: var(--color-text); }
  .button-icon.danger:hover { color: #e55; }
  .button-sm { font-size: 0.5625rem; padding: 1px var(--space-1); }
  .input-sm {
    font-size: 0.625rem; padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); color: inherit; font-family: inherit;
  }
  .road-reference {
    border-top: var(--line) solid var(--color-line);
    padding-top: var(--space-2);
  }
  .ref-title { font-size: 0.5625rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
  .ref-grid { display: grid; grid-template-columns: auto 1fr; gap: 1px var(--space-2); font-size: 0.5625rem; padding-top: var(--space-1); }
  .ref-type { font-family: var(--font-mono); font-weight: 600; }
  .ref-desc { color: var(--color-muted); }
</style>
