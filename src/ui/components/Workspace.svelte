<script lang="ts">
  import { editor } from "../state/editor.svelte.js";
  import { PLAYER_COLORS } from "../data/shellData.js";

  let zones = $derived(editor.zones);
  let connections = $derived(editor.connections);
  let selectedZoneId = $derived(editor.selectedZone.id);
  let selectedConnId = $derived(editor.selectedConnection?.id);
  let focusedPlayer = $derived(editor.focusedPlayer);

  // Canvas drag state
  let dragging = $state(false);
  let dragZone = $state<string | null>(null);
  let dragOffset = $state({ x: 0, y: 0 });
  let dragPos = $state({ x: 0, y: 0 });

  // Connection drag state
  let connDragging = $state(false);
  let connFromZone = $state<string | null>(null);
  let connMousePos = $state({ x: 0, y: 0 });

  function zonePointerDown(e: PointerEvent, zone: typeof zones[number]) {
    if (e.button !== 0) return;
    if (e.ctrlKey) {
      // Start connection drag
      connDragging = true;
      connFromZone = zone.label;
      const rect = (e.currentTarget as HTMLElement).closest('.canvas-stage')!.getBoundingClientRect();
      connMousePos = { x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 };
      e.preventDefault();
      return;
    }
    // Start zone drag
    dragging = true;
    dragZone = zone.label;
    const rect = (e.currentTarget as HTMLElement).closest('.canvas-stage')!.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    dragOffset = { x: mx - zone.x, y: my - zone.y };
    dragPos = { x: zone.x, y: zone.y };
    editor.selectZoneByName(zone.label);
    e.preventDefault();
  }

  function stagePointerMove(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    if (dragging && dragZone) {
      dragPos = {
        x: Math.max(0, Math.min(90, mx - dragOffset.x)),
        y: Math.max(0, Math.min(90, my - dragOffset.y)),
      };
    }
    if (connDragging) {
      connMousePos = { x: mx, y: my };
    }
  }

  function stagePointerUp() {
    if (dragging && dragZone) {
      editor.moveZone(dragZone, dragPos);
      dragging = false;
      dragZone = null;
    }
    if (connDragging && connFromZone) {
      // Find target zone under pointer
      const target = zones.find((z) => z.label !== connFromZone);
      if (target) editor.addConnectionBetween(connFromZone, target.label);
      connDragging = false;
      connFromZone = null;
    }
  }

  function stageDblClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.stage-node')) return;
    editor.addZone();
  }

  function zoneCenter(zone: typeof zones[number]) {
    return { x: zone.x + 5, y: zone.y + 4 };
  }

  function connectionPath(conn: typeof connections[number]) {
    const from = zones.find((z) => z.id === conn.from);
    const to = zones.find((z) => z.id === conn.to);
    if (!from || !to) return "";
    const a = zoneCenter(from);
    const b = zoneCenter(to);
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
</script>

<div class="workspace">
  <div class="canvas-stage"
    onpointermove={stagePointerMove}
    onpointerup={stagePointerUp}
    ondblclick={stageDblClick}
    role="application"
    aria-label="Map canvas"
  >
    <!-- Connections -->
    <svg class="stage-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      {#each connections as conn (conn.id)}
        <g>
          <path
            class="stage-link-hit"
            d={connectionPath(conn)}
            onclick={() => editor.selectConnectionById(conn.id)}
          />
          <path
            class="stage-link"
            class:is-selected={conn.id === selectedConnId}
            d={connectionPath(conn)}
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

    <!-- Zones -->
    {#each zones as zone (zone.id)}
      {@const ownerColor = zone.owner === "Neutral" ? "#666" : (PLAYER_COLORS[zone.owner] ?? "#888")}
      {@const isSelected = zone.id === selectedZoneId}
      {@const isFocused = focusedPlayer !== undefined && zone.owner === focusedPlayer}
      {@const px = dragging && dragZone === zone.label ? dragPos.x : zone.x}
      {@const py = dragging && dragZone === zone.label ? dragPos.y : zone.y}
      <button
        class="stage-node"
        class:is-selected={isSelected}
        class:is-focused={isFocused}
        style="left:{px}%;top:{py}%;--zone-color:{ownerColor}"
        onpointerdown={(e) => zonePointerDown(e, zone)}
      >
        <strong>{zone.label}</strong>
        <span>{zone.owner} / size {zone.size}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .workspace {
    min-width: 0;
    min-height: 0;
    grid-column: 3;
    grid-row: 1;
    height: 100%;
    overflow: hidden;
    background: var(--color-panel);
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  .canvas-stage {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 20rem;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }
  .stage-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .stage-link {
    fill: none;
    stroke: var(--conn-color, var(--color-connection-default));
    stroke-width: 0.4;
    vector-effect: non-scaling-stroke;
  }
  .stage-link.is-selected {
    stroke-width: 0.8;
    filter: brightness(1.3);
  }
  .stage-link-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: stroke;
    cursor: pointer;
  }
  .conn-draft {
    stroke: var(--color-muted);
    stroke-width: 0.3;
    stroke-dasharray: 1 1;
    vector-effect: non-scaling-stroke;
  }
  .stage-node {
    position: absolute;
    width: 10%;
    min-height: 5%;
    border: var(--line-strong) solid var(--color-line-strong);
    border-left-width: 5px;
    border-left-color: var(--zone-color, #666);
    background: var(--color-panel);
    padding: var(--space-1) var(--space-2);
    cursor: grab;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font: inherit;
    text-align: left;
    color: var(--color-ink);
    transition: box-shadow 0.1s;
  }
  .stage-node:active { cursor: grabbing; }
  .stage-node.is-selected {
    box-shadow: 0 0 0 2px var(--color-focus);
    z-index: 1;
  }
  .stage-node.is-focused {
    box-shadow: 0 0 0 2px var(--color-focus), 0 0 8px 2px color-mix(in srgb, var(--zone-color) 30%, transparent);
  }
  .stage-node strong {
    font-size: 0.6875rem;
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
