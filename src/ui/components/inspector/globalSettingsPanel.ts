import { GAME_MODES } from "../../../core/rmg/enums.js";
import type { RmgTemplate } from "../../../core/rmg/rmgTypes.js";
import type { GlobalSettingsDraft } from "../../state/editorSession.js";
import { el } from "../../dom.js";
import {
  createCheckbox,
  createInstantField,
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

  const collectDraft = (): GlobalSettingsDraft => ({
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
  });

  const commit = () => props.onApplyGlobalSettings(collectDraft());

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

  const num = (input: HTMLInputElement) => String(optionalNumber(input) ?? "");
  const str = (input: HTMLInputElement) => input.value;

  return el("div", { className: "inspector-body" }, [
    el("h3", { text: "Game" }),
    createInstantField("Mode", gameModeInput, { initialValue: props.template.gameMode ?? "Classic", onCommit: () => commit(), onReset: () => { gameModeInput.value = props.template.gameMode ?? "Classic"; syncGameModeDefaults(); commit(); } }),
    el("p", { className: "conditional-note", text: "SingleHero forces one hero, bans hiring, disables encounter holes." }),
    createInstantField("Hero min", heroCountMinInput, { initialValue: String(gameRules.heroCountMin ?? 5), onCommit: () => commit(), onReset: () => { heroCountMinInput.value = String(gameRules.heroCountMin ?? 5); commit(); } }),
    createInstantField("Hero max", heroCountMaxInput, { initialValue: String(gameRules.heroCountMax ?? 10), onCommit: () => commit(), onReset: () => { heroCountMaxInput.value = String(gameRules.heroCountMax ?? 10); commit(); } }),
    createInstantField("Hero step", heroCountIncrementInput, { initialValue: String(gameRules.heroCountIncrement ?? 1), onCommit: () => commit(), onReset: () => { heroCountIncrementInput.value = String(gameRules.heroCountIncrement ?? 1); commit(); } }),
    createInstantField("Hero hire ban", heroHireBanInput, { initialValue: String(gameRules.heroHireBan ?? false), onCommit: () => commit(), onReset: () => { heroHireBanInput.checked = gameRules.heroHireBan ?? false; commit(); } }),
    createInstantField("Encounter holes", encounterHolesInput, { initialValue: String(gameRules.encounterHoles ?? true), onCommit: () => commit(), onReset: () => { encounterHolesInput.checked = gameRules.encounterHoles ?? true; commit(); } }),
    createInstantField("Disable faction laws", disableFactionLawsInput, { initialValue: String(gameRules.disableFactionLaws ?? false), onCommit: () => commit(), onReset: () => { disableFactionLawsInput.checked = gameRules.disableFactionLaws ?? false; commit(); } }),
    createInstantField("Disable magic guild", disableMagicGuildInput, { initialValue: String(gameRules.disableMagicGuild ?? false), onCommit: () => commit(), onReset: () => { disableMagicGuildInput.checked = gameRules.disableMagicGuild ?? false; commit(); } }),
    createInstantField("Disable magic learning", disableMagicCustomLearningInput, { initialValue: String(gameRules.disableMagicCustomLearning ?? false), onCommit: () => commit(), onReset: () => { disableMagicCustomLearningInput.checked = gameRules.disableMagicCustomLearning ?? false; commit(); } }),
    createInstantField("Tournament rules", tournamentRulesInput, { initialValue: String(gameRules.tournamentRules ?? false), onCommit: () => commit(), onReset: () => { tournamentRulesInput.checked = gameRules.tournamentRules ?? false; commit(); } }),
    createInstantField("Faction exp mod", factionLawsExpModifierInput, { initialValue: num(factionLawsExpModifierInput), onCommit: () => commit(), onReset: () => { factionLawsExpModifierInput.value = num(factionLawsExpModifierInput); commit(); } }),
    createInstantField("Astrology exp mod", astrologyExpModifierInput, { initialValue: num(astrologyExpModifierInput), onCommit: () => commit(), onReset: () => { astrologyExpModifierInput.value = num(astrologyExpModifierInput); commit(); } }),
    el("h3", { text: "Win conditions" }),
    createInstantField("Classic", classicInput, { initialValue: String(winConditions.classic ?? true), onCommit: () => commit(), onReset: () => { classicInput.checked = winConditions.classic ?? true; commit(); } }),
    createInstantField("Desertion", desertionInput, { initialValue: String(winConditions.desertion ?? false), onCommit: () => commit(), onReset: () => { desertionInput.checked = winConditions.desertion ?? false; commit(); } }),
    createInstantField("Desertion day", desertionDayInput, { initialValue: num(desertionDayInput), onCommit: () => commit(), onReset: () => { desertionDayInput.value = num(desertionDayInput); commit(); } }),
    createInstantField("Desertion value", desertionValueInput, { initialValue: num(desertionValueInput), onCommit: () => commit(), onReset: () => { desertionValueInput.value = num(desertionValueInput); commit(); } }),
    createInstantField("Hero lighting", heroLightingInput, { initialValue: String(winConditions.heroLighting ?? false), onCommit: () => commit(), onReset: () => { heroLightingInput.checked = winConditions.heroLighting ?? false; commit(); } }),
    createInstantField("Hero lighting day", heroLightingDayInput, { initialValue: num(heroLightingDayInput), onCommit: () => commit(), onReset: () => { heroLightingDayInput.value = num(heroLightingDayInput); commit(); } }),
    createInstantField("Lost start city", lostStartCityInput, { initialValue: String(winConditions.lostStartCity ?? false), onCommit: () => commit(), onReset: () => { lostStartCityInput.checked = winConditions.lostStartCity ?? false; commit(); } }),
    createInstantField("Lost city day", lostStartCityDayInput, { initialValue: num(lostStartCityDayInput), onCommit: () => commit(), onReset: () => { lostStartCityDayInput.value = num(lostStartCityDayInput); commit(); } }),
    createInstantField("Lost start hero", lostStartHeroInput, { initialValue: String(winConditions.lostStartHero ?? false), onCommit: () => commit(), onReset: () => { lostStartHeroInput.checked = winConditions.lostStartHero ?? false; commit(); } }),
    createInstantField("Gladiator arena", gladiatorArenaInput, { initialValue: String(winConditions.gladiatorArena ?? false), onCommit: () => commit(), onReset: () => { gladiatorArenaInput.checked = winConditions.gladiatorArena ?? false; commit(); } }),
    createInstantField("Gladiator delay", gladiatorDelayInput, { initialValue: num(gladiatorDelayInput), onCommit: () => commit(), onReset: () => { gladiatorDelayInput.value = num(gladiatorDelayInput); commit(); } }),
    createInstantField("Gladiator days", gladiatorCountInput, { initialValue: num(gladiatorCountInput), onCommit: () => commit(), onReset: () => { gladiatorCountInput.value = num(gladiatorCountInput); commit(); } }),
    createInstantField("Champion rule", championRuleInput, { initialValue: str(championRuleInput), onCommit: () => commit(), onReset: () => { championRuleInput.value = str(championRuleInput); commit(); } }),
    createInstantField("City hold", cityHoldInput, { initialValue: String(winConditions.cityHold ?? false), onCommit: () => commit(), onReset: () => { cityHoldInput.checked = winConditions.cityHold ?? false; commit(); } }),
    createInstantField("City hold days", cityHoldDaysInput, { initialValue: num(cityHoldDaysInput), onCommit: () => commit(), onReset: () => { cityHoldDaysInput.value = num(cityHoldDaysInput); commit(); } }),
    createInstantField("Tournament", tournamentInput, { initialValue: String(winConditions.tournament ?? false), onCommit: () => commit(), onReset: () => { tournamentInput.checked = winConditions.tournament ?? false; commit(); } }),
    createInstantField("Tournament points", tournamentPointsInput, { initialValue: num(tournamentPointsInput), onCommit: () => commit(), onReset: () => { tournamentPointsInput.value = num(tournamentPointsInput); commit(); } }),
  ]);
}
