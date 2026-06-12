<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import NoisePreview from "../svelte/NoisePreview.svelte";
  import ZoneLayoutPreview from "../svelte/ZoneLayoutPreview.svelte";
  import NumberField from "../ui/NumberField.svelte";

  let template = $derived(editor.session.template);
  let variant = $derived(template.variants?.[editor.session.selectedVariantIndex]);
  let border = $derived(variant?.border ?? {});
  let layouts = $derived(template.zoneLayouts ?? []);

  // Track the SELECTED ZONE's layout
  let selectedZoneName = $derived(editor.session.selectedZoneName);
  let selectedZone = $derived(variant?.zones?.find(z => z.name === selectedZoneName));
  let zoneLayoutName = $derived(selectedZone?.layout ?? "");

  // Find the matching local layout
  let layoutIndex = $derived(layouts.findIndex(l => l.name === zoneLayoutName));
  let layout = $derived(layoutIndex >= 0 ? layouts[layoutIndex] : undefined);
  let isLocal = $derived(layoutIndex >= 0);
  let obstaclesFill = $derived(layout?.obstaclesFill ?? 0.4);
  let obstaclesFillVoid = $derived(layout?.obstaclesFillVoid ?? 0.5);
  let lakesFill = $derived(layout?.lakesFill ?? 0);
  let minLakeArea = $derived(layout?.minLakeArea ?? 20);
  let elevationClusterScale = $derived(layout?.elevationClusterScale ?? 0.15);
  let roadClusterArea = $derived(layout?.roadClusterArea ?? 70);

  /** Ensure we have a local layout. If not, auto-clone. Returns the layout index. */
  function ensureLocal(): number {
    if (isLocal) return layoutIndex;
    if (!selectedZoneName) return -1;
    editor.createLocalLayoutForZone(selectedZoneName);
    // After cloning, re-derive the index from the updated template
    const newLayouts = editor.session.template.zoneLayouts ?? [];
    const newZone = editor.session.template.variants?.[editor.session.selectedVariantIndex]?.zones?.find(z => z.name === selectedZoneName);
    const newName = newZone?.layout ?? "";
    return newLayouts.findIndex(l => l.name === newName);
  }

  function updateField(field: string, value: unknown) {
    const idx = ensureLocal();
    if (idx < 0) return;
    editor.updateZoneLayout(idx, { [field]: value });
  }

  function updateNumberField(field: string, value: number | undefined, fallback: number) {
    updateField(field, value ?? fallback);
  }

  // --- Elevation Modes ---
  type ElevMode = { weight?: number; minElevatedFraction?: number; maxElevatedFraction?: number };
  let elevModes = $derived((layout?.elevationModes ?? []) as ElevMode[]);

  function updateElevMode(index: number, field: keyof ElevMode, value: number | undefined) {
    const modes = [...elevModes];
    modes[index] = { ...modes[index], [field]: value };
    updateField("elevationModes", modes);
  }

  function addElevMode() {
    const modes = [...elevModes, { weight: 1, minElevatedFraction: 0.2, maxElevatedFraction: 0.4 }];
    updateField("elevationModes", modes);
  }

  function removeElevMode(index: number) {
    const modes = elevModes.filter((_, i) => i !== index);
    updateField("elevationModes", modes);
  }

  // --- Ambient Pickup Distribution ---
  type AmbientDist = {
    repulsion?: number;
    noise?: number;
    roadAttraction?: number;
    obstacleAttraction?: number;
    groupSizeWeights?: number[];
  };
  let ambient = $derived((layout?.ambientPickupDistribution ?? {}) as AmbientDist);
  let groupWeightsText = $derived((ambient.groupSizeWeights ?? []).join(", "));

  function updateAmbient(field: keyof AmbientDist, value: unknown) {
    const next = { ...ambient, [field]: value };
    updateField("ambientPickupDistribution", next);
  }

  function parseGroupWeights(text: string): number[] {
    return text
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n));
  }
</script>

<div class="gen-panel">
  <!-- Zone info header -->
  <div class="gen-zone-info">
    <span class="gen-zone-name">{selectedZoneName ?? "No zone selected"}</span>
    {#if zoneLayoutName}
      {@const refCount = (variant?.zones ?? []).filter(z => z.layout === zoneLayoutName).length}
      <span class="gen-zone-layout" class:is-local={isLocal} class:is-core={!isLocal}>
        {zoneLayoutName}{#if refCount > 1} · shared by {refCount} zones{/if}{#if !isLocal} · editing clones{/if}
      </span>
    {:else}
      <span class="gen-zone-layout is-missing">No layout assigned</span>
    {/if}
  </div>

  {#if !selectedZoneName}
    <p class="gen-empty">Select a zone to edit generation settings.</p>
  {:else}
    <div class="gen-preview-band">
      <ZoneLayoutPreview {layout} />
    </div>

    <!-- Terrain -->
    <details open class="gen-section">
      <summary class="gen-section-title">Terrain</summary>
      <div class="gen-fields">
        <label class="gen-field">
          <span class="gen-label">Obstacles fill</span>
          <NumberField bind:value={obstaclesFill} oncommit={(value) => updateNumberField("obstaclesFill", value, 0.4)} min={0} max={1} step={0.05} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Obstacles fill void</span>
          <NumberField bind:value={obstaclesFillVoid} oncommit={(value) => updateNumberField("obstaclesFillVoid", value, 0.5)} min={0} max={1} step={0.05} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Lakes fill</span>
          <NumberField bind:value={lakesFill} oncommit={(value) => updateNumberField("lakesFill", value, 0)} min={0} max={1} step={0.05} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Min lake area</span>
          <NumberField bind:value={minLakeArea} oncommit={(value) => updateNumberField("minLakeArea", value, 20)} min={0} step={1} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Elevation cluster scale</span>
          <NumberField bind:value={elevationClusterScale} oncommit={(value) => updateNumberField("elevationClusterScale", value, 0.15)} min={0} max={1} step={0.05} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Road cluster area</span>
          <NumberField bind:value={roadClusterArea} oncommit={(value) => updateNumberField("roadClusterArea", value, 70)} min={0} step={5} allowEmpty={false} />
        </label>
      </div>
    </details>

    <!-- Border noise preview -->
    <details open class="gen-section">
      <summary class="gen-section-title">Border noise</summary>
      <div class="gen-noise-previews">
        <NoisePreview
          label="Obstacles"
          amp={border.obstaclesNoise?.[0]?.amp ?? 1}
          freq={border.obstaclesNoise?.[0]?.freq ?? 12}
        />
        <NoisePreview
          label="Water"
          amp={border.waterNoise?.[0]?.amp ?? 1}
          freq={border.waterNoise?.[0]?.freq ?? 12}
        />
      </div>
    </details>

    <!-- Elevation Modes -->
    <details open class="gen-section">
      <summary class="gen-section-title">
        Elevation modes ({elevModes.length})
        <button class="gen-add-btn" onclick={(e) => { e.preventDefault(); e.stopPropagation(); addElevMode(); }} title="Add elevation mode">+</button>
      </summary>
      {#if elevModes.length === 0}
        <p class="gen-hint">No elevation modes. Zone will be flat.</p>
      {:else}
        {#each elevModes as mode, i (i)}
          <div class="gen-mode-row">
            <div class="gen-mode-fields">
              <label class="gen-field">
                <span class="gen-label">Weight</span>
                <NumberField value={mode.weight ?? 1} oncommit={(value) => updateElevMode(i, "weight", value ?? 1)} min={0} step={1} allowEmpty={false} />
              </label>
              <label class="gen-field">
                <span class="gen-label">Min elevated %</span>
                <NumberField value={mode.minElevatedFraction !== undefined ? Math.round(mode.minElevatedFraction * 100) : 20} oncommit={(value) => updateElevMode(i, "minElevatedFraction", (value ?? 20) / 100)} min={0} max={100} step={5} allowEmpty={false} unit="%" />
              </label>
              <label class="gen-field">
                <span class="gen-label">Max elevated %</span>
                <NumberField value={mode.maxElevatedFraction !== undefined ? Math.round(mode.maxElevatedFraction * 100) : 40} oncommit={(value) => updateElevMode(i, "maxElevatedFraction", (value ?? 40) / 100)} min={0} max={100} step={5} allowEmpty={false} unit="%" />
              </label>
            </div>
            <button class="gen-remove-btn" onclick={() => removeElevMode(i)} title="Remove mode">✕</button>
          </div>
        {/each}
      {/if}
    </details>

    <!-- Ambient Pickup Distribution -->
    <details open class="gen-section">
      <summary class="gen-section-title">Ambient pickups</summary>
      <div class="gen-fields">
        <label class="gen-field">
          <span class="gen-label">Repulsion</span>
          <NumberField value={ambient.repulsion ?? 1} oncommit={(value) => updateAmbient("repulsion", value ?? 1)} min={0} step={0.1} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Noise</span>
          <NumberField value={ambient.noise ?? 0.3} oncommit={(value) => updateAmbient("noise", value ?? 0.3)} min={0} step={0.1} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Road attraction</span>
          <NumberField value={ambient.roadAttraction ?? 0.5} oncommit={(value) => updateAmbient("roadAttraction", value ?? 0.5)} step={0.05} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Obstacle attraction</span>
          <NumberField value={ambient.obstacleAttraction ?? 0} oncommit={(value) => updateAmbient("obstacleAttraction", value ?? 0)} step={0.05} precision={2} allowEmpty={false} />
        </label>
        <label class="gen-field">
          <span class="gen-label">Group size weights</span>
          <span class="gen-hint">Solo, pair, trio, etc.</span>
          <input type="text" class="gen-input"
            value={groupWeightsText}
            placeholder="4, 1, 1"
            oninput={(e) => { groupWeightsText = e.currentTarget.value; }}
            onblur={(e) => {
              const nums = parseGroupWeights(e.currentTarget.value);
              updateAmbient("groupSizeWeights", nums.length > 0 ? nums : undefined);
            }}
          />
        </label>
      </div>
    </details>
  {/if}
</div>

<style>
  .gen-panel {
    display: grid;
    gap: var(--space-2);
    font-size: var(--font-size-sm);
  }
  .gen-zone-info {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    border-bottom: var(--line) solid var(--color-line);
    margin-bottom: var(--space-2);
  }
  .gen-zone-name {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-ink);
  }
  .gen-zone-layout {
    font-size: var(--font-size-xs);
    font-family: var(--font-mono);
    color: var(--color-muted);
  }
  .gen-zone-layout.is-local { color: var(--color-accent); }
  .gen-zone-layout.is-core { color: var(--color-muted); font-style: italic; }
  .gen-zone-layout.is-missing { color: var(--color-state-invalid); }
  .gen-empty {
    color: var(--color-muted);
    font-size: var(--font-size-xs);
    padding: var(--space-2);
    text-align: center;
  }
  .gen-section {
    border: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
  }
  .gen-section-title {
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-muted);
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .gen-section-title:hover { color: var(--color-ink); }
  .gen-preview-band {
    padding: var(--space-2);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
  }
  .gen-add-btn {
    width: 1.25rem; height: 1.25rem;
    display: grid; place-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-accent);
    cursor: pointer;
    font-size: var(--font-size-sm);
    line-height: 1;
    padding: 0;
  }
  .gen-add-btn:hover { background: var(--color-active); }
  .gen-fields {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2) var(--space-2);
  }
  .gen-field {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-2);
  }
  .gen-label {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
    white-space: nowrap;
  }
  .gen-hint {
    font-size: var(--font-size-xxs);
    color: var(--color-muted);
    grid-column: 1 / -1;
    margin: 0;
  }
  .gen-input {
    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    min-height: 1.5rem;
    padding: 2px var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-ink);
    width: fit-content;
    min-width: 3ch;
    max-width: 100%;
    box-sizing: border-box;
  }
  .gen-input::placeholder { color: var(--color-muted); opacity: 1; }
  .gen-input:focus { outline: 1px solid var(--color-accent); outline-offset: -1px; }
  .gen-input[type="text"] { width: 100%; min-width: 0; }
  .gen-field :global(.number-field) {
    width: fit-content;
    min-width: 4.75rem;
    max-width: 100%;
  }
  .gen-mode-row {
    display: flex;
    align-items: start;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border-top: var(--line) solid var(--color-line);
  }
  .gen-mode-fields {
    flex: 1;
    display: grid;
    gap: var(--space-1);
  }
  .gen-remove-btn {
    width: 1.25rem; height: 1.25rem;
    display: grid; place-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-danger, #c55);
    cursor: pointer;
    font-size: var(--font-size-xs);
    line-height: 1;
    padding: 0;
    margin-top: 2px;
    flex-shrink: 0;
  }
  .gen-remove-btn:hover { background: var(--color-danger, #c55); color: white; }
  .gen-noise-previews {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2) var(--space-2);
  }
</style>
