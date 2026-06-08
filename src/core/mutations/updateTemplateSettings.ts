import type { GameRules, RmgTemplate, UnknownFields, WinConditions } from "../rmg/rmgTypes.js";
import { GAME_MODES, isEnumValue, type GameMode } from "../rmg/enums.js";
import {
  DEFAULT_HERO_COUNT_INCREMENT,
  DEFAULT_HERO_COUNT_MAX,
  DEFAULT_HERO_COUNT_MIN,
} from "../rmg/defaults.js";
import {
  cloneWinConditions,
  createWinConditionsFromPreset,
  getWinConditionPreset,
  isWinConditionPresetId,
  type WinConditionPresetId,
} from "../rmg/winConditions.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { ensureGameRules } from "./defaultObjects.js";
import { buildMutationResult, recordDelete, recordStringChange, recordValueChange } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface GameRuleSettings {
  heroCountMin?: number;
  heroCountMax?: number;
  heroCountIncrement?: number;
  heroHireBan?: boolean;
  encounterHoles?: boolean;
  disableFactionLaws?: boolean;
  disableMagicGuild?: boolean;
  disableMagicCustomLearning?: boolean;
  tournamentRules?: boolean;
  customAI?: string | null;
  factionLawsExpModifier?: number;
  astrologyExpModifier?: number;
  bonuses?: UnknownFields[] | null;
}

export interface UpdateTemplateSettingsInput extends TemplateMutationInput {
  name?: string | null;
  description?: string | null;
  gameMode?: GameMode;
  displayWinCondition?: string | null;
  winConditionPreset?: WinConditionPresetId;
  winConditions?: Partial<WinConditions>;
  sizeX?: number;
  sizeZ?: number;
  gameRules?: GameRuleSettings;
  applyGameModeDefaults?: boolean;
}

export function updateTemplateSettings(input: UpdateTemplateSettingsInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  if (input.gameMode !== undefined && !isEnumValue(GAME_MODES, input.gameMode)) {
    diagnostics.push(diagnostic("error", "mutation.template.gameModeInvalid", `Invalid game mode '${input.gameMode}'.`, "$.gameMode"));
  }
  if (input.winConditionPreset !== undefined && !isWinConditionPresetId(input.winConditionPreset)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.template.winConditionPresetInvalid",
        `Invalid win-condition preset '${input.winConditionPreset}'.`,
        "$.displayWinCondition",
      ),
    );
  }
  validateNullableNonEmptyString(input.name, "$.name", "name", diagnostics);
  validatePositiveInteger(input.sizeX, "$.sizeX", "sizeX", diagnostics);
  validatePositiveInteger(input.sizeZ, "$.sizeZ", "sizeZ", diagnostics);
  validateWinConditionSettings(input.winConditions, diagnostics);
  if (input.gameRules) {
    validateGameRuleSettings(input.gameRules, template.gameRules, diagnostics);
  }
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.name !== undefined) {
    if (input.name === null) {
      recordDelete(template, "name", "$.name", changes, "template name removed");
    } else {
      recordStringChange(template, "name", "$.name", input.name, changes, "template name");
    }
  }
  if (input.description !== undefined) {
    if (input.description === null) {
      recordDelete(template, "description", "$.description", changes, "template description removed");
    } else {
      recordStringChange(template, "description", "$.description", input.description, changes, "template description");
    }
  }
  if (input.gameMode !== undefined) {
    recordStringChange(template, "gameMode", "$.gameMode", input.gameMode, changes, "template game mode");
    if ((input.applyGameModeDefaults ?? false) && input.gameMode === "SingleHero") {
      const gameRules = ensureGameRules(template);
      setGameRuleValue(gameRules, "heroCountMin", 1, changes);
      setGameRuleValue(gameRules, "heroCountMax", 1, changes);
      setGameRuleValue(gameRules, "heroCountIncrement", 1, changes);
      setGameRuleValue(gameRules, "heroHireBan", true, changes);
      setGameRuleValue(gameRules, "encounterHoles", false, changes);
      recordValueChange(
        gameRules,
        "winConditions",
        "$.gameRules.winConditions",
        { ...cloneWinConditions(gameRules.winConditions ?? {}), lostStartHero: true },
        changes,
        "single hero win-condition default",
      );
    }
  }
  if (input.winConditionPreset !== undefined) {
    const preset = getWinConditionPreset(input.winConditionPreset);
    const gameRules = ensureGameRules(template);
    const winConditions = createWinConditionsFromPreset(input.winConditionPreset, input.winConditions ?? {});
    recordValueChange(gameRules, "winConditions", "$.gameRules.winConditions", winConditions, changes, "win-condition preset");
    if (input.displayWinCondition === undefined) {
      recordStringChange(template, "displayWinCondition", "$.displayWinCondition", preset.displaySid, changes, "win-condition display SID");
    }
  } else if (input.winConditions !== undefined) {
    const gameRules = ensureGameRules(template);
    const winConditions = {
      ...cloneWinConditions(gameRules.winConditions ?? {}),
      ...input.winConditions,
    };
    recordValueChange(gameRules, "winConditions", "$.gameRules.winConditions", winConditions, changes, "win-condition settings");
  }
  if (input.displayWinCondition !== undefined) {
    if (input.displayWinCondition === null) {
      recordDelete(template, "displayWinCondition", "$.displayWinCondition", changes, "template display win condition removed");
    } else {
      recordStringChange(template, "displayWinCondition", "$.displayWinCondition", input.displayWinCondition, changes, "template display win condition");
    }
  }
  if (input.sizeX !== undefined) {
    recordValueChange(template, "sizeX", "$.sizeX", input.sizeX, changes, "template map width");
  }
  if (input.sizeZ !== undefined) {
    recordValueChange(template, "sizeZ", "$.sizeZ", input.sizeZ, changes, "template map height");
  }
  if (input.gameRules) {
    const gameRules = ensureGameRules(template);
    applyGameRuleSettings(gameRules, input.gameRules, changes);
  }

  return buildMutationResult(template, changes, diagnostics);
}

function validateWinConditionSettings(settings: Partial<WinConditions> | undefined, diagnostics: Diagnostic[]): void {
  if (!settings) {
    return;
  }
  for (const key of [
    "desertionDay",
    "desertionValue",
    "heroLightingDay",
    "lostStartCityDay",
    "gladiatorArenaDaysDelayStart",
    "gladiatorArenaCountDay",
    "cityHoldDays",
    "tournamentPointsToWin",
  ] as const) {
    validateNonNegativeInteger(settings[key], `$.gameRules.winConditions.${key}`, key, diagnostics);
  }
  validateNonNegativeIntegerArray(settings.tournamentDays, "$.gameRules.winConditions.tournamentDays", "tournamentDays", diagnostics);
  validateNonNegativeIntegerArray(
    settings.tournamentAnnounceDays,
    "$.gameRules.winConditions.tournamentAnnounceDays",
    "tournamentAnnounceDays",
    diagnostics,
  );
}

function validateGameRuleSettings(
  settings: GameRuleSettings,
  current: GameRules | undefined,
  diagnostics: Diagnostic[],
): void {
  const nextMin = settings.heroCountMin ?? current?.heroCountMin ?? DEFAULT_HERO_COUNT_MIN;
  const nextMax = settings.heroCountMax ?? current?.heroCountMax ?? DEFAULT_HERO_COUNT_MAX;
  validateNonNegativeInteger(settings.heroCountMin, "$.gameRules.heroCountMin", "heroCountMin", diagnostics);
  validateNonNegativeInteger(settings.heroCountMax, "$.gameRules.heroCountMax", "heroCountMax", diagnostics);
  validateNonNegativeInteger(settings.heroCountIncrement, "$.gameRules.heroCountIncrement", "heroCountIncrement", diagnostics);
  validateFiniteNumber(settings.factionLawsExpModifier, "$.gameRules.factionLawsExpModifier", "factionLawsExpModifier", diagnostics);
  validateFiniteNumber(settings.astrologyExpModifier, "$.gameRules.astrologyExpModifier", "astrologyExpModifier", diagnostics);
  if (settings.bonuses !== undefined && settings.bonuses !== null && !Array.isArray(settings.bonuses)) {
    diagnostics.push(diagnostic("error", "mutation.gameRules.bonusesInvalid", "bonuses must be an array or null.", "$.gameRules.bonuses"));
  }
  if (nextMin > nextMax) {
    diagnostics.push(
      diagnostic("error", "mutation.gameRules.heroCountRangeInvalid", "heroCountMin cannot be greater than heroCountMax.", "$.gameRules"),
    );
  }
}

function applyGameRuleSettings(gameRules: GameRules, settings: GameRuleSettings, changes: MutationChange[]): void {
  for (const key of [
    "heroCountMin",
    "heroCountMax",
    "heroCountIncrement",
    "heroHireBan",
    "encounterHoles",
    "disableFactionLaws",
    "disableMagicGuild",
    "disableMagicCustomLearning",
    "tournamentRules",
    "factionLawsExpModifier",
    "astrologyExpModifier",
  ] as const) {
    if (settings[key] !== undefined) {
      setGameRuleValue(gameRules, key, settings[key], changes);
    }
  }
  if (settings.customAI !== undefined) {
    if (settings.customAI === null || settings.customAI.trim().length === 0) {
      recordDelete(gameRules, "customAI", "$.gameRules.customAI", changes, "custom AI disabled");
    } else {
      setGameRuleValue(gameRules, "customAI", settings.customAI, changes);
    }
  }
  if (settings.bonuses !== undefined) {
    if (settings.bonuses === null) {
      recordDelete(gameRules, "bonuses", "$.gameRules.bonuses", changes, "game rule bonuses removed");
    } else {
      setGameRuleValue(gameRules, "bonuses", settings.bonuses, changes);
    }
  }
}

function setGameRuleValue(gameRules: GameRules, key: string, value: unknown, changes: MutationChange[]): void {
  recordValueChange(gameRules, key, `$.gameRules.${key}`, value, changes, "game rule setting");
}

function validateNullableNonEmptyString(
  value: string | null | undefined,
  path: string,
  label: string,
  diagnostics: Diagnostic[],
): void {
  if (value !== undefined && value !== null && value.trim().length === 0) {
    diagnostics.push(diagnostic("error", `mutation.template.${label}.empty`, `${label} cannot be empty.`, path));
  }
}

function validateNonNegativeInteger(
  value: number | undefined,
  path: string,
  label: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || value < 0) {
    diagnostics.push(diagnostic("error", `mutation.${label}.invalid`, `${label} must be a non-negative integer.`, path));
  }
}

function validateFiniteNumber(
  value: number | undefined,
  path: string,
  label: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    diagnostics.push(diagnostic("error", `mutation.${label}.invalid`, `${label} must be a finite number.`, path));
  }
}

function validatePositiveInteger(
  value: number | undefined,
  path: string,
  label: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || value <= 0) {
    diagnostics.push(diagnostic("error", `mutation.${label}.invalid`, `${label} must be a positive integer.`, path));
  }
}

function validateNonNegativeIntegerArray(
  value: number[] | undefined,
  path: string,
  label: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value) || value.some((item) => !Number.isInteger(item) || item < 0)) {
    diagnostics.push(diagnostic("error", `mutation.${label}.invalid`, `${label} must contain non-negative integers.`, path));
  }
}
