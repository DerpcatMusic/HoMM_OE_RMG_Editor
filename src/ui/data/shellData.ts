import {
  EDITOR_SCHEMA_SECTIONS,
  listEditorFields,
  type EditorFieldEditLevel,
  type EditorFieldMetadata,
  type EditorSchemaSectionId,
} from "../../core/editor-schema/index.js";

export type GeneralNavItemId = "game" | "win" | "pools" | "mandatory" | "validation";

export interface GeneralNavItem {
  id: GeneralNavItemId;
  label: string;
  detail: string;
  icon: string;
  sectionId: EditorSchemaSectionId;
}

export interface ShellZoneItem {
  id: string;
  label: string;
  owner: string;
  role: "spawn" | "center" | "treasure" | "connector" | "neutral";
  index: number;
  x: number;
  y: number;
  size: number;
  layout: string;
  zoneBiome: ShellRuleItem;
  contentBiome: ShellRuleItem;
  metaObjectsBiome: ShellRuleItem;
  crossroadsPosition?: number;
  diplomacyModifier?: number;
  guardCutoffValue?: number;
  guardMultiplier?: number;
  guardRandomization?: number;
  guardWeeklyIncrement?: number;
  guardReactionDistribution: readonly number[];
  guardedContentValue?: number;
  guardedContentValuePerArea?: number;
  unguardedContentValue?: number;
  unguardedContentValuePerArea?: number;
  resourcesValue?: number;
  resourcesValuePerArea?: number;
  guardedPool: string;
  guardedPools: readonly string[];
  unguardedPools: readonly string[];
  resourcesPools: readonly string[];
  mandatoryContent: readonly string[];
  contentCountLimits: readonly string[];
  mainObjectCount: number;
  roadCount: number;
  zoneObjects: readonly ShellZoneObjectItem[];
  zoneRoads: readonly ShellZoneRoadItem[];
}
export interface ShellPlayerItem {
  id: string;
  label: string;
  color: string;
  zoneCount: number;
  zoneIds: readonly string[];
}

export const PLAYER_COLORS: Record<string, string> = {
  Player1: "#881a1a",
  Player2: "#25428e",
  Player3: "#905427",
  Player4: "#278224",
  Player5: "#52237b",
  Player6: "#1b6a64",
  Player7: "#958f24",
  Player8: "#8d335a",
};

export interface ShellRuleItem {
  type: string;
  args: readonly string[];
}

export interface ShellConnectionItem {
  id: string;
  label: string;
  index: number;
  from: string;
  to: string;
  type: string;
  length?: number;
  portalFromEnabled?: boolean;
  portalToEnabled?: boolean;
  guardZone?: string;
  guardValue?: number;
  guardWeeklyIncrement?: number;
  guardReaction?: string;
  guardEscape?: boolean;
  gatePlacement?: string;
  road?: boolean;
  simTurnSquad?: boolean;
  guardRandomization?: number;
}

export interface ShellZoneObjectItem {
  id: string;
  kind: "main" | "connection" | "crossroads" | "mandatory" | "roadTarget";
  index?: number;
  label: string;
  type: string;
  detail: string;
  x: number;
  y: number;
  spawn?: string;
  owner?: string;
  isKeyObject?: boolean;
  holdCityWinCon?: boolean;
  placement?: string;
  placementArgs: readonly string[];
  faction: ShellRuleItem;
  enableWeeklyUnitIncrement?: boolean;
  initialUnitIncrement?: number;
  guardChance?: number;
  guardValue?: number;
  guardWeeklyIncrement?: number;
  guardRandomization?: number;
  removeGuardIfHasOwner?: boolean;
  buildingsConstructionSid?: string;
  buildingsBanSid?: string;
  mandatoryEntryName?: string;
  mandatorySid?: string;
  mandatoryPresetNames?: readonly string[];
}

export interface ShellZoneRoadItem {
  id: string;
  label: string;
  index: number;
  type: string;
  fromId: string;
  toId: string;
  fromTarget: ShellRoadTargetItem;
  toTarget: ShellRoadTargetItem;
}

export interface ShellRoadTargetItem {
  type: string;
  args: readonly string[];
}

export interface ShellSectionSummary {
  id: EditorSchemaSectionId;
  label: string;
  description: string;
  totalFields: number;
  firstClassFields: number;
  advancedFields: number;
  compatibilityFields: number;
  preserveOnlyFields: number;
}

export interface ShellMetrics {
  sections: number;
  fields: number;
  firstClassFields: number;
  compatibilityFields: number;
}

export interface ShellCatalogOptions {
  biomes: readonly ShellCatalogOption[];
  factions: readonly ShellCatalogOption[];
  contentPools: readonly ShellCatalogOption[];
  guardedContentPools: readonly ShellCatalogOption[];
  unguardedContentPools: readonly ShellCatalogOption[];
  resourceContentPools: readonly ShellCatalogOption[];
  rmgContent: readonly ShellCatalogOption[];
}

export interface ShellCatalogOption {
  id: string;
  label: string;
  category?: string;
  variantCount?: number;
  sourcePaths?: readonly string[];
}

export const GENERAL_NAV_ITEMS: readonly GeneralNavItem[] = [
  { id: "game", label: "Game settings", sectionId: "gameRules", detail: "mode, heroes, bans", icon: "tune" },
  { id: "win", label: "Win conditions", sectionId: "winConditions", detail: "classic, arena, city hold", icon: "flag" },
  { id: "pools", label: "Content pools", sectionId: "contentPools", detail: "groups, lists, limits", icon: "database" },
  { id: "mandatory", label: "Mandatory content", sectionId: "mandatoryContent", detail: "required objects", icon: "rule" },
  { id: "validation", label: "Validation", sectionId: "compatibility", detail: "raw and compatibility", icon: "verified" },
] as const;

export function getShellSections(): ShellSectionSummary[] {
  return EDITOR_SCHEMA_SECTIONS.map((section) => {
    const fields = listEditorFields(section.id);
    return {
      id: section.id,
      label: section.label,
      description: section.description,
      totalFields: fields.length,
      firstClassFields: countByEditLevel(fields, "firstClass"),
      advancedFields: countByEditLevel(fields, "advanced"),
      compatibilityFields: countByEditLevel(fields, "compatibility"),
      preserveOnlyFields: countByEditLevel(fields, "preserveOnly"),
    };
  });
}

export function getGeneralNavItems(): readonly GeneralNavItem[] {
  return GENERAL_NAV_ITEMS;
}

export function getShellMetrics(): ShellMetrics {
  const fields = listEditorFields();
  return {
    sections: EDITOR_SCHEMA_SECTIONS.length,
    fields: fields.length,
    firstClassFields: countByEditLevel(fields, "firstClass"),
    compatibilityFields: countByEditLevel(fields, "compatibility") + countByEditLevel(fields, "preserveOnly"),
  };
}

export function getSectionFields(sectionId: EditorSchemaSectionId): readonly EditorFieldMetadata[] {
  return listEditorFields(sectionId);
}

function countByEditLevel(fields: readonly EditorFieldMetadata[], editLevel: EditorFieldEditLevel): number {
  return fields.filter((field) => field.editLevel === editLevel).length;
}
