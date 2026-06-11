<script lang="ts">
  import type { ShellZoneObjectItem, ShellZoneRoadItem } from "../../data/shellData.js";
  import { editor } from "../../state/editor.svelte.js";
  import ContextMenu from "../ContextMenu.svelte";
  import { createContextMenuState } from "../contextMenu.svelte.js";
  import CanvasHitPath from "./CanvasHitPath.svelte";
  import CanvasSvgLayer from "./CanvasSvgLayer.svelte";
  import { clampCanvasPoint, linePath, pointerPercent, type CanvasPoint } from "./canvasGeometry.js";

  let selectedZone = $derived(editor.selectedZone);

  let creatingRoad = $state(false);
  let roadFromNodeId = $state<string | null>(null);
  let roadType = $state<"Dirt" | "Stone">("Stone");
  let selectedRoadId = $state<string | null>(null);

  let nodeDragging = $state(false);
  let dragNodeId = $state<string | null>(null);
  let nodeDragOffset = $state<CanvasPoint>({ x: 0, y: 0 });
  let nodeDragPos = $state<CanvasPoint>({ x: 0, y: 0 });

  let nodeConnDragging = $state(false);
  let nodeConnFromId = $state<string | null>(null);
  let nodeConnMousePos = $state<CanvasPoint>({ x: 0, y: 0 });

  const contextMenu = createContextMenuState();
  let ctxMenu = $derived(contextMenu.current);

  function nodeTypeFromId(id: string): string {
    if (id.startsWith("main:")) return "MainObject";
    if (id.startsWith("connection:")) return "Connection";
    if (id === "crossroads") return "Crossroads";
    return "MandatoryContent";
  }

  function nodeArgFromId(id: string): string {
    if (id.startsWith("main:")) return id.replace("main:", "");
    if (id.startsWith("connection:")) return id.replace("connection:", "");
    if (id === "crossroads") return "";
    return id;
  }

  function zoneStageRect(event: PointerEvent) {
    return (event.currentTarget as HTMLElement).closest(".zone-stage")!.getBoundingClientRect();
  }

  function nodePos(object: Pick<ShellZoneObjectItem, "id" | "x" | "y">) {
    if (nodeDragging && dragNodeId === object.id) return nodeDragPos;
    return { x: object.x, y: object.y };
  }

  function roadEndpointPos(targetId: string): CanvasPoint | null {
    const object = selectedZone.zoneObjects.find((item) => item.id === targetId);
    if (object) return nodePos(object);
    return null;
  }

  function roadPath(road: ShellZoneRoadItem): string {
    const from = roadEndpointPos(road.fromId);
    const to = roadEndpointPos(road.toId);
    if (!from || !to) return "";
    return linePath(from, to);
  }

  function addRoadBetweenNodeIds(fromId: string, toId: string) {
    const fromArg = nodeArgFromId(fromId);
    const toArg = nodeArgFromId(toId);
    editor.addRoadBetween(
      { type: nodeTypeFromId(fromId), args: fromArg ? [fromArg] : [] },
      { type: nodeTypeFromId(toId), args: toArg ? [toArg] : [] },
      roadType,
    );
  }

  function nodePointerDown(event: PointerEvent, object: ShellZoneObjectItem) {
    if (event.button !== 0) return;
    const point = pointerPercent(event, zoneStageRect(event));

    if (event.ctrlKey) {
      nodeConnDragging = true;
      nodeConnFromId = object.id;
      nodeConnMousePos = point;
      event.preventDefault();
      return;
    }

    if (event.shiftKey) {
      nodeClick(object.id);
      event.preventDefault();
      return;
    }

    nodeDragOffset = { x: point.x - object.x, y: point.y - object.y };
    nodeDragPos = { x: object.x, y: object.y };
    nodeDragging = true;
    dragNodeId = object.id;
    event.preventDefault();
  }

  function nodeFocusInspector(object: ShellZoneObjectItem) {
    if (object.id.startsWith("main:")) {
      editor.selectObject(object.index ?? 0);
    } else if (object.id.startsWith("connection:") || object.id === "crossroads") {
      editor.setInspectorTab("roads");
    } else {
      editor.setInspectorTab("pools");
    }
  }

  function zoneStagePointerMove(event: PointerEvent) {
    const point = pointerPercent(event, (event.currentTarget as HTMLElement).getBoundingClientRect());
    if (nodeDragging && dragNodeId) {
      nodeDragPos = clampCanvasPoint({ x: point.x - nodeDragOffset.x, y: point.y - nodeDragOffset.y }, { minX: 5, maxX: 95, minY: 5, maxY: 95 });
    }
    if (nodeConnDragging) {
      nodeConnMousePos = point;
    }
  }

  function zoneStagePointerUp(event: PointerEvent) {
    if (nodeDragging && dragNodeId) {
      const object = selectedZone.zoneObjects.find((item) => item.id === dragNodeId);
      const startPos = object ? { x: object.x, y: object.y } : nodeDragPos;
      const moved = Math.abs(nodeDragPos.x - startPos.x) + Math.abs(nodeDragPos.y - startPos.y);
      if (moved < 3 && object) {
        nodeFocusInspector(object);
      } else {
        editor.moveZoneObject(selectedZone.label, dragNodeId, nodeDragPos);
      }
      nodeDragging = false;
      dragNodeId = null;
    }

    if (nodeConnDragging && nodeConnFromId) {
      const element = document.elementFromPoint(event.clientX, event.clientY)?.closest(".zone-node") as HTMLElement | null;
      const targetId = element?.dataset.nodeId;
      if (targetId && targetId !== nodeConnFromId) {
        addRoadBetweenNodeIds(nodeConnFromId, targetId);
      }
      nodeConnDragging = false;
      nodeConnFromId = null;
    }
  }

  function zoneStageDblClick(event: MouseEvent) {
    if ((event.target as Element).closest(".zone-node, .road-hit")) return;
    editor.addMainObject();
  }

  function nodeClick(objectId: string) {
    if (!creatingRoad) {
      creatingRoad = true;
      roadFromNodeId = objectId;
      return;
    }
    if (roadFromNodeId && roadFromNodeId !== objectId) {
      addRoadBetweenNodeIds(roadFromNodeId, objectId);
    }
    creatingRoad = false;
    roadFromNodeId = null;
  }

  function cancelRoadCreation() {
    creatingRoad = false;
    roadFromNodeId = null;
    selectedRoadId = null;
  }

  function selectRoad(road: ShellZoneRoadItem) {
    selectedRoadId = road.id;
    editor.setInspectorTab("roads");
  }

  function nodeContextMenu(event: MouseEvent, object: ShellZoneObjectItem) {
    const isMain = object.id.startsWith("main:");
    const targetId = object.id;
    const objectIndex = object.index ?? Number(object.id.replace("main:", ""));
    contextMenu.open(event, [
      { label: "Start road from here", icon: "route", onClick: () => { creatingRoad = true; roadFromNodeId = targetId; } },
      ...(isMain && Number.isInteger(objectIndex) ? [{ label: "Remove main object", icon: "delete", onClick: () => editor.removeMainObject(objectIndex) }] : []),
    ]);
  }

  function roadContextMenu(event: MouseEvent, road: ShellZoneRoadItem) {
    selectedRoadId = road.id;
    contextMenu.open(event, [
      { label: `Delete road (${road.type})`, icon: "delete", onClick: () => editor.removeRoad(road.index) },
      { label: "Change to Stone", icon: "swap_horiz", onClick: () => editor.updateRoad(road.index, { roadIndex: road.index, type: "Stone", from: road.fromTarget, to: road.toTarget }) },
      { label: "Change to Dirt", icon: "swap_horiz", onClick: () => editor.updateRoad(road.index, { roadIndex: road.index, type: "Dirt", from: road.fromTarget, to: road.toTarget }) },
    ]);
  }

  function zoneStageKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      cancelRoadCreation();
      event.preventDefault();
      return;
    }
    if (event.key === "Delete" && selectedRoadId) {
      const road = selectedZone.zoneRoads.find((item) => item.id === selectedRoadId);
      if (road) {
        editor.removeRoad(road.index);
        selectedRoadId = null;
      }
      event.preventDefault();
    }
  }
</script>

<section class="workspace-panel zone-edit-panel">
  <div class="workspace-bar">
    <div>
      <h2>{selectedZone.label} internals</h2>
      <span>Main objects {selectedZone.mainObjectCount} / roads {selectedZone.roadCount}</span>
    </div>
    <div class="bar-actions">
      <button class="button button-secondary" onclick={() => editor.addMainObject()}>Add main object</button>
      <button class="button button-secondary" onclick={() => editor.addRoad()}>Add road</button>
    </div>
  </div>
  <p class="conditional-note">
    {#if creatingRoad}
      Click a target node to complete the road. <button class="button button-sm" onclick={cancelRoadCreation}>Cancel (Esc)</button>
    {:else if nodeConnDragging}
      Release on a target node to create a road.
    {:else}
      Drag to move. Ctrl+drag to connect. Shift+click for two-click road. Double-click empty to add main object.
    {/if}
  </p>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="zone-stage"
    onpointermove={zoneStagePointerMove}
    onpointerup={zoneStagePointerUp}
    ondblclick={zoneStageDblClick}
    onkeydown={zoneStageKeydown}
    oncontextmenu={(event) => {
      if ((event.target as HTMLElement).closest(".zone-node, .road-hit")) return;
      contextMenu.open(event, [
        { label: "Add main object", icon: "add_circle", onClick: () => editor.addMainObject() },
        { label: "Add road", icon: "route", onClick: () => editor.addRoad() },
      ]);
    }}
    role="application"
    aria-label="Zone edit canvas"
    tabindex="0"
  >
    <div class="stage-grid"></div>
    <CanvasSvgLayer>
      {#each selectedZone.zoneRoads as road (road.id)}
        {@const path = roadPath(road)}
        {#if path}
          <g>
            <CanvasHitPath
              class="road-hit"
              d={path}
              onclick={() => selectRoad(road)}
              oncontextmenu={(event) => roadContextMenu(event, road)}
              label={road.label}
            />
            <path
              class="zone-road-line"
              class:is-stone={road.type === "Stone"}
              class:is-selected={selectedRoadId === road.id}
              d={path}
            />
          </g>
        {/if}
      {/each}
      {#if nodeConnDragging && nodeConnFromId}
        {@const fromPos = roadEndpointPos(nodeConnFromId)}
        {#if fromPos}
          <line class="conn-draft" x1={fromPos.x} y1={fromPos.y} x2={nodeConnMousePos.x} y2={nodeConnMousePos.y} />
        {/if}
      {/if}
      {#if creatingRoad && roadFromNodeId}
        {@const fromPos = roadEndpointPos(roadFromNodeId)}
        {#if fromPos}
          <circle class="road-draft-start" cx={fromPos.x} cy={fromPos.y} r="2" />
        {/if}
      {/if}
    </CanvasSvgLayer>
    {#each selectedZone.zoneObjects as object (object.id)}
      {@const isMain = object.id.startsWith("main:")}
      {@const isConnection = object.id.startsWith("connection:")}
      {@const isCrossroads = object.id === "crossroads"}
      {@const isRoadSource = creatingRoad && roadFromNodeId === object.id}
      {@const point = nodePos(object)}
      <button
        type="button"
        class="zone-node"
        class:is-main={isMain}
        class:is-connection={isConnection}
        class:is-crossroads={isCrossroads}
        class:is-road-source={isRoadSource}
        data-node-id={object.id}
        style="left:{point.x}%;top:{point.y}%"
        onpointerdown={(event) => nodePointerDown(event, object)}
        oncontextmenu={(event) => nodeContextMenu(event, object)}
        title="{object.type}: {object.label}"
      >
        <span class="node-icon">{isMain ? "🏰" : isConnection ? "🚪" : isCrossroads ? "╬" : "📦"}</span>
        <span class="node-label">{object.label}</span>
        {#if object.detail}<span class="node-detail">{object.detail}</span>{/if}
      </button>
    {/each}
  </div>
  <div class="zone-controls">
    <label class="road-type-selector">
      <span>Road type</span>
      <select class="input-sm" bind:value={roadType}>
        <option value="Stone">Stone</option>
        <option value="Dirt">Dirt</option>
      </select>
    </label>
    {#if selectedZone.crossroadsPosition !== undefined}
      <div class="road-type-selector">
        <span class="muted-label">Crossroads pos: {selectedZone.crossroadsPosition}</span>
      </div>
    {/if}
    <div class="zone-roads-summary">
      <strong>Roads</strong>
      <span>{selectedZone.zoneRoads.map((road) => `${road.type}: ${road.fromId}→${road.toId}`).join(" / ") || "none"}</span>
    </div>
  </div>
</section>

{#if ctxMenu}
  <ContextMenu {...ctxMenu} onClose={() => contextMenu.close()} />
{/if}

<style>
  .zone-edit-panel {
    grid-template-rows: auto auto minmax(0, 1fr) auto;
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
  :global(.conn-draft) {
    stroke: var(--color-muted);
    stroke-width: 3;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }
  .zone-node {
    position: absolute;
    z-index: 2;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 4px 6px;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    cursor: grab;
    font: inherit;
    color: inherit;
    min-width: 2rem;
    text-align: center;
    transition: box-shadow 0.1s;
    touch-action: none;
  }
  .zone-node:active { cursor: grabbing; }
  .zone-node:hover { background: var(--color-panel-2); box-shadow: 0 0 0 2px var(--color-focus); }
  .zone-node.is-main { border-left: 3px solid #c90; }
  .zone-node.is-connection { border-left: 3px solid #5af; }
  .zone-node.is-crossroads { border-left: 3px solid #8a8; }
  .zone-node.is-road-source { box-shadow: 0 0 0 3px var(--color-accent); background: var(--color-active); }
  .node-icon { font-size: 0.75rem; line-height: 1; }
  .node-label { font-family: var(--font-mono); font-size: 0.5rem; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 5rem; }
  .node-detail { font-size: 0.4375rem; color: var(--color-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 5rem; }
  :global(.zone-road-line) {
    fill: none;
    stroke: #888;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
    stroke-dasharray: 4 2;
  }
  :global(.zone-road-line.is-stone) {
    stroke: #bbb;
    stroke-width: 3;
    stroke-dasharray: none;
  }
  :global(.zone-road-line.is-selected) {
    stroke: var(--color-accent);
    stroke-width: 4;
  }
  :global(.road-draft-start) {
    fill: var(--color-accent);
    pointer-events: none;
  }
  .zone-controls {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2);
    border-top: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: 0.625rem;
  }
  .road-type-selector { display: flex; align-items: center; gap: var(--space-1); }
  .road-type-selector span { color: var(--color-muted); font-size: 0.5625rem; }
  .zone-roads-summary { display: flex; align-items: center; gap: var(--space-1); }
  .zone-roads-summary strong { font-size: 0.5625rem; }
  .zone-roads-summary span { font-family: var(--font-mono); font-size: 0.5rem; color: var(--color-muted); }
  .muted-label { font-size: 0.5rem; color: var(--color-muted); font-family: var(--font-mono); }
  .button-sm { font-size: 0.5625rem; padding: 1px var(--space-1); }
  .input-sm {
    font-size: 0.625rem;
    padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit;
    font-family: inherit;
  }
</style>
