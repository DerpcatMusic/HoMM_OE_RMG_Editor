import {
  DEFAULT_GAME_MODE,
  DEFAULT_GUARDED_CONTENT_POOL,
  DEFAULT_HERO_COUNT_INCREMENT,
  DEFAULT_HERO_COUNT_MAX,
  DEFAULT_HERO_COUNT_MIN,
  DEFAULT_MAIN_OBJECT_PLACEMENT,
  DEFAULT_MAIN_OBJECT_TYPE,
  DEFAULT_RESOURCES_CONTENT_POOL,
  DEFAULT_UNGUARDED_CONTENT_POOL,
  DEFAULT_ZONE_LAYOUT,
  DEFAULT_ZONE_SIZE,
} from "../rmg/defaults.js";
import type { ConnectionType, GameMode } from "../rmg/enums.js";
import type {
  Border,
  Connection,
  GameRules,
  MainObject,
  Orientation,
  RmgTemplate,
  Variant,
  WinConditions,
  Zone,
} from "../rmg/rmgTypes.js";
import {
  createWinConditionsFromPreset,
  getWinConditionPreset,
  type WinConditionPresetId,
} from "../rmg/winConditions.js";

export interface DefaultTemplateOptions {
  name: string;
  description?: string;
  gameMode?: GameMode;
  winConditionPreset?: WinConditionPresetId;
  displayWinCondition?: string;
  sizeX?: number;
  sizeZ?: number;
}

export interface DefaultVariantOptions {}

export interface DefaultZoneOptions {
  name: string;
  size?: number;
  layout?: string;
  guardedContentPool?: string[];
  unguardedContentPool?: string[];
  resourcesContentPool?: string[];
}

export interface DefaultMainObjectOptions {
  type?: string;
  placement?: string;
  spawn?: string;
  owner?: string;
}

export interface DefaultConnectionOptions {
  name: string;
  from: string;
  to: string;
  connectionType?: ConnectionType;
  length?: number;
  guardZone?: string;
  guardValue?: number;
  guardWeeklyIncrement?: number;
  guardEscape?: boolean;
  portalFromEnabled?: boolean;
  portalToEnabled?: boolean;
}

export function createDefaultTemplate(options: DefaultTemplateOptions): RmgTemplate {
  const winConditionPreset = getWinConditionPreset(options.winConditionPreset ?? "classic");
  return {
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    gameMode: options.gameMode ?? DEFAULT_GAME_MODE,
    displayWinCondition: options.displayWinCondition ?? winConditionPreset.displaySid,
    sizeX: options.sizeX ?? 128,
    sizeZ: options.sizeZ ?? 128,
    gameRules: createDefaultGameRules(options.gameMode, options.winConditionPreset),
    variants: [createDefaultVariant()],
    mandatoryContent: [],
    contentCountLimits: [],
    contentPools: [],
    contentLists: [],
    zoneLayouts: [],
    valueOverrides: [],
  };
}

export function createDefaultVariant(): Variant {
  return {
    orientation: createDefaultOrientation(),
    border: createDefaultBorder(),
    zones: [],
    connections: [],
  };
}

export function createDefaultZone(options: DefaultZoneOptions): Zone {
  return {
    name: options.name,
    size: options.size ?? DEFAULT_ZONE_SIZE,
    layout: options.layout ?? DEFAULT_ZONE_LAYOUT,
    mainObjects: [],
    zoneBiome: { type: "FromList", args: [] },
    contentBiome: { type: "MatchZone", args: [] },
    metaObjectsBiome: { type: "MatchZone", args: [] },
    crossroadsPosition: -1,
    guardedContentPool: [...(options.guardedContentPool ?? [DEFAULT_GUARDED_CONTENT_POOL])],
    unguardedContentPool: [...(options.unguardedContentPool ?? [DEFAULT_UNGUARDED_CONTENT_POOL])],
    resourcesContentPool: [...(options.resourcesContentPool ?? [DEFAULT_RESOURCES_CONTENT_POOL])],
    contentCountLimits: [],
    guardedContentValue: 0,
    guardedContentValuePerArea: 0,
    unguardedContentValue: 0,
    unguardedContentValuePerArea: 0,
    resourcesValue: 0,
    resourcesValuePerArea: 0,
    mandatoryContent: [],
    roads: [],
  };
}

export function createDefaultMainObject(options: DefaultMainObjectOptions = {}): MainObject {
  const type = options.type ?? DEFAULT_MAIN_OBJECT_TYPE;
  const mainObject: MainObject = {
    type: options.type ?? DEFAULT_MAIN_OBJECT_TYPE,
    ...(options.spawn ? { spawn: options.spawn } : {}),
    ...(options.owner ? { owner: options.owner } : {}),
    placement: options.placement ?? DEFAULT_MAIN_OBJECT_PLACEMENT,
    placementArgs: [],
  };
  if (type !== "Spawn" && type !== "GladiatorArena") {
    mainObject.faction = { type: "FromList", args: [] };
  }
  return mainObject;
}

export function createDefaultConnection(options: DefaultConnectionOptions): Connection {
  const connectionType = options.connectionType ?? "Default";
  return {
    name: options.name,
    from: options.from,
    to: options.to,
    connectionType,
    ...(options.length !== undefined ? { length: options.length } : {}),
    ...(options.guardZone ? { guardZone: options.guardZone } : {}),
    ...(options.guardValue !== undefined ? { guardValue: options.guardValue } : {}),
    ...(options.guardWeeklyIncrement !== undefined ? { guardWeeklyIncrement: options.guardWeeklyIncrement } : {}),
    ...(options.guardEscape !== undefined ? { guardEscape: options.guardEscape } : {}),
    ...(connectionType === "Portal"
      ? {
          portalFromEnabled: options.portalFromEnabled ?? true,
          portalToEnabled: options.portalToEnabled ?? true,
        }
      : {
          ...(options.portalFromEnabled !== undefined ? { portalFromEnabled: options.portalFromEnabled } : {}),
          ...(options.portalToEnabled !== undefined ? { portalToEnabled: options.portalToEnabled } : {}),
        }),
  };
}

export function ensureGameRules(template: RmgTemplate): GameRules {
  template.gameRules ??= {};
  template.gameMode ??= DEFAULT_GAME_MODE;
  template.gameRules.heroCountMin ??= DEFAULT_HERO_COUNT_MIN;
  template.gameRules.heroCountMax ??= DEFAULT_HERO_COUNT_MAX;
  template.gameRules.heroCountIncrement ??= DEFAULT_HERO_COUNT_INCREMENT;
  template.gameRules.winConditions ??= createDefaultWinConditions();
  return template.gameRules;
}

export function createDefaultGameRules(
  gameMode: GameMode | undefined = DEFAULT_GAME_MODE,
  winConditionPreset: WinConditionPresetId = "classic",
): GameRules {
  if (gameMode === "SingleHero") {
    return {
      heroCountMin: 1,
      heroCountMax: 1,
      heroCountIncrement: 1,
      heroHireBan: true,
      encounterHoles: false,
      bonuses: [],
      winConditions: createDefaultWinConditions({ lostStartHero: true }, winConditionPreset),
    };
  }
  return {
    heroCountMin: DEFAULT_HERO_COUNT_MIN,
    heroCountMax: DEFAULT_HERO_COUNT_MAX,
    heroCountIncrement: DEFAULT_HERO_COUNT_INCREMENT,
    heroHireBan: false,
    encounterHoles: true,
    tournamentRules: false,
    bonuses: [],
    winConditions: createDefaultWinConditions({}, winConditionPreset),
  };
}

export function createDefaultWinConditions(
  overrides: Partial<WinConditions> = {},
  preset: WinConditionPresetId = "classic",
): WinConditions {
  return createWinConditionsFromPreset(preset, overrides);
}

export function createDefaultOrientation(): Orientation {
  return {
    mode: "MinimalBoundingSquare",
    baseAngleMin: 0,
    baseAngleMax: 360,
    randomAngleAmplitude: 45,
    randomAngleStep: 90,
  };
}

export function createDefaultBorder(): Border {
  return {
    cornerRadius: 0,
    obstaclesWidth: 3,
    obstaclesNoise: [{ amp: 1, freq: 12 }],
    waterWidth: 0,
    waterNoise: [{ amp: 1, freq: 12 }],
    waterType: "water grass",
  };
}
