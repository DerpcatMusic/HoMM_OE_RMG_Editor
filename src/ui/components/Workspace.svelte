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
  // Zone edit state
  let creatingRoad = $state(false);
  let roadFromNodeId = $state<string | null>(null);
  let roadType = $state<"Dirt" | "Stone">("Stone");
  let selectedRoadId = $state<string | null>(null);
  // Zone node drag state
  let nodeDragging = $state(false);
  let dragNodeId = $state<string | null>(null);
  let nodeDragOffset = $state({ x: 0, y: 0 });
  let nodeDragPos = $state({ x: 0, y: 0 });
  // Zone node connection drag (Ctrl+drag)
  let nodeConnDragging = $state(false);
  let nodeConnFromId = $state<string | null>(null);
  let nodeConnMousePos = $state({ x: 0, y: 0 });
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
  // --- Zone edit: node/road interaction ---
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
  function zoneStageRect(e: PointerEvent) {
    return (e.currentTarget as HTMLElement).closest(".zone-stage")!.getBoundingClientRect();
  }
  function zoneStagePct(e: PointerEvent, rect: DOMRect) {
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }
  function nodePos(obj: { id: string; x: number; y: number }) {
    if (nodeDragging && dragNodeId === obj.id) return nodeDragPos;
    return { x: obj.x, y: obj.y };
  }
  function roadEndpointPos(targetId: string): { x: number; y: number } | null {
    const obj = selectedZone.zoneObjects.find((o) => o.id === targetId);
    if (obj) return nodePos(obj);
    return null;
  }
  function roadPath(road: typeof selectedZone.zoneRoads[number]): string {
    const from = roadEndpointPos(road.fromId);
    const to = roadEndpointPos(road.toId);
    if (!from || !to) return "";
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} L ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }
  // Node pointer down: drag, ctrl+drag, or click
  function nodePointerDown(e: PointerEvent, obj: typeof selectedZone.zoneObjects[number]) {
    if (e.button !== 0) return;
    const rect = zoneStageRect(e);
    const p = zoneStagePct(e, rect);
    // Ctrl+drag → create road (like canvas ctrl+drag for connections)
    if (e.ctrlKey) {
      nodeConnDragging = true;
      nodeConnFromId = obj.id;
      nodeConnMousePos = p;
      e.preventDefault();
      return;
    }
    // Shift+click → road creation mode (two-click)
    if (e.shiftKey) {
      nodeClick(obj.id);
      e.preventDefault();
      return;
    }
    // Read position BEFORE setting dragging (nodePos returns stale nodeDragPos once dragging=true)
    const pos = { x: obj.x, y: obj.y };
    nodeDragOffset = { x: p.x - pos.x, y: p.y - pos.y };
    nodeDragPos = { x: pos.x, y: pos.y };
    nodeDragging = true;
    dragNodeId = obj.id;
    e.preventDefault();
  }
  // Node click (non-drag) → focus inspector panel
  function nodeFocusInspector(obj: typeof selectedZone.zoneObjects[number]) {
    if (obj.id.startsWith("main:")) {
      editor.selectObject(obj.index ?? 0);
    } else if (obj.id.startsWith("connection:") || obj.id === "crossroads") {
      editor.setInspectorTab("roads");
    } else {
      // MandatoryContent entry → focus pools tab
      editor.setInspectorTab("pools");
    }
  }
  // Stage pointer move
  function zoneStagePointerMove(e: PointerEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const p = zoneStagePct(e, rect);
    if (nodeDragging && dragNodeId) {
      nodeDragPos = {
        x: Math.max(5, Math.min(95, p.x - nodeDragOffset.x)),
        y: Math.max(5, Math.min(95, p.y - nodeDragOffset.y)),
      };
    }
    if (nodeConnDragging) {
      nodeConnMousePos = p;
    }
  }
  // Stage pointer up
  function zoneStagePointerUp(e: PointerEvent) {
    if (nodeDragging && dragNodeId) {
      // Detect click vs drag (if barely moved, treat as click)
      const obj = selectedZone.zoneObjects.find((o) => o.id === dragNodeId);
      const startPos = obj ? { x: obj.x, y: obj.y } : nodeDragPos;
      const moved = Math.abs(nodeDragPos.x - startPos.x) + Math.abs(nodeDragPos.y - startPos.y);
      if (moved < 3 && obj) {
        nodeFocusInspector(obj);
      } else {
        editor.moveZoneObject(selectedZone.label, dragNodeId, nodeDragPos);
      }
      nodeDragging = false;
      dragNodeId = null;
    }
    if (nodeConnDragging && nodeConnFromId) {
      const el = document.elementFromPoint(e.clientX, e.clientY)?.closest(".zone-node") as HTMLElement | null;
      const targetId = el?.dataset.nodeId;
      if (targetId && targetId !== nodeConnFromId) {
        const fromType = nodeTypeFromId(nodeConnFromId);
        const fromArg = nodeArgFromId(nodeConnFromId);
        const toType = nodeTypeFromId(targetId);
        const toArg = nodeArgFromId(targetId);
        editor.addRoadBetween(
          { type: fromType, args: fromArg ? [fromArg] : [] },
          { type: toType, args: toArg ? [toArg] : [] },
          roadType
        );
      }
      nodeConnDragging = false;
      nodeConnFromId = null;
    }
  }
  // Double-click on stage → add main object
  function zoneStageDblClick(e: MouseEvent) {
    if ((e.target as HTMLElement).closest(".zone-node")) return;
    editor.addMainObject();
  }
  // Node click (shift+click or two-click mode)
  function nodeClick(objId: string) {
    if (!creatingRoad) {
      creatingRoad = true;
      roadFromNodeId = objId;
      return;
    }
    if (roadFromNodeId && roadFromNodeId !== objId) {
      const fromType = nodeTypeFromId(roadFromNodeId);
      const fromArg = nodeArgFromId(roadFromNodeId);
      const toType = nodeTypeFromId(objId);
      const toArg = nodeArgFromId(objId);
      editor.addRoadBetween(
        { type: fromType, args: fromArg ? [fromArg] : [] },
        { type: toType, args: toArg ? [toArg] : [] },
        roadType
      );
    }
    creatingRoad = false;
    roadFromNodeId = null;
  }
  function cancelRoadCreation() {
    creatingRoad = false;
    roadFromNodeId = null;
    selectedRoadId = null;
  }
  // Context menu on nodes
  function nodeContextMenu(e: MouseEvent, obj: typeof selectedZone.zoneObjects[number]) {
    e.preventDefault();
    const isMain = obj.id.startsWith("main:");
    const targetId = obj.id;
    ctxMenu = {
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Start road from here", icon: "route", onClick: () => { creatingRoad = true; roadFromNodeId = targetId; } },
        ...(isMain ? [{ label: "Remove main object", icon: "delete", onClick: () => { /* TODO: remove main object */ } }] : []),
      ],
    };
  }
  // Context menu on road lines
  function roadContextMenu(e: MouseEvent, road: typeof selectedZone.zoneRoads[number]) {
    e.preventDefault();
    selectedRoadId = road.id;
    ctxMenu = {
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: `Delete road (${road.type})`, icon: "delete", onClick: () => editor.removeRoad(road.index) },
        { label: "Change to Stone", icon: "swap_horiz", onClick: () => editor.updateRoad(road.index, { roadIndex: road.index, type: "Stone", from: road.fromTarget, to: road.toTarget }) },
        { label: "Change to Dirt", icon: "swap_horiz", onClick: () => editor.updateRoad(road.index, { roadIndex: road.index, type: "Dirt", from: road.fromTarget, to: road.toTarget }) },
      ],
    };
  }
  // Keyboard on zone stage
  function zoneStageKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cancelRoadCreation();
      e.preventDefault();
      return;
    }
    if (e.key === "Delete" && selectedRoadId) {
      const road = selectedZone.zoneRoads.find((r) => r.id === selectedRoadId);
      if (road) {
        editor.removeRoad(road.index);
        selectedRoadId = null;
      }
      e.preventDefault();
      return;
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
      <p class="conditional-note">
        {#if creatingRoad}
          Click a target node to complete the road. <button class="button button-sm" onclick={cancelRoadCreation}>Cancel (Esc)</button>
        {:else if nodeConnDragging}
          Release on a target node to create a road.
        {:else}
          Drag to move. Ctrl+drag to connect. Shift+click for two-click road. Double-click empty to add main object.
        {/if}
      </p>
      <div class="zone-stage"
        onpointermove={zoneStagePointerMove}
        onpointerup={zoneStagePointerUp}
        ondblclick={zoneStageDblClick}
        onkeydown={zoneStageKeydown}
        role="application"
        aria-label="Zone edit canvas"
        tabindex="0"
      >
        <div class="stage-grid"></div>
        <!-- SVG layer for roads -->
        <svg class="stage-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {#each selectedZone.zoneRoads as road (road.id)}
            {@const path = roadPath(road)}
            {#if path}
              <g>
                <!-- Hit area (wider, invisible) -->
                <path
                  class="road-hit"
                  d={path}
                  onclick={() => { selectedRoadId = road.id; }}
                  oncontextmenu={(e) => roadContextMenu(e, road)}
                  role="button"
                  tabindex="0"
                />
                <!-- Visible road line -->
                <path
                  class="zone-road-line"
                  class:is-stone={road.type === "Stone"}
                  class:is-selected={selectedRoadId === road.id}
                  d={path}
                />
              </g>
            {/if}
          {/each}
          <!-- Ctrl+drag draft line -->
          {#if nodeConnDragging && nodeConnFromId}
            {@const fromPos = roadEndpointPos(nodeConnFromId)}
            {#if fromPos}
              <line class="conn-draft" x1={fromPos.x} y1={fromPos.y} x2={nodeConnMousePos.x} y2={nodeConnMousePos.y} />
            {/if}
          {/if}
          <!-- Two-click draft marker -->
          {#if creatingRoad && roadFromNodeId}
            {@const fromPos = roadEndpointPos(roadFromNodeId)}
            {#if fromPos}
              <circle class="road-draft-start" cx={fromPos.x} cy={fromPos.y} r="2" />
            {/if}
          {/if}
        </svg>
        <!-- Zone object nodes -->
        {#each selectedZone.zoneObjects as obj (obj.id)}
          {@const isMain = obj.id.startsWith("main:")}
          {@const isConnection = obj.id.startsWith("connection:")}
          {@const isCrossroads = obj.id === "crossroads"}
          {@const isRoadSource = creatingRoad && roadFromNodeId === obj.id}
          {@const pos = nodePos(obj)}
          <button
            type="button"
            class="zone-node"
            class:is-main={isMain}
            class:is-connection={isConnection}
            class:is-crossroads={isCrossroads}
            class:is-road-source={isRoadSource}
            data-node-id={obj.id}
            style="left:{pos.x}%;top:{pos.y}%"
            onpointerdown={(e) => nodePointerDown(e, obj)}
            oncontextmenu={(e) => nodeContextMenu(e, obj)}
            title="{obj.type}: {obj.label}"
          >
            <span class="node-icon">{isMain ? "🏰" : isConnection ? "🚪" : isCrossroads ? "╬" : "📦"}</span>
            <span class="node-label">{obj.label}</span>
            {#if obj.detail}<span class="node-detail">{obj.detail}</span>{/if}
          </button>
        {/each}
      </div>
      <!-- Controls and summary -->
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
          <span>{selectedZone.zoneRoads.map((r) => `${r.type}: ${r.fromId}→${r.toId}`).join(" / ") || "none"}</span>
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
  /* Zone edit: nodes, roads, controls */
  .zone-node {
    position: absolute;
    z-index: 2;
    display: flex; flex-direction: column; align-items: center;
    gap: 1px;
    padding: 4px 6px;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    cursor: grab;
    font: inherit; color: inherit;
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
  .zone-road-line {
    fill: none;
    stroke: #888;
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    pointer-events: none;
    stroke-dasharray: 4 2;
  }
  .zone-road-line.is-stone {
    stroke: #bbb;
    stroke-width: 3;
    stroke-dasharray: none;
  }
  .zone-road-line.is-selected {
    stroke: var(--color-accent);
    stroke-width: 4;
  }
  .road-hit {
    fill: none;
    stroke: transparent;
    stroke-width: 10;
    vector-effect: non-scaling-stroke;
    pointer-events: stroke;
    cursor: pointer;
  }
  .road-draft-start {
    fill: var(--color-accent);
    pointer-events: none;
  }
  .zone-controls {
    display: flex; align-items: center; gap: var(--space-3);
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
    font-size: 0.625rem; padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); color: inherit; font-family: inherit;
  }
</style>