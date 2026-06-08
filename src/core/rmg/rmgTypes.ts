import type {
  BiomeRuleType,
  ConnectionType,
  FactionRuleType,
  GatePlacement,
  GuardReaction,
  MainObjectPlacement,
  MainObjectType,
  PlacementRuleType,
  RoadTargetType,
  RoadType,
} from "./enums.js";

export interface UnknownFields {
  [key: string]: unknown;
}

export interface RmgTemplate extends UnknownFields {
  name?: string;
  description?: string;
  gameMode?: string;
  displayWinCondition?: string;
  sizeX?: number;
  sizeZ?: number;
  gameRules?: GameRules;
  globalBans?: GlobalBans;
  valueOverrides?: ContentValueOverride[];
  variants?: Variant[];
  zoneLayouts?: ZoneLayoutConfig[];
  mandatoryContent?: MandatoryContentPreset[];
  contentCountLimits?: ContentCountLimitPreset[];
  contentPools?: ContentPoolConfig[];
  contentLists?: ContentList[];
}

export interface Variant extends UnknownFields {
  orientation?: Orientation;
  border?: Border;
  river?: RiverSettings;
  zones?: Zone[];
  connections?: Connection[];
}

export interface Zone extends UnknownFields {
  name?: string;
  size?: number;
  layout?: string;
  mainObjects?: MainObject[];
  zoneBiome?: BiomeRule;
  contentBiome?: BiomeRule;
  metaObjectsBiome?: BiomeRule;
  crossroadsPosition?: number;
  guardedContentPool?: string[];
  unguardedContentPool?: string[];
  resourcesContentPool?: string[];
  contentCountLimits?: string[];
  guardedContentValue?: number;
  guardedContentValuePerArea?: number;
  unguardedContentValue?: number;
  unguardedContentValuePerArea?: number;
  resourcesValue?: number;
  resourcesValuePerArea?: number;
  randomHireEnableWeeklyUnitIncrement?: boolean[];
  randomHireInitialUnitIncrement?: number[];
  diplomacyModifier?: number;
  guardCutoffValue?: number;
  guardMultiplier?: number;
  guardRandomization?: number;
  guardWeeklyIncrement?: number;
  guardReactionDistribution?: number[];
  encounterHolesSettings?: UnknownFields;
  roads?: RoadConfig[];
  mandatoryContent?: string[];
}

export interface Connection extends UnknownFields {
  name?: string;
  from?: string;
  to?: string;
  connectionType?: ConnectionType | string;
  length?: number;
  portalFromEnabled?: boolean;
  portalToEnabled?: boolean;
  guardZone?: string;
  guardValue?: number;
  guardWeeklyIncrement?: number;
  guardReaction?: GuardReaction | string;
  guardEscape?: boolean;
  guardMatchGroup?: string;
  gatePlacement?: GatePlacement | string;
  gatePlacementArgs?: string[];
  portalPlacementRulesFrom?: PlacementRule[];
  portalPlacementRulesTo?: PlacementRule[];
  road?: boolean;
  simTurnSquad?: boolean;
  guardRandomization?: number;
}

export interface MainObject extends UnknownFields {
  type?: MainObjectType | string;
  spawn?: string;
  owner?: string;
  isKeyObject?: boolean;
  holdCityWinCon?: boolean;
  placement?: MainObjectPlacement | string;
  placementArgs?: string[];
  faction?: FactionRule;
  enableWeeklyUnitIncrement?: boolean;
  initialUnitIncrement?: number;
  guardChance?: number;
  guardValue?: number;
  guardWeeklyIncrement?: number;
  guardRandomization?: number;
  removeGuardIfHasOwner?: boolean;
  buildingsConstructionSid?: string;
  buildingsBanSid?: string;
}

export interface MandatoryContent extends UnknownFields {
  name?: string;
  includeLists?: string[];
  content?: ContentWeight[];
  sid?: string;
  variant?: number;
  rules?: PlacementRule[];
  designatedEncounter?: boolean;
  soloEncounter?: boolean;
  isGuarded?: boolean;
  isMine?: boolean;
  owner?: string;
}

export interface MandatoryContentPreset extends UnknownFields {
  name?: string;
  content?: MandatoryContent[];
}

export interface ContentCountLimitPreset extends UnknownFields {
  name?: string;
  limits?: ContentCountLimit[];
}

export interface GlobalBans extends UnknownFields {
  magics?: string[];
  items?: string[];
  skills?: string[];
  heroes?: string[];
  units?: string[];
}

export interface GameRules extends UnknownFields {
  heroCountMin?: number;
  heroCountMax?: number;
  heroCountIncrement?: number;
  heroHireBan?: boolean;
  encounterHoles?: boolean;
  disableFactionLaws?: boolean;
  disableMagicGuild?: boolean;
  disableMagicCustomLearning?: boolean;
  tournamentRules?: boolean;
  customAI?: string;
  factionLawsExpModifier?: number;
  astrologyExpModifier?: number;
  bonuses?: UnknownFields[];
  winConditions?: WinConditions;
}

export interface WinConditions extends UnknownFields {
  classic?: boolean;
  desertion?: boolean;
  heroLighting?: boolean;
  lostStartCity?: boolean;
  lostStartHero?: boolean;
  gladiatorArena?: boolean;
  cityHold?: boolean;
  tournament?: boolean;
  desertionDay?: number;
  desertionValue?: number;
  heroLightingDay?: number;
  lostStartCityDay?: number;
  gladiatorArenaRegistrationStartWork?: boolean;
  gladiatorArenaRegistrationStartFight?: boolean;
  gladiatorArenaDaysDelayStart?: number;
  gladiatorArenaCountDay?: number;
  championSelectRule?: string;
  cityHoldDays?: number;
  tournamentPointsToWin?: number;
  tournamentSaveArmy?: boolean;
  tournamentDays?: number[];
  tournamentAnnounceDays?: number[];
}

export interface ContentPoolConfig extends UnknownFields {
  name?: string;
  valueDistribution?: ValueDistributionConfig;
  groups?: ContentPoolGroup[];
  bans?: ContentID[];
}

export interface ContentPoolGroup extends UnknownFields {
  weight?: number;
  includeLists?: string[];
  content?: ContentWeight[];
}

export interface ContentList extends UnknownFields {
  name?: string;
  content?: ContentWeight[];
}

export interface ContentWeight extends UnknownFields {
  sid?: string;
  variant?: number;
  biome?: string;
  weight?: number;
}

export interface ContentID extends UnknownFields {
  sid?: string;
  variant?: number;
}

export interface ContentCountLimit extends UnknownFields {
  includeLists?: string[];
  content?: ContentID[];
  sid?: string;
  variant?: number;
  biome?: string;
  maxCount?: number;
}

export interface ContentValueOverride extends UnknownFields {
  sid?: string;
  variant?: number;
  goodsValue?: number;
  guardValue?: number;
  aiValue?: number;
}

export interface ValueDistributionConfig extends UnknownFields {
  priceBounds?: number[];
  weights?: number[];
}

export interface FactionRule extends UnknownFields {
  type?: FactionRuleType | string;
  args?: string[];
}

export interface BiomeRule extends UnknownFields {
  type?: BiomeRuleType | string;
  args?: string[];
}

export interface PlacementRule extends UnknownFields {
  type?: PlacementRuleType | string;
  args?: string[];
  target?: number;
  targetMin?: number;
  targetMax?: number;
  weight?: number;
}

export interface RoadConfig extends UnknownFields {
  type?: RoadType | string;
  from?: RoadTargetConfig;
  to?: RoadTargetConfig;
}

export interface RoadTargetConfig extends UnknownFields {
  type?: RoadTargetType | string;
  args?: string[];
}

export interface ZoneLayoutConfig extends UnknownFields {
  name?: string;
  obstaclesFill?: number;
  obstaclesFillVoid?: number;
  lakesFill?: number;
  minLakeArea?: number;
  elevationClusterScale?: number;
  elevationModes?: UnknownFields[];
  roadClusterArea?: number;
  guardedEncounterResourceFractions?: UnknownFields;
  ambientPickupDistribution?: UnknownFields;
}

export interface Orientation extends UnknownFields {
  mode?: string;
  zeroAngleZone?: string;
  baseAngleMin?: number;
  baseAngleMax?: number;
  randomAngleAmplitude?: number;
  randomAngleStep?: number;
}

export interface Border extends UnknownFields {
  cornerRadius?: number;
  obstaclesWidth?: number;
  obstaclesNoise?: NoiseMode[];
  waterWidth?: number;
  waterNoise?: NoiseMode[];
  waterType?: string;
}

export interface NoiseMode extends UnknownFields {
  amp?: number;
  freq?: number;
}

export interface RiverSettings extends UnknownFields {
  createRiverSystem?: boolean;
  tributarySpacing?: number;
}
