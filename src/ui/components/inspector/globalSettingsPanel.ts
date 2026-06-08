import { GAME_MODES } from "../../../core/rmg/enums.js";
import type { RmgTemplate } from "../../../core/rmg/rmgTypes.js";
import type { GlobalSettingsDraft } from "../../state/editorSession.js";
import { el } from "../../dom.js";
import { createButton } from "../primitives.js";
import {
  createCheckbox,
  createControlRow,
  createNumberInput,
  createOptionalNumberInput,
  createSelect,
  createTextInput,
  optionalNumber,
} from "./controls.js";

export function createGlobalSettingsForm(props: { template: RmgTemplate; onApplyGlobalSettings: (draft: GlobalSettingsDraft) => void }): HTMLElement {
  const gameRules = props.template.gameRules ?? {};
  const winConditions = gameRules.winConditions ?? {};
  const gameModeInput = createSelect(props.template.gameMode ?? "Classic", GAME_MODES);
  const heroCountMinInput = createNumberInput(gameRules.heroCountMin ?? 5);
  const heroCountMaxInput = createNumberInput(gameRules.heroCountMax ?? 10);
  const heroCountIncrementInput = createNumberInput(gameRules.heroCountIncrement ?? 1);
  const heroHireBanInput = createCheckbox(gameRules.heroHireBan ?? false);
  const encounterHolesInput = createCheckbox(gameRules.encounterHoles ?? true);
  const disableFactionLawsInput = createCheckbox(gameRules.disableFactionLaws ?? false);
  const disableMagicGuildInput = createCheckbox(gameRules.disableMagicGuild ?? false);
  const disableMagicCustomLearningInput = createCheckbox(gameRules.disableMagicCustomLearning ?? false);
  const tournamentRulesInput = createCheckbox(gameRules.tournamentRules ?? false);
  const factionLawsExpModifierInput = createOptionalNumberInput(gameRules.factionLawsExpModifier);
  const astrologyExpModifierInput = createOptionalNumberInput(gameRules.astrologyExpModifier);
  const classicInput = createCheckbox(winConditions.classic ?? true);
  const desertionInput = createCheckbox(winConditions.desertion ?? false);
  const desertionDayInput = createOptionalNumberInput(winConditions.desertionDay);
  const desertionValueInput = createOptionalNumberInput(winConditions.desertionValue);
  const heroLightingInput = createCheckbox(winConditions.heroLighting ?? false);
  const heroLightingDayInput = createOptionalNumberInput(winConditions.heroLightingDay);
  const lostStartCityInput = createCheckbox(winConditions.lostStartCity ?? false);
  const lostStartCityDayInput = createOptionalNumberInput(winConditions.lostStartCityDay);
  const lostStartHeroInput = createCheckbox(winConditions.lostStartHero ?? false);
  const gladiatorArenaInput = createCheckbox(winConditions.gladiatorArena ?? false);
  const gladiatorDelayInput = createOptionalNumberInput(winConditions.gladiatorArenaDaysDelayStart);
  const gladiatorCountInput = createOptionalNumberInput(winConditions.gladiatorArenaCountDay);
  const championRuleInput = createTextInput(winConditions.championSelectRule ?? "");
  const cityHoldInput = createCheckbox(winConditions.cityHold ?? false);
  const cityHoldDaysInput = createOptionalNumberInput(winConditions.cityHoldDays);
  const tournamentInput = createCheckbox(winConditions.tournament ?? false);
  const tournamentPointsInput = createOptionalNumberInput(winConditions.tournamentPointsToWin);
  const syncGameModeDefaults = () => {
    const isSingleHero = gameModeInput.value === "SingleHero";
    if (isSingleHero) {
      heroCountMinInput.value = "1";
      heroCountMaxInput.value = "1";
      heroCountIncrementInput.value = "1";
      heroHireBanInput.checked = true;
      encounterHolesInput.checked = false;
      lostStartHeroInput.checked = true;
    }
    for (const control of [heroCountMinInput, heroCountMaxInput, heroCountIncrementInput, heroHireBanInput, encounterHolesInput, lostStartHeroInput]) {
      control.disabled = isSingleHero;
    }
  };
  gameModeInput.addEventListener("change", syncGameModeDefaults);
  syncGameModeDefaults();

  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Game" }),
    createControlRow("Mode", gameModeInput),
    el("p", { className: "conditional-note", text: "SingleHero mode forces one hero, bans hero hiring, disables encounter holes, and enables lost-start-hero." }),
    createControlRow("Hero min", heroCountMinInput),
    createControlRow("Hero max", heroCountMaxInput),
    createControlRow("Hero step", heroCountIncrementInput),
    createControlRow("Hero hire ban", heroHireBanInput),
    createControlRow("Encounter holes", encounterHolesInput),
    createControlRow("Disable faction laws", disableFactionLawsInput),
    createControlRow("Disable magic guild", disableMagicGuildInput),
    createControlRow("Disable magic learning", disableMagicCustomLearningInput),
    createControlRow("Tournament rules", tournamentRulesInput),
    createControlRow("Faction exp mod", factionLawsExpModifierInput),
    createControlRow("Astrology exp mod", astrologyExpModifierInput),
    el("h3", { text: "Win conditions" }),
    createControlRow("Classic", classicInput),
    createControlRow("Desertion", desertionInput),
    createControlRow("Desertion day", desertionDayInput),
    createControlRow("Desertion value", desertionValueInput),
    createControlRow("Hero lighting", heroLightingInput),
    createControlRow("Hero lighting day", heroLightingDayInput),
    createControlRow("Lost start city", lostStartCityInput),
    createControlRow("Lost city day", lostStartCityDayInput),
    createControlRow("Lost start hero", lostStartHeroInput),
    createControlRow("Gladiator arena", gladiatorArenaInput),
    createControlRow("Gladiator delay", gladiatorDelayInput),
    createControlRow("Gladiator days", gladiatorCountInput),
    createControlRow("Champion rule", championRuleInput),
    createControlRow("City hold", cityHoldInput),
    createControlRow("City hold days", cityHoldDaysInput),
    createControlRow("Tournament", tournamentInput),
    createControlRow("Tournament points", tournamentPointsInput),
    el("div", { className: "inspector-actions" }, [
      createButton("Apply global settings", { variant: "primary", icon: "check", onClick: () => props.onApplyGlobalSettings({
        gameMode: gameModeInput.value,
        heroCountMin: Number(heroCountMinInput.value),
        heroCountMax: Number(heroCountMaxInput.value),
        heroCountIncrement: Number(heroCountIncrementInput.value),
        heroHireBan: heroHireBanInput.checked,
        encounterHoles: encounterHolesInput.checked,
        disableFactionLaws: disableFactionLawsInput.checked,
        disableMagicGuild: disableMagicGuildInput.checked,
        disableMagicCustomLearning: disableMagicCustomLearningInput.checked,
        tournamentRules: tournamentRulesInput.checked,
        factionLawsExpModifier: optionalNumber(factionLawsExpModifierInput),
        astrologyExpModifier: optionalNumber(astrologyExpModifierInput),
        classic: classicInput.checked,
        desertion: desertionInput.checked,
        desertionDay: optionalNumber(desertionDayInput),
        desertionValue: optionalNumber(desertionValueInput),
        heroLighting: heroLightingInput.checked,
        heroLightingDay: optionalNumber(heroLightingDayInput),
        lostStartCity: lostStartCityInput.checked,
        lostStartCityDay: optionalNumber(lostStartCityDayInput),
        lostStartHero: lostStartHeroInput.checked,
        gladiatorArena: gladiatorArenaInput.checked,
        gladiatorArenaDaysDelayStart: optionalNumber(gladiatorDelayInput),
        gladiatorArenaCountDay: optionalNumber(gladiatorCountInput),
        championSelectRule: championRuleInput.value,
        cityHold: cityHoldInput.checked,
        cityHoldDays: optionalNumber(cityHoldDaysInput),
        tournament: tournamentInput.checked,
        tournamentPointsToWin: optionalNumber(tournamentPointsInput),
      })}),
    ]),
  ]);
}
