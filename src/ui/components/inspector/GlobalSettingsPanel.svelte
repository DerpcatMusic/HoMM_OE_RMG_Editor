<script lang="ts">
  import { editor } from "../../state/editor.svelte.js";
  import { GAME_MODES } from "../../../core/rmg/enums.js";
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
  function apply() {
    editor.applyGlobalSettings({
      gameMode, sizeX, sizeZ,
      displayWinCondition: template.displayWinCondition ?? "",
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
    });
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
      {#each GAME_MODES as mode}
        <option value={mode}>{mode}</option>
      {/each}
    </select>
  </div>
  <div class="setting-row">
    <label for="gs-sizex">Size X</label>
    <input id="gs-sizex" type="number" bind:value={sizeX} onchange={apply} min="32" max="512" step="16" />
  </div>
  <div class="setting-row">
    <label for="gs-sizez">Size Z</label>
    <input id="gs-sizez" type="number" bind:value={sizeZ} onchange={apply} min="32" max="512" step="16" />
  </div>
  <div class="setting-row">
    <label for="gs-hero-min">Hero min</label>
    <input id="gs-hero-min" type="number" bind:value={heroCountMin} onchange={apply} min="1" max="8" disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-hero-max">Hero max</label>
    <input id="gs-hero-max" type="number" bind:value={heroCountMax} onchange={apply} min="1" max="8" disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-hero-step">Hero step</label>
    <input id="gs-hero-step" type="number" bind:value={heroCountIncrement} onchange={apply} min="1" max="8" disabled={gameMode === "SingleHero"} />
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
    <label for="gs-tourn-rules">Tournament rules</label>
    <input id="gs-tourn-rules" type="checkbox" bind:checked={tournamentRules} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-faction-exp">Faction exp mod</label>
    <input id="gs-faction-exp" type="number" value={factionLawsExpModifier ?? ""} onchange={(e) => { factionLawsExpModifier = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.1" />
  </div>
  <div class="setting-row">
    <label for="gs-astro-exp">Astrology exp mod</label>
    <input id="gs-astro-exp" type="number" value={astrologyExpModifier ?? ""} onchange={(e) => { astrologyExpModifier = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" step="0.1" />
  </div>
  <h3 class="section-heading">Win conditions</h3>
  <div class="setting-row">
    <label for="gs-classic">Classic</label>
    <input id="gs-classic" type="checkbox" bind:checked={classic} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-desertion">Desertion</label>
    <input id="gs-desertion" type="checkbox" bind:checked={desertion} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-desert-day">Desertion day</label>
    <input id="gs-desert-day" type="number" value={desertionDay ?? ""} onchange={(e) => { desertionDay = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-desert-val">Desertion value</label>
    <input id="gs-desert-val" type="number" value={desertionValue ?? ""} onchange={(e) => { desertionValue = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-hero-light">Hero lighting</label>
    <input id="gs-hero-light" type="checkbox" bind:checked={heroLighting} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-hero-light-day">Lighting day</label>
    <input id="gs-hero-light-day" type="number" value={heroLightingDay ?? ""} onchange={(e) => { heroLightingDay = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-lost-city">Lost start city</label>
    <input id="gs-lost-city" type="checkbox" bind:checked={lostStartCity} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-lost-city-day">Lost city day</label>
    <input id="gs-lost-city-day" type="number" value={lostStartCityDay ?? ""} onchange={(e) => { lostStartCityDay = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-lost-hero">Lost start hero</label>
    <input id="gs-lost-hero" type="checkbox" bind:checked={lostStartHero} onchange={apply} disabled={gameMode === "SingleHero"} />
  </div>
  <div class="setting-row">
    <label for="gs-glad">Gladiator arena</label>
    <input id="gs-glad" type="checkbox" bind:checked={gladiatorArena} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-glad-delay">Gladiator delay</label>
    <input id="gs-glad-delay" type="number" value={gladiatorArenaDaysDelayStart ?? ""} onchange={(e) => { gladiatorArenaDaysDelayStart = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-glad-count">Gladiator days</label>
    <input id="gs-glad-count" type="number" value={gladiatorArenaCountDay ?? ""} onchange={(e) => { gladiatorArenaCountDay = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-champ">Champion rule</label>
    <input id="gs-champ" type="text" value={championSelectRule} onchange={(e) => { championSelectRule = e.currentTarget.value; apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-city-hold">City hold</label>
    <input id="gs-city-hold" type="checkbox" bind:checked={cityHold} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-city-hold-days">City hold days</label>
    <input id="gs-city-hold-days" type="number" value={cityHoldDays ?? ""} onchange={(e) => { cityHoldDays = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
  </div>
  <div class="setting-row">
    <label for="gs-tournament">Tournament</label>
    <input id="gs-tournament" type="checkbox" bind:checked={tournament} onchange={apply} />
  </div>
  <div class="setting-row">
    <label for="gs-tourn-pts">Tournament points</label>
    <input id="gs-tourn-pts" type="number" value={tournamentPointsToWin ?? ""} onchange={(e) => { tournamentPointsToWin = e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value); apply(); }} placeholder="—" />
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
    grid-template-columns: 5rem 1fr;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-bottom: var(--line) solid var(--color-line);
    font-size: 0.6875rem;
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
  .setting-row input[type="number"],
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
  .setting-row input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: var(--color-ink);
  }
  .setting-row input:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>