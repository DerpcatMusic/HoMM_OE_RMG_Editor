<script lang="ts">
  import { ROAD_TYPES, type RoadTargetType, type RoadType } from "../../../core/rmg/enums.js";
  import type { ShellRoadTargetItem, ShellZoneRoadItem } from "../../data/shellData.js";
  import { editor } from "../../state/editor.svelte.js";

  interface RoadEndpointOption {
    key: string;
    type: RoadTargetType;
    args: string[];
    label: string;
    detail: string;
    icon: string;
  }

  let zone = $derived(editor.selectedZone);
  let connections = $derived(editor.connections);
  let session = $derived(editor.session);
  let roads = $derived(zone.zoneRoads ?? []);
  let activeRoadIndex = $derived(editor.activeRoadIndex);
  let mainObjects = $derived(zone.zoneObjects.filter((object) => object.id.startsWith("main:")));
  let touchingConnections = $derived(
    connections.filter((connection) => connection.type !== "Proximity" && (connection.from === zone.label || connection.to === zone.label)),
  );

  let namedMandatoryEntries = $derived.by(() => {
    const presetNames = new Set(zone.mandatoryContent ?? []);
    const entries: { name: string; sid: string }[] = [];
    for (const preset of session.template.mandatoryContent ?? []) {
      if (!preset.name || !presetNames.has(preset.name)) continue;
      for (const entry of preset.content ?? []) {
        if (entry.name) entries.push({ name: entry.name, sid: entry.sid ?? "" });
      }
    }
    return entries;
  });

  let endpointOptions = $derived.by(() => {
    const options: RoadEndpointOption[] = [
      {
        key: serializeTarget("Crossroads", []),
        type: "Crossroads",
        args: [],
        label: "Hub",
        detail: "Crossroads inside this zone",
        icon: "hub",
      },
    ];

    for (const object of mainObjects) {
      const index = String(object.index ?? (object.id.replace("main:", "") || "0"));
      options.push({
        key: serializeTarget("MainObject", [index]),
        type: "MainObject",
        args: [index],
        label: object.label,
        detail: `Main object ${index}`,
        icon: "castle",
      });
    }

    for (const connection of touchingConnections) {
      const otherZone = connection.from === zone.label ? connection.to : connection.from;
      options.push({
        key: serializeTarget("Connection", [connection.label]),
        type: "Connection",
        args: [connection.label],
        label: connection.label,
        detail: `${otherZone} connection`,
        icon: "door_open",
      });
    }

    for (const entry of namedMandatoryEntries) {
      options.push({
        key: serializeTarget("MandatoryContent", [entry.name]),
        type: "MandatoryContent",
        args: [entry.name],
        label: entry.name,
        detail: entry.sid || "Mandatory content",
        icon: "location_on",
      });
    }

    return options;
  });

  let complexity = $derived.by(() => {
    const hasMandatoryTarget = roads.some((road) => road.fromTarget.type === "MandatoryContent" || road.toTarget.type === "MandatoryContent");
    const hasHub = roads.some((road) => road.fromTarget.type === "Crossroads" || road.toTarget.type === "Crossroads");
    const connectionToConnection = roads.some((road) => road.fromTarget.type === "Connection" && road.toTarget.type === "Connection");
    if (hasMandatoryTarget) return { label: "Named targets", state: "complex" };
    if (hasHub || connectionToConnection) return { label: "Hub layout", state: "hub" };
    if (roads.length > 0) return { label: "Simple exits", state: "simple" };
    return { label: "No roads", state: "empty" };
  });

  let warnings = $derived.by(() => {
    const result: string[] = [];
    const namedSet = new Set(namedMandatoryEntries.map((entry) => entry.name));
    for (const road of roads) {
      for (const side of [road.fromTarget, road.toTarget]) {
        if (side.type !== "MandatoryContent") continue;
        const name = side.args[0];
        if (name && !namedSet.has(name)) {
          result.push(`Mandatory target "${name}" is not named in this zone's preset alternatives.`);
        }
      }
    }
    return result;
  });

  let editingRoad = $state<number | null>(null);
  let lastSyncedRoadIndex = $state<number | null>(null);
  let editType = $state<RoadType>("Stone");
  let editFromKey = $state("");
  let editToKey = $state("");

  $effect(() => {
    const index = activeRoadIndex;
    if (index === lastSyncedRoadIndex) return;
    lastSyncedRoadIndex = index;
    const road = roads.find((item) => item.index === index);
    if (road) {
      syncEditFromRoad(road);
    } else if (index < 0) {
      editingRoad = null;
    }
  });

  function serializeTarget(type: RoadTargetType, args: readonly string[]) {
    return JSON.stringify({ type, args: [...args] });
  }

  function parseTarget(key: string): { type: RoadTargetType; args: string[] } {
    try {
      const parsed = JSON.parse(key) as { type?: string; args?: unknown };
      const type = parsed.type === "MainObject" || parsed.type === "Connection" || parsed.type === "MandatoryContent" || parsed.type === "Crossroads"
        ? parsed.type
        : "Crossroads";
      const args = Array.isArray(parsed.args) ? parsed.args.filter((item): item is string => typeof item === "string") : [];
      return { type, args };
    } catch {
      return { type: "Crossroads", args: [] };
    }
  }

  function targetKey(target: ShellRoadTargetItem) {
    return serializeTarget(target.type as RoadTargetType, target.args);
  }

  function optionForTarget(target: ShellRoadTargetItem) {
    const key = targetKey(target);
    return endpointOptions.find((option) => option.key === key) ?? fallbackOption(target, key);
  }

  function optionsForTarget(target: ShellRoadTargetItem) {
    const key = targetKey(target);
    return endpointOptions.some((option) => option.key === key) ? endpointOptions : [...endpointOptions, fallbackOption(target, key)];
  }

  function fallbackOption(target: ShellRoadTargetItem, key = targetKey(target)): RoadEndpointOption {
    const arg = target.args[0] ?? "";
    return {
      key,
      type: target.type as RoadTargetType,
      args: [...target.args],
      label: arg || target.type,
      detail: target.type === "Crossroads" ? "Hub" : `${target.type} target`,
      icon: targetIcon(target.type),
    };
  }

  function targetIcon(type: string) {
    switch (type) {
      case "MainObject": return "castle";
      case "Connection": return "door_open";
      case "MandatoryContent": return "location_on";
      default: return "hub";
    }
  }

  function syncEditFromRoad(road: ShellZoneRoadItem) {
    editingRoad = road.index;
    editType = (road.type === "Dirt" || road.type === "Stone" ? road.type : "Stone") as RoadType;
    editFromKey = targetKey(road.fromTarget);
    editToKey = targetKey(road.toTarget);
  }

  function startEdit(road: ShellZoneRoadItem) {
    syncEditFromRoad(road);
    editor.selectRoad(road.index);
  }

  function cancelEdit() {
    editingRoad = null;
    editor.clearRoadSelection();
  }

  function saveEdit() {
    if (editingRoad === null) return;
    const from = parseTarget(editFromKey);
    const to = parseTarget(editToKey);
    editor.updateRoad(editingRoad, {
      roadIndex: editingRoad,
      type: editType,
      from,
      to,
    });
    editingRoad = null;
    editor.clearRoadSelection();
  }

  function swapEndpoints() {
    const currentFrom = editFromKey;
    editFromKey = editToKey;
    editToKey = currentFrom;
  }

  function deleteRoad(index: number) {
    editor.removeRoad(index);
    if (editingRoad === index) editingRoad = null;
  }

  function addRoadFromPreset(preset: "simple-exit" | "hub-spoke" | "mine-branches") {
    const mainObject = mainObjects[0];
    const connection = touchingConnections[0];
    switch (preset) {
      case "simple-exit":
        if (!mainObject || !connection) return;
        editor.addRoadBetween({ type: "MainObject", args: [String(mainObject.index ?? 0)] }, { type: "Connection", args: [connection.label] }, "Stone");
        return;
      case "hub-spoke":
        if (!mainObject || touchingConnections.length === 0) return;
        editor.addRoadBetween({ type: "MainObject", args: [String(mainObject.index ?? 0)] }, { type: "Crossroads", args: [] }, "Stone");
        for (const item of touchingConnections) {
          editor.addRoadBetween({ type: "Crossroads", args: [] }, { type: "Connection", args: [item.label] }, "Stone");
        }
        return;
      case "mine-branches":
        for (const entry of namedMandatoryEntries.filter((item) => `${item.name} ${item.sid}`.toLowerCase().includes("mine"))) {
          editor.addRoadBetween({ type: "Crossroads", args: [] }, { type: "MandatoryContent", args: [entry.name] }, "Dirt");
        }
    }
  }

  function optionDisabledMessage() {
    if (mainObjects.length === 0) return "Add a main object first.";
    if (touchingConnections.length === 0) return "Add a non-proximity connection touching this zone.";
    return "";
  }
</script>

<div class="roads-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its roads.</p>
  {:else}
    <div class="road-header">
      <div>
        <h3>Roads</h3>
        <span>{roads.length} defined · {complexity.label}</span>
      </div>
      <button class="icon-command" onclick={() => editor.addRoad()} title="Add road" aria-label="Add road">
        <span class="material-symbols-outlined">add_road</span>
      </button>
    </div>

    {#if warnings.length > 0}
      <div class="road-warnings">
        {#each warnings as warning (warning)}
          <span>{warning}</span>
        {/each}
      </div>
    {/if}

    <div class="road-presets" aria-label="Road presets">
      <button onclick={() => addRoadFromPreset("simple-exit")} disabled={Boolean(optionDisabledMessage())} title={optionDisabledMessage() || "Main object to first connection"}>
        <span class="material-symbols-outlined">exit_to_app</span>
        <span>Exit</span>
      </button>
      <button onclick={() => addRoadFromPreset("hub-spoke")} disabled={Boolean(optionDisabledMessage())} title={optionDisabledMessage() || "Main object through hub to every connection"}>
        <span class="material-symbols-outlined">hub</span>
        <span>Hub</span>
      </button>
      <button onclick={() => addRoadFromPreset("mine-branches")} disabled={namedMandatoryEntries.length === 0} title="Hub to named mine entries">
        <span class="material-symbols-outlined">route</span>
        <span>Mines</span>
      </button>
    </div>

    {#if roads.length === 0}
      <p class="placeholder">No zone-internal roads yet. Add an exit road or draw one in Zone edit.</p>
    {:else}
      <ul class="road-list">
        {#each roads as road (road.id)}
          {@const from = optionForTarget(road.fromTarget)}
          {@const to = optionForTarget(road.toTarget)}
          <li class="road-row" class:is-editing={editingRoad === road.index} class:is-active={activeRoadIndex === road.index}>
            {#if editingRoad === road.index}
              <div class="route-editor">
                <select class="road-kind" bind:value={editType} aria-label="Road type">
                  {#each ROAD_TYPES as type (type)}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
                <select bind:value={editFromKey} aria-label="From endpoint">
                  {#each optionsForTarget(road.fromTarget) as option (option.key)}
                    <option value={option.key}>{option.label} · {option.detail}</option>
                  {/each}
                </select>
                <button class="icon-command route-swap" onclick={swapEndpoints} title="Swap endpoints" aria-label="Swap endpoints">
                  <span class="material-symbols-outlined">swap_horiz</span>
                </button>
                <select bind:value={editToKey} aria-label="To endpoint">
                  {#each optionsForTarget(road.toTarget) as option (option.key)}
                    <option value={option.key}>{option.label} · {option.detail}</option>
                  {/each}
                </select>
                <button class="icon-command" onclick={saveEdit} title="Save road" aria-label="Save road">
                  <span class="material-symbols-outlined">check</span>
                </button>
                <button class="icon-command" onclick={cancelEdit} title="Cancel" aria-label="Cancel">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
            {:else}
              <button class="route-summary" onclick={() => startEdit(road)} title="Edit road">
                <span class="route-type" data-road-type={road.type}>{road.type}</span>
                <span class="endpoint">
                  <span class="material-symbols-outlined">{from.icon}</span>
                  <strong>{from.label}</strong>
                  <small>{from.detail}</small>
                </span>
                <span class="route-arrow material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                <span class="endpoint">
                  <span class="material-symbols-outlined">{to.icon}</span>
                  <strong>{to.label}</strong>
                  <small>{to.detail}</small>
                </span>
              </button>
              <button class="icon-command danger" onclick={() => deleteRoad(road.index)} title="Delete road" aria-label="Delete road">
                <span class="material-symbols-outlined">delete</span>
              </button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    <div class="road-help">
      <span class="material-symbols-outlined">info</span>
      <p>
        Roads connect zone-local endpoints used by the RMG generator: main objects, touching non-proximity connections, the zone hub, or named mandatory-content entries.
      </p>
    </div>
  {/if}
</div>

<style>
  .roads-panel {
    display: grid;
    gap: var(--space-2);
  }
  .placeholder {
    color: var(--color-muted);
    font-size: var(--font-size-sm);
    margin: 0;
  }
  .road-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .road-header h3 {
    margin: 0;
    font-size: var(--font-size-m);
    font-weight: 600;
  }
  .road-header span {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    font-family: var(--font-mono);
  }
  .icon-command {
    width: 1.625rem;
    height: 1.625rem;
    display: grid;
    place-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-ink);
    cursor: pointer;
    padding: 0;
  }
  .icon-command:hover {
    background: var(--color-panel-2);
    border-color: var(--color-line-strong);
  }
  .icon-command:disabled,
  .road-presets button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .icon-command.danger:hover {
    color: var(--color-state-invalid);
  }
  .material-symbols-outlined {
    font-family: var(--font-icon);
    font-size: var(--font-size-m);
    line-height: 1;
  }
  .road-warnings {
    display: grid;
    gap: 2px;
  }
  .road-warnings span {
    padding: 2px var(--space-1);
    border: var(--line) solid color-mix(in srgb, var(--color-state-invalid) 55%, var(--color-line));
    color: var(--color-state-invalid);
    font-size: var(--font-size-xs);
  }
  .road-presets {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-1);
  }
  .road-presets button {
    min-width: 0;
    height: 1.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-ink);
    font: inherit;
    font-size: var(--font-size-xs);
    cursor: pointer;
  }
  .road-presets button:hover {
    background: var(--color-panel-2);
  }
  .road-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: var(--space-1);
  }
  .road-row {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
  }
  .road-row.is-editing {
    grid-template-columns: 1fr;
    border-color: var(--color-line-strong);
    background: var(--color-panel-2);
  }
  .road-row.is-active:not(.is-editing) {
    border-color: var(--color-accent);
    background: var(--color-active);
  }
  .route-summary {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .route-summary:hover {
    background: var(--color-panel-2);
  }
  .route-type {
    padding: 1px var(--space-1);
    border: var(--line) solid var(--color-line);
    font-size: var(--font-size-xxs);
    font-family: var(--font-mono);
  }
  .route-type[data-road-type="Stone"] {
    background: var(--color-active);
  }
  .endpoint {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--space-1);
    align-items: center;
  }
  .endpoint strong,
  .endpoint small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .endpoint strong {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
  .endpoint small {
    grid-column: 2;
    color: var(--color-muted);
    font-size: var(--font-size-xxs);
  }
  .route-arrow {
    color: var(--color-muted);
  }
  .route-editor {
    display: grid;
    grid-template-columns: 4.25rem minmax(0, 1fr) auto minmax(0, 1fr) auto auto;
    gap: var(--space-1);
    padding: var(--space-2);
    align-items: center;
  }
  .route-editor select {
    min-width: 0;
    height: 1.625rem;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-ink);
    font: inherit;
    font-size: var(--font-size-xs);
  }
  .road-kind {
    font-family: var(--font-mono);
  }
  .route-swap {
    color: var(--color-muted);
  }
  .road-help {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-1);
    align-items: start;
    border-top: var(--line) solid var(--color-line);
    padding-top: var(--space-2);
    color: var(--color-muted);
  }
  .road-help p {
    margin: 0;
    font-size: var(--font-size-xs);
    line-height: 1.35;
  }
</style>
