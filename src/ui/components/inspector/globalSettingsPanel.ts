import { GAME_MODES } from "../../../core/rmg/enums.js";
import type { RmgTemplate } from "../../../core/rmg/rmgTypes.js";
import type { GlobalSettingsDraft } from "../../state/editorSession.js";
import { el } from "../../dom.js";
import { createAccordionSection } from "../primitives.js";
import {
  createBoundInstantField,
  createCheckbox,
  createNumberInput,
  createOptionalNumberInput,
  createSelect,
  createSelectWithLabels,
  optionalNumber,
} from "./controls.js";

const VICTORY_CONDITION_OPTIONS = [
  { value: "win_condition_0", label: "Story-Based" },
  { value: "win_condition_1", label: "Classic" },
  { value: "win_condition_2", label: "Capital Capture" },
  { value: "win_condition_3", label: "Capital Hold" },
  { value: "win_condition_4", label: "Final Battle" },
  { value: "win_condition_5", label: "City Hold" },
  { value: "win_condition_6", label: "Tournament" },
  { value: "win_condition_7", label: "Battle for Capital" },
] as const;

export function createGlobalSettingsForm(props: {
  template: RmgTemplate;
  onApplyGlobalSettings: (draft: GlobalSettingsDraft) => void;
}): HTMLElement {
  const gameRules = props.template.gameRules ?? {};
  const winConditions = gameRules.winConditions ?? {};

  const sizeXInput = createNumberInput(props.template.sizeX ?? 128);
  const sizeZInput = createNumberInput(props.template.sizeZ ?? 128);
  const displayWinConditionInput = createSelectWithLabels(props.template.displayWinCondition ?? "", VICTORY_CONDITION_OPTIONS);
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
  const championRuleValue = winConditions.championSelectRule ?? "";
  const championRuleInput = createSelect(championRuleValue, championRuleValue && championRuleValue !== "StartHero" ? ["", championRuleValue, "StartHero"] : ["", "StartHero"]);
  const cityHoldInput = createCheckbox(winConditions.cityHold ?? false);
  const cityHoldDaysInput = createOptionalNumberInput(winConditions.cityHoldDays);
  const tournamentInput = createCheckbox(winConditions.tournament ?? false);
  const tournamentPointsInput = createOptionalNumberInput(winConditions.tournamentPointsToWin);

  const collectDraft = (): GlobalSettingsDraft => ({
    gameMode: gameModeInput.value,
    sizeX: Number(sizeXInput.value),
    sizeZ: Number(sizeZInput.value),
    displayWinCondition: displayWinConditionInput.value,
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
  const text = (input: HTMLInputElement | HTMLSelectElement) => input.value;
  const num = (input: HTMLInputElement) => String(optionalNumber(input) ?? "");
  const bool = (input: HTMLInputElement) => String(input.checked);
  const field = (
    label: string,
    input: HTMLInputElement | HTMLSelectElement,
    initialValue: string,
    afterReset?: () => void,
  ) => createBoundInstantField(label, input, initialValue, commit, afterReset ? { afterReset } : {});

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

  const gladiatorEnabled = winConditions.gladiatorArena ?? false;
  const tournamentEnabled = winConditions.tournament ?? false;

  return el("div", { className: "inspector-body" }, [
    createAccordionSection("Template", [
      field("Map width", sizeXInput, String(props.template.sizeX ?? 128)),
      field("Map height", sizeZInput, String(props.template.sizeZ ?? 128)),
      field("Victory condition", displayWinConditionInput, props.template.displayWinCondition ?? ""),
    ]),
    createAccordionSection("Game", [
      field("Mode", gameModeInput, props.template.gameMode ?? "Classic", syncGameModeDefaults),
      el("p", { className: "conditional-note", text: "SingleHero forces one hero, bans hiring, disables encounter holes." }),
      field("Hero min", heroCountMinInput, String(gameRules.heroCountMin ?? 5)),
      field("Hero max", heroCountMaxInput, String(gameRules.heroCountMax ?? 10)),
      field("Hero step", heroCountIncrementInput, String(gameRules.heroCountIncrement ?? 1)),
      field("Hero hire ban", heroHireBanInput, bool(heroHireBanInput)),
      field("Encounter holes", encounterHolesInput, bool(encounterHolesInput)),
      field("Disable faction laws", disableFactionLawsInput, bool(disableFactionLawsInput)),
      field("Disable magic guild", disableMagicGuildInput, bool(disableMagicGuildInput)),
      field("Disable magic learning", disableMagicCustomLearningInput, bool(disableMagicCustomLearningInput)),
      field("Tournament rules", tournamentRulesInput, bool(tournamentRulesInput)),
      field("Faction exp mod", factionLawsExpModifierInput, num(factionLawsExpModifierInput)),
      field("Astrology exp mod", astrologyExpModifierInput, num(astrologyExpModifierInput)),
    ]),
    createAccordionSection("Win conditions", [
      field("Classic", classicInput, bool(classicInput)),
      field("Desertion", desertionInput, bool(desertionInput)),
      field("Desertion day", desertionDayInput, num(desertionDayInput)),
      field("Desertion value", desertionValueInput, num(desertionValueInput)),
      field("Hero lighting", heroLightingInput, bool(heroLightingInput)),
      field("Hero lighting day", heroLightingDayInput, num(heroLightingDayInput)),
      field("Lost start city", lostStartCityInput, bool(lostStartCityInput)),
      field("Lost city day", lostStartCityDayInput, num(lostStartCityDayInput)),
      field("Lost start hero", lostStartHeroInput, bool(lostStartHeroInput)),
      field("Gladiator arena", gladiatorArenaInput, bool(gladiatorArenaInput)),
      ...(gladiatorEnabled ? [
        field("Gladiator delay", gladiatorDelayInput, num(gladiatorDelayInput)),
        field("Gladiator days", gladiatorCountInput, num(gladiatorCountInput)),
      ] : []),
      ...(gladiatorEnabled || tournamentEnabled ? [
        field("Champion rule", championRuleInput, text(championRuleInput)),
        el("p", { className: "conditional-note", text: "Official templates use StartHero; unknown loaded values are preserved." }),
      ] : []),
      field("City hold", cityHoldInput, bool(cityHoldInput)),
      field("City hold days", cityHoldDaysInput, num(cityHoldDaysInput)),
      field("Tournament", tournamentInput, bool(tournamentInput)),
      field("Tournament points", tournamentPointsInput, num(tournamentPointsInput)),
    ]),
  ]);
}
