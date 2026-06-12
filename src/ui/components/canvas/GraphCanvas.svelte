<script lang="ts">
  import { CONNECTION_TYPES, PLAYER_REFS } from "../../../core/rmg/enums.js";
  import { PLAYER_COLORS, type ShellConnectionItem, type ShellZoneItem } from "../../data/shellData.js";
  import { editor } from "../../state/editor.svelte.js";
  import ContextMenu from "../ContextMenu.svelte";
  import { createContextMenuState } from "../contextMenu.svelte.js";
  import CanvasHitPath from "./CanvasHitPath.svelte";
  import CanvasSvgLayer from "./CanvasSvgLayer.svelte";
  import { clampCanvasPoint, linePath, pointerPercent, type CanvasPoint } from "./canvasGeometry.js";

  let zones = $derived(editor.zones);
  let connections = $derived(editor.connections);
  let selectedZone = $derived(editor.selectedZone);
  let selectedConnId = $derived(editor.selectedConnection?.id);
  let focusedPlayer = $derived(editor.focusedPlayer);

  let dragging = $state(false);
  let dragZone = $state<string | null>(null);
  let dragOffset = $state<CanvasPoint>({ x: 0, y: 0 });
  let dragPos = $state<CanvasPoint>({ x: 0, y: 0 });

  let connDragging = $state(false);
  let connFromZone = $state<string | null>(null);
  let connMousePos = $state<CanvasPoint>({ x: 0, y: 0 });

  const contextMenu = createContextMenuState();
  let ctxMenu = $derived(contextMenu.current);

  function stageRect(event: PointerEvent) {
    return (event.currentTarget as HTMLElement).closest(".map-stage")!.getBoundingClientRect();
  }

  function zonePointerDown(event: PointerEvent, zone: ShellZoneItem) {
    if (event.button !== 0) return;
    const rect = stageRect(event);
    const point = pointerPercent(event, rect);

    if (event.ctrlKey) {
      connDragging = true;
      connFromZone = zone.label;
      connMousePos = point;
      event.preventDefault();
      return;
    }

    dragging = true;
    dragZone = zone.label;
    dragOffset = { x: point.x - zone.x, y: point.y - zone.y };
    dragPos = { x: zone.x, y: zone.y };
    editor.selectZoneByName(zone.label);
    event.preventDefault();
  }

  function zoneContextMenu(event: MouseEvent, zone: ShellZoneItem) {
    contextMenu.open(event, [
      { label: "Select", icon: "target", onClick: () => editor.selectZoneByName(zone.label) },
      ...PLAYER_REFS.map((player) => ({
        label: `Assign ${player}`,
        icon: "person",
        onClick: () => editor.reassignOwner(zone.label, player),
      })),
      { label: "Assign Neutral", icon: "remove_circle_outline", onClick: () => editor.reassignOwner(zone.label, "Neutral") },
      { label: "Delete zone", icon: "delete", onClick: () => editor.deleteZone(zone.label) },
    ]);
  }

  function connContextMenu(event: MouseEvent, connection: ShellConnectionItem) {
    contextMenu.open(event, [
      { label: "Select", icon: "target", onClick: () => editor.selectConnectionById(connection.id) },
      ...Array.from(CONNECTION_TYPES).map((type) => ({
        label: `Type: ${type}`,
        icon: "swap_horiz",
        onClick: () => editor.changeConnectionType(connection.id, type),
      })),
      { label: "Delete connection", icon: "delete", onClick: () => editor.deleteConnection(connection.id) },
    ]);
  }

  function stagePointerMove(event: PointerEvent) {
    const point = pointerPercent(event, (event.currentTarget as HTMLElement).getBoundingClientRect());
    if (dragging && dragZone) {
      dragPos = clampCanvasPoint({ x: point.x - dragOffset.x, y: point.y - dragOffset.y }, { minX: 2, maxX: 88, minY: 2, maxY: 88 });
    }
    if (connDragging) {
      connMousePos = point;
    }
  }

  function stagePointerUp(event: PointerEvent) {
    if (dragging && dragZone) {
      editor.moveZone(dragZone, dragPos);
      dragging = false;
      dragZone = null;
    }
    if (connDragging && connFromZone) {
      const el = document.elementFromPoint(event.clientX, event.clientY)?.closest(".stage-node") as HTMLElement | null;
      const targetId = el?.dataset.zoneId;
      if (targetId && targetId !== connFromZone) {
        editor.addConnectionBetween(connFromZone, targetId);
      }
      connDragging = false;
      connFromZone = null;
    }
  }

  function stageDblClick(event: MouseEvent) {
    if ((event.target as Element).closest(".stage-node, .stage-link-hit")) return;
    editor.addZone();
  }

  function zonePos(zone: ShellZoneItem) {
    if (dragging && dragZone === zone.label) return dragPos;
    return { x: zone.x, y: zone.y };
  }

  function zoneCenter(zone: ShellZoneItem) {
    return zonePos(zone);
  }

  function connectionPath(connection: ShellConnectionItem) {
    const from = zones.find((zone) => zone.id === connection.from);
    const to = zones.find((zone) => zone.id === connection.to);
    if (!from || !to) return "";
    return linePath(zoneCenter(from), zoneCenter(to));
  }
</script>

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
  <div
    class="map-stage"
    onpointermove={stagePointerMove}
    onpointerup={stagePointerUp}
    ondblclick={stageDblClick}
    oncontextmenu={(event) => {
      if ((event.target as HTMLElement).closest(".stage-node, .stage-link-hit")) return;
      contextMenu.open(event, [
        { label: "Add zone", icon: "add_circle", onClick: () => editor.addZone() },
        { label: "Add connection", icon: "link", onClick: () => editor.addConnection() },
      ]);
    }}
    role="application"
    aria-label="Map canvas"
  >
    <CanvasSvgLayer>
      {#each connections as connection (connection.id)}
        <g>
          <CanvasHitPath
            class="stage-link-hit"
            d={connectionPath(connection)}
            onclick={() => editor.selectConnectionById(connection.id)}
            oncontextmenu={(event) => connContextMenu(event, connection)}
            label={`${connection.id} (${connection.type})`}
          />
          <path
            class="stage-link"
            class:is-selected={connection.id === selectedConnId}
            d={connectionPath(connection)}
            data-connection-type={connection.type}
            style="--conn-color: var(--color-connection-{connection.type?.toLowerCase() ?? 'default'})"
          />
        </g>
      {/each}
      {#if connDragging && connFromZone}
        {@const from = zones.find((zone) => zone.label === connFromZone)}
        {#if from}
          {@const center = zoneCenter(from)}
          <line class="conn-draft" x1={center.x} y1={center.y} x2={connMousePos.x} y2={connMousePos.y} />
        {/if}
      {/if}
    </CanvasSvgLayer>
    {#each zones as zone (zone.id)}
      {@const ownerColor = zone.owner === "Neutral" ? "#666" : (PLAYER_COLORS[zone.owner] ?? "#888")}
      {@const isSelected = zone.id === selectedZone.id}
      {@const isFocused = focusedPlayer !== undefined && zone.owner === focusedPlayer}
      {@const point = zonePos(zone)}
      <button
        type="button"
        class="stage-node"
        class:is-selected={isSelected}
        class:is-focused={isFocused}
        data-zone-id={zone.label}
        data-zone-role={zone.role}
        data-focused-owner={isFocused}
        style="left:{point.x}%;top:{point.y}%;--zone-color:{ownerColor}"
        onpointerdown={(event) => zonePointerDown(event, zone)}
        oncontextmenu={(event) => zoneContextMenu(event, zone)}
      >
        <strong>{zone.label}</strong>
        <span>{zone.owner} / size {zone.size}</span>
      </button>
    {/each}
  </div>
</section>

{#if ctxMenu}
  <ContextMenu {...ctxMenu} onClose={() => contextMenu.close()} />
{/if}

<style>
  .canvas-panel {
    grid-template-rows: auto minmax(0, 1fr);
  }
  .map-stage {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    user-select: none;
    touch-action: none;
  }
  :global(.stage-link) {
    fill: none;
    stroke: var(--conn-color, var(--color-connection-default));
    stroke-width: 4;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  :global(.stage-link.is-selected) {
    stroke-width: 6;
  }
  :global(.conn-draft) {
    stroke: var(--color-muted);
    stroke-width: 3;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }
  .stage-node {
    position: absolute;
    z-index: 2;
    width: 10.5rem;
    transform: translate(-50%, -50%);
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
    font-size: var(--font-size-m);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .stage-node span {
    font-size: var(--font-size-xxs);
    color: var(--color-muted);
  }
</style>
