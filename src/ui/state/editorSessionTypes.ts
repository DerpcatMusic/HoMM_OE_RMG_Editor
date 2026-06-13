import type { TransactionHistory } from "../../core/mutations/transactionManager.js";
import type { ContentPoolConfig, ContentWeight, RmgTemplate } from "../../core/rmg/rmgTypes.js";
import type { WinConditionPresetId } from "../../core/rmg/winConditions.js";

export interface CanvasPosition {
  x: number;
  y: number;
}

export interface EditorLayoutState {
  canvasPositions: Record<string, CanvasPosition>;
  zoneObjectPositions: Record<string, Record<string, CanvasPosition>>;
}

export interface CoreArchiveRef {
  name: string;
  size: number;
  lastModified: number;
  catalogSummary?: CoreArchiveCatalogSummary;
  source?: "bundled" | "uploaded";
  contentPoolIndex?: Map<string, import("../../core/rmg/rmgTypes.js").ContentPoolConfig>;
  contentListIndex?: Map<string, import("../../core/rmg/rmgTypes.js").ContentList>;
}

export interface CoreArchiveCatalogSummary {
  contentPools: number;
  contentLists: number;
  factions: number;
  biomes: number;
  heroes: number;
  magics: number;
  units: number;
  rmgContent: number;
  biomeOptions: readonly CoreCatalogOption[];
  factionOptions: readonly CoreCatalogOption[];
  contentPoolOptions: readonly CoreCatalogOption[];
  guardedContentPoolOptions: readonly CoreCatalogOption[];
  unguardedContentPoolOptions: readonly CoreCatalogOption[];
  resourceContentPoolOptions: readonly CoreCatalogOption[];
  rmgContentOptions: readonly CoreCatalogOption[];
}

export interface CoreCatalogOption {
  id: string;
  label: string;
  category?: string;
  variantCount?: number;
  sourcePaths?: readonly string[];
}

export interface ZoneUpdateDraft {
  name: string;
  size: number;
  layout: string;
  zoneBiomeType: string;
  zoneBiomeArgs: readonly string[];
  contentBiomeType: string;
  contentBiomeArgs: readonly string[];
  metaObjectsBiomeType: string;
  metaObjectsBiomeArgs: readonly string[];
  crossroadsPosition: number | undefined;
  diplomacyModifier: number | undefined;
  guardCutoffValue: number | undefined;
  guardMultiplier: number | undefined;
  guardRandomization: number | undefined;
  guardWeeklyIncrement: number | undefined;
  guardReactionDistribution: readonly number[] | undefined;
  guardedContentValue: number | undefined;
  guardedContentValuePerArea: number | undefined;
  unguardedContentValue: number | undefined;
  unguardedContentValuePerArea: number | undefined;
  resourcesValue: number | undefined;
  resourcesValuePerArea: number | undefined;
  guardedPools: readonly string[];
  unguardedPools: readonly string[];
  resourcesPools: readonly string[];
  mandatoryContent: readonly string[];
  contentCountLimits: readonly string[];
}

export interface GlobalSettingsDraft {
  gameMode: string;
  sizeX: number;
  displayWinCondition: string;
  winConditionPreset?: WinConditionPresetId;
  sizeZ: number;
  heroCountMin: number;
  heroCountMax: number;
  heroCountIncrement: number;
  heroHireBan: boolean;
  encounterHoles: boolean;
  disableFactionLaws: boolean;
  disableMagicGuild: boolean;
  disableMagicCustomLearning: boolean;
  tournamentRules: boolean;
  factionLawsExpModifier: number | undefined;
  astrologyExpModifier: number | undefined;
  classic: boolean;
  desertion: boolean;
  desertionDay: number | undefined;
  desertionValue: number | undefined;
  heroLighting: boolean;
  heroLightingDay: number | undefined;
  lostStartCity: boolean;
  lostStartCityDay: number | undefined;
  lostStartHero: boolean;
  gladiatorArena: boolean;
  gladiatorArenaDaysDelayStart: number | undefined;
  gladiatorArenaCountDay: number | undefined;
  championSelectRule: string;
  cityHold: boolean;
  cityHoldDays: number | undefined;
  tournament: boolean;
  tournamentPointsToWin: number | undefined;
}

export interface ConnectionUpdateDraft {
  originalName: string;
  name: string;
  from: string;
  to: string;
  connectionType: string;
  length: number | undefined;
  portalFromEnabled: boolean;
  portalToEnabled: boolean;
  guardZone: string;
  guardValue: number | undefined;
  guardWeeklyIncrement: number | undefined;
  guardReaction: string;
  guardEscape: boolean;
  gatePlacement: string;
  road: boolean;
  simTurnSquad: boolean;
  guardRandomization: number | undefined;
}

export interface RoadUpdateDraft {
  roadIndex: number;
  type: string;
  from: {
    type: string;
    args: readonly string[];
  };
  to: {
    type: string;
    args: readonly string[];
  };
}

export interface MainObjectUpdateDraft {
  objectIndex: number;
  type: string;
  spawn: string;
  owner: string;
  isKeyObject: boolean;
  holdCityWinCon: boolean;
  placement: string;
  placementArgs: readonly string[];
  factionType: string;
  factionArgs: readonly string[];
  enableWeeklyUnitIncrement: boolean;
  initialUnitIncrement: number | undefined;
  guardChance: number | undefined;
  guardValue: number | undefined;
  guardWeeklyIncrement: number | undefined;
  guardRandomization: number | undefined;
  removeGuardIfHasOwner: boolean;
  buildingsConstructionSid: string;
  buildingsBanSid: string;
}

export interface MandatoryContentCreateDraft {
  sid: string;
  name: string;
  isMine?: boolean;
}

export interface ContentPoolCreateDraft {
  name: string;
  pool?: ContentPoolConfig;
}

export interface ContentPoolGroupCreateDraft {
  poolIndex: number;
}

export interface ContentPoolGroupUpdateDraft {
  poolIndex: number;
  groupIndex: number;
  weight: number | undefined;
  includeLists: readonly string[];
  content: readonly ContentWeight[];
}

export interface EditorSession {
  template: RmgTemplate;
  history: TransactionHistory;
  sourceFileName: string | undefined;
  coreArchive: CoreArchiveRef | undefined;
  dirty: boolean;
  lastMessage: string;
  lastActionFailed: boolean;
  selectedVariantIndex: number;
  selectedZoneName: string | undefined;
  selectedConnectionName: string | undefined;
  layoutStorageKey: string;
  canvasPositions: Record<string, CanvasPosition>;
  zoneObjectPositions: Record<string, Record<string, CanvasPosition>>;
  focusedPlayer: string | undefined;
}
