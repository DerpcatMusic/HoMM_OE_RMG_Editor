<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { GAME_MODES } from "../../../core/rmg/enums.js";
  import { WIN_CONDITION_PRESETS, isWinConditionPresetId, type WinConditionPresetId } from "../../../core/rmg/winConditions.js";
  import { FIELD_PLACEHOLDERS } from "./fieldPlaceholders.js";
  import NumberField from "../ui/NumberField.svelte";
  const ph = FIELD_PLACEHOLDERS;
  let template = $derived(editor.session.template);
  let gameRules = $derived(template.gameRules ?? {});
  let winCon = $derived(gameRules.winConditions ?? {});
  // Game settings
  let gameMode = $derived(template.gameMode ?? "Classic");
  let sizeX = $derived(template.sizeX ?? 144);
  let sizeZ = $derived(template.sizeZ ?? 144);
  let heroCountMin = $derived(gameRules.heroCountMin ?? 5);
  let heroCountMax = $derived(gameRules.heroCountMax ?? 10);
  let heroCountIncrement = $derived(gameRules.heroCountIncrement ?? 1);
  let heroHireBan = $derived(gameRules.heroHireBan ?? false);
  let encounterHoles = $derived(gameRules.encounterHoles ?? true);
  let disableFactionLaws = $derived(gameRules.disableFactionLaws ?? false);
  let disableMagicGuild = $derived(gameRules.disableMagicGuild ?? false);
  let disableMagicCustomLearning = $derived(gameRules.disableMagicCustomLearning ?? false);
  let tournamentRules = $derived(gameRules.tournamentRules ?? false);
  let factionLawsExpModifier = $derived(gameRules.factionLawsExpModifier);
  let astrologyExpModifier = $derived(gameRules.astrologyExpModifier);
  // Win conditions
  let currentWinPreset = $derived.by(() => WIN_CONDITION_PRESETS.find((preset) => preset.displaySid === template.displayWinCondition) ?? null);
  let winConditionPresetId = $derived(currentWinPreset?.id ?? "custom");
  let winFlagsLocked = $derived(currentWinPreset !== null);
  let classic = $derived(winCon.classic ?? true);
  let desertion = $derived(winCon.desertion ?? false);
  let desertionDay = $derived(winCon.desertionDay);
  let desertionValue = $derived(winCon.desertionValue);
  let heroLighting = $derived(winCon.heroLighting ?? false);
  let heroLightingDay = $derived(winCon.heroLightingDay);
  let lostStartCity = $derived(winCon.lostStartCity ?? false);
  let lostStartCityDay = $derived(winCon.lostStartCityDay);
  let lostStartHero = $derived(winCon.lostStartHero ?? false);
  let gladiatorArena = $derived(winCon.gladiatorArena ?? false);
  let gladiatorArenaDaysDelayStart = $derived(winCon.gladiatorArenaDaysDelayStart);
  let gladiatorArenaCountDay = $derived(winCon.gladiatorArenaCountDay);
  let championSelectRule = $derived(winCon.championSelectRule ?? "");
  let cityHold = $derived(winCon.cityHold ?? false);
  let cityHoldDays = $derived(winCon.cityHoldDays);
  let tournament = $derived(winCon.tournament ?? false);
  let tournamentPointsToWin = $derived(winCon.tournamentPointsToWin);
  let mapSizeLinked = $state(true);

  function buildGlobalSettingsDraft(winConditionPreset?: WinConditionPresetId) {
    const displayWinCondition = winConditionPreset
      ? WIN_CONDITION_PRESETS.find((preset) => preset.id === winConditionPreset)?.displaySid ?? template.displayWinCondition ?? ""
      : template.displayWinCondition ?? "";
    return {
      gameMode, sizeX, sizeZ,
      displayWinCondition,
      ...(winConditionPreset ? { winConditionPreset } : {}),
      heroCountMin, heroCountMax, heroCountIncrement,
      heroHireBan, encounterHoles,
      disableFactionLaws, disableMagicGuild, disableMagicCustomLearning,
      tournamentRules, factionLawsExpModifier, astrologyExpModifier,
      classic, desertion, desertionDay, desertionValue,
      heroLighting, heroLightingDay,
      lostStartCity, lostStartCityDay, lostStartHero,
      gladiatorArena, gladiatorArenaDaysDelayStart, gladiatorArenaCountDay,
      championSelectRule, cityHold, cityHoldDays,
      tournament, tournamentPointsToWin,
    };
  }
  function apply() {
    editor.applyGlobalSettings(buildGlobalSettingsDraft());
  }
  function applySize(axis: "x" | "z") {
    if (mapSizeLinked) {
      if (axis === "x") {
        sizeZ = sizeX;
      } else {
        sizeX = sizeZ;
      }
    }
    apply();
  }
  function applyWinConditionPreset(value: string) {
    if (!isWinConditionPresetId(value)) {
      return;
    }
    editor.applyGlobalSettings(buildGlobalSettingsDraft(value));
  }
  function toggleMapSizeLink() {
    mapSizeLinked = !mapSizeLinked;
    if (mapSizeLinked) {
      sizeZ = sizeX;
      apply();
    }
  }
  function onSingleHeroChange() {
    if (gameMode === "SingleHero") {
      heroCountMin = 1;
      heroCountMax = 1;
      heroCountIncrement = 1;
      heroHireBan = true;
      encounterHoles = false;
      lostStartHero = true;
      apply();
    }
  }
</script>
<div class="global-settings">
  <h3 class="section-heading">Game</h3>
  <div class="setting-row">
    <label for="gs-mode">Mode</label>
    <select id="gs-mode" bind:value={gameMode} onchange={() => { onSingleHeroChange(); apply(); }}>
      {#each GAME_MODES as mode (mode)}
        <option value={mode}>{mode}</option>
      {/each}
    </select>
  </div>
  <div class="setting-row setting-row--stacked">
    <label for="gs-win-preset">Victory</label>
    <div class="setting-stack">
      <select id="gs-win-preset" value={winConditionPresetId} onchange={(event) => applyWinConditionPreset(event.currentTarget.value)}>
        {#if winConditionPresetId === "custom"}
          <option value="custom">Custom ({template.displayWinCondition ?? "no SID"})</option>
        {/if}
        {#each WIN_CONDITION_PRESETS as preset (preset.id)}
          <option value={preset.id}>{preset.name}</option>
        {/each}
      </select>
      {#if currentWinPreset}
        <span class="setting-help">{currentWinPreset.displaySid}: preset owns the generator flags below.</span>
      {:else}
        <span class="setting-help">Custom condition. Generator flags below are editable.</span>
      {/if}
    </div>
  </div>
  <div class="setting-row">
    <label for="gs-sizex">Size</label>
    <div class="size-control">
      <NumberField id="gs-sizex" bind:value={sizeX} oncommit={() => applySize("x")} min={32} max={512} step={16} allowEmpty={false} title="Map width" />
      <button
        class="icon-toggle"
        class:is-active={mapSizeLinked}
        type="button"
        title={mapSizeLinked ? "Unlink map width and height" : "Link map width and height"}
        aria-label={mapSizeLinked ? "Unlink map width and height" : "Link map width and height"}
        aria-pressed={mapSizeLinked}
        onclick={toggleMapSizeLink}
      >
        <span class="material-symbols-outlined" aria-hidden="true">{mapSizeLinked ? "link" : "link_off"}</span>
      </button>
      <NumberField id="gs-sizez" bind:value={sizeZ} oncommit={() => applySize("z")} min={32} max={512} step={16} allowEmpty={false} title="Map height" />
    </div>
  </div>
  <div class="setting-row">
    <label for="gs-hero-min">Hero min</label>
    <NumberField id="gs-hero-min" bind:value={heroCountMin} oncommit={apply} min={1} max={8} allowEmpty={false} disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-hero-max">Hero max</label>
    <NumberField id="gs-hero-max" bind:value={heroCountMax} oncommit={apply} min={1} max={8} allowEmpty={false} disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-hero-step">Hero step</label>
    <NumberField id="gs-hero-step" bind:value={heroCountIncrement} oncommit={apply} min={1} max={8} allowEmpty={false} disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-hero-ban">Hero hire ban</label>
    <input id="gs-hero-ban" type="checkbox" bind:checked={heroHireBan} onchange={apply} disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-enc-holes">Encounter holes</label>
    <input id="gs-enc-holes" type="checkbox" bind:checked={encounterHoles} onchange={apply} disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-no-laws">No faction laws</label>
    <input id="gs-no-laws" type="checkbox" bind:checked={disableFactionLaws} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-no-magic">No magic guild</label>
    <input id="gs-no-magic" type="checkbox" bind:checked={disableMagicGuild} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-no-learn">No magic learn</label>
    <input id="gs-no-learn" type="checkbox" bind:checked={disableMagicCustomLearning} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-tourn-rules">Tournament battle rules</label>
    <input id="gs-tourn-rules" type="checkbox" bind:checked={tournamentRules} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-faction-exp">Faction exp mod</label>
    <NumberField id="gs-faction-exp" bind:value={factionLawsExpModifier} oncommit={apply} placeholder={ph["gs-faction-exp"]} step={0.1} />
  </div>
  <div class="setting-row">
    <label for="gs-astro-exp">Astrology exp mod</label>
    <NumberField id="gs-astro-exp" bind:value={astrologyExpModifier} oncommit={apply} placeholder={ph["gs-astro-exp"]} step={0.1} />
  </div>
  <h3 class="section-heading">Generator flags</h3>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-classic">Classic flag</label>
    <input id="gs-classic" type="checkbox" bind:checked={classic} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-desertion">Desertion</label>
    <input id="gs-desertion" type="checkbox" bind:checked={desertion} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !desertion}>
    <label for="gs-desert-day">Desertion day</label>
    <NumberField id="gs-desert-day" bind:value={desertionDay} oncommit={apply} placeholder={ph["gs-desert-day"]} disabled={winFlagsLocked || !desertion} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !desertion}>
    <label for="gs-desert-val">Desertion value</label>
    <NumberField id="gs-desert-val" bind:value={desertionValue} oncommit={apply} placeholder={ph["gs-desert-val"]} disabled={winFlagsLocked || !desertion} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-hero-light">Hero lighting</label>
    <input id="gs-hero-light" type="checkbox" bind:checked={heroLighting} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !heroLighting}>
    <label for="gs-hero-light-day">Lighting day</label>
    <NumberField id="gs-hero-light-day" bind:value={heroLightingDay} oncommit={apply} placeholder={ph["gs-hero-light-day"]} disabled={winFlagsLocked || !heroLighting} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-lost-city">Lost start city</label>
    <input id="gs-lost-city" type="checkbox" bind:checked={lostStartCity} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !lostStartCity}>
    <label for="gs-lost-city-day">Lost city day</label>
    <NumberField id="gs-lost-city-day" bind:value={lostStartCityDay} oncommit={apply} placeholder={ph["gs-lost-city-day"]} disabled={winFlagsLocked || !lostStartCity} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || gameMode === "SingleHero"}>
    <label for="gs-lost-hero">Lost start hero</label>
    <input id="gs-lost-hero" type="checkbox" bind:checked={lostStartHero} onchange={apply} disabled={winFlagsLocked || gameMode === "SingleHero"} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-glad">Final battle arena</label>
    <input id="gs-glad" type="checkbox" bind:checked={gladiatorArena} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !gladiatorArena}>
    <label for="gs-glad-delay">Gladiator delay</label>
    <NumberField id="gs-glad-delay" bind:value={gladiatorArenaDaysDelayStart} oncommit={apply} placeholder={ph["gs-glad-delay"]} disabled={winFlagsLocked || !gladiatorArena} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !gladiatorArena}>
    <label for="gs-glad-count">Gladiator days</label>
    <NumberField id="gs-glad-count" bind:value={gladiatorArenaCountDay} oncommit={apply} placeholder={ph["gs-glad-count"]} disabled={winFlagsLocked || !gladiatorArena} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || (!gladiatorArena && !tournament)}>
    <label for="gs-champ">Champion rule</label>
    <input id="gs-champ" type="text" value={championSelectRule} onchange={(e) => { championSelectRule = e.currentTarget.value; apply(); }} placeholder={ph["gs-champ"]} disabled={winFlagsLocked || (!gladiatorArena && !tournament)} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-city-hold">City hold flag</label>
    <input id="gs-city-hold" type="checkbox" bind:checked={cityHold} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !cityHold}>
    <label for="gs-city-hold-days">City hold days</label>
    <NumberField id="gs-city-hold-days" bind:value={cityHoldDays} oncommit={apply} placeholder={ph["gs-city-hold-days"]} disabled={winFlagsLocked || !cityHold} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked}>
    <label for="gs-tournament">Tournament flag</label>
    <input id="gs-tournament" type="checkbox" bind:checked={tournament} onchange={apply} disabled={winFlagsLocked} />
  </div>
  <div class="setting-row" class:is-disabled={winFlagsLocked || !tournament}>
    <label for="gs-tourn-pts">Tournament points</label>
    <NumberField id="gs-tourn-pts" bind:value={tournamentPointsToWin} oncommit={apply} placeholder={ph["gs-tourn-pts"]} disabled={winFlagsLocked || !tournament} />
  </div>
</div>
<style>
  .global-settings {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }
  .section-heading {
    padding: var(--space-1) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    background: var(--color-panel-2);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--color-muted);
    font-weight: 500;
    margin: 0;
    position: sticky;
    top: 0;
    z-index: 1;
  }
  .setting-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    font-size: 0.6875rem;
  }
  .setting-row--stacked {
    align-items: start;
  }
  .setting-row.is-disabled {
    background: var(--color-panel-2);
    opacity: 0.62;
  }
  .size-control {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
  }
  .icon-toggle {
    width: 1.5rem;
    height: 1.5rem;
    display: grid;
    place-items: center;
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    color: var(--color-muted);
    cursor: pointer;
    padding: 0;
  }
  .icon-toggle:hover,
  .icon-toggle.is-active {
    border-color: var(--color-line-strong);
    color: var(--color-ink);
    background: var(--color-active);
  }
  .icon-toggle .material-symbols-outlined {
    font-family: var(--font-icon);
    font-size: 0.875rem;
    line-height: 1;
  }
  .setting-stack {
    display: grid;
    gap: var(--space-1);
    min-width: 0;
  }
  .setting-help {
    color: var(--color-muted);
    font-size: 0.625rem;
    line-height: 1.25;
  }
  .setting-row label {
    color: var(--color-muted);
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .setting-row input[type="text"],
  .setting-row select {
    height: 1.5rem;
    padding: 0 var(--space-1);
    border: var(--line) solid var(--color-line);
    background: var(--color-panel);
    font: inherit;
    font-size: 0.6875rem;
    color: var(--color-ink);
  }
  .setting-row :global(.number-field) {
    width: fit-content;
    min-width: 3ch;
    max-width: 100%;
    box-sizing: border-box;
  }
  .setting-row input[type="text"],
  .setting-row select {
    width: 100%;
    min-width: 0;
  }
  .setting-row input::placeholder {
    font-size: 0.625rem;
  }
  .setting-row input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-ink);
  }
  .setting-row input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .setting-row input:disabled::placeholder {
    opacity: 0.3;
  }
</style>
