import type { WinConditions } from "./rmgTypes.js";

export type WinConditionPresetId =
  | "storyBased"
  | "classic"
  | "capitalCapture"
  | "capitalHold"
  | "finalBattle"
  | "cityHold"
  | "tournament"
  | "battleForCapital";

export interface WinConditionPreset {
  id: WinConditionPresetId;
  displaySid: string;
  name: string;
  descriptionSid: string;
  description: string;
  winConditions: WinConditions;
}

const BASE_SECONDARY_CONDITIONS: WinConditions = {
  classic: true,
  desertion: true,
  desertionDay: 3,
  desertionValue: 3000,
  heroLighting: true,
  heroLightingDay: 1,
  lostStartCity: false,
  lostStartHero: false,
};

export const WIN_CONDITION_PRESETS: readonly WinConditionPreset[] = [
  {
    id: "storyBased",
    displaySid: "win_condition_0",
    name: "Story-Based",
    descriptionSid: "win_condition_0_desc",
    description: "Victory conditions are defined by the map's scenario.",
    winConditions: {},
  },
  {
    id: "classic",
    displaySid: "win_condition_1",
    name: "Classic",
    descriptionSid: "win_condition_1_desc",
    description: "Defeat all enemy heroes and capture every enemy city to win.",
    winConditions: { ...BASE_SECONDARY_CONDITIONS },
  },
  {
    id: "capitalCapture",
    displaySid: "win_condition_2",
    name: "Capital Capture",
    descriptionSid: "win_condition_2_desc",
    description: "Capture the opponent's starting city to win.",
    winConditions: { ...BASE_SECONDARY_CONDITIONS, lostStartCity: true, lostStartCityDay: 1 },
  },
  {
    id: "capitalHold",
    displaySid: "win_condition_3",
    name: "Capital Hold",
    descriptionSid: "win_condition_3_desc",
    description: "Capture the opponent's starting city and hold it for a set number of in-game days to win.",
    winConditions: { ...BASE_SECONDARY_CONDITIONS, lostStartCity: true, lostStartCityDay: 3 },
  },
  {
    id: "finalBattle",
    displaySid: "win_condition_4",
    name: "Final Battle",
    descriptionSid: "win_condition_4_desc",
    description: "Face the opponent's hero in a final battle. The winner claims victory in the game.",
    winConditions: {
      ...BASE_SECONDARY_CONDITIONS,
      lostStartHero: true,
      gladiatorArena: true,
      gladiatorArenaRegistrationStartWork: false,
      gladiatorArenaRegistrationStartFight: true,
      gladiatorArenaDaysDelayStart: 30,
      gladiatorArenaCountDay: 3,
      championSelectRule: "StartHero",
    },
  },
  {
    id: "cityHold",
    displaySid: "win_condition_5",
    name: "City Hold",
    descriptionSid: "win_condition_5_desc",
    description: "Capture the marked neutral city and hold it for a set number of in-game days to win.",
    winConditions: { ...BASE_SECONDARY_CONDITIONS, cityHold: true, cityHoldDays: 3 },
  },
  {
    id: "tournament",
    displaySid: "win_condition_6",
    name: "Tournament",
    descriptionSid: "win_condition_6_desc",
    description: "Face the opponent's hero in a series of battles. The winner of the set claims victory in the game.",
    winConditions: {
      ...BASE_SECONDARY_CONDITIONS,
      lostStartHero: true,
      gladiatorArena: false,
      gladiatorArenaRegistrationStartWork: false,
      gladiatorArenaRegistrationStartFight: true,
      gladiatorArenaDaysDelayStart: 21,
      gladiatorArenaCountDay: 8,
      tournament: true,
      tournamentPointsToWin: 2,
      tournamentSaveArmy: true,
      tournamentDays: [3, 3, 3],
      tournamentAnnounceDays: [7, 14, 21],
      championSelectRule: "StartHero",
    },
  },
  {
    id: "battleForCapital",
    displaySid: "win_condition_7",
    name: "Battle for Capital",
    descriptionSid: "win_condition_7_desc",
    description: "Capture the opponent's starting city to trigger the final battle with their hero.",
    winConditions: {
      ...BASE_SECONDARY_CONDITIONS,
      lostStartCity: true,
      lostStartCityDay: 1,
      lostStartHero: true,
      gladiatorArena: true,
      gladiatorArenaRegistrationStartWork: false,
      gladiatorArenaRegistrationStartFight: true,
      gladiatorArenaDaysDelayStart: 0,
      gladiatorArenaCountDay: 1,
      championSelectRule: "StartHero",
    },
  },
] as const;

export function getWinConditionPreset(id: WinConditionPresetId): WinConditionPreset {
  const preset = WIN_CONDITION_PRESETS.find((item) => item.id === id);
  if (!preset) {
    throw new Error(`Unknown win-condition preset '${id}'.`);
  }
  return preset;
}

export function isWinConditionPresetId(value: unknown): value is WinConditionPresetId {
  return typeof value === "string" && WIN_CONDITION_PRESETS.some((preset) => preset.id === value);
}

export function createWinConditionsFromPreset(
  id: WinConditionPresetId,
  overrides: Partial<WinConditions> = {},
): WinConditions {
  return {
    ...cloneWinConditions(getWinConditionPreset(id).winConditions),
    ...overrides,
  };
}

export function cloneWinConditions(winConditions: WinConditions): WinConditions {
  return JSON.parse(JSON.stringify(winConditions)) as WinConditions;
}
