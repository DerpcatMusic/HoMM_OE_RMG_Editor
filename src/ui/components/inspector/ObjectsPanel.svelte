<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { MAIN_OBJECT_TYPES, MAIN_OBJECT_PLACEMENTS, PLAYER_REFS, FACTION_RULE_TYPES } from "../../../core/rmg/enums.js";
  import { isMineRoutedContent } from "../../data/rmgContentSemantics.js";
  import type { ShellCatalogOption } from "../../data/shellData.js";
  import type { MainObjectUpdateDraft } from "../../state/editorSession.js";
  import type { MandatoryContent } from "../../../core/rmg/rmgTypes.js";
  import GuardFields from "../svelte/GuardFields.svelte";
  import ObjectIdentity from "../ui/ObjectIdentity.svelte";

  interface MandatoryEntryRef {
    presetName: string;
    presetIndex: number;
    entryIndex: number;
    entry: MandatoryContent;
  }

  const ZONE_OWNER_VALUE = "__zone_owner__";

  let zone = $derived(editor.selectedZone);
  let session = $derived(editor.session);
  let catalogObjects = $derived(editor.catalogOptions.rmgContent);
  let mainObjects = $derived(zone.zoneObjects.filter((o) => o.id.startsWith("main:")));
  let mandatoryObjects = $derived(zone.zoneObjects.filter((o) => o.id.startsWith("mandatory:") || o.id.startsWith("mc:")));
  let activeIndex = $derived(editor.activeObjectIndex);
  let activeMandatoryName = $derived(editor.activeMandatoryContentName);
  let activeObj = $derived(mainObjects.find((o) => o.index === activeIndex));
  let activeMandatoryObj = $derived(mandatoryObjects.find((o) => mandatoryObjectName(o.id) === activeMandatoryName));
  let activeMandatoryEntries = $derived.by(() => {
    if (!activeMandatoryName) return [];
    const presetNames = new Set(zone.mandatoryContent ?? []);
    const entries: MandatoryEntryRef[] = [];
    for (const [presetIndex, preset] of (session.template.mandatoryContent ?? []).entries()) {
      if (!preset.name || !presetNames.has(preset.name)) continue;
      for (const [entryIndex, entry] of (preset.content ?? []).entries()) {
        if ((entry.name ?? entry.sid) === activeMandatoryName) {
          entries.push({ presetName: preset.name, presetIndex, entryIndex, entry });
        }
      }
    }
    return entries;
  });
  let activeMandatoryEntry = $derived(activeMandatoryEntries[0]);
  let activeMandatoryContent = $derived(activeMandatoryEntry?.entry);
  let activeMandatorySid = $derived(activeMandatoryContent?.sid ?? activeMandatoryObj?.mandatorySid ?? "");
  let activeMandatoryCatalogObject = $derived.by(() => {
    return activeMandatorySid ? catalogObjects.find((object) => object.id === activeMandatorySid) : undefined;
  });
  let activeMandatoryVariantCount = $derived(activeMandatoryCatalogObject?.variantCount ?? 0);
  let activeMandatoryIsDirect = $derived(Boolean(activeMandatoryContent?.sid));
  let activeMandatoryIsKnownMine = $derived(isMineRoutedContent(activeMandatoryCatalogObject, activeMandatorySid));
  let activeMandatoryIsMineRouted = $derived(activeMandatoryIsKnownMine || Boolean(activeMandatoryContent?.isMine));
  let activeMandatoryRoadTargeted = $derived.by(() =>
    Boolean(activeMandatoryName) && zone.zoneRoads.some((road) =>
      targetUsesMandatoryEntry(road.fromTarget, activeMandatoryName) || targetUsesMandatoryEntry(road.toTarget, activeMandatoryName),
    ),
  );
  let activeZoneOwner = $derived(isPlayerRef(zone.owner) ? zone.owner : "");
  let activeMandatoryDesignated = $derived(activeMandatoryRoadTargeted || Boolean(activeMandatoryContent?.designatedEncounter));
  let showMandatoryVariant = $derived(activeMandatoryIsDirect && (activeMandatoryVariantCount > 0 || activeMandatoryContent?.variant !== undefined));
  let showMandatoryOwner = $derived(Boolean(activeMandatoryContent));

  // Edit state (synced from activeObj)
  let editType = $state("City");
  let editSpawn = $state("");
  let editOwner = $state("");
  let editIsKeyObject = $state(false);
  let editHoldCityWinCon = $state(false);
  let editPlacement = $state("Uniform");
  let editPlacementArgs = $state<string[]>([]);
  let editFactionType = $state("");
  let editFactionArgs = $state<string[]>([]);
  let editEnableWeeklyUnitIncrement = $state(false);
  let editInitialUnitIncrement = $state<number | undefined>(undefined);
  let editGuardChance = $state<number | undefined>(undefined);
  let editGuardValue = $state<number | undefined>(undefined);
  let editGuardWeeklyIncrement = $state<number | undefined>(undefined);
  let editGuardRandomization = $state<number | undefined>(undefined);
  let editRemoveGuardIfHasOwner = $state(false);
  let editBuildingsConstructionSid = $state("");
  let editBuildingsBanSid = $state("");

  // Sync edit state when active object changes
  let lastSyncedIndex = $state(-1);
  $effect(() => {
    const obj = activeObj;
    const idx = activeIndex;
    if (idx === lastSyncedIndex) return;
    lastSyncedIndex = idx;
    if (!obj) return;
    editType = obj.type || "City";
    editSpawn = obj.spawn ?? "";
    editOwner = obj.owner ?? "";
    editIsKeyObject = obj.isKeyObject ?? false;
    editHoldCityWinCon = obj.holdCityWinCon ?? false;
    editPlacement = obj.placement ?? "Uniform";
    editPlacementArgs = [...(obj.placementArgs ?? [])];
    editFactionType = obj.faction?.type ?? "";
    editFactionArgs = [...(obj.faction?.args ?? [])];
    editEnableWeeklyUnitIncrement = obj.enableWeeklyUnitIncrement ?? false;
    editInitialUnitIncrement = obj.initialUnitIncrement;
    editGuardChance = obj.guardChance;
    editGuardValue = obj.guardValue;
    editGuardWeeklyIncrement = obj.guardWeeklyIncrement;
    editGuardRandomization = obj.guardRandomization;
    editRemoveGuardIfHasOwner = obj.removeGuardIfHasOwner ?? false;
    editBuildingsConstructionSid = obj.buildingsConstructionSid ?? "";
    editBuildingsBanSid = obj.buildingsBanSid ?? "";
  });

  function apply() {
    if (activeIndex < 0) return;
    const draft: MainObjectUpdateDraft = {
      objectIndex: activeIndex,
      type: editType,
      spawn: editSpawn,
      owner: editOwner,
      isKeyObject: editIsKeyObject,
      holdCityWinCon: editHoldCityWinCon,
      placement: editPlacement,
      placementArgs: editPlacementArgs,
      factionType: editFactionType,
      factionArgs: editFactionArgs,
      enableWeeklyUnitIncrement: editEnableWeeklyUnitIncrement,
      initialUnitIncrement: editInitialUnitIncrement,
      guardChance: editGuardChance,
      guardValue: editGuardValue,
      guardWeeklyIncrement: editGuardWeeklyIncrement,
      guardRandomization: editGuardRandomization,
      removeGuardIfHasOwner: editRemoveGuardIfHasOwner,
      buildingsConstructionSid: editBuildingsConstructionSid,
      buildingsBanSid: editBuildingsBanSid,
    };
    editor.updateMainObject(draft);
  }

  function parseArgs(value: string): string[] {
    return value.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }

  function parseOptionalString(value: string): string | undefined {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  function parseOptionalNumber(value: string): number | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function parseStringList(value: string): string[] | undefined {
    const values = value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
    return values.length > 0 ? values : undefined;
  }

  function updateMandatoryEntries(mutator: (entry: MandatoryContent) => MandatoryContent) {
    for (const ref of activeMandatoryEntries) {
      const preset = editor.session.template.mandatoryContent?.[ref.presetIndex];
      const nextContent = (preset?.content ?? []).map((entry, index) =>
        index === ref.entryIndex ? normalizeMandatoryEntry(mutator(entry)) : entry,
      );
      editor.updateMandatoryContentPreset(ref.presetIndex, nextContent);
    }
  }

  function normalizeMandatoryEntry(entry: MandatoryContent): MandatoryContent {
    const sid = entry.sid ?? "";
    const catalogObject = catalogObjects.find((object) => object.id === sid);
    if (isMineRoutedContent(catalogObject, sid)) {
      return { ...entry, isMine: true };
    }
    return entry;
  }

  function updateMandatoryField(field: keyof MandatoryContent, value: unknown) {
    updateMandatoryEntries((entry) => ({ ...entry, [field]: value }));
  }

  function updateMandatorySid(value: string) {
    const sid = parseOptionalString(value);
    updateMandatoryEntries((entry) => ({ ...entry, sid }));
  }

  function mandatoryOwnerSelectValue(): string {
    const owner = activeMandatoryContent?.owner ?? "";
    return owner && owner === activeZoneOwner ? ZONE_OWNER_VALUE : owner;
  }

  function updateMandatoryOwner(value: string) {
    updateMandatoryField("owner", value === ZONE_OWNER_VALUE ? parseOptionalString(activeZoneOwner) : parseOptionalString(value));
  }

  function setMandatoryFlag(field: "designatedEncounter" | "soloEncounter" | "isGuarded" | "isMine", checked: boolean) {
    updateMandatoryField(field, checked ? true : undefined);
  }

  function setMandatoryMineFlag(checked: boolean) {
    if (activeMandatoryIsKnownMine) {
      updateMandatoryField("isMine", true);
      return;
    }
    setMandatoryFlag("isMine", checked);
  }

  function mandatoryObjectName(objectId: string): string {
    if (objectId.startsWith("mandatory:")) return objectId.replace("mandatory:", "");
    if (objectId.startsWith("mc:")) return objectId.replace("mc:", "");
    return objectId;
  }

  function targetUsesMandatoryEntry(target: { type: string; args: readonly string[] }, entryName: string): boolean {
    return target.type === "MandatoryContent" && target.args[0] === entryName;
  }

  function objectDisplayName(object: ShellCatalogOption | undefined, fallback: string): string {
    if (!object) return fallback || "Unresolved object";
    return object.label.replace(new RegExp(`\\s*\\(${escapeRegExp(object.id)}\\)$`), "");
  }

  function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function isPlayerRef(value: unknown): boolean {
    return typeof value === "string" && (PLAYER_REFS as readonly string[]).includes(value);
  }
</script>

<div class="objects-panel">
  {#if zone.id === "__no_zone__"}
    <p class="placeholder">Select a zone to view its objects.</p>
  {:else}
    <datalist id="mandatory-object-sid-options">
      {#each catalogObjects as object (object.id)}
        <option value={object.id}>{object.label}</option>
      {/each}
    </datalist>

    <!-- Object editor (when selected) -->
    {#if activeObj}
      <div class="object-editor">
        <div class="editor-header">
          <span class="editor-title">{activeObj.type} [{activeIndex}]</span>
          <span class="editor-subtitle">{activeObj.label}</span>
        </div>

        <!-- Type & Placement -->
        <div class="editor-section">
          <h4 class="section-title">Type & Placement</h4>
          <label class="field">
            <span class="field-label">Type</span>
            <select class="input-sm" bind:value={editType} onchange={apply}>
              {#each MAIN_OBJECT_TYPES as t (t)}<option value={t}>{t}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Placement</span>
            <select class="input-sm" bind:value={editPlacement} onchange={apply}>
              {#each MAIN_OBJECT_PLACEMENTS as p (p)}<option value={p}>{p}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Placement args</span>
            <input type="text" class="input-sm" value={editPlacementArgs.join(", ")}
              onchange={(e) => { editPlacementArgs = parseArgs(e.currentTarget.value); apply(); }}
              placeholder="arg1, arg2" />
          </label>
        </div>

        <!-- Ownership -->
        <div class="editor-section">
          <h4 class="section-title">Ownership</h4>
          <label class="field">
            <span class="field-label">Spawn</span>
            <select class="input-sm" bind:value={editSpawn} onchange={apply}>
              <option value="">None</option>
              {#each PLAYER_REFS as p (p)}<option value={p}>{p}</option>{/each}
            </select>
          </label>
          <label class="field">
            <span class="field-label">Owner</span>
            <select class="input-sm" bind:value={editOwner} onchange={apply}>
              <option value="">None</option>
              {#each PLAYER_REFS as p (p)}<option value={p}>{p}</option>{/each}
            </select>
          </label>
          <label class="field checkbox">
            <input type="checkbox" bind:checked={editIsKeyObject} onchange={apply} />
            <span class="field-label">Key object</span>
          </label>
          <label class="field checkbox">
            <input type="checkbox" bind:checked={editHoldCityWinCon} onchange={apply} />
            <span class="field-label">Hold city win condition</span>
          </label>
        </div>

        <!-- Guards -->
        <div class="editor-section">
          <h4 class="section-title">Guards</h4>
          <GuardFields
            showObjectFields={true}
            bind:guardWeeklyIncrement={editGuardWeeklyIncrement}
            bind:guardRandomization={editGuardRandomization}
            bind:guardChance={editGuardChance}
            bind:guardValue={editGuardValue}
            bind:removeGuardIfHasOwner={editRemoveGuardIfHasOwner}
            onchange={apply}
          />
        </div>

        <!-- Faction -->
        <div class="editor-section">
          <h4 class="section-title">Faction</h4>
          <label class="field">
            <span class="field-label">Faction rule type</span>
            <select class="input-sm" bind:value={editFactionType} onchange={apply}>
              <option value="">None</option>
              {#each FACTION_RULE_TYPES as t (t)}<option value={t}>{t}</option>{/each}
            </select>
          </label>
          {#if editFactionType}
            <label class="field">
              <span class="field-label">Faction args</span>
              <input type="text" class="input-sm" value={editFactionArgs.join(", ")}
                onchange={(e) => { editFactionArgs = parseArgs(e.currentTarget.value); apply(); }}
                placeholder="faction_1, faction_2" />
            </label>
          {/if}
        </div>

        <!-- Units -->
        <div class="editor-section">
          <h4 class="section-title">Units</h4>
          <label class="field checkbox">
            <input type="checkbox" bind:checked={editEnableWeeklyUnitIncrement} onchange={apply} />
            <span class="field-label">Enable weekly unit increment</span>
          </label>
          {#if editEnableWeeklyUnitIncrement}
            <label class="field">
              <span class="field-label">Initial unit increment</span>
              <input type="number" class="input-xs" bind:value={editInitialUnitIncrement}
                onchange={apply} step="1" min="0" placeholder="0" />
            </label>
          {/if}
        </div>

        <!-- Buildings -->
        <div class="editor-section">
          <h4 class="section-title">Buildings</h4>
          <label class="field">
            <span class="field-label">Construction SID</span>
            <input type="text" class="input-sm" bind:value={editBuildingsConstructionSid}
              onchange={apply} placeholder="building_sid" />
          </label>
          <label class="field">
            <span class="field-label">Ban SID</span>
            <input type="text" class="input-sm" bind:value={editBuildingsBanSid}
              onchange={apply} placeholder="building_ban_sid" />
          </label>
        </div>
      </div>
    {:else if activeMandatoryName}
      <div class="object-editor mandatory-editor">
        <div class="editor-header">
          <span class="editor-title">Mandatory content</span>
          <span class="editor-subtitle">{activeMandatoryName}</span>
        </div>

        <div class="mandatory-focus-form">
          <label class="field field-large">
            <span class="field-label">Object SID</span>
            <input
              type="search"
              class="input-lg sid-input"
              list="mandatory-object-sid-options"
              value={activeMandatoryContent?.sid ?? ""}
              onchange={(event) => updateMandatorySid(event.currentTarget.value)}
              placeholder="choose object SID"
            />
          </label>

          {#if activeMandatorySid}
            <div class="mandatory-object-summary">
              <ObjectIdentity
                icon="location_on"
                label={objectDisplayName(activeMandatoryCatalogObject, activeMandatorySid)}
                detail={activeMandatoryCatalogObject?.category ?? "RMG content"}
                tone="mandatory"
                variant="summary"
              />
            </div>
          {:else}
            <label class="field field-large">
              <span class="field-label">Include lists</span>
              <textarea
                rows="3"
                class="input-lg"
                value={(activeMandatoryContent?.includeLists ?? []).join("\n")}
                onchange={(event) => updateMandatoryField("includeLists", parseStringList(event.currentTarget.value))}
                placeholder="content_list_basic_mines"
              ></textarea>
            </label>
          {/if}

          {#if showMandatoryVariant}
            <label class="field field-large">
              <span class="field-label">Variant</span>
              <input
                type="number"
                class="input-lg"
                value={activeMandatoryContent?.variant ?? ""}
                onchange={(event) => updateMandatoryField("variant", parseOptionalNumber(event.currentTarget.value))}
                step="1"
                placeholder={activeMandatoryVariantCount > 0 ? `-1 or 0-${activeMandatoryVariantCount - 1}` : "-1"}
              />
            </label>
          {/if}

          <div class="mandatory-toggle-grid">
            <label class="toggle-card">
              <input
                type="checkbox"
                checked={!!activeMandatoryContent?.isGuarded}
                onchange={(event) => setMandatoryFlag("isGuarded", event.currentTarget.checked)}
              />
              <span>
                <strong>Guarded slot</strong>
                <small>Uses guarded encounter routing.</small>
              </span>
            </label>

            <label class="toggle-card">
              <input
                type="checkbox"
                checked={!!activeMandatoryContent?.soloEncounter}
                onchange={(event) => setMandatoryFlag("soloEncounter", event.currentTarget.checked)}
              />
              <span>
                <strong>Solo encounter</strong>
                <small>Keep this object alone.</small>
              </span>
            </label>

            <label class="toggle-card">
              <input
                type="checkbox"
                checked={activeMandatoryDesignated}
                disabled={activeMandatoryRoadTargeted}
                onchange={(event) => setMandatoryFlag("designatedEncounter", event.currentTarget.checked)}
              />
              <span>
                <strong>Road endpoint slot</strong>
                <small>{activeMandatoryRoadTargeted ? "Set by road target. Guarded is separate." : "Reserve a fixed encounter slot."}</small>
              </span>
            </label>

            {#if activeMandatoryIsKnownMine}
              <label class="toggle-card is-locked">
                <input type="checkbox" checked disabled />
                <span>
                  <strong>Mine placement</strong>
                  <small>Required for this object.</small>
                </span>
              </label>
            {:else if !activeMandatoryIsDirect || activeMandatoryContent?.isMine}
              <label class="toggle-card">
                <input
                  type="checkbox"
                  checked={!!activeMandatoryContent?.isMine}
                  onchange={(event) => setMandatoryMineFlag(event.currentTarget.checked)}
                />
                <span>
                  <strong>Mine placement</strong>
                  <small>Route through PlaceMines.</small>
                </span>
              </label>
            {/if}
          </div>

          {#if showMandatoryOwner}
            <label class="field field-large">
              <span class="field-label">Owner</span>
              <select class="input-lg" value={mandatoryOwnerSelectValue()} onchange={(event) => updateMandatoryOwner(event.currentTarget.value)}>
                <option value="">None</option>
                <option value={ZONE_OWNER_VALUE} disabled={!activeZoneOwner}>Zone owner{activeZoneOwner ? ` (${activeZoneOwner})` : ""}</option>
                {#each PLAYER_REFS as player (player)}
                  <option value={player}>{player}</option>
                {/each}
              </select>
            </label>
          {/if}

          {#if activeMandatoryEntries.length === 0}
            <p class="inline-warning">No matching preset entry in this zone.</p>
          {/if}
        </div>
      </div>
    {:else}
      <div class="panel-header">
        <span class="count">{mainObjects.length} main / {mandatoryObjects.length} mandatory</span>
        <button class="add-btn" onclick={() => editor.addMainObject()}>+ Add main</button>
      </div>
      {#if mainObjects.length === 0 && mandatoryObjects.length === 0}
        <p class="placeholder">No zone objects.</p>
      {:else}
        {#if mainObjects.length > 0}
          <h4 class="list-title">Main objects</h4>
          <ul class="object-list">
            {#each mainObjects as obj (obj.id)}
              {@const isActive = obj.index === activeIndex}
              <li class="object-item" class:is-active={isActive}>
                <button class="obj-btn" onclick={() => editor.selectObject(obj.index ?? 0)}>
                  <ObjectIdentity
                    label={obj.label}
                    detail={obj.detail}
                    meta={obj.type}
                    tone="main"
                  />
                </button>
                <button class="button-icon danger" onclick={() => editor.removeMainObject(obj.index ?? 0)} title="Remove">✕</button>
              </li>
            {/each}
          </ul>
        {/if}

        {#if mandatoryObjects.length > 0}
          <h4 class="list-title">Mandatory content</h4>
          <ul class="object-list">
            {#each mandatoryObjects as obj (obj.id)}
              {@const entryName = obj.mandatoryEntryName ?? mandatoryObjectName(obj.id)}
              {@const isActive = entryName === activeMandatoryName}
              <li class="object-item mandatory-item" class:is-active={isActive}>
                <button class="obj-btn" onclick={() => editor.selectMandatoryContent(entryName)}>
                  <ObjectIdentity
                    icon="location_on"
                    label={obj.label}
                    detail={obj.detail}
                    meta="Mandatory"
                    tone="mandatory"
                  />
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<style>
  .objects-panel { display: grid; gap: var(--space-2); }
  .placeholder { color: var(--color-muted); font-size: var(--font-size-sm); }
  .panel-header {
    display: flex; align-items: center; justify-content: space-between;
    font-size: var(--font-size-sm);
  }
  .count { color: var(--color-muted); font-family: var(--font-mono); font-size: var(--font-size-xs); }
  .list-title {
    margin: 0;
    font-size: var(--font-size-xxs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-muted);
  }
  .add-btn {
    height: 1.5rem; padding: 0 var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); font: inherit; font-size: var(--font-size-sm); cursor: pointer;
  }
  .add-btn:hover { background: var(--color-panel-2); }
  .object-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 1px; }
  .object-item {
    display: flex; align-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
  }
  .object-item.mandatory-item { border-color: oklch(0.50 0.13 185); }
  .object-item.is-active { border-color: var(--color-accent); background: var(--color-active); }
  .obj-btn {
    flex: 1; display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: 0; background: transparent; font: inherit; font-size: var(--font-size-sm);
    cursor: pointer; text-align: left; color: inherit;
  }
  .obj-btn:hover { background: var(--color-panel-2); }

  /* Object editor */
  .object-editor {
    border: var(--line) solid var(--color-accent);
    border-radius: 4px;
    display: grid; gap: 0;
    max-height: 60vh; overflow-y: auto;
  }
  .mandatory-editor {
    max-height: none;
  }
  .editor-header {
    display: flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2);
    background: var(--color-panel-2);
    border-bottom: var(--line) solid var(--color-line);
  }
  .editor-title { font-weight: 600; font-size: var(--font-size-sm); }
  .editor-subtitle { font-family: var(--font-mono); font-size: var(--font-size-xxs); color: var(--color-muted); }
  .editor-section {
    padding: var(--space-2);
    border-bottom: var(--line) solid var(--color-line);
    display: grid; gap: var(--space-1);
  }
  .editor-section:last-child { border-bottom: 0; }
  .section-title {
    font-size: var(--font-size-xxs); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--color-muted); margin: 0;
  }
  .field { display: grid; gap: 2px; }
  .field-large { gap: var(--space-1); }
  .field.checkbox { display: flex; align-items: center; gap: var(--space-1); flex-direction: row; }
  .field.checkbox input { margin: 0; }
  .field-label { font-size: var(--font-size-xxs); color: var(--color-muted); }
  .mandatory-focus-form {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-2);
  }
  .mandatory-object-summary {
    min-width: 0;
    display: block;
    padding: var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
  }
  .mandatory-toggle-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--space-1);
  }
  .toggle-card {
    min-width: 0;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-2);
    align-items: start;
    padding: var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    cursor: pointer;
  }
  .toggle-card:hover {
    border-color: var(--color-line-strong);
    background: var(--color-panel-2);
  }
  .toggle-card input {
    margin: 2px 0 0;
  }
  .toggle-card input:disabled {
    cursor: not-allowed;
  }
  .toggle-card.is-locked {
    cursor: default;
    background: var(--color-active);
  }
  .toggle-card span {
    min-width: 0;
    display: grid;
    gap: 1px;
  }
  .toggle-card strong {
    font-size: var(--font-size-sm);
    font-weight: 600;
  }
  .toggle-card small {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    line-height: 1.25;
  }
  .inline-warning {
    margin: 0;
    color: var(--color-state-invalid);
    font-size: var(--font-size-sm);
  }
  .sid-input {
    font-family: var(--font-mono);
  }
  .input-sm {
    font-size: var(--font-size-xs); padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); color: inherit; font-family: inherit;
  }
  .input-lg {
    min-width: 0;
    width: 100%;
    min-height: 2.25rem;
    padding: var(--space-1) var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: inherit;
    font: inherit;
    font-size: var(--font-size-m);
  }
  textarea.input-lg {
    min-height: 5rem;
    resize: vertical;
  }
  .input-xs {
    font-size: var(--font-size-xxs); padding: 1px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel); color: inherit; font-family: var(--font-mono);
    width: 100%;
    min-width: 0;
  }
  .input-xs[type="number"] {
    width: fit-content;
    min-width: 3ch;
  }
  .button-icon { border: 0; background: transparent; cursor: pointer; font-size: var(--font-size-sm); padding: 2px; color: var(--color-muted); line-height: 1; }
  .button-icon:hover { color: var(--color-text); }
  .button-icon.danger:hover { color: #e55; }
  @media (max-width: 48rem) {
    .mandatory-toggle-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
