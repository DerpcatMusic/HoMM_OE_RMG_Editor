<script lang="ts">
  import { Combobox, Dialog } from "bits-ui";
  import { MAIN_OBJECT_TYPES, type MainObjectType } from "../../../core/rmg/enums.js";
  import type { ShellCatalogOption, ShellZoneObjectItem, ShellZoneRoadItem } from "../../data/shellData.js";
  import { editor } from "../../state/editor.svelte.js";
  import ContextMenu from "../ContextMenu.svelte";
  import { createContextMenuState } from "../contextMenu.svelte.js";
  import ObjectIdentity from "../ui/ObjectIdentity.svelte";
  import CanvasHitPath from "./CanvasHitPath.svelte";
  import CanvasSvgLayer from "./CanvasSvgLayer.svelte";
  import { clampCanvasPoint, linePath, pointerPercent, type CanvasPoint } from "./canvasGeometry.js";

  let selectedZone = $derived(editor.selectedZone);

  let creatingRoad = $state(false);
  let roadFromNodeId = $state<string | null>(null);
  let roadType = $state<"Dirt" | "Stone">("Stone");
  let selectedRoadId = $derived(editor.activeRoadIndex >= 0 ? `road:${editor.activeRoadIndex}` : null);

  let nodeDragging = $state(false);
  let dragNodeId = $state<string | null>(null);
  let nodeDragOffset = $state<CanvasPoint>({ x: 0, y: 0 });
  let nodeDragPos = $state<CanvasPoint>({ x: 0, y: 0 });

  let nodeConnDragging = $state(false);
  let nodeConnFromId = $state<string | null>(null);
  let nodeConnMousePos = $state<CanvasPoint>({ x: 0, y: 0 });

  const contextMenu = createContextMenuState();
  let ctxMenu = $derived(contextMenu.current);
  let activeZoneObjectId = $derived(editor.activeZoneObjectId);
  let catalogObjects = $derived(editor.catalogOptions.rmgContent);
  let mandatoryObjectCount = $derived(selectedZone.zoneObjects.filter(isMandatoryObject).length);

  let addObjectDialogOpen = $state(false);
  let objectComboboxOpen = $state(false);
  let objectSearch = $state("");
  let selectedCatalogObjectId = $state("");
  let pendingSpawnPoint = $state<CanvasPoint | null>(null);
  let addMainObjectDialogOpen = $state(false);
  let pendingMainObjectPoint = $state<CanvasPoint | null>(null);

  let catalogComboboxItems = $derived.by(() =>
    catalogObjects.map((object) => ({
      value: object.id,
      label: object.label,
    })),
  );

  let filteredCatalogObjects = $derived.by(() => {
    const query = objectSearch.trim().toLowerCase();
    if (!query) return catalogObjects;
    return catalogObjects.filter((object) =>
      `${object.id} ${object.label} ${object.category ?? ""}`.toLowerCase().includes(query),
    );
  });

  function nodeTypeFromId(id: string): string {
    if (id.startsWith("main:")) return "MainObject";
    if (id.startsWith("connection:")) return "Connection";
    if (id.startsWith("mandatory:") || id.startsWith("mc:")) return "MandatoryContent";
    if (id === "crossroads") return "Crossroads";
    return "MandatoryContent";
  }

  function nodeArgFromId(id: string): string {
    if (id.startsWith("main:")) return id.replace("main:", "");
    if (id.startsWith("connection:")) return id.replace("connection:", "");
    if (id.startsWith("mandatory:")) return id.replace("mandatory:", "");
    if (id.startsWith("mc:")) return id.replace("mc:", "");
    if (id === "crossroads") return "";
    return id;
  }

  function isMandatoryObject(object: ShellZoneObjectItem): boolean {
    return object.kind === "mandatory" || object.id.startsWith("mandatory:") || object.id.startsWith("mc:");
  }

  function nodeIcon(object: ShellZoneObjectItem): string {
    if (object.kind === "main" || object.id.startsWith("main:")) return "castle";
    if (object.kind === "connection" || object.id.startsWith("connection:")) return "door_open";
    if (object.kind === "crossroads" || object.id === "crossroads") return "hub";
    if (isMandatoryObject(object)) return "location_on";
    return "category";
  }

  function nodeTone(object: ShellZoneObjectItem): "neutral" | "main" | "connection" | "crossroads" | "mandatory" {
    if (object.kind === "main" || object.id.startsWith("main:")) return "main";
    if (object.kind === "connection" || object.id.startsWith("connection:")) return "connection";
    if (object.kind === "crossroads" || object.id === "crossroads") return "crossroads";
    if (isMandatoryObject(object)) return "mandatory";
    return "neutral";
  }

  function openAddObjectDialog(point: CanvasPoint) {
    pendingSpawnPoint = clampCanvasPoint(point, { minX: 5, maxX: 95, minY: 5, maxY: 95 });
    objectSearch = "";
    selectedCatalogObjectId = "";
    objectComboboxOpen = true;
    addObjectDialogOpen = true;
  }

  function openAddMainObjectDialog(point: CanvasPoint | null = null) {
    pendingMainObjectPoint = point
      ? clampCanvasPoint(point, { minX: 5, maxX: 95, minY: 5, maxY: 95 })
      : null;
    addMainObjectDialogOpen = true;
  }

  function handleAddObjectDialogOpenChange(open: boolean) {
    addObjectDialogOpen = open;
    if (!open) {
      objectComboboxOpen = false;
      objectSearch = "";
      selectedCatalogObjectId = "";
      pendingSpawnPoint = null;
    }
  }

  function handleAddMainObjectDialogOpenChange(open: boolean) {
    addMainObjectDialogOpen = open;
    if (!open) {
      pendingMainObjectPoint = null;
    }
  }

  function updateObjectSearch(event: Event) {
    objectSearch = (event.currentTarget as HTMLInputElement).value;
    objectComboboxOpen = true;
  }

  function catalogCategory(object: ShellCatalogOption): string {
    return object.category || "RMG content";
  }

  function handleCatalogObjectSelection(value: string) {
    selectedCatalogObjectId = value;
    const object = catalogObjects.find((item) => item.id === value);
    if (!object) return;
    editor.addMandatoryContentToSelectedZone(object.id, pendingSpawnPoint ?? undefined);
    handleAddObjectDialogOpenChange(false);
  }

  function addMainObjectType(type: MainObjectType) {
    editor.addMainObject(type, pendingMainObjectPoint ?? undefined);
    handleAddMainObjectDialogOpenChange(false);
  }

  function mainObjectIcon(type: MainObjectType): string {
    switch (type) {
      case "City": return "castle";
      case "Spawn": return "flag";
      case "AbandonedOutpost": return "fort";
      case "GladiatorArena": return "stadium";
    }
  }

  function mainObjectDetail(type: MainObjectType): string {
    switch (type) {
      case "City": return "Town anchor with faction";
      case "Spawn": return "Player start object";
      case "AbandonedOutpost": return "Neutral map anchor";
      case "GladiatorArena": return "Arena objective";
    }
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
    } else if (isMandatoryObject(object)) {
      editor.selectMandatoryContent(object.mandatoryEntryName ?? nodeArgFromId(object.id));
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
    const point = pointerPercent(event as PointerEvent, (event.currentTarget as HTMLElement).getBoundingClientRect());
    openAddMainObjectDialog(point);
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
    editor.clearRoadSelection();
  }

  function selectRoad(road: ShellZoneRoadItem) {
    editor.selectRoad(road.index);
  }

  function nodeContextMenu(event: MouseEvent, object: ShellZoneObjectItem) {
    const isMain = object.id.startsWith("main:");
    const isMandatory = isMandatoryObject(object);
    const targetId = object.id;
    const objectIndex = object.index ?? Number(object.id.replace("main:", ""));
    const mandatoryName = object.mandatoryEntryName ?? nodeArgFromId(object.id);
    contextMenu.open(event, [
      { label: "Start road from here", icon: "route", onClick: () => { creatingRoad = true; roadFromNodeId = targetId; } },
      ...(isMandatory && mandatoryName ? [{ label: "Inspect mandatory content", icon: "location_on", onClick: () => editor.selectMandatoryContent(mandatoryName) }] : []),
      ...(isMain && Number.isInteger(objectIndex) ? [{ label: "Remove main object", icon: "delete", onClick: () => editor.removeMainObject(objectIndex) }] : []),
    ]);
  }

  function zoneStageContextMenu(event: MouseEvent) {
    if ((event.target as HTMLElement).closest(".zone-node, .road-hit")) return;
    const point = pointerPercent(event as PointerEvent, (event.currentTarget as HTMLElement).getBoundingClientRect());
    contextMenu.open(event, [
      { label: "Add Object", icon: "add_location_alt", onClick: () => openAddObjectDialog(point) },
      { label: "Add main object", icon: "add_circle", onClick: () => openAddMainObjectDialog(point) },
      { label: "Add road", icon: "route", onClick: () => editor.addRoad() },
    ]);
  }

  function roadContextMenu(event: MouseEvent, road: ShellZoneRoadItem) {
    editor.selectRoad(road.index);
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
        editor.clearRoadSelection();
      }
      event.preventDefault();
    }
  }
</script>

<section class="workspace-panel zone-edit-panel">
  <div class="workspace-bar">
    <div>
      <h2>{selectedZone.label} internals</h2>
      <span>Main objects {selectedZone.mainObjectCount} / mandatory {mandatoryObjectCount} / roads {selectedZone.roadCount}</span>
    </div>
    <div class="bar-actions">
      <button class="button button-secondary" onclick={() => openAddMainObjectDialog()}>Add main object</button>
      <button class="button button-secondary" onclick={() => editor.addRoad()}>Add road</button>
    </div>
  </div>
  <p class="conditional-note">
    {#if creatingRoad}
      Click a target node to complete the road. <button class="button button-sm" onclick={cancelRoadCreation}>Cancel (Esc)</button>
    {:else if nodeConnDragging}
      Release on a target node to create a road.
    {:else}
      Drag to move. Ctrl+drag to connect. Shift+click for two-click road. Double-click empty to choose a main object.
    {/if}
  </p>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="zone-stage"
    onpointermove={zoneStagePointerMove}
    onpointerup={zoneStagePointerUp}
    ondblclick={zoneStageDblClick}
    onkeydown={zoneStageKeydown}
    oncontextmenu={zoneStageContextMenu}
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
      {@const isMandatory = isMandatoryObject(object)}
      {@const isRoadSource = creatingRoad && roadFromNodeId === object.id}
      {@const isSelected = activeZoneObjectId === object.id}
      {@const point = nodePos(object)}
      <button
        type="button"
        class="zone-node"
        class:is-main={isMain}
        class:is-connection={isConnection}
        class:is-crossroads={isCrossroads}
        class:is-mandatory={isMandatory}
        class:is-road-source={isRoadSource}
        class:is-selected={isSelected}
        data-node-id={object.id}
        style="left:{point.x}%;top:{point.y}%"
        onpointerdown={(event) => nodePointerDown(event, object)}
        oncontextmenu={(event) => nodeContextMenu(event, object)}
        title="{object.type}: {object.label}"
      >
        <ObjectIdentity
          icon={nodeIcon(object)}
          label={object.label}
          detail={object.detail}
          tone={nodeTone(object)}
          variant="canvas"
        />
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

<Dialog.Root open={addObjectDialogOpen} onOpenChange={handleAddObjectDialogOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="object-dialog-overlay" />
    <Dialog.Content class="object-dialog-content">
      <div class="object-dialog-header">
        <Dialog.Title class="object-dialog-title">Add mandatory content</Dialog.Title>
        <Dialog.Close class="object-dialog-close" aria-label="Close">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </Dialog.Close>
      </div>
      <div class="object-dialog-body">
        <label class="object-search-label" for="mandatory-object-search">Search</label>
        <div class="object-combobox">
          <Combobox.Root
            type="single"
            value={selectedCatalogObjectId}
            onValueChange={handleCatalogObjectSelection}
            items={catalogComboboxItems}
            open={objectComboboxOpen}
            onOpenChange={(open) => { objectComboboxOpen = open; }}
            allowDeselect={false}
            inputValue={objectSearch}
          >
            <Combobox.Input
              id="mandatory-object-search"
              class="object-combobox-input"
              placeholder="Object name or SID"
              oninput={updateObjectSearch}
              onfocus={() => { objectComboboxOpen = true; }}
              autocomplete="off"
            />
            <Combobox.Portal>
              <Combobox.Content class="object-combobox-content" side="bottom" sideOffset={4}>
                <Combobox.Viewport class="object-combobox-viewport">
                  {#if filteredCatalogObjects.length === 0}
                    <div class="object-combobox-empty">No matching objects</div>
                  {:else}
                    {#each filteredCatalogObjects as object (object.id)}
                      <Combobox.Item class="object-combobox-item" value={object.id} label={object.label}>
                        <ObjectIdentity
                          label={object.label}
                          meta={catalogCategory(object)}
                          metaPosition="after"
                          tone="mandatory"
                        />
                      </Combobox.Item>
                    {/each}
                  {/if}
                </Combobox.Viewport>
              </Combobox.Content>
            </Combobox.Portal>
          </Combobox.Root>
        </div>
        <div class="object-dialog-count">
          {filteredCatalogObjects.length} / {catalogObjects.length} objects
        </div>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<Dialog.Root open={addMainObjectDialogOpen} onOpenChange={handleAddMainObjectDialogOpenChange}>
  <Dialog.Portal>
    <Dialog.Overlay class="object-dialog-overlay" />
    <Dialog.Content class="main-object-dialog-content">
      <div class="object-dialog-header">
        <Dialog.Title class="object-dialog-title">Add main object</Dialog.Title>
        <Dialog.Close class="object-dialog-close" aria-label="Close">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </Dialog.Close>
      </div>
      <div class="main-object-list" aria-label="Main object types">
        {#each MAIN_OBJECT_TYPES as type (type)}
          <button
            type="button"
            class="main-object-option"
            onclick={() => addMainObjectType(type)}
            title="{type}: {mainObjectDetail(type)}"
          >
            <ObjectIdentity
              icon={mainObjectIcon(type)}
              label={type}
              tone="main"
            />
          </button>
        {/each}
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

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
    display: inline-flex;
    align-items: center;
    padding: 2px 4px;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    cursor: grab;
    font: inherit;
    color: inherit;
    min-width: 1.375rem;
    min-height: 1.25rem;
    max-width: 6rem;
    text-align: center;
    transition: background 0.12s, outline-color 0.12s;
    touch-action: none;
  }
  .zone-node:active { cursor: grabbing; }
  .zone-node:hover { background: var(--color-panel-2); outline: var(--line-strong) solid var(--color-focus); outline-offset: 1px; }
  .zone-node.is-main { border-color: var(--color-object-city); }
  .zone-node.is-connection { border-color: var(--color-connection-default); }
  .zone-node.is-crossroads { border-color: var(--color-role-connector); }
  .zone-node.is-mandatory { border-color: oklch(0.50 0.13 185); }
  .zone-node.is-selected { outline: var(--line-strong) solid var(--color-focus); outline-offset: 2px; background: var(--color-active); }
  .zone-node.is-road-source { outline: var(--line-strong) solid var(--color-accent); outline-offset: 2px; background: var(--color-active); }
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
    font-size: var(--font-size-xs);
  }
  .road-type-selector { display: flex; align-items: center; gap: var(--space-1); }
  .road-type-selector span { color: var(--color-muted); font-size: var(--font-size-xxs); }
  .zone-roads-summary { display: flex; align-items: center; gap: var(--space-1); }
  .zone-roads-summary strong { font-size: var(--font-size-xxs); }
  .zone-roads-summary span { font-family: var(--font-mono); font-size: var(--font-size-xxs); color: var(--color-muted); }
  .muted-label { font-size: var(--font-size-xxs); color: var(--color-muted); font-family: var(--font-mono); }
  .button-sm { font-size: var(--font-size-xxs); padding: 1px var(--space-1); }
  .input-sm {
    font-size: var(--font-size-xs);
    padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit;
    font-family: inherit;
  }
  :global(.object-dialog-overlay) {
    position: fixed;
    inset: 0;
    z-index: 1200;
    background: rgb(0 0 0 / 0.35);
  }
  :global(.object-dialog-content) {
    position: fixed;
    z-index: 1201;
    top: 5rem;
    left: 50%;
    transform: translateX(-50%);
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(34rem, calc(100vh - 2rem));
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    border: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel);
  }
  :global(.main-object-dialog-content) {
    position: fixed;
    z-index: 1201;
    top: 5rem;
    left: 50%;
    transform: translateX(-50%);
    width: min(17rem, calc(100vw - 2rem));
    display: grid;
    grid-template-rows: auto auto;
    border: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel);
  }
  .object-dialog-header {
    min-height: 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: var(--line) solid var(--color-line-strong);
    background: var(--color-panel-2);
  }
  :global(.object-dialog-title) {
    padding: 0 var(--space-3);
    font-size: var(--font-size-m);
    font-weight: 600;
  }
  :global(.object-dialog-close) {
    width: 2rem;
    height: 2rem;
    display: grid;
    place-items: center;
    border: 0;
    border-left: var(--line) solid var(--color-line);
    background: var(--color-panel);
    cursor: pointer;
  }
  :global(.object-dialog-close:hover) {
    background: var(--color-panel-2);
  }
  :global(.object-dialog-close .material-symbols-outlined) {
    font-family: var(--font-icon);
    font-size: var(--font-size-m);
  }
  .object-dialog-body {
    min-height: 0;
    display: grid;
    grid-template-rows: auto auto auto;
    gap: var(--space-1);
    padding: var(--space-3);
  }
  .object-search-label,
  .object-dialog-count {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    font-family: var(--font-mono);
  }
  .object-combobox {
    display: grid;
    min-width: 0;
  }
  :global(.object-combobox-input) {
    width: 100%;
    min-height: 2rem;
    padding: var(--space-1) var(--space-2);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    color: var(--color-ink);
    font: inherit;
    font-size: var(--font-size-sm);
  }
  :global(.object-combobox-input::placeholder) {
    color: var(--color-muted);
  }
  :global(.object-combobox-content) {
    z-index: 1300;
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(22rem, calc(100vh - 10rem));
    overflow: hidden;
    border: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-panel);
  }
  :global(.object-combobox-viewport) {
    max-height: min(22rem, calc(100vh - 10rem));
    overflow-y: auto;
  }
  :global(.object-combobox-item),
  .object-combobox-empty {
    min-height: 1.75rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-1) var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }
  :global(.object-combobox-item:last-child) {
    border-bottom: 0;
  }
  :global(.object-combobox-item[data-highlighted]) {
    background: var(--color-panel-2);
  }
  :global(.object-combobox-item[data-selected]) {
    background: var(--color-active);
    box-shadow: inset 3px 0 0 var(--color-focus);
  }
  .object-combobox-empty {
    grid-template-columns: 1fr;
    color: var(--color-muted);
    cursor: default;
  }
  .main-object-list {
    display: grid;
  }
  .main-object-option {
    display: flex;
    align-items: center;
    min-height: 1.875rem;
    padding: var(--space-1) var(--space-2);
    border: 0;
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit;
    cursor: pointer;
    text-align: left;
  }
  .main-object-option:last-child {
    border-bottom: 0;
  }
  .main-object-option:hover {
    background: var(--color-panel-2);
  }
</style>
