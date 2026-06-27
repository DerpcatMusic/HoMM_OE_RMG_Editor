<script lang="ts">
  import { CONNECTION_TYPES, PLAYER_REFS } from "../../../core/rmg/enums.js";
  import { PLAYER_COLORS, type ShellConnectionItem, type ShellZoneItem } from "../../data/shellData.js";
  import { editor } from "../../state/editor.svelte.js";
  import ContextMenu from "../ContextMenu.svelte";
  import { createContextMenuState } from "../contextMenu.svelte.js";
  import CanvasHitPath from "./CanvasHitPath.svelte";
  import CanvasSvgLayer from "./CanvasSvgLayer.svelte";
  import { clampCanvasPoint, linePath, pointerPercent, type CanvasPoint } from "./canvasGeometry.js";

  const AXIS_TICKS = [0, 25, 50, 75, 100] as const;

  let zones = $derived(editor.zones);
  let connections = $derived(editor.connections);
  let selectedZone = $derived(editor.selectedZone);
  let selectedConnId = $derived(editor.selectedConnection?.id);
  let focusedPlayer = $derived(editor.focusedPlayer);
  let zoom = $state(1);
  let showGrid = $state(true);
  let showConnectionLabels = $state(true);

  let dragging = $state(false);
  let dragZone = $state<string | null>(null);
  let dragOffset = $state<CanvasPoint>({ x: 0, y: 0 });
  let dragPos = $state<CanvasPoint>({ x: 0, y: 0 });

  let connDragging = $state(false);
  let connFromZone = $state<string | null>(null);
  let connMousePos = $state<CanvasPoint>({ x: 0, y: 0 });
  let connSnapZoneId = $state<string | null>(null);

  const contextMenu = createContextMenuState();
  let ctxMenu = $derived(contextMenu.current);

  function stageElement(event: PointerEvent): HTMLElement {
    return (event.currentTarget as HTMLElement).closest(".map-stage")!;
  }

  function stagePoint(event: PointerEvent): CanvasPoint {
    const raw = pointerPercent(event, stageElement(event).getBoundingClientRect());
    return {
      x: (raw.x - 50) / zoom + 50,
      y: (raw.y - 50) / zoom + 50,
    };
  }

  function zonePointerDown(event: PointerEvent, zone: ShellZoneItem) {
    if (event.button !== 0) return;
    const point = stagePoint(event);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);

    if (event.ctrlKey) {
      connDragging = true;
      connFromZone = zone.label;
      connMousePos = point;
      connSnapZoneId = null;
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

  function zonePointerMove(event: PointerEvent) {
    if (!dragging && !connDragging) return;
    stagePointerMove(event);
    event.stopPropagation();
    event.preventDefault();
  }

  function zonePointerUp(event: PointerEvent) {
    if (!dragging && !connDragging) return;
    stagePointerUp(event);
    event.stopPropagation();
    event.preventDefault();
  }

  function zoneContextMenu(event: MouseEvent, zone: ShellZoneItem) {
    contextMenu.open(event, [
      { label: "Select", icon: "target", onClick: () => editor.selectZoneByName(zone.label) },
      { label: "Duplicate zone", icon: "content_copy", onClick: () => editor.duplicateZone(zone.label) },
      ...PLAYER_REFS.map((player) => ({
        label: `Assign ${player}`,
        icon: "person",
        onClick: () => editor.reassignOwner(zone.label, player),
      })),
      { label: "Assign Neutral", icon: "remove_circle_outline", onClick: () => editor.reassignOwner(zone.label, "Neutral") },
      { label: "Delete zone", icon: "delete", variant: "danger", onClick: () => editor.deleteZone(zone.label) },
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
      { label: "Delete connection", icon: "delete", variant: "danger", onClick: () => editor.deleteConnection(connection.id) },
    ]);
  }

  function stagePointerMove(event: PointerEvent) {
    const point = stagePoint(event);
    if (dragging && dragZone) {
      dragPos = clampCanvasPoint({ x: point.x - dragOffset.x, y: point.y - dragOffset.y }, { minX: 2, maxX: 88, minY: 2, maxY: 88 });
    }
    if (connDragging) {
      connMousePos = point;
      connSnapZoneId = nearestZoneId(point, connFromZone);
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
      const targetId = connSnapZoneId ?? el?.dataset.zoneId;
      if (targetId && targetId !== connFromZone) {
        editor.addConnectionBetween(connFromZone, targetId);
      }
      connDragging = false;
      connFromZone = null;
      connSnapZoneId = null;
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

  function nearestZoneId(point: CanvasPoint, excludeId: string | null): string | null {
    let closest: { id: string; distance: number } | null = null;
    for (const zone of zones) {
      if (zone.label === excludeId) continue;
      const pos = zonePos(zone);
      const dx = point.x - pos.x;
      const dy = point.y - pos.y;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 8) continue;
      const distance = dx * dx + dy * dy;
      if (!closest || distance < closest.distance) closest = { id: zone.label, distance };
    }
    return closest?.id ?? null;
  }

  function connectionPath(connection: ShellConnectionItem) {
    const from = zones.find((zone) => zone.id === connection.from);
    const to = zones.find((zone) => zone.id === connection.to);
    if (!from || !to) return "";
    return linePath(zoneCenter(from), zoneCenter(to));
  }

  function connectionMidpoint(connection: ShellConnectionItem): CanvasPoint {
    const from = zones.find((zone) => zone.id === connection.from);
    const to = zones.find((zone) => zone.id === connection.to);
    if (!from || !to) return { x: 50, y: 50 };
    const a = zoneCenter(from);
    const b = zoneCenter(to);
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function compactNumber(value: number | undefined): string {
    if (value === undefined || !Number.isFinite(value)) return "";
    const abs = Math.abs(value);
    if (abs >= 1_000_000) return `${trimNumber(value / 1_000_000)}m`;
    if (abs >= 1_000) return `${trimNumber(value / 1_000)}k`;
    return String(Math.round(value));
  }

  function trimNumber(value: number): string {
    const fixed = Math.abs(value) >= 10 ? value.toFixed(0) : value.toFixed(1);
    return fixed.replace(/\.0$/u, "");
  }

  function zoneTotalValue(zone: ShellZoneItem): number | undefined {
    const values = [zone.guardedContentValue, zone.unguardedContentValue, zone.resourcesValue]
      .filter((value): value is number => value !== undefined && Number.isFinite(value));
    if (values.length === 0) return undefined;
    return values.reduce((sum, value) => sum + value, 0);
  }

  function valueTier(value: number | undefined): string {
    if (value === undefined) return "unset";
    if (value >= 1_000_000) return "mythic";
    if (value >= 250_000) return "rich";
    if (value >= 75_000) return "solid";
    if (value > 0) return "light";
    return "empty";
  }

  function connectionValueLabel(connection: ShellConnectionItem): string {
    if (connection.type === "Proximity") {
      return connection.length !== undefined ? `L ${trimNumber(connection.length)}` : "spring";
    }
    return connection.guardValue !== undefined ? compactNumber(connection.guardValue) : "open";
  }

  function connectionMetaLabel(connection: ShellConnectionItem): string {
    const bits = [connection.type || "Default"];
    if (connection.road !== false && connection.type !== "Proximity") bits.push("road");
    if (connection.guardWeeklyIncrement !== undefined) bits.push(`+${compactNumber(connection.guardWeeklyIncrement)}/w`);
    return bits.join(" / ");
  }

  function setZoom(nextZoom: number) {
    zoom = Math.max(0.75, Math.min(1.85, Number(nextZoom.toFixed(2))));
  }

  function resetViewport() {
    zoom = 1;
    showGrid = true;
    showConnectionLabels = true;
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
      <button class="button button-secondary" onclick={() => editor.addConnection()}>Connect zones</button>
    </div>
  </div>
  <div class="map-stage-shell">
    <div class="canvas-tools" aria-label="Canvas view controls">
      <button type="button" title="Zoom out" onclick={() => setZoom(zoom - 0.15)}>-</button>
      <span>{Math.round(zoom * 100)}%</span>
      <button type="button" title="Zoom in" onclick={() => setZoom(zoom + 0.15)}>+</button>
      <button type="button" title="Reset canvas view" onclick={resetViewport}>fit</button>
      <button type="button" class:is-active={showGrid} title="Toggle grid" onclick={() => { showGrid = !showGrid; }}>grid</button>
      <button type="button" class:is-active={showConnectionLabels} title="Toggle connection labels" onclick={() => { showConnectionLabels = !showConnectionLabels; }}>labels</button>
    </div>
    <div class="canvas-legend" aria-label="Canvas legend">
      <span><i class="legend-line is-direct"></i>passage</span>
      <span><i class="legend-line is-portal"></i>portal</span>
      <span><i class="legend-line is-proximity"></i>spring</span>
      <span><i class="legend-chip"></i>value tier</span>
    </div>
    <div class="axis axis-x" aria-hidden="true">
      {#each AXIS_TICKS as tick (tick)}
        <span style="left:{tick}%">{tick}</span>
      {/each}
    </div>
    <div class="axis axis-y" aria-hidden="true">
      {#each AXIS_TICKS as tick (tick)}
        <span style="top:{tick}%">{tick}</span>
      {/each}
    </div>
    <div
      class="map-stage"
      onpointermove={stagePointerMove}
      onpointerup={stagePointerUp}
      ondblclick={stageDblClick}
      oncontextmenu={(event) => {
        if ((event.target as HTMLElement).closest(".stage-node, .stage-link-hit, .connection-label")) return;
        contextMenu.open(event, [
          { label: "Add zone", icon: "add_circle", onClick: () => editor.addZone() },
          { label: "Connect zones", icon: "link", onClick: () => editor.addConnection() },
        ]);
      }}
      role="application"
      aria-label="Map canvas"
      data-grid={showGrid}
    >
      <div class="stage-corner" aria-hidden="true">x / z</div>
      <div class="map-content" style="--canvas-zoom:{zoom}">
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
                data-has-road={connection.road !== false}
                style="--conn-color: var(--color-connection-{connection.type?.toLowerCase() ?? 'default'})"
              />
            </g>
          {/each}
          {#if connDragging && connFromZone}
            {@const from = zones.find((zone) => zone.label === connFromZone)}
            {@const snap = connSnapZoneId ? zones.find((zone) => zone.label === connSnapZoneId) : undefined}
            {#if from}
              {@const center = zoneCenter(from)}
              {@const snapCenter = snap ? zoneCenter(snap) : undefined}
              <line class="conn-draft" x1={center.x} y1={center.y} x2={snapCenter?.x ?? connMousePos.x} y2={snapCenter?.y ?? connMousePos.y} />
            {/if}
          {/if}
        </CanvasSvgLayer>
        {#if showConnectionLabels}
          {#each connections as connection (connection.id)}
            {@const labelPoint = connectionMidpoint(connection)}
            <button
              type="button"
              class="connection-label"
              class:is-selected={connection.id === selectedConnId}
              data-connection-type={connection.type}
              style="left:{labelPoint.x}%;top:{labelPoint.y}%;--conn-color: var(--color-connection-{connection.type?.toLowerCase() ?? 'default'})"
              onclick={() => editor.selectConnectionById(connection.id)}
              oncontextmenu={(event) => connContextMenu(event, connection)}
              title={`${connection.label}: ${connectionMetaLabel(connection)}`}
            >
              <strong>{connectionValueLabel(connection)}</strong>
              <span>{connectionMetaLabel(connection)}</span>
            </button>
          {/each}
        {/if}
        {#each zones as zone (zone.id)}
          {@const ownerColor = zone.owner === "Neutral" ? "#666" : (PLAYER_COLORS[zone.owner] ?? "#888")}
          {@const isSelected = zone.id === selectedZone.id}
          {@const isFocused = focusedPlayer !== undefined && zone.owner === focusedPlayer}
          {@const isConnSnap = connDragging && connSnapZoneId === zone.label}
          {@const point = zonePos(zone)}
          {@const totalValue = zoneTotalValue(zone)}
          <button
            type="button"
            class="stage-node"
            class:is-selected={isSelected}
            class:is-focused={isFocused}
            class:is-conn-snap={isConnSnap}
            data-zone-id={zone.label}
            data-zone-role={zone.role}
            data-value-tier={valueTier(totalValue)}
            data-focused-owner={isFocused}
            style="left:{point.x}%;top:{point.y}%;--zone-color:{ownerColor}"
            onpointerdown={(event) => zonePointerDown(event, zone)}
            onpointermove={zonePointerMove}
            onpointerup={zonePointerUp}
            oncontextmenu={(event) => zoneContextMenu(event, zone)}
          >
            <span class="zone-topline">
              <span class="zone-owner-dot"></span>
              <span class="zone-role">{zone.role}</span>
              <span class="zone-size">size {zone.size}</span>
            </span>
            <strong class="zone-name">{zone.label}</strong>
            <span class="zone-value-row">
              <span class="zone-total" title="Total guarded, unguarded, and resource value">
                {totalValue === undefined ? "value n/a" : `value ${compactNumber(totalValue)}`}
              </span>
              <span class="zone-objects" title="Main objects and roads">
                {zone.mainObjectCount} obj / {zone.roadCount} road
              </span>
            </span>
            <span class="zone-metrics" aria-label="Zone content metrics">
              <span title="Guarded content value">G {compactNumber(zone.guardedContentValue) || "n/a"}</span>
              <span title="Unguarded content value">U {compactNumber(zone.unguardedContentValue) || "n/a"}</span>
              <span title="Resource content value">R {compactNumber(zone.resourcesValue) || "n/a"}</span>
              <span title="Pool alternatives">P {zone.guardedPools.length + zone.unguardedPools.length + zone.resourcesPools.length}</span>
            </span>
          </button>
        {/each}
      </div>
      <div class="canvas-summary" aria-label="Template graph summary">
        <span>{zones.length} zones</span>
        <span>{connections.length} connections</span>
        <span>{connections.filter((connection) => connection.type === "Proximity").length} springs</span>
        <span>{connections.filter((connection) => connection.road !== false && connection.type !== "Proximity").length} roads</span>
      </div>
    </div>
  </div>
</section>

{#if ctxMenu}
  <ContextMenu {...ctxMenu} onClose={() => contextMenu.close()} />
{/if}

<style>
  .canvas-panel {
    grid-template-rows: auto minmax(0, 1fr);
  }
  .map-stage-shell {
    position: relative;
    min-height: 0;
    overflow: hidden;
    background: var(--color-panel-2);
    border-top: var(--line) solid var(--color-line-strong);
  }
  .canvas-tools,
  .canvas-legend,
  .canvas-summary {
    position: absolute;
    z-index: 8;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
  }
  .canvas-tools {
    top: var(--space-2);
    right: var(--space-3);
  }
  .canvas-tools button {
    min-width: 1.75rem;
    height: 1.5rem;
    padding: 0 var(--space-1);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    color: var(--color-ink);
    cursor: pointer;
    font: inherit;
  }
  .canvas-tools button:hover,
  .canvas-tools button.is-active {
    background: var(--color-active);
  }
  .canvas-tools > span {
    min-width: 2.5rem;
    text-align: center;
    color: var(--color-muted);
  }
  .canvas-legend {
    left: 2.25rem;
    bottom: 0.75rem;
    padding: 0.1875rem var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
  }
  .canvas-legend span,
  .canvas-summary span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    white-space: nowrap;
  }
  .legend-line {
    width: 1.25rem;
    height: 0;
    border-top: 3px solid var(--color-connection-direct);
  }
  .legend-line.is-portal {
    border-top-color: var(--color-connection-portal);
    border-top-style: dashed;
  }
  .legend-line.is-proximity {
    border-top-color: var(--color-connection-proximity);
    border-top-style: dashed;
  }
  .legend-chip {
    width: 1.25rem;
    height: 0.25rem;
    background: var(--color-state-uncertain);
    border: var(--line) solid var(--color-line-strong);
  }
  .map-stage {
    position: relative;
    width: calc(100% - 3rem);
    height: calc(100% - 2.5rem);
    margin: 2rem 1rem 0.5rem 2rem;
    overflow: hidden;
    user-select: none;
    touch-action: none;
    background-color: var(--color-panel);
    background-image:
      linear-gradient(to right, color-mix(in oklch, var(--color-line) 42%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in oklch, var(--color-line) 42%, transparent) 1px, transparent 1px),
      linear-gradient(to right, color-mix(in oklch, var(--color-line-strong) 34%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in oklch, var(--color-line-strong) 34%, transparent) 1px, transparent 1px);
    background-size: 5% 5%, 5% 5%, 25% 25%, 25% 25%;
    border: var(--line-strong) solid var(--color-line-strong);
    box-shadow: inset 0 0 0 var(--line) var(--color-panel);
  }
  .map-stage[data-grid="false"] {
    background-image: none;
  }
  .map-content {
    position: absolute;
    inset: 0;
    transform: scale(var(--canvas-zoom, 1));
    transform-origin: 50% 50%;
  }
  .canvas-summary {
    right: var(--space-2);
    bottom: var(--space-2);
    padding: 0.1875rem var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
  }
  .stage-corner {
    position: absolute;
    top: var(--space-1);
    left: var(--space-1);
    z-index: 4;
    padding: 0 var(--space-1);
    background: var(--color-panel);
    border: var(--line) solid var(--color-line);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    pointer-events: none;
  }
  .axis {
    position: absolute;
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    pointer-events: none;
    z-index: 4;
  }
  .axis span {
    position: absolute;
    transform: translate(-50%, -50%);
  }
  .axis-x {
    left: 2rem;
    right: 1rem;
    top: 0.85rem;
    height: 1rem;
    border-bottom: var(--line) solid var(--color-line-strong);
  }
  .axis-x span::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 0.7rem;
    height: 0.5rem;
    border-left: var(--line) solid var(--color-line-strong);
  }
  .axis-y {
    top: 2rem;
    bottom: 0.5rem;
    left: 0.7rem;
    width: 1rem;
    border-right: var(--line) solid var(--color-line-strong);
  }
  .axis-y span::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 0.7rem;
    width: 0.5rem;
    border-top: var(--line) solid var(--color-line-strong);
  }
  :global(.stage-link) {
    fill: none;
    stroke: var(--conn-color, var(--color-connection-default));
    stroke-width: 5;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
  }
  :global(.stage-link.is-selected) {
    stroke-width: 8;
    filter: drop-shadow(0 0 2px var(--color-focus));
  }
  :global(.stage-link[data-connection-type="Proximity"]) {
    stroke-dasharray: 5 5;
    stroke-width: 3;
  }
  :global(.stage-link[data-connection-type="Portal"]) {
    stroke-dasharray: 12 4;
  }
  :global(.stage-link[data-connection-type="GladiatorArena"]) {
    stroke-dasharray: 2 4;
  }
  :global(.stage-link[data-has-road="false"]:not([data-connection-type="Proximity"])) {
    stroke-dasharray: 8 3;
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
    width: 12.75rem;
    transform: translate(-50%, -50%);
    display: grid;
    gap: 0.3125rem;
    padding: var(--space-2);
    text-align: left;
    touch-action: none;
    border: var(--line) solid var(--color-line-strong);
    border-radius: 0;
    background: var(--color-panel);
    cursor: grab;
    font: inherit;
    color: var(--color-ink);
    transition: background-color 0.1s, box-shadow 0.1s, outline-color 0.1s;
  }
  .stage-node::before {
    content: "";
    position: absolute;
    inset: 0 auto 0 0;
    width: 0.3125rem;
    background: var(--zone-color, #666);
  }
  .stage-node::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    box-shadow: inset 0 -0.25rem 0 var(--zone-value-color, var(--color-line));
  }
  .stage-node[data-value-tier="empty"] { --zone-value-color: var(--color-state-inactive); }
  .stage-node[data-value-tier="light"] { --zone-value-color: var(--color-role-treasure); }
  .stage-node[data-value-tier="solid"] { --zone-value-color: var(--color-state-uncertain); }
  .stage-node[data-value-tier="rich"] { --zone-value-color: var(--color-connection-arena); }
  .stage-node[data-value-tier="mythic"] { --zone-value-color: var(--color-connection-portal); }
  .stage-node[data-value-tier="unset"] { --zone-value-color: var(--color-line); }
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
  .stage-node.is-conn-snap {
    outline: var(--line-strong) solid var(--color-accent);
    outline-offset: 0.25rem;
    background: var(--color-active);
    z-index: 11;
  }
  .zone-topline,
  .zone-value-row,
  .zone-metrics {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  .zone-topline {
    padding-left: var(--space-2);
    font-size: var(--font-size-xxs);
    text-transform: uppercase;
  }
  .zone-owner-dot {
    width: 0.625rem;
    height: 0.625rem;
    background: var(--zone-color, #666);
    border: var(--line) solid var(--color-line-strong);
    flex-shrink: 0;
  }
  .zone-role,
  .zone-size {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .zone-size {
    margin-left: auto;
    font-family: var(--font-mono);
  }
  .zone-name {
    font-family: var(--font-mono);
    font-size: var(--font-size-m);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-left: var(--space-2);
  }
  .zone-value-row {
    padding-left: var(--space-2);
    font-size: var(--font-size-xs);
    justify-content: space-between;
  }
  .zone-total {
    font-family: var(--font-mono);
    color: var(--color-ink);
  }
  .zone-objects {
    color: var(--color-muted);
  }
  .zone-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-left: var(--space-2);
  }
  .zone-metrics span {
    min-width: 0;
    padding: 1px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--font-size-xxs);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .connection-label {
    position: absolute;
    z-index: 5;
    transform: translate(-50%, -50%);
    min-width: 4.5rem;
    max-width: 8rem;
    display: grid;
    gap: 1px;
    padding: 2px var(--space-1);
    border: var(--line) solid var(--conn-color, var(--color-line-strong));
    background: var(--color-panel);
    color: var(--color-ink);
    cursor: pointer;
    font: inherit;
    text-align: center;
  }
  .connection-label:hover,
  .connection-label.is-selected {
    background: var(--color-active);
    outline: var(--line) solid var(--color-line-strong);
  }
  .connection-label strong {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    line-height: 1;
  }
  .connection-label span {
    font-size: var(--font-size-xxs);
    color: var(--color-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .connection-label[data-connection-type="Proximity"] {
    border-style: dashed;
  }

  @media (max-width: 900px) {
    .stage-node {
      width: 10.5rem;
    }
    .connection-label span {
      display: none;
    }
  }
</style>
