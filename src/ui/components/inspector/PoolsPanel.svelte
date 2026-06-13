<script lang="ts">
  import { PLAYER_REFS } from "../../../core/rmg/enums.js";
  import { editor } from "../../state/editor.svelte.js";
  import { PLAYER_COLORS } from "../../data/shellData.js";
  import type { ContentPoolConfig, ContentWeight, MandatoryContent, PlacementRule } from "../../../core/rmg/rmgTypes.js";
  import PoolAssignmentStrip from "./pools/PoolAssignmentStrip.svelte";

  let zone = $derived(editor.selectedZone);
  let session = $derived(editor.session);
  let activePoolName = $derived(editor.activeContentPoolName);
  let catalogOptions = $derived(editor.catalogOptions);

  // --- Pool browser state (existing) ---
  let activePool = $derived.by((): { pool: ContentPoolConfig; source: "template-local" | "core"; poolIndex: number } | undefined => {
    if (!activePoolName) return undefined;
    const pools = session.template.contentPools ?? [];
    const li = pools.findIndex((p) => p.name === activePoolName);
    if (li !== -1) return { pool: pools[li], source: "template-local", poolIndex: li };
    const corePool = session.coreArchive?.contentPoolIndex?.get(activePoolName);
    if (corePool) return { pool: corePool, source: "core", poolIndex: -1 };
    const isCore = catalogOptions.contentPools.some((p) => p.id === activePoolName);
    if (isCore) return { pool: { name: activePoolName, groups: [] }, source: "core", poolIndex: -1 };
    return undefined;
  });

  type MandatoryObjectRuleRow = {
    entryIndex: number;
    contentIndex: number | undefined;
    ruleIndex: number | undefined;
    id: string;
    sid: string | undefined;
    weight: number | undefined;
    variant: number | undefined;
    biome: string | undefined;
    entry: MandatoryContent;
    item: ContentWeight | undefined;
    rule: PlacementRule | undefined;
  };
  let mandatoryRows = $derived.by((): MandatoryObjectRuleRow[] => {
    const rows: MandatoryObjectRuleRow[] = [];
    for (const [entryIndex, entry] of presetEntries.entries()) {
      const objects = entry.sid
        ? [{ contentIndex: undefined, sid: entry.sid, weight: undefined, variant: entry.variant, biome: undefined, item: undefined }]
        : (entry.content ?? []).map((item, contentIndex) => ({
            contentIndex,
            sid: item.sid,
            weight: item.weight,
            variant: item.variant,
            biome: item.biome,
            item,
          }));
      const visibleObjects = objects.length > 0
        ? objects
        : [{ contentIndex: undefined, sid: undefined, weight: undefined, variant: entry.variant, biome: undefined, item: undefined }];
      const rules = (entry.rules ?? []).length > 0 ? (entry.rules ?? []) : [undefined];
      for (const object of visibleObjects) {
        for (const [ruleIndex, rule] of rules.entries()) {
          const objectId = object.contentIndex === undefined ? `E${entryIndex}` : `E${entryIndex}.C${object.contentIndex}`;
          rows.push({
            entryIndex,
            contentIndex: object.contentIndex,
            ruleIndex: rule ? ruleIndex : undefined,
            id: rule ? `${objectId}.R${ruleIndex}` : objectId,
            sid: object.sid,
            weight: object.weight,
            variant: object.variant,
            biome: object.biome,
            entry,
            item: object.item,
            rule,
          });
        }
      }
    }
    return rows;
  });
  let isEditable = $derived(activePool?.source === "template-local");
  let focusedGroup = $state<number | undefined>(0);
  let contentSearch = $state("");
  let banSearch = $state("");
  let groups = $derived(activePool?.pool.groups ?? []);
  $effect(() => {
    const g = groups.length;
    if (g === 0) focusedGroup = undefined;
    else if (focusedGroup !== undefined && focusedGroup >= g) focusedGroup = g - 1;
  });
  let focusedGroupData = $derived(focusedGroup === undefined ? undefined : groups[focusedGroup]);
  let resolvedIncludedLists = $derived.by((): { name: string; items: ContentWeight[] }[] => {
    if (!focusedGroupData) return [];
    const listNames = focusedGroupData.includeLists ?? [];
    const listIndex = session.coreArchive?.contentListIndex;
    if (!listIndex || listNames.length === 0) return [];
    return listNames.map((name) => ({
      name,
      items: (listIndex.get(name)?.content ?? []) as ContentWeight[],
    }));
  });
  let allGroupContent = $derived.by(() => {
    const direct = (focusedGroupData?.content ?? []) as ContentWeight[];
    const included = resolvedIncludedLists.flatMap((l) => l.items);
    return { direct, included };
  });
  let directContentRows = $derived.by(() => groups.flatMap((group, groupIndex) =>
    ((group.content ?? []) as ContentWeight[]).map((item, contentIndex) => ({
      groupIndex,
      contentIndex,
      item,
    })),
  ));
  let filteredContentOptions = $derived.by(() => {
    const q = contentSearch.trim().toLowerCase();
    const base = catalogOptions.rmgContent;
    if (!q) return base.slice(0, 30);
    return base.filter((o) => o.id.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)).slice(0, 30);
  });
  let sheetAddSid = $state("");
  let sheetAddWeight = $state<number | undefined>(undefined);
  let sheetAddVariant = $state<number | undefined>(undefined);
  let sheetAddBiome = $state("");
  let ungroupedPanelRem = $state(12);
  let assignmentPanelRem = $state(9);
  const mandatoryColumns = ["Entry", "SID", "Weight", "Variant", "Biome", "Owner", "Flags", "Rule", "Args", "Target", "Min target", "Max target", "Rule weight", "Remove"] as const;
  const contentPoolColumns = ["Entry", "SID", "Weight", "Variant", "Biome", "Remove"] as const;
  const mandatoryColumnDefaults = ["max-content", "minmax(16rem, 1fr)", "max-content", "max-content", "max-content", "max-content", "max-content", "max-content", "minmax(10rem, 0.65fr)", "max-content", "max-content", "max-content", "max-content", "max-content"];
  const contentPoolColumnDefaults = ["4.5rem", "minmax(16rem, 1fr)", "7rem", "6rem", "8rem", "5rem"];
  let mandatoryColumnWidths = $state<(number | undefined)[]>([]);
  let contentPoolColumnWidths = $state<(number | undefined)[]>([]);
  $effect(() => {
    if (mandatoryColumnWidths.length !== mandatoryColumnDefaults.length) mandatoryColumnWidths = Array(mandatoryColumnDefaults.length).fill(undefined);
    if (contentPoolColumnWidths.length !== contentPoolColumnDefaults.length) contentPoolColumnWidths = Array(contentPoolColumnDefaults.length).fill(undefined);
  });
  function columnTemplate(defaults: readonly string[], widths: readonly (number | undefined)[]): string {
    return defaults.map((value, index) => widths[index] === undefined ? value : `${Math.max(36, widths[index]!)}px`).join(" ");
  }
  let mandatorySheetColumns = $derived(columnTemplate(mandatoryColumnDefaults, mandatoryColumnWidths));
  let contentPoolSheetColumns = $derived(columnTemplate(contentPoolColumnDefaults, contentPoolColumnWidths));
  let poolSheetStyle = $derived(`--pool-sheet-cols: ${mandatorySheetColumns}; --ungrouped-height: ${ungroupedPanelRem}rem;`);
  let contentPoolSheetStyle = $derived(`--pool-sheet-cols: ${contentPoolSheetColumns}; --ungrouped-height: ${ungroupedPanelRem}rem;`);
  let assignmentPanelStyle = $derived(`--assignment-panel-height: ${assignmentPanelRem}rem;`);
  let filteredSheetAddOptions = $derived.by(() => {
    const q = sheetAddSid.trim().toLowerCase();
    const base = catalogOptions.rmgContent;
    if (!q) return base.slice(0, 20);
    return base.filter((o) => o.id.toLowerCase().includes(q) || o.label.toLowerCase().includes(q)).slice(0, 20);
  });
  let contentListOptions = $derived.by(() => {
    const ids: string[] = [];
    for (const list of session.template.contentLists ?? []) {
      if (list.name && !ids.includes(list.name)) ids.push(list.name);
    }
    for (const id of session.coreArchive?.contentListIndex?.keys() ?? []) {
      if (!ids.includes(id)) ids.push(id);
    }
    return ids.sort((a, b) => a.localeCompare(b));
  });
  let ruleArgOptionsFlat = $derived.by(() => {
    const namedEntries = presetEntries
      .map((entry, index) => entry.name ?? `E${index}`)
      .filter(Boolean)
      .map((id) => ({ id, label: "mandatory entry" }));
    return [...namedEntries, ...catalogOptions.rmgContent.slice(0, 500)];
  });

  // --- Zone assignment multi-picker state ---
  let guardedInput = $state("");
  let unguardedInput = $state("");
  let resourceInput = $state("");
  let mandatoryInput = $state("");
  let countLimitInput = $state("");
  let poolScope = $state<"zone" | "global">("zone");

  // --- Template-local list filter state ---
  let poolFilter = $state("");
  let presetFilter = $state("");
  let newPoolName = $state("");
  let newPresetName = $state("");

  let filteredLocalPools = $derived.by(() => {
    const pools = session.template.contentPools ?? [];
    const q = poolFilter.trim().toLowerCase();
    if (!q) return pools;
    return pools.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  });

  let filteredLocalPresets = $derived.by(() => {
    const presets = session.template.mandatoryContent ?? [];
    const q = presetFilter.trim().toLowerCase();
    if (!q) return presets;
    return presets.filter((p) => (p.name ?? "").toLowerCase().includes(q));
  });

  let assignmentFilter = $derived(poolFilter.trim().toLowerCase());
  let globalLocalPools = $derived.by(() => {
    const pools = session.template.contentPools ?? [];
    if (!assignmentFilter) return pools;
    return pools.filter((pool) => (pool.name ?? "").toLowerCase().includes(assignmentFilter));
  });
  let globalMandatoryPresets = $derived.by(() => {
    const presets = session.template.mandatoryContent ?? [];
    if (!assignmentFilter) return presets;
    return presets.filter((preset) => (preset.name ?? "").toLowerCase().includes(assignmentFilter));
  });
  let globalGuardedPools = $derived.by(() => {
    const pools = session.coreArchive?.catalogSummary?.guardedContentPoolOptions ?? catalogOptions.guardedContentPools;
    if (!assignmentFilter) return pools;
    return pools.filter((pool) => pool.id.toLowerCase().includes(assignmentFilter) || pool.label.toLowerCase().includes(assignmentFilter));
  });
  let globalUnguardedPools = $derived.by(() => {
    const pools = session.coreArchive?.catalogSummary?.unguardedContentPoolOptions ?? catalogOptions.unguardedContentPools;
    if (!assignmentFilter) return pools;
    return pools.filter((pool) => pool.id.toLowerCase().includes(assignmentFilter) || pool.label.toLowerCase().includes(assignmentFilter));
  });
  let globalResourcePools = $derived.by(() => {
    const pools = session.coreArchive?.catalogSummary?.resourceContentPoolOptions ?? catalogOptions.resourceContentPools;
    if (!assignmentFilter) return pools;
    return pools.filter((pool) => pool.id.toLowerCase().includes(assignmentFilter) || pool.label.toLowerCase().includes(assignmentFilter));
  });

  // --- Pool browser functions ---
  function inspectPoolTag(poolName: string) {
    const resolved = editor.resolvePool(poolName);
    editor.inspectPool(poolName, resolved?.source ?? "core");
    focusedGroup = 0;
  }

  function cloneAndEdit() {
    if (!activePoolName) return;
    const field = getPoolZoneField(activePoolName);
    editor.cloneCorePoolToEdit(activePoolName, field as any ?? "guardedContentPool");
  }

  function swapPool(newPoolName: string) {
    if (!activePoolName || !newPoolName.trim()) return;
    const field = getPoolZoneField(activePoolName);
    if (!field) return;
    const currentPools = getZonePools(field);
    const idx = currentPools.indexOf(activePoolName);
    if (idx === -1) return;
    const next = [...currentPools];
    next[idx] = newPoolName.trim();
    editor.setZonePoolField(field, next);
    editor.inspectPool(newPoolName.trim(), editor.resolvePool(newPoolName.trim())?.source ?? "core");
    focusedGroup = 0;
  }

  function getPoolZoneField(poolName: string): "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool" | undefined {
    if (zone.guardedPools.includes(poolName)) return "guardedContentPool";
    if (zone.unguardedPools.includes(poolName)) return "unguardedContentPool";
    if (zone.resourcesPools.includes(poolName)) return "resourcesContentPool";
    return undefined;
  }

  function getZonePools(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool"): string[] {
    if (field === "guardedContentPool") return [...zone.guardedPools];
    if (field === "unguardedContentPool") return [...zone.unguardedPools];
    return [...zone.resourcesPools];
  }

  function optionLabel(id: string, options: readonly { id: string; label: string }[]): string {
    const option = options.find((item) => item.id === id);
    return option && option.label !== id ? option.label : "";
  }

  function ensureEditablePoolIndex(): number | undefined {
    if (!activePoolName || !activePool) return undefined;
    if (activePool.source === "template-local") return activePool.poolIndex;
    const field = getPoolZoneField(activePoolName);
    if (poolScope === "zone" && field) {
      editor.cloneCorePoolToEdit(activePoolName, field);
      const nextName = editor.activeContentPoolName;
      const index = (editor.session.template.contentPools ?? []).findIndex((pool) => pool.name === nextName);
      return index === -1 ? undefined : index;
    }
    editor.localizeCorePoolForEditing(activePoolName);
    const index = (editor.session.template.contentPools ?? []).findIndex((pool) => pool.name === activePoolName);
    return index === -1 ? undefined : index;
  }

  function addContent() {
    if (!activePool || !contentSearch.trim()) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.addContentToPoolGroup(poolIndex, focusedGroup ?? 0, contentSearch.trim());
    contentSearch = "";
  }

  function parseOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function pruneContentWeight(item: ContentWeight): ContentWeight {
    const next: ContentWeight = {};
    if (item.sid?.trim()) next.sid = item.sid.trim();
    if (item.weight !== undefined && Number.isFinite(item.weight)) next.weight = item.weight;
    if (item.variant !== undefined && Number.isFinite(item.variant)) next.variant = item.variant;
    if (item.biome?.trim()) next.biome = item.biome.trim();
    return next;
  }

  function replaceGroupContent(groupIndex: number, content: readonly ContentWeight[]) {
    if (!activePool) return;
    const group = groups[groupIndex];
    if (!group) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.updatePoolGroup(poolIndex, groupIndex, group.weight, group.includeLists ?? [], content);
  }

  function updateDirectContent(groupIndex: number, contentIndex: number, patch: Partial<ContentWeight>) {
    const group = groups[groupIndex];
    if (!group) return;
    const content = [...(group.content ?? [])];
    const current = content[contentIndex];
    if (!current) return;
    content[contentIndex] = pruneContentWeight({ ...current, ...patch });
    replaceGroupContent(groupIndex, content);
  }

  function addSheetContent() {
    if (!activePool) return;
    const groupIndex = focusedGroup ?? 0;
    const group = groups[groupIndex];
    if (!group) return;
    const sid = sheetAddSid.trim();
    if (!sid) return;
    const nextItem = pruneContentWeight({
      sid,
      weight: sheetAddWeight,
      variant: sheetAddVariant,
      biome: sheetAddBiome,
    });
    replaceGroupContent(groupIndex, [...(group.content ?? []), nextItem]);
    sheetAddSid = "";
    sheetAddWeight = undefined;
    sheetAddVariant = undefined;
    sheetAddBiome = "";
  }
  function removeDirectContent(groupIndex: number, contentIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const content = [...(group.content ?? [])];
    content.splice(contentIndex, 1);
    replaceGroupContent(groupIndex, content);
  }

  function handleDirectSidInput(groupIndex: number, contentIndex: number, value: string) {
    if (!value.trim()) return;
    updateDirectContent(groupIndex, contentIndex, { sid: value });
  }

  function handleDirectSidFinalize(event: Event | KeyboardEvent, groupIndex: number, contentIndex: number) {
    const target = event.currentTarget as HTMLInputElement;
    if (target.value.trim()) return;
    if ("key" in event && event.key !== "Enter") return;
    event.preventDefault?.();
    removeDirectContent(groupIndex, contentIndex);
  }

  function handleSheetAddKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSheetContent();
  }

  function handleSheetAddBlur() {
    addSheetContent();
  }

  function startColumnResize(event: PointerEvent, columnIndex: number, table: "mandatory" | "pool") {
    if (event.button !== 0) return;
    const header = event.currentTarget instanceof HTMLElement ? event.currentTarget.parentElement : undefined;
    if (!header) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = header.getBoundingClientRect().width;
    function handleMove(moveEvent: PointerEvent) {
      const nextWidth = Math.max(36, startWidth + moveEvent.clientX - startX);
      if (table === "mandatory") {
        mandatoryColumnWidths[columnIndex] = nextWidth;
        mandatoryColumnWidths = [...mandatoryColumnWidths];
      } else {
        contentPoolColumnWidths[columnIndex] = nextWidth;
        contentPoolColumnWidths = [...contentPoolColumnWidths];
      }
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function startDirectSplitResize(event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startY = event.clientY;
    const startRem = ungroupedPanelRem;
    function handleMove(moveEvent: PointerEvent) {
      const deltaRem = (moveEvent.clientY - startY) / 16;
      ungroupedPanelRem = Math.min(34, Math.max(5, startRem - deltaRem));
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function startAssignmentResize(event: PointerEvent) {
    if (event.button !== 0) return;
    event.preventDefault();
    const startY = event.clientY;
    const startRem = assignmentPanelRem;
    function handleMove(moveEvent: PointerEvent) {
      const deltaRem = (moveEvent.clientY - startY) / 16;
      assignmentPanelRem = Math.min(24, Math.max(5, startRem + deltaRem));
    }
    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  function sidTone(sid: string | undefined): string {
    const value = (sid ?? "").toLowerCase();
    if (!value) return "empty";
    if (value.includes("mine_") || value.includes("_mine")) return "mine";
    if (value.includes("random")) return "random";
    if (value.includes("item")) return "item";
    if (value.includes("unit_")) return "unit";
    return "content";
  }

  function biomeTone(biome: string | undefined): string {
    const value = (biome ?? "").toLowerCase();
    if (!value) return "empty";
    if (value.includes("snow") || value.includes("frost")) return "cold";
    if (value.includes("desert") || value.includes("sand")) return "dry";
    if (value.includes("swamp") || value.includes("water")) return "wet";
    return "content";
  }

  function playerShortName(player: string): string {
    const index = PLAYER_REFS.indexOf(player as any);
    return index === -1 ? player : `P${index + 1}`;
  }

  function playerColor(player: string | undefined): string {
    return player ? (PLAYER_COLORS[player] ?? "#777") : "#777";
  }

  function contentSidFromDrop(event: DragEvent): string {
    return event.dataTransfer?.getData("application/x-rmg-content-sid") || "";
  }

  function poolIdFromDrop(event: DragEvent): string {
    return event.dataTransfer?.getData("application/x-rmg-pool-id") || "";
  }

  function canDropContent(event: DragEvent): boolean {
    return Boolean(activePool && contentSidFromDrop(event));
  }

  function handleContentDragOver(event: DragEvent) {
    if (!canDropContent(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  function handleContentDrop(event: DragEvent) {
    if (!activePool) return;
    const sid = contentSidFromDrop(event);
    if (!sid) return;
    event.preventDefault();
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.addContentToPoolGroup(poolIndex, focusedGroup ?? 0, sid);
  }

  function addBan() {
    if (!activePool || !banSearch.trim()) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.addBanToPool(poolIndex, banSearch.trim());
    banSearch = "";
  }

  function removeBan(bi: number) {
    if (!activePool) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.removeBanFromPool(poolIndex, bi);
  }

  function addGroup() {
    if (!activePool) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.addGroupToPool(poolIndex);
    focusedGroup = groups.length;
  }

  function removeGroup(gi: number) {
    if (!activePool) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.removeGroupFromPool(poolIndex, gi);
  }

  function updateGroupWeight(weight: number | undefined) {
    if (!activePool || !focusedGroupData) return;
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.updatePoolGroup(poolIndex, focusedGroup ?? 0, weight, focusedGroupData.includeLists ?? [], focusedGroupData.content ?? []);
  }

  function updateGroupIncludeLists(value: string) {
    if (!activePool || !focusedGroupData) return;
    const lists = value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    const poolIndex = ensureEditablePoolIndex();
    if (poolIndex === undefined) return;
    editor.updatePoolGroup(poolIndex, focusedGroup ?? 0, focusedGroupData.weight, lists, focusedGroupData.content ?? []);
  }

  // --- Zone assignment multi-picker helpers ---
  function addPoolToZone(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool", input: string) {
    const name = input.trim();
    if (!name) return;
    const current = getZonePools(field);
    if (current.includes(name)) return;
    editor.setZonePoolField(field, [...current, name]);
  }

  function handlePoolDragOver(event: DragEvent) {
    if (!poolIdFromDrop(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  }

  function handlePoolDrop(event: DragEvent, field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool") {
    const poolName = poolIdFromDrop(event);
    if (!poolName) return;
    event.preventDefault();
    addPoolToZone(field, poolName);
  }

  function removePoolFromZone(field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool", index: number) {
    const current = getZonePools(field);
    editor.setZonePoolField(field, current.filter((_, i) => i !== index));
  }

  function addMandatoryPreset() {
    const name = mandatoryInput.trim();
    if (!name) return;
    const current = [...zone.mandatoryContent];
    if (current.includes(name)) return;
    editor.setZoneMandatoryPresets([...current, name]);
    mandatoryInput = "";
  }

  function removeMandatoryPreset(index: number) {
    editor.setZoneMandatoryPresets(zone.mandatoryContent.filter((_, i) => i !== index));
  }

  function addCountLimit() {
    const name = countLimitInput.trim();
    if (!name) return;
    const current = [...zone.contentCountLimits];
    if (current.includes(name)) return;
    editor.setZoneCountLimitPresets([...current, name]);
    countLimitInput = "";
  }

  function removeCountLimit(index: number) {
    editor.setZoneCountLimitPresets(zone.contentCountLimits.filter((_, i) => i !== index));
  }
  // --- Mandatory content preset browser ---
  let activePresetName = $derived(editor.activeMandatoryContentPresetName);
  let activePreset = $derived.by((): { preset: import("../../../core/rmg/rmgTypes.js").MandatoryContentPreset; presetIndex: number } | undefined => {
    if (!activePresetName) return undefined;
    const presets = session.template.mandatoryContent ?? [];
    const idx = presets.findIndex((p) => p.name === activePresetName);
    if (idx !== -1) return { preset: presets[idx], presetIndex: idx };
    return undefined;
  });
  let presetEntries = $derived(activePreset?.preset.content ?? []);
  let focusedEntry = $state(0);
  let mcSid = $state("");
  let mcVariant = $state<number | undefined>(undefined);
  let mcDesignated = $state(false);
  let mcSolo = $state(false);
  let mcGuarded = $state(true);
  let mcMine = $state(false);
  $effect(() => {
    const n = presetEntries.length;
    if (n === 0) focusedEntry = 0;
    else if (focusedEntry >= n) focusedEntry = n - 1;
  });
  function addPresetEntry() {
    if (!activePreset || !mcSid.trim()) return;
    const newEntry: MandatoryContent = {
      sid: mcSid.trim(),
      variant: mcVariant,
      designatedEncounter: mcDesignated || undefined,
      soloEncounter: mcSolo || undefined,
      isGuarded: mcGuarded ? undefined : false,
      isMine: mcMine || undefined,
    };
    const nextContent = [...presetEntries, newEntry];
    editor.updateMandatoryContentPreset(activePreset.presetIndex, nextContent);
    mcSid = ""; mcVariant = undefined;
    mcDesignated = false; mcSolo = false; mcGuarded = true; mcMine = false;
  }
  function addMandatorySheetEntry() {
    addPresetEntry();
  }
  function handleMandatoryAddKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addMandatorySheetEntry();
  }
  function removePresetEntry(entryIndex: number) {
    if (!activePreset) return;
    const nextContent = presetEntries.filter((_, i) => i !== entryIndex);
    editor.updateMandatoryContentPreset(activePreset.presetIndex, nextContent);
  }
  function updateEntryNumber(entryIndex: number, field: keyof MandatoryContent, value: string) {
    updateEntryField(entryIndex, field, parseOptionalNumber(value));
  }
  function setEntryOwner(entryIndex: number, value: string) {
    updateEntryField(entryIndex, "owner", value || undefined);
  }
  function ruleSummary(entry: MandatoryContent): string {
    const count = entry.rules?.length ?? 0;
    return count === 0 ? "none" : `${count} rule${count === 1 ? "" : "s"}`;
  }
  function placementSummary(entry: MandatoryContent): string {
    const labels = [];
    if (entry.designatedEncounter) labels.push("designated");
    if (entry.soloEncounter) labels.push("solo");
    labels.push(entry.isGuarded === false ? "unguarded" : "guarded");
    if (entry.isMine) labels.push("mine");
    return labels.join(" ");
  }
  function updateEntryField(entryIndex: number, field: keyof MandatoryContent, value: unknown) {
    if (!activePreset) return;
    const nextContent = presetEntries.map((entry, i) => {
      if (i !== entryIndex) return entry;
      return { ...entry, [field]: value };
    });
    editor.updateMandatoryContentPreset(activePreset.presetIndex, nextContent);
  }
  function updateEntryContent(entryIndex: number, contentIndex: number, patch: Partial<ContentWeight>) {
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const content = [...(entry.content ?? [])];
    const current = content[contentIndex];
    if (!current) return;
    content[contentIndex] = pruneContentWeight({ ...current, ...patch });
    updateEntryField(entryIndex, "content", content.length > 0 ? content : undefined);
  }
  function updateMandatoryRowSid(row: MandatoryObjectRuleRow, value: string) {
    if (row.contentIndex === undefined) {
      updateEntryField(row.entryIndex, "sid", value || undefined);
      return;
    }
    updateEntryContent(row.entryIndex, row.contentIndex, { sid: value });
  }
  function updateMandatoryRowVariant(row: MandatoryObjectRuleRow, value: string) {
    const variant = parseOptionalNumber(value);
    if (row.contentIndex === undefined) {
      updateEntryField(row.entryIndex, "variant", variant);
      return;
    }
    updateEntryContent(row.entryIndex, row.contentIndex, { variant });
  }
  function updateMandatoryRowWeight(row: MandatoryObjectRuleRow, value: string) {
    if (row.contentIndex === undefined) return;
    updateEntryContent(row.entryIndex, row.contentIndex, { weight: parseOptionalNumber(value) });
  }
  function updateMandatoryRowBiome(row: MandatoryObjectRuleRow, value: string) {
    if (row.contentIndex === undefined) return;
    updateEntryContent(row.entryIndex, row.contentIndex, { biome: value });
  }
  function removeEntryContent(entryIndex: number, contentIndex: number) {
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const content = [...(entry.content ?? [])];
    content.splice(contentIndex, 1);
    updateEntryField(entryIndex, "content", content.length > 0 ? content : undefined);
  }
  function toggleEntryFlag(entryIndex: number, field: "designatedEncounter" | "soloEncounter" | "isGuarded" | "isMine") {
    if (!activePreset) return;
    const current = presetEntries[entryIndex]?.[field];
    if (field === "isGuarded") {
      updateEntryField(entryIndex, field, current === false ? undefined : false);
      return;
    }
    updateEntryField(entryIndex, field, current ? undefined : true);
  }
  // --- Rule management ---
  const RULE_TYPES = ["Random", "Sid", "MainObject", "Crossroads", "Connection", "Road", "MandatoryContent"] as const;
  const OWNER_REFS = ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6", "Player7", "Player8"] as const;
  function ruleNeedsArgs(type: string): boolean {
    return type === "Sid" || type === "MainObject" || type === "Connection" || type === "MandatoryContent";
  }
  function ruleArgLabel(type: string): string {
    switch (type) {
      case "Sid": return "Object SID";
      case "MainObject": return "Main object index (0-based)";
      case "Connection": return "Connection name";
      case "MandatoryContent": return "Entry name";
      default: return "";
    }
  }
  function removeRule(entryIndex: number, ruleIndex: number) {
    if (!activePreset) return;
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const nextRules = (entry.rules ?? []).filter((_, i) => i !== ruleIndex);
    updateEntryField(entryIndex, "rules", nextRules.length > 0 ? nextRules : undefined);
  }
  function parseRuleArgs(value: string): string[] | undefined {
    const args = value.split(/[,]+/).map((part) => part.trim()).filter(Boolean);
    return args.length > 0 ? args : undefined;
  }
  function updateRuleNumber(entryIndex: number, ruleIndex: number, field: keyof PlacementRule, value: string) {
    updateRuleField(entryIndex, ruleIndex, field, parseOptionalNumber(value));
  }
  function updateRuleField(entryIndex: number, ruleIndex: number, field: string, value: unknown) {
    if (!activePreset) return;
    const entry = presetEntries[entryIndex];
    if (!entry) return;
    const nextRules = (entry.rules ?? []).map((rule, i) => {
      if (i !== ruleIndex) return rule;
      return { ...rule, [field]: value };
    });
    updateEntryField(entryIndex, "rules", nextRules);
  }

  // --- Template-local entity management ---
  function addNewPool() {
    const name = newPoolName.trim();
    if (!name) return;
    editor.addLocalPool(name);
    newPoolName = "";
  }

  function addToolbarPool() {
    const name = poolFilter.trim();
    if (!name) return;
    editor.addLocalPool(name);
    editor.inspectPool(name, "template-local");
    poolFilter = "";
    focusedGroup = 0;
  }

  function removeLocalPool(index: number) {
    const pool = (session.template.contentPools ?? [])[index];
    if (!pool?.name) return;
    editor.removeLocalPool(pool.name);
  }

  function addNewPreset() {
    const name = newPresetName.trim();
    if (!name) return;
    editor.addMandatoryContentPreset(name);
    newPresetName = "";
  }

  function removeLocalPreset(index: number) {
    editor.removeMandatoryContentPreset(index);
  }

  function removeMandatoryPresetByName(presetName: string) {
    const index = (session.template.mandatoryContent ?? []).findIndex((preset) => preset.name === presetName);
    if (index !== -1) editor.removeMandatoryContentPreset(index);
  }

  function inspectLocalPool(poolName: string) {
    editor.inspectPool(poolName, "template-local");
    focusedGroup = 0;
  }

  function inspectMandatoryPreset(presetName: string) {
    editor.inspectMandatoryContentPreset(presetName);
  }

  function removeLocalPoolByName(poolName: string) {
    editor.removeLocalPool(poolName);
  }
</script>

<div class="pools-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to manage its content pools.</p>
  {:else}

    <PoolAssignmentStrip
      {zone}
      bind:poolScope
      bind:poolFilter
      panelStyle={assignmentPanelStyle}
      {activePoolName}
      {activePresetName}
      {globalGuardedPools}
      {globalUnguardedPools}
      {globalResourcePools}
      {globalMandatoryPresets}
      {globalLocalPools}
      onAddToolbarPool={addToolbarPool}
      onInspectPool={inspectPoolTag}
      onInspectLocalPool={inspectLocalPool}
      onInspectMandatoryPreset={inspectMandatoryPreset}
      onRemovePoolFromZone={removePoolFromZone}
      onRemoveMandatoryPreset={removeMandatoryPreset}
      onRemoveGlobalMandatoryPreset={removeMandatoryPresetByName}
      onRemoveCountLimit={removeCountLimit}
      onRemoveLocalPool={removeLocalPoolByName}
      onPoolDragOver={handlePoolDragOver}
      onPoolDrop={handlePoolDrop}
      onResizeStart={startAssignmentResize}
    />

    {#if activePreset}
      {@const preset = activePreset.preset}
      <section class="main-editor">
        <header class="pool-title">
          <div>
            <h1>{activePresetName}</h1>
            <small>Template-local mandatory preset, {presetEntries.length} entries, {presetEntries.reduce((sum, entry) => sum + (entry.rules?.length ?? 0), 0)} placement rules</small>
          </div>
          <div class="sheet-toolbar">
            <input aria-label="Filter mandatory rows" bind:value={contentSearch} placeholder="Filter SID..." />
            <input aria-label="New mandatory SID" type="search" list="mc-sid-options" bind:value={mcSid} onkeydown={handleMandatoryAddKeydown} placeholder="New SID..." />
            <button class="btn primary" onclick={addMandatorySheetEntry} disabled={!mcSid.trim()}>Add entry</button>
            <button class="button-icon" onclick={() => editor.clearMandatoryContentInspection()} title="Close">✕</button>
          </div>
        </header>

        <div class="sheet" style={poolSheetStyle}>
          <section class="sheet-col" aria-label="Mandatory entries">
            <div class="col-head"><strong>Objects</strong><span>{presetEntries.length} entries</span></div>
            <div class="group-list">
              {#each presetEntries as entry, ei (entry)}
                <div
                  class="group-row"
                  class:active={focusedEntry === ei}
                  onclick={() => focusedEntry = ei}
                  onkeydown={(event) => { if (event.key === "Enter" || event.key === " ") focusedEntry = ei; }}
                  role="button"
                  tabindex="0"
                >
                  <span class="toggle">{focusedEntry === ei ? "▾" : "▸"}</span>
                  <strong>E{ei} {entry.sid ?? (entry.content?.[0]?.sid ?? "weighted objects")}</strong>
                  <small>{ruleSummary(entry)}</small>
                </div>
                {#if focusedEntry === ei}
                  <div class="group-children">
                    <div class="child-row"><span>p</span><span>{placementSummary(entry)}</span></div>
                    {#if entry.content?.length}<div class="child-row"><span>c</span><span>{entry.content.length} weighted objects</span></div>{/if}
                  </div>
                {/if}
              {/each}
              {#if presetEntries.length === 0}
                <p class="placeholder pane-empty">No objects</p>
              {/if}
            </div>
          </section>

          <section class="pool-sheet-col">
            <div class="col-head"><strong>Items + rules</strong><span>objects with placement rule fields</span></div>
            <div class="pool-sheet" role="grid" tabindex="0" aria-label="Mandatory content objects and rules">
              <div class="column-fill" aria-hidden="true">
                {#each mandatoryColumns as column (column)}
                  <span></span>
                {/each}
              </div>
              {#each mandatoryColumns as column (column)}
                <div
                  class="sheet-cell head"
                  role="columnheader"
                  title={column === "Target" ? "Preferred normalized placement target distance, 0 to 1" : column === "Min target" ? "Minimum normalized placement target distance for randomized target, 0 to 1" : column === "Max target" ? "Maximum normalized placement target distance for randomized target, 0 to 1" : undefined}
                >
                  <span>{column}</span>
                  <button class="column-resize" type="button" aria-label="Resize {column} column" onpointerdown={(event) => startColumnResize(event, mandatoryColumns.indexOf(column), "mandatory")}></button>
                </div>
              {/each}

              <div class="section-row"><strong>Mandatory objects</strong><span>one row per object and rule pairing</span></div>

              {#each mandatoryRows as row (row.id)}
                {@const matchesFilter = !contentSearch.trim() || (row.sid ?? "Random").toLowerCase().includes(contentSearch.trim().toLowerCase()) || (row.entry.name ?? "").toLowerCase().includes(contentSearch.trim().toLowerCase()) || (row.rule?.type ?? "").toLowerCase().includes(contentSearch.trim().toLowerCase())}
                {#if matchesFilter}
                  <div class="sheet-cell id" class:active={focusedEntry === row.entryIndex}>{row.id}</div>
                  <div class="sheet-cell sid" class:active={focusedEntry === row.entryIndex} class:is-mine={sidTone(row.sid) === "mine"} class:is-random={sidTone(row.sid) === "random"} class:is-item={sidTone(row.sid) === "item"} class:is-unit={sidTone(row.sid) === "unit"}>
                    <input type="search" list="mc-sid-options" value={row.sid ?? ""} placeholder="Object SID" oninput={(event) => updateMandatoryRowSid(row, event.currentTarget.value)} />
                  </div>
                  <div class="sheet-cell numeric">
                    {#if row.contentIndex !== undefined}
                      <input type="text" inputmode="decimal" value={row.weight ?? ""} placeholder="100" oninput={(event) => updateMandatoryRowWeight(row, event.currentTarget.value)} />
                    {:else}
                      <span class="muted-cell">direct</span>
                    {/if}
                  </div>
                  <div class="sheet-cell numeric"><input type="text" inputmode="numeric" value={row.variant ?? ""} placeholder="-1" oninput={(event) => updateMandatoryRowVariant(row, event.currentTarget.value)} /></div>
                  <div class="sheet-cell" class:is-cold={biomeTone(row.biome) === "cold"} class:is-dry={biomeTone(row.biome) === "dry"} class:is-wet={biomeTone(row.biome) === "wet"}>
                    {#if row.contentIndex !== undefined}
                      <input type="text" list="pool-biome-options" value={row.biome ?? ""} placeholder="biome" oninput={(event) => updateMandatoryRowBiome(row, event.currentTarget.value)} />
                    {:else}
                      <span class="muted-cell">preset</span>
                    {/if}
                  </div>
                  <div class="sheet-cell owner-cell" style:--player-color={playerColor(row.entry.owner)}>
                    <select value={row.entry.owner ?? ""} onchange={(event) => setEntryOwner(row.entryIndex, event.currentTarget.value)}>
                      <option value="">optional</option>
                      {#each PLAYER_REFS as player (player)}
                        <option value={player}>{playerShortName(player)}</option>
                      {/each}
                    </select>
                  </div>
                  <div class="sheet-cell flag-cell">
                    <label title="Use guarded mandatory-content routing"><input type="checkbox" checked={row.entry.isGuarded !== false} onchange={() => toggleEntryFlag(row.entryIndex, "isGuarded")} /> guarded</label>
                    <label title="Route this object through mine placement"><input type="checkbox" checked={!!row.entry.isMine} onchange={() => toggleEntryFlag(row.entryIndex, "isMine")} /> mine</label>
                    <label title="Reserve or mark a designated encounter"><input type="checkbox" checked={!!row.entry.designatedEncounter} onchange={() => toggleEntryFlag(row.entryIndex, "designatedEncounter")} /> designated</label>
                    <label title="Request a solo encounter"><input type="checkbox" checked={!!row.entry.soloEncounter} onchange={() => toggleEntryFlag(row.entryIndex, "soloEncounter")} /> solo</label>
                  </div>
                  <div class="sheet-cell">
                    {#if row.ruleIndex !== undefined && row.rule}
                      <select value={row.rule.type ?? ""} onchange={(event) => updateRuleField(row.entryIndex, row.ruleIndex!, "type", event.currentTarget.value)}>
                        {#each RULE_TYPES as ruleType (ruleType)}
                          <option value={ruleType}>{ruleType}</option>
                        {/each}
                      </select>
                    {:else}
                      <span class="muted-cell">none</span>
                    {/if}
                  </div>
                  <div class="sheet-cell">
                    {#if row.ruleIndex !== undefined && row.rule}
                      <input type="search" list="pool-rule-arg-options" value={(row.rule.args ?? []).join(", ")} placeholder={ruleNeedsArgs(row.rule.type ?? "") ? ruleArgLabel(row.rule.type ?? "") : "none"} oninput={(event) => updateRuleField(row.entryIndex, row.ruleIndex!, "args", parseRuleArgs(event.currentTarget.value))} />
                    {:else}
                      <span class="muted-cell"></span>
                    {/if}
                  </div>
                  <div class="sheet-cell numeric" title="Preferred normalized placement target distance, 0 to 1">
                    {#if row.ruleIndex !== undefined && row.rule}<input type="text" inputmode="decimal" value={row.rule.target ?? ""} placeholder="target" oninput={(event) => updateRuleNumber(row.entryIndex, row.ruleIndex!, "target", event.currentTarget.value)} />{/if}
                  </div>
                  <div class="sheet-cell numeric" title="Minimum normalized placement target distance for randomized target, 0 to 1">
                    {#if row.ruleIndex !== undefined && row.rule}<input type="text" inputmode="decimal" value={row.rule.targetMin ?? ""} placeholder="min" oninput={(event) => updateRuleNumber(row.entryIndex, row.ruleIndex!, "targetMin", event.currentTarget.value)} />{/if}
                  </div>
                  <div class="sheet-cell numeric" title="Maximum normalized placement target distance for randomized target, 0 to 1">
                    {#if row.ruleIndex !== undefined && row.rule}<input type="text" inputmode="decimal" value={row.rule.targetMax ?? ""} placeholder="max" oninput={(event) => updateRuleNumber(row.entryIndex, row.ruleIndex!, "targetMax", event.currentTarget.value)} />{/if}
                  </div>
                  <div class="sheet-cell numeric" title="Placement-rule scoring weight">
                    {#if row.ruleIndex !== undefined && row.rule}<input type="text" inputmode="decimal" value={row.rule.weight ?? ""} placeholder="weight" oninput={(event) => updateRuleNumber(row.entryIndex, row.ruleIndex!, "weight", event.currentTarget.value)} />{/if}
                  </div>
                  <div class="sheet-cell">
                    {#if row.ruleIndex !== undefined}
                      <button class="button-icon danger" onclick={() => removeRule(row.entryIndex, row.ruleIndex!)} title="Remove rule from {row.id}">×</button>
                    {:else if row.contentIndex !== undefined}
                      <button class="button-icon danger" onclick={() => removeEntryContent(row.entryIndex, row.contentIndex!)} title="Remove object {row.id}">×</button>
                    {:else}
                      <button class="button-icon danger" onclick={() => removePresetEntry(row.entryIndex)} title="Remove object {row.id}">×</button>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </section>
        </div>
      </section>

    {:else if activePool}
      {@const pool = activePool.pool}

      <section class="main-editor">
        <header class="pool-title">
          <div>
            <h1>{activePoolName}</h1>
            <small>{isEditable ? "Template-local" : "Core"} pool, {groups.length} groups, {groups.reduce((sum, group) => sum + (group.content ?? []).length, 0)} direct rows, {(pool.bans ?? []).length} bans</small>
          </div>
          <div class="sheet-toolbar">
            <input aria-label="Filter rows" bind:value={contentSearch} placeholder="Filter SID..." />
            <button class="btn" onclick={addGroup}>Add group</button>
            <details class="pool-extra">
              <summary>Bans ({(pool.bans ?? []).length})</summary>
              <div class="pool-extra-body">
                {#if (pool.bans ?? []).length > 0}
                  <div class="ban-strip">
                    {#each (pool.bans ?? []) as ban, bi (ban)}
                      <span class="ban-chip">
                        {ban.sid ?? "?"}
                        <button class="button-icon danger" onclick={() => removeBan(bi)}>✕</button>
                      </span>
                    {/each}
                  </div>
                {/if}
                <div class="add-row">
                  <input type="search" class="input-sm" placeholder="SID to ban..." bind:value={banSearch} />
                  <button class="button button-secondary button-sm" onclick={addBan}>+ Ban</button>
                </div>
              </div>
            </details>
            <button class="button-icon" onclick={() => editor.clearPoolInspection()} title="Close">✕</button>
          </div>
        </header>

        <div class="sheet" style={poolSheetStyle}>
          <section class="sheet-col" aria-label="Pool groups">
            <div class="col-head"><strong>Groups</strong><span>toggle rows</span></div>
            <div class="group-list">
              {#each groups as group, gi (group)}
                <div
                  class="group-row"
                  class:active={focusedGroup === gi}
                  onclick={() => focusedGroup = focusedGroup === gi ? undefined : gi}
                  onkeydown={(event) => { if (event.key === "Enter" || event.key === " ") focusedGroup = focusedGroup === gi ? undefined : gi; }}
                  role="button"
                  tabindex="0"
                >
                  <span class="toggle">{focusedGroup === gi ? "▾" : "▸"}</span>
                  <strong>G{gi} {(group.includeLists ?? [])[0] ?? "direct rows"}</strong>
                  <small>w {group.weight ?? 100}</small>
                </div>
                {#if focusedGroup === gi}
                  <div class="group-children">
                    {#each (group.content ?? []).slice(0, 10) as item, childIndex (`${gi}-${childIndex}`)}
                      <div class="child-row"><span>{childIndex}</span><span>{item.sid ?? "Random"}</span></div>
                    {/each}
                    {#if (group.content ?? []).length === 0}<div class="child-row"><span>0</span><span class="ghost">No direct rows</span></div>{/if}
                  </div>
                {/if}
              {/each}
              {#if groups.length === 0}
                <p class="placeholder pane-empty">No groups</p>
              {/if}
            </div>
          </section>

          <section class="pool-sheet-col">
            <div class="col-head"><strong>Items + settings</strong><span>one connected row per item</span></div>
            <div class="pool-stack" class:only-ungrouped={focusedGroupData === undefined} style={contentPoolSheetStyle}>
              {#if focusedGroupData}
                {@const group = focusedGroupData}
                <div class="pool-table grouped-table" role="grid" tabindex="0" aria-label="Grouped pool content rows" ondragover={handleContentDragOver} ondrop={handleContentDrop}>
                  <div class="column-fill" aria-hidden="true">
                    {#each contentPoolColumns as column (column)}
                      <span></span>
                    {/each}
                  </div>
                  {#each contentPoolColumns as column (column)}
                    <div class="sheet-cell head" role="columnheader">
                      <span>{column}</span>
                      <button class="column-resize" type="button" aria-label="Resize {column} column" onpointerdown={(event) => startColumnResize(event, contentPoolColumns.indexOf(column), "pool")}></button>
                    </div>
                  {/each}

                  <div class="section-row"><strong>G{focusedGroup} group settings</strong><span>{allGroupContent.included.length} included rows</span></div>
                  <div class="sheet-cell id">G{focusedGroup}</div>
                  <div class="sheet-cell">
                    <input
                      type="text"
                      list="pool-content-list-options"
                      value={(group.includeLists ?? []).join(", ")}
                      placeholder="include list ids"
                      oninput={(event) => updateGroupIncludeLists(event.currentTarget.value)}
                    />
                  </div>
                  <div class="sheet-cell numeric">
                    <input
                      type="text"
                      inputmode="decimal"
                      value={group.weight ?? ""}
                      placeholder="weight"
                      oninput={(event) => updateGroupWeight(parseOptionalNumber(event.currentTarget.value))}
                    />
                  </div>
                  <div class="sheet-cell disabled">group</div>
                  <div class="sheet-cell disabled">settings</div>
                  <div class="sheet-cell"><button class="button-icon danger" onclick={() => focusedGroup !== undefined && removeGroup(focusedGroup)} title="Remove G{focusedGroup}">×</button></div>

                  <div class="section-row"><strong>G{focusedGroup} grouped rows</strong><span>{allGroupContent.included.length} included rows</span></div>

                  {#each resolvedIncludedLists as list, li (list.name)}
                    <div class="section-row included-title"><strong>{list.name}</strong><span>{list.items.length} included rows</span></div>
                    {#each list.items as item, ii (`${list.name}-${ii}`)}
                      <div class="sheet-cell id">L{li}.{ii}</div>
                      <div class="sheet-cell sid" class:is-mine={sidTone(item.sid) === "mine"} class:is-random={sidTone(item.sid) === "random"} class:is-item={sidTone(item.sid) === "item"} class:is-unit={sidTone(item.sid) === "unit"}>{item.sid ?? "Random"}</div>
                      <div class="sheet-cell numeric">{item.weight ?? ""}</div>
                      <div class="sheet-cell numeric">{item.variant ?? ""}</div>
                      <div class="sheet-cell" class:is-cold={biomeTone(item.biome) === "cold"} class:is-dry={biomeTone(item.biome) === "dry"} class:is-wet={biomeTone(item.biome) === "wet"}>{item.biome ?? ""}</div>
                      <div class="sheet-cell disabled">included</div>
                    {/each}
                  {/each}
                </div>
              {/if}

                {#if focusedGroupData}
                  <button class="split-row" type="button" onpointerdown={startDirectSplitResize} title="Drag to resize direct group rows">
                    <strong>Direct group rows</strong>
                    <span>{directContentRows.length} rows across {groups.length} groups</span>
                  </button>
                {:else}
                  <div class="section-row ungrouped-only-title">
                    <strong>Direct group rows</strong>
                    <span>{directContentRows.length} rows across {groups.length} groups</span>
                  </div>
                {/if}

                <div class="pool-table ungrouped-table" role="grid" tabindex="0" aria-label="Direct group content rows" ondragover={handleContentDragOver} ondrop={handleContentDrop}>
                  <div class="column-fill" aria-hidden="true">
                    {#each contentPoolColumns as column (column)}
                      <span></span>
                    {/each}
                  </div>
                  {#if focusedGroupData === undefined}
                    {#each contentPoolColumns as column (column)}
                      <div class="sheet-cell head" role="columnheader">
                        <span>{column}</span>
                        <button class="column-resize" type="button" aria-label="Resize {column} column" onpointerdown={(event) => startColumnResize(event, contentPoolColumns.indexOf(column), "pool")}></button>
                      </div>
                    {/each}
                  {/if}

                  {#each directContentRows as row (`direct-${row.groupIndex}-${row.contentIndex}`)}
                    <div class="sheet-cell id">G{row.groupIndex}.D{row.contentIndex}</div>
                    <div class="sheet-cell sid" class:is-mine={sidTone(row.item.sid) === "mine"} class:is-random={sidTone(row.item.sid) === "random"} class:is-item={sidTone(row.item.sid) === "item"} class:is-unit={sidTone(row.item.sid) === "unit"}>
                      <input
                        type="search"
                        list="pool-content-options"
                        value={row.item.sid ?? ""}
                        oninput={(event) => handleDirectSidInput(row.groupIndex, row.contentIndex, event.currentTarget.value)}
                        onblur={(event) => handleDirectSidFinalize(event, row.groupIndex, row.contentIndex)}
                        onkeydown={(event) => handleDirectSidFinalize(event, row.groupIndex, row.contentIndex)}
                      />
                    </div>
                    <div class="sheet-cell numeric"><input type="text" inputmode="decimal" value={row.item.weight ?? ""} oninput={(event) => updateDirectContent(row.groupIndex, row.contentIndex, { weight: parseOptionalNumber(event.currentTarget.value) })} /></div>
                    <div class="sheet-cell numeric"><input type="text" inputmode="numeric" value={row.item.variant ?? ""} oninput={(event) => updateDirectContent(row.groupIndex, row.contentIndex, { variant: parseOptionalNumber(event.currentTarget.value) })} /></div>
                    <div class="sheet-cell" class:is-cold={biomeTone(row.item.biome) === "cold"} class:is-dry={biomeTone(row.item.biome) === "dry"} class:is-wet={biomeTone(row.item.biome) === "wet"}><input type="text" list="pool-biome-options" value={row.item.biome ?? ""} oninput={(event) => updateDirectContent(row.groupIndex, row.contentIndex, { biome: event.currentTarget.value })} /></div>
                    <div class="sheet-cell disabled"><button class="button-icon danger" onclick={() => removeDirectContent(row.groupIndex, row.contentIndex)} title="Remove G{row.groupIndex}.D{row.contentIndex}">×</button></div>
                  {/each}

                  <div class="sheet-cell id">+</div>
                  <div class="sheet-cell sid"><input type="search" list="pool-sheet-content-options" value={sheetAddSid} oninput={(event) => sheetAddSid = event.currentTarget.value} onblur={handleSheetAddBlur} onkeydown={handleSheetAddKeydown} placeholder={focusedGroup === undefined ? "select a group or type to add to G0" : `type SID into G${focusedGroup}`} /></div>
                  <div class="sheet-cell numeric"><input type="text" inputmode="decimal" value={sheetAddWeight ?? ""} oninput={(event) => sheetAddWeight = parseOptionalNumber(event.currentTarget.value)} onkeydown={handleSheetAddKeydown} placeholder="100" /></div>
                  <div class="sheet-cell numeric"><input type="text" inputmode="numeric" value={sheetAddVariant ?? ""} oninput={(event) => sheetAddVariant = parseOptionalNumber(event.currentTarget.value)} onkeydown={handleSheetAddKeydown} placeholder="-1" /></div>
                  <div class="sheet-cell"><input type="text" list="pool-biome-options" bind:value={sheetAddBiome} onkeydown={handleSheetAddKeydown} placeholder="biome" /></div>
                  <div class="sheet-cell disabled">auto</div>
                </div>
              </div>
          </section>
        </div>

      </section>
    {/if}
    <!-- Shared datalist -->
    <datalist id="pool-content-options">
      {#each filteredContentOptions as opt (opt.id)}
        <option value={opt.id} label={opt.label}></option>
      {/each}
    </datalist>
    <datalist id="pool-sheet-content-options">
      {#each filteredSheetAddOptions as opt (opt.id)}
        <option value={opt.id} label={opt.label}></option>
      {/each}
    </datalist>
    <datalist id="mc-sid-options">
      {#each catalogOptions.rmgContent as opt (opt.id)}
        <option value={opt.id} label={opt.label}></option>
      {/each}
    </datalist>
    <datalist id="pool-biome-options">
      {#each catalogOptions.biomes as opt (opt.id)}
        <option value={opt.id} label={opt.label}></option>
      {/each}
    </datalist>
    <datalist id="pool-content-list-options">
      {#each contentListOptions as listName (listName)}
        <option value={listName}></option>
      {/each}
    </datalist>
    <datalist id="pool-rule-arg-options">
      {#each ruleArgOptionsFlat as option (option.id)}
        <option value={option.id} label={option.label}></option>
      {/each}
    </datalist>

  {/if}
</div>

<style>
  .pools-panel {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0;
    container-type: inline-size;
    min-inline-size: 0;
    min-height: 0;
    block-size: 100%;
    overflow: hidden;
    font-size: 13px;
    line-height: 1.38;
  }
  .placeholder { color: var(--color-muted); font-size: var(--font-size-sm); margin: 0; padding: var(--space-2); }
  .add-row { display: flex; gap: var(--space-1); padding-top: 0.125rem; }
  .add-row input { flex: 1; }
  .ban-strip { display: flex; flex-wrap: wrap; gap: var(--space-1); }
  .ban-chip {
    display: flex; align-items: center; gap: 0.125rem;
    padding: 0 var(--space-1);
    background: var(--color-panel-2);
    border: var(--line) solid var(--color-line);
    font-family: var(--font-mono); font-size: var(--font-size-xxs);
  }
  .column-resize {
    align-self: stretch;
    inline-size: 0.5rem;
    margin-block: -0.1875rem;
    margin-inline-end: calc(var(--space-1) * -1);
    border: 0;
    border-right: var(--line) solid transparent;
    background: transparent;
    cursor: col-resize;
  }
  .column-resize:hover {
    border-right-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }
  /* Pool edit sheet, matched to mockups/pool-editor-system.html */
  .pool-title h1,
  .col-head strong,
  .group-row strong,
  .split-row strong {
    font-family: var(--font-mono);
  }
  .sheet-toolbar input {
    min-width: 0;
    block-size: 1.45rem;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    padding: 0 var(--space-2);
    font: inherit;
  }
  .sheet-toolbar {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
  }
  .pool-extra {
    position: relative;
    block-size: 1.45rem;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    white-space: nowrap;
  }
  .pool-extra summary {
    display: flex;
    align-items: center;
    block-size: 100%;
    padding: 0 var(--space-2);
    cursor: pointer;
    list-style: none;
  }
  .pool-extra summary::-webkit-details-marker { display: none; }
  .pool-extra-body {
    position: absolute;
    inset-block-start: calc(100% + var(--line));
    inset-inline-end: 0;
    z-index: 5;
    inline-size: min(28rem, 70vw);
    display: grid;
    gap: var(--space-1);
    padding: var(--space-2);
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
  }
  .btn {
    block-size: 1.45rem;
    border: var(--line) solid var(--color-line-strong);
    background: var(--color-panel);
    padding: 0 var(--space-2);
    cursor: pointer;
    white-space: nowrap;
    font: inherit;
  }
  .btn:hover { background: var(--color-active); }
  .btn:disabled {
    color: var(--color-muted);
    border-color: var(--color-line);
    cursor: not-allowed;
  }
  .btn.primary {
    background: var(--color-ink);
    color: var(--color-panel);
  }
  .btn.primary:disabled {
    background: var(--color-panel-2);
    color: var(--color-muted);
  }
  .main-editor {
    block-size: 100%;
    min-block-size: 0;
    display: grid;
    grid-template-rows: 2.5rem minmax(0, 1fr);
    background: var(--color-panel);
    min-inline-size: 0;
  }
  .pool-title {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-3);
    border-bottom: var(--line-strong) solid var(--color-line-strong);
  }
  .pool-title h1 {
    margin: 0;
    font-size: 1rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pool-title small {
    color: var(--color-muted);
    font-size: 0.6875rem;
  }
  .sheet {
    block-size: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(12rem, 0.22fr) minmax(38rem, 1fr);
    overflow: hidden;
  }
  .sheet-col,
  .pool-sheet-col {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: 1.65rem minmax(0, 1fr);
    overflow: hidden;
  }
  .sheet-col {
    border-right: var(--line-strong) solid var(--color-line-strong);
  }
  .col-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-1);
    padding: 0 var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: 0.6875rem;
    color: var(--color-muted);
  }
  .col-head strong {
    color: var(--color-ink);
    font-size: 0.75rem;
  }
  .group-list {
    overflow: auto;
    min-height: 0;
    display: grid;
    align-content: start;
  }
  .group-row {
    display: grid;
    grid-template-columns: 1.6rem minmax(0, 1fr) 3rem;
    align-items: center;
    min-height: 1.75rem;
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel);
    cursor: pointer;
    color: inherit;
  }
  .group-row.active {
    background: var(--color-active);
    box-shadow: inset var(--line-strong) 0 0 var(--color-line-strong);
  }
  .group-row .toggle {
    display: grid;
    place-items: center;
    color: var(--color-muted);
  }
  .group-row strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
  }
  .group-row small {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    text-align: right;
    padding-right: var(--space-2);
  }
  .group-children {
    display: grid;
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
  }
  .child-row {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    align-items: center;
    min-height: 1.45rem;
    padding-right: var(--space-2);
    font-size: 0.6875rem;
  }
  .child-row span:first-child {
    color: var(--color-muted);
    text-align: right;
    padding-right: var(--space-1);
    font-family: var(--font-mono);
  }
  .child-row span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-mono);
  }
  .pool-sheet {
    position: relative;
    block-size: 100%;
    inline-size: 100%;
    overflow: auto;
    min-height: 0;
    min-width: 0;
    display: grid;
    align-content: start;
    grid-template-columns: var(--pool-sheet-cols);
    grid-auto-rows: minmax(1.7rem, max-content);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    background: var(--color-panel);
  }
  .pool-stack {
    block-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    position: relative;
    overflow: hidden;
    background: var(--color-panel);
  }
  .pool-stack.only-ungrouped {
    display: grid;
    grid-template-rows: 1.7rem minmax(0, 1fr);
  }
  .pool-table {
    position: relative;
    block-size: 100%;
    inline-size: 100%;
    min-block-size: 0;
    min-inline-size: 0;
    overflow: auto;
    display: grid;
    align-content: start;
    grid-template-columns: var(--pool-sheet-cols);
    grid-auto-rows: minmax(1.7rem, max-content);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    background: var(--color-panel);
  }
  .column-fill {
    position: absolute;
    inset: 0;
    z-index: 0;
    display: grid;
    grid-template-columns: var(--pool-sheet-cols);
    pointer-events: none;
  }
  .column-fill span {
    min-width: 0;
    border-right: var(--line) solid var(--color-line);
    background: transparent;
  }
  .grouped-table {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
  .ungrouped-table {
    position: absolute;
    inset-inline: 0;
    inset-block-end: 0;
    z-index: 3;
    block-size: var(--ungrouped-height);
    border-top: var(--line) solid var(--color-line);
  }
  .only-ungrouped .ungrouped-table {
    position: static;
    block-size: 100%;
  }
  .sheet-cell {
    position: relative;
    z-index: 1;
    min-height: 1.7rem;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    padding: 0 var(--space-2);
    border-right: var(--line) solid var(--color-line);
    border-bottom: var(--line) solid var(--color-line);
    overflow: hidden;
    white-space: nowrap;
    background: var(--color-panel);
    text-overflow: ellipsis;
  }
  .sheet-cell.head {
    position: sticky;
    top: 0;
    z-index: 4;
    background: var(--color-panel-2);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 0.6875rem;
    font-weight: 600;
    justify-content: space-between;
  }
  .sheet-cell.id {
    color: var(--color-muted);
    justify-content: end;
  }
  .sheet-cell.sid {
    font-weight: 600;
  }
  .muted-cell {
    color: var(--color-muted);
  }
  .sheet-cell.disabled {
    background: oklch(0.935 0 0);
    color: oklch(0.62 0 0);
    font-style: normal;
  }
  .sheet-cell.active {
    background: var(--color-active);
  }
  .sheet-cell.is-mine { background: color-mix(in srgb, var(--color-object-city) 12%, var(--color-panel)); }
  .sheet-cell.is-random { background: color-mix(in srgb, var(--color-muted) 12%, var(--color-panel)); }
  .sheet-cell.is-item { background: color-mix(in srgb, var(--color-role-center) 15%, var(--color-panel)); }
  .sheet-cell.is-unit { background: color-mix(in srgb, var(--color-role-connector) 10%, var(--color-panel)); }
  .sheet-cell.is-cold { background: color-mix(in srgb, #4aa3d8 14%, var(--color-panel)); }
  .sheet-cell.is-dry { background: color-mix(in srgb, #c78b2c 16%, var(--color-panel)); }
  .sheet-cell.is-wet { background: color-mix(in srgb, #14856d 14%, var(--color-panel)); }
  .sheet-cell input[type="checkbox"] {
    margin: 0;
    inline-size: 0.95rem;
    block-size: 0.95rem;
  }
  .sheet-cell input[type="text"],
  .sheet-cell input[type="search"],
  .sheet-cell select {
    inline-size: 100%;
    min-width: 0;
    border: 0;
    background: transparent;
    font: inherit;
    outline: none;
    direction: ltr;
    text-align: left;
  }
  .sheet-cell.numeric input[type="text"] {
    text-align: right;
  }
  .sheet-cell.sid input {
    text-align: left;
    font-weight: 600;
  }
  .owner-cell {
    background: color-mix(in srgb, var(--player-color) 12%, var(--color-panel));
  }
  .owner-cell select,
  .sheet-cell select {
    inline-size: 100%;
    min-width: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
  }
  .flag-cell {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    white-space: normal;
  }
  .flag-cell label {
    display: inline-flex;
    align-items: center;
    gap: 0.1875rem;
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 0.6875rem;
  }
  .numeric {
    justify-content: end;
    text-align: right;
  }
  .section-row {
    grid-column: 1 / -1;
    min-height: 1.45rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: 0 var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: 0.6875rem;
    position: sticky;
    top: 1.7rem;
    z-index: 3;
  }
  .section-row strong {
    color: var(--color-ink);
    font-family: var(--font-mono);
  }
  .included-title {
    position: static;
    background: color-mix(in srgb, var(--color-active) 70%, var(--color-panel));
  }
  .split-row {
    position: absolute;
    inset-inline: 0;
    inset-block-end: var(--ungrouped-height);
    z-index: 4;
    min-height: 2rem;
    display: grid;
    grid-template-columns: 1fr auto auto 1fr;
    align-items: center;
    gap: var(--space-2);
    padding: 0 var(--space-2);
    border: 0;
    border-top: var(--line-strong) solid var(--color-line-strong);
    border-bottom: var(--line-strong) solid var(--color-line-strong);
    background: var(--color-active);
    color: var(--color-ink);
    cursor: row-resize;
    font-family: var(--font-sans);
    font-size: 0.6875rem;
  }
  .split-row::before,
  .split-row::after {
    content: "";
    height: var(--line);
    background: var(--color-line);
  }
  .split-row strong {
    font-size: 0.6875rem;
    white-space: nowrap;
  }
  /* Shared */
  .button-icon {
    border: 0; background: transparent; cursor: pointer;
    font-size: var(--font-size-sm); padding: 0.125rem; color: var(--color-muted); line-height: 1;
  }
  .button-icon:hover { color: var(--color-text); }
  .button-icon.danger:hover { color: #e55; }
  .button-sm { font-size: var(--font-size-xxs); padding: var(--line) var(--space-1); }
  .input-sm {
    font-size: var(--font-size-xs);
    padding: 0.125rem var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit; font-family: inherit;
    inline-size: 100%;
    min-inline-size: 0;
  }
  input[type="search"].input-sm { flex: 1; }
  @media (max-width: 980px) {
    .sheet {
      grid-template-columns: 1fr;
      overflow: auto;
    }
    .sheet-col {
      min-height: 22rem;
      border-right: 0;
      border-bottom: var(--line-strong) solid var(--color-line-strong);
    }
  }

  @container (min-width: 48rem) {
    .pools-panel {
      align-content: stretch;
    }
  }
</style>
