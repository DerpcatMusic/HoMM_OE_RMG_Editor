<script lang="ts">
  import { editor } from "../state/editor.svelte.js";
  import { PLAYER_COLORS } from "../data/shellData.js";
  import { PLAYER_REFS, CONNECTION_TYPES } from "../../core/rmg/enums.js";
  import ContextMenu from "./ContextMenu.svelte";
  let zones = $derived(editor.zones);
  let connections = $derived(editor.connections);
  let selectedZone = $derived(editor.selectedZone);
  let selectedConnId = $derived(editor.selectedConnection?.id);
  let focusedPlayer = $derived(editor.focusedPlayer);
  let workspaceTab = $derived(editor.workspaceTab);
  // Canvas drag state
  let dragging = $state(false);
  let dragZone = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });
  let dragPos = $state({ x: 0, y: 0 });
  // Connection drag state
  let connDragging = $state(false);
  let connFromZone = $state<string | null>(null);
  let connMousePos = $state({ x: 0, y: 0 });
  // Context menu state
  let ctxMenu = $state<{ x: number; y: number; items: Array<{ label: string; icon?: string; onClick: () => void }> } | null>(null);
  function closeCtxMenu() { ctxMenu = null; }
  function zonePointerDown(e: PointerEvent, zone: typeof zones[number]) {
    if (e.button !== 0) return;
    if (e.ctrlKey) {
      connDragging = true;
      connFromZone = zone.label;
      const rect = stageRect(e);
      connMousePos = pct(e, rect);
      e.preventDefault();
      return;
    }
    dragging = true;
    dragZone = zone.label;
    const rect = stageRect(e);
    const p = pct(e, rect);
    dragOffset = { x: p.x - zone.x, y: p.y - zone.y };
    dragPos = { x: zone.x, y: zone.y };
    editor.selectZoneByName(zone.label);
    e.preventDefault();
  }
  function zoneContextMenu(e: MouseEvent, zone: typeof zones[number]) {
    e.preventDefault();
    ctxMenu = {
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Select", icon: "target", onClick: () => editor.selectZoneByName(zone.label) },
        ...PLAYER_REFS.map((p) => ({
          label: `Assign ${p}`,
          icon: "person",
          onClick: () => editor.reassignZoneOwner(zone.label, p),
        })),
        { label: "Assign Neutral", icon: "remove_circle_outline", onClick: () => editor.reassignZoneOwner(zone.label, "Neutral") },
        { label: "Delete zone", icon: "delete", onClick: () => editor.deleteZone(zone.label) },
      ],
    };
  }
  function connContextMenu(e: MouseEvent, conn: typeof connections[number]) {
    e.preventDefault();
    ctxMenu = {
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Select", icon: "target", onClick: () => editor.selectConnectionById(conn.id) },
        ...Array.from(CONNECTION_TYPES).map((type) => ({
          label: `Type: ${type}`,
          icon: "swap_horiz",
          onClick: () => editor.changeConnectionType(conn.id, type),
        })),
        { label: "Delete connection", icon: "delete", onClick: () => editor.deleteConnection(conn.id) },
      ],
    };
  }
  function stagePointerMove(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = pct(e, rect);
    if (dragging && dragZone) {
      dragPos = {
        x: Math.max(2, Math.min(88, p.x - dragOffset.x)),
        y: Math.max(2, Math.min(88, p.y - dragOffset.y)),
      };
    }
    if (connDragging) {
      connMousePos = p;
    }
  }
  function stagePointerUp(e: PointerEvent) {
    if (dragging && dragZone) {
      editor.moveZone(dragZone, dragPos);
      dragging = false;
      dragZone = null;
    }
    if (connDragging && connFromZone) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".stage-node") as HTMLElement | null;
      const targetId = el?.dataset.zoneId;
      if (targetId && targetId !== connFromZone) {
        editor.addConnectionBetween(connFromZone, targetId);
      }
      connDragging = false;
      connFromZone = null;
    }
  }
  function stageDblClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest(".stage-node")) return;
    editor.addZone();
  }
  function stageRect(e: PointerEvent) {
    return (e.currentTarget as HTMLElement).closest(".map-stage")!.getBoundingClientRect();
  }
  function pct(e: PointerEvent, rect: DOMRect) {
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }
  function zonePos(zone: typeof zones[number]) {
    if (dragging && dragZone === zone.label) return dragPos;
    return { x: zone.x, y: zone.y };
  }
  function zoneCenter(zone: typeof zones[number]) {
    const p = zonePos(zone);
    return { x: p.x + 5, y: p.y + 4 };
  }
  function connectionPath(conn: typeof connections[number]) {
    const from = zones.find((z) => z.id === conn.from);
    const to = zones.find((z) => z.id === conn.to);
    if (!from || !to) return "";
    const a = zoneCenter(from);
    const b = zoneCenter(to);
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  function onConnKeydown(e: KeyboardEvent, connId: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      editor.selectConnectionById(connId);
    }
  }
</script>
<div class="workspace">
  <div class="workspace-tabs" role="tablist" aria-label="Workspace mode">
    <button class="tab-button" class:is-active={workspaceTab === "canvas"} onclick={() => editor.setWorkspaceTab("canvas")}>
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">globe</span>
      <span class="tab-label">Canvas</span>
    </button>
    <button class="tab-button" class:is-active={workspaceTab === "zoneEdit"} onclick={() => editor.setWorkspaceTab("zoneEdit")}>
      <span class="material-symbols-outlined tab-icon" aria-hidden="true">edit_square</span>
      <span class="tab-label">Zone edit</span>
    </button>
  </div>
  {#if workspaceTab === "canvas"}
    <section class="workspace-panel canvas-panel">
      <div class="workspace-bar">
        <div>
          <h2>Zone graph</h2>
          <span>Selected: {selectedZone.label}</span>
        </div>
        <div class="bar-actions">
          <button class="button button-secondary" onclick={() => editor.addZone()}>Add zone</button>
          <button class="button button-secondary" onclick={() => editor.addConnection()}>Add connection</button>
        </div>
      </div>
      <div class="map-stage"
        onpointermove={stagePointerMove}
        onpointerup={stagePointerUp}
        ondblclick={stageDblClick}
        role="application"
        aria-label="Map canvas"
      >
        <svg class="stage-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {#each connections as conn (conn.id)}
            <g>
              <path
                class="stage-link-hit"
                d={connectionPath(conn)}
                onclick={() => editor.selectConnectionById(conn.id)}
                oncontextmenu={(e) => connContextMenu(e, conn)}
                role="button"
                tabindex="0"
                aria-label="{conn.id} ({conn.type})"
                onkeydown={(e) => onConnKeydown(e, conn.id)}
              />
              <path
                class="stage-link"
                class:is-selected={conn.id === selectedConnId}
                d={connectionPath(conn)}
                data-connection-type={conn.type}
                style="--conn-color: var(--color-connection-{conn.type?.toLowerCase() ?? 'default'})"
              />
            </g>
          {/each}
          {#if connDragging && connFromZone}
            {@const from = zones.find((z) => z.label === connFromZone)}
            {#if from}
              {@const c = zoneCenter(from)}
              <line class="conn-draft" x1={c.x} y1={c.y} x2={connMousePos.x} y2={connMousePos.y} />
            {/if}
          {/if}
        </svg>
        {#each zones as zone (zone.id)}
          {@const ownerColor = zone.owner === "Neutral" ? "#666" : (PLAYER_COLORS[zone.owner] ?? "#888")}
          {@const isSelected = zone.id === selectedZone.id}
          {@const isFocused = focusedPlayer !== undefined && zone.owner === focusedPlayer}
          {@const p = zonePos(zone)}
          <button
            type="button"
            class="stage-node"
            class:is-selected={isSelected}
            class:is-focused={isFocused}
            data-zone-id={zone.label}
            data-zone-role={zone.role}
            data-focused-owner={isFocused}
            style="left:{p.x}%;top:{p.y}%;--zone-color:{ownerColor}"
            onpointerdown={(e) => zonePointerDown(e, zone)}
            oncontextmenu={(e) => zoneContextMenu(e, zone)}
          >
            <strong>{zone.label}</strong>
            <span>{zone.owner} / size {zone.size}</span>
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <section class="workspace-panel zone-edit-panel">
      <div class="workspace-bar">
        <div>
          <h2>{selectedZone.label} internals</h2>
          <span>Main objects {selectedZone.mainObjectCount} / roads {selectedZone.roadCount}</span>
        </div>
        <div class="bar-actions">
          <button class="button button-secondary" onclick={() => editor.addMainObjectToSelectedZone()}>Add main object</button>
          <button class="button button-secondary" onclick={() => editor.addDefaultRoadToSelectedZone()}>Add road</button>
        </div>
      </div>
      <p class="conditional-note">Road lines are parsed from zone.roads[] targets: crossroads, main objects, connections, and mandatory content.</p>
      <div class="zone-stage">
        <div class="stage-grid"></div>
        <!-- TODO: zone object nodes and roads -->
      </div>
      <div class="zone-internals-summary">
        <div>
          <strong>Main objects</strong>
          <span>{selectedZone.zoneObjects.filter((o) => o.id.startsWith("main:")).map((o) => `${o.index}: ${o.type}`).join(" / ") || "none"}</span>
        </div>
        <div>
          <strong>Roads</strong>
          <span>{selectedZone.zoneRoads.map((r) => `${r.type}: ${r.fromId} -> ${r.toId}`).join(" / ") || "none"}</span>
        </div>
        <div>
          <strong>Edit</strong>
          <span>Use Inspector > Objects or Inspector > Roads for properties.</span>
        </div>
      </div>
    </section>
  {/if}
</div>
{#if ctxMenu}
  <ContextMenu {...ctxMenu} onClose={closeCtxMenu} />
{/if}

<style>
  .workspace {
    min-width: 0;
    min-height: 0;
    grid-column: 3;
    grid-row: 1;
    overflow: hidden;
    background: var(--color-panel);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .workspace-panel {
    min-height: 0;
    overflow: hidden;
    display: grid;
  }
  .canvas-panel {
    grid-template-rows: auto minmax(0, 1fr);
  }
  .zone-edit-panel {
    grid-template-rows: auto auto minmax(0, 1fr) auto;
  }
  .map-stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }
  .zone-stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }
  .stage-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(to right, var(--color-line) 1px, transparent 1px),
      linear-gradient(to bottom, var(--color-line) 1px, transparent 1px);
    background-size: 10% 10%;
    opacity: 0.15;
  }
  .stage-svg {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .stage-link {
    fill: none;
    stroke: var(--conn-color, var(--color-connection-default));
    stroke-width: 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  .stage-link.is-selected {
    stroke-width: 6;
  }
  .stage-link-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 12;
    vector-effect: non-scaling-stroke;
    pointer-events: stroke;
    cursor: pointer;
  }
  .conn-draft {
    stroke: var(--color-muted);
    stroke-width: 3;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }
  .stage-node {
    position: absolute;
    z-index: 2;
    width: 10.5rem;
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2);
    text-align: left;
    touch-action: none;
    border: var(--line) solid var(--color-line-strong);
    border-radius: 0;
    border-left: 5px solid var(--zone-color, #666);
    background: var(--color-panel);
    cursor: grab;
    font: inherit;
    color: var(--color-ink);
    transition: box-shadow 0.1s;
  }
  .stage-node:hover { background: var(--color-panel-2); }
  .stage-node:active { cursor: grabbing; }
  .stage-node.is-selected {
    background: var(--color-active);
    outline: var(--line-strong) solid var(--color-line-strong);
    box-shadow: 0 0 0 2px var(--color-focus);
    z-index: 3;
  }
  .stage-node.is-focused {
    outline: 3px solid var(--zone-color, #888);
    outline-offset: 2px;
    box-shadow: 0 0 14px 2px var(--zone-color);
    z-index: 10;
  }
  .stage-node strong {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stage-node span {
    font-size: 0.5625rem;
    color: var(--color-muted);
  }
</style>