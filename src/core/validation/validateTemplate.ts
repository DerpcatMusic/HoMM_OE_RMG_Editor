import type { GameDataIndex } from "../game-data/gameDataIndex.js";
import {
  BIOME_RULE_TYPES,
  CONNECTION_TYPES,
  FACTION_RULE_TYPES,
  GAME_MODES,
  GATE_PLACEMENTS,
  GUARD_REACTIONS,
  isEnumValue,
  MAIN_OBJECT_PLACEMENTS,
  MAIN_OBJECT_TYPES,
  PLACEMENT_RULE_TYPES,
  ROAD_TARGET_TYPES,
  ROAD_TYPES,
} from "../rmg/enums.js";
import type {
  BiomeRule,
  Connection,
  ContentCountLimit,
  ContentPoolConfig,
  FactionRule,
  GameRules,
  MainObject,
  PlacementRule,
  RmgTemplate,
  RoadConfig,
  RoadTargetConfig,
  ValueDistributionConfig,
  Zone,
} from "../rmg/rmgTypes.js";
import { isStringArrayCompatible } from "../rmg/stringArrayCompat.js";
import type { ResolvedTemplate } from "../resolver/resolvedTypes.js";
import { diagnostic, type Diagnostic } from "./validationTypes.js";

export function collectResolvedDiagnostics(resolved: ResolvedTemplate): Diagnostic[] {
  return [
    ...resolved.diagnostics,
    ...resolved.variants.flatMap((variant) => [
      ...variant.diagnostics,
      ...variant.zones.flatMap((zone) => zone.diagnostics),
      ...variant.connections.flatMap((connection) => connection.diagnostics),
    ]),
  ];
}

export function validateResolvedTemplate(resolved: ResolvedTemplate, gameData: GameDataIndex): Diagnostic[] {
  return [
    ...collectResolvedDiagnostics(resolved),
    ...validateTemplateShape(resolved.template, resolved.sourcePath),
    ...validateTemplateLocalContentPools(resolved.template, gameData, resolved.sourcePath),
  ];
}

export function validateGameDataIndex(gameData: GameDataIndex): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  for (const duplicate of [
    ...gameData.contentPools.duplicates.map((item) => ({ ...item, kind: "contentPool" })),
    ...gameData.contentLists.duplicates.map((item) => ({ ...item, kind: "contentList" })),
    ...gameData.zoneLayouts.duplicates.map((item) => ({ ...item, kind: "zoneLayout" })),
  ]) {
    diagnostics.push(
      diagnostic(
        "warning",
        `${duplicate.kind}.duplicate`,
        `Duplicate ${duplicate.kind} name '${duplicate.name}'. First definition wins.`,
        duplicate.name,
        duplicate.duplicateSourcePath,
      ),
    );
  }

  for (const entry of gameData.contentPools.byName.values()) {
    validateContentPool(entry.value, entry.sourcePath, diagnostics);
    validatePoolIncludeLists(entry.value, gameData, [], entry.sourcePath, diagnostics);
  }

  return diagnostics;
}

export function validateTemplateShape(template: RmgTemplate, sourcePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  if (!template.name) {
    diagnostics.push(diagnostic("warning", "template.name.missing", "Template has no name.", "$.name", sourcePath));
  }
  if (template.gameMode !== undefined && !isEnumValue(GAME_MODES, template.gameMode)) {
    diagnostics.push(diagnostic("error", "template.gameMode.invalid", `Invalid game mode '${template.gameMode}'.`, "$.gameMode", sourcePath));
  }
  validateGameRules(template.gameRules, "$.gameRules", sourcePath, diagnostics);
  if (!Array.isArray(template.variants)) {
    diagnostics.push(diagnostic("error", "template.variants.notArray", "Template variants must be an array.", "$.variants", sourcePath));
    return diagnostics;
  }

  template.variants.forEach((variant, variantIndex) => {
    const variantPath = `$.variants[${variantIndex}]`;
    if (!Array.isArray(variant.zones)) {
      diagnostics.push(diagnostic("error", "variant.zones.notArray", "Variant zones must be an array.", `${variantPath}.zones`, sourcePath));
    }
    if (!Array.isArray(variant.connections)) {
      diagnostics.push(
        diagnostic("error", "variant.connections.notArray", "Variant connections must be an array.", `${variantPath}.connections`, sourcePath),
      );
    }

    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      diagnostics.push(...validateZoneShape(zone, `${variantPath}.zones[${zoneIndex}]`, sourcePath));
    });

    (variant.connections ?? []).forEach((connection, connectionIndex) => {
      diagnostics.push(...validateConnectionShape(connection, `${variantPath}.connections[${connectionIndex}]`, sourcePath));
    });
  });

  validatePresetNames(template.mandatoryContent, "$.mandatoryContent", "mandatoryContent", sourcePath, diagnostics);
  validatePresetNames(template.contentCountLimits, "$.contentCountLimits", "contentCountLimits", sourcePath, diagnostics);
  validatePresetNames(template.contentPools, "$.contentPools", "contentPools", sourcePath, diagnostics);
  validatePresetNames(template.contentLists, "$.contentLists", "contentLists", sourcePath, diagnostics);

  return diagnostics;
}

function validateGameRules(gameRules: GameRules | undefined, path: string, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!gameRules) {
    return;
  }
  validateNonNegativeInteger(gameRules.heroCountMin, `${path}.heroCountMin`, "heroCountMin", sourcePath, diagnostics);
  validateNonNegativeInteger(gameRules.heroCountMax, `${path}.heroCountMax`, "heroCountMax", sourcePath, diagnostics);
  validateNonNegativeInteger(gameRules.heroCountIncrement, `${path}.heroCountIncrement`, "heroCountIncrement", sourcePath, diagnostics);
  if (
    gameRules.heroCountMin !== undefined &&
    gameRules.heroCountMax !== undefined &&
    gameRules.heroCountMin > gameRules.heroCountMax
  ) {
    diagnostics.push(diagnostic("error", "gameRules.heroCount.range", "heroCountMin cannot be greater than heroCountMax.", path, sourcePath));
  }
}

function validateZoneShape(zone: Zone, path: string, sourcePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!zone.name) {
    diagnostics.push(diagnostic("error", "zone.name.missing", "Zone must have a name.", `${path}.name`, sourcePath));
  }
  validateRequiredStringArray(zone.guardedContentPool, `${path}.guardedContentPool`, sourcePath, diagnostics);
  validateRequiredStringArray(zone.unguardedContentPool, `${path}.unguardedContentPool`, sourcePath, diagnostics);
  validateRequiredStringArray(zone.resourcesContentPool, `${path}.resourcesContentPool`, sourcePath, diagnostics);
  validateStringArray(zone.mandatoryContent, `${path}.mandatoryContent`, sourcePath, diagnostics);
  validateStringArray(zone.contentCountLimits, `${path}.contentCountLimits`, sourcePath, diagnostics);

  validateBiomeRule(zone.zoneBiome, `${path}.zoneBiome`, sourcePath, diagnostics);
  validateBiomeRule(zone.contentBiome, `${path}.contentBiome`, sourcePath, diagnostics);
  validateBiomeRule(zone.metaObjectsBiome, `${path}.metaObjectsBiome`, sourcePath, diagnostics);
  validateGuardReactionDistribution(zone.guardReactionDistribution, `${path}.guardReactionDistribution`, sourcePath, diagnostics);

  (zone.mainObjects ?? []).forEach((mainObject, index) => {
    diagnostics.push(...validateMainObject(mainObject, `${path}.mainObjects[${index}]`, sourcePath));
  });
  (zone.roads ?? []).forEach((road, index) => {
    diagnostics.push(...validateRoad(road, `${path}.roads[${index}]`, sourcePath));
  });

  return diagnostics;
}

function validateConnectionShape(connection: Connection, path: string, sourcePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (connection.connectionType !== undefined && !isEnumValue(CONNECTION_TYPES, connection.connectionType)) {
    diagnostics.push(
      diagnostic("error", "connection.connectionType.invalid", `Invalid connection type '${connection.connectionType}'.`, `${path}.connectionType`, sourcePath),
    );
  }
  if (connection.guardReaction !== undefined && !isEnumValue(GUARD_REACTIONS, connection.guardReaction)) {
    diagnostics.push(
      diagnostic("error", "connection.guardReaction.invalid", `Invalid guard reaction '${connection.guardReaction}'.`, `${path}.guardReaction`, sourcePath),
    );
  }
  if (connection.gatePlacement !== undefined && !isEnumValue(GATE_PLACEMENTS, connection.gatePlacement)) {
    diagnostics.push(
      diagnostic("error", "connection.gatePlacement.invalid", `Invalid gate placement '${connection.gatePlacement}'.`, `${path}.gatePlacement`, sourcePath),
    );
  }
  validatePlacementRules(connection.portalPlacementRulesFrom, `${path}.portalPlacementRulesFrom`, sourcePath, diagnostics);
  validatePlacementRules(connection.portalPlacementRulesTo, `${path}.portalPlacementRulesTo`, sourcePath, diagnostics);
  validateStringArray(connection.gatePlacementArgs, `${path}.gatePlacementArgs`, sourcePath, diagnostics);
  validateNonNegativeNumberShape(connection.length, `${path}.length`, "length", sourcePath, diagnostics);
  validateOptionalBoolean(connection.portalFromEnabled, `${path}.portalFromEnabled`, "portalFromEnabled", sourcePath, diagnostics);
  validateOptionalBoolean(connection.portalToEnabled, `${path}.portalToEnabled`, "portalToEnabled", sourcePath, diagnostics);
  validateIntegerShape(connection.guardValue, `${path}.guardValue`, "guardValue", sourcePath, diagnostics);
  validateNonNegativeNumberShape(connection.guardWeeklyIncrement, `${path}.guardWeeklyIncrement`, "guardWeeklyIncrement", sourcePath, diagnostics);
  validateOptionalBoolean(connection.guardEscape, `${path}.guardEscape`, "guardEscape", sourcePath, diagnostics);
  validateOptionalBoolean(connection.road, `${path}.road`, "road", sourcePath, diagnostics);
  validateOptionalBoolean(connection.simTurnSquad, `${path}.simTurnSquad`, "simTurnSquad", sourcePath, diagnostics);
  validateNonNegativeNumberShape(connection.guardRandomization, `${path}.guardRandomization`, "guardRandomization", sourcePath, diagnostics);
  return diagnostics;
}

function validateMainObject(mainObject: MainObject, path: string, sourcePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if ("factions" in mainObject) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mainObject.factions.unknown",
        "MainObject uses 'factions', but the C# RMG model uses singular 'faction'. Preserve it for round-trip, but do not rely on it for generation.",
        `${path}.factions`,
        sourcePath,
      ),
    );
  }
  if (mainObject.type !== undefined && !isEnumValue(MAIN_OBJECT_TYPES, mainObject.type)) {
    diagnostics.push(diagnostic("error", "mainObject.type.invalid", `Invalid main object type '${mainObject.type}'.`, `${path}.type`, sourcePath));
  }
  if (mainObject.placement !== undefined && !isEnumValue(MAIN_OBJECT_PLACEMENTS, mainObject.placement)) {
    diagnostics.push(
      diagnostic("error", "mainObject.placement.invalid", `Invalid main object placement '${mainObject.placement}'.`, `${path}.placement`, sourcePath),
    );
  }
  validateFactionRule(mainObject.faction, `${path}.faction`, sourcePath, diagnostics);
  validateStringArray(mainObject.placementArgs, `${path}.placementArgs`, sourcePath, diagnostics);
  return diagnostics;
}

function validateRoad(road: RoadConfig, path: string, sourcePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (road.type !== undefined && !isEnumValue(ROAD_TYPES, road.type)) {
    diagnostics.push(diagnostic("error", "road.type.invalid", `Invalid road type '${road.type}'.`, `${path}.type`, sourcePath));
  }
  validateRoadTarget(road.from, `${path}.from`, sourcePath, diagnostics);
  validateRoadTarget(road.to, `${path}.to`, sourcePath, diagnostics);
  return diagnostics;
}

function validateRoadTarget(target: RoadTargetConfig | undefined, path: string, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!target) {
    return;
  }
  if (target.type !== undefined && !isEnumValue(ROAD_TARGET_TYPES, target.type)) {
    diagnostics.push(diagnostic("error", "roadTarget.type.invalid", `Invalid road target type '${target.type}'.`, `${path}.type`, sourcePath));
  }
  validateStringArray(target.args, `${path}.args`, sourcePath, diagnostics);
}

function validateFactionRule(rule: FactionRule | undefined, path: string, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!rule) {
    return;
  }
  if (rule.type !== undefined && !isEnumValue(FACTION_RULE_TYPES, rule.type)) {
    diagnostics.push(diagnostic("error", "factionRule.type.invalid", `Invalid faction rule type '${rule.type}'.`, `${path}.type`, sourcePath));
  }
  validateStringArray(rule.args, `${path}.args`, sourcePath, diagnostics);
}

function validateBiomeRule(rule: BiomeRule | undefined, path: string, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!rule) {
    return;
  }
  if (rule.type !== undefined && !isEnumValue(BIOME_RULE_TYPES, rule.type)) {
    diagnostics.push(diagnostic("error", "biomeRule.type.invalid", `Invalid biome rule type '${rule.type}'.`, `${path}.type`, sourcePath));
  }
  validateStringArray(rule.args, `${path}.args`, sourcePath, diagnostics);
}

function validatePlacementRules(
  rules: PlacementRule[] | undefined,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (!rules) {
    return;
  }
  if (!Array.isArray(rules)) {
    diagnostics.push(diagnostic("error", "placementRules.notArray", "Placement rules must be an array.", path, sourcePath));
    return;
  }
  rules.forEach((rule, index) => {
    if (rule.type !== undefined && !isEnumValue(PLACEMENT_RULE_TYPES, rule.type)) {
      diagnostics.push(
        diagnostic("error", "placementRule.type.invalid", `Invalid placement rule type '${rule.type}'.`, `${path}[${index}].type`, sourcePath),
      );
    }
    validateStringArray(rule.args, `${path}[${index}].args`, sourcePath, diagnostics);
  });
}

function validateStringArray(value: unknown, path: string, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!isStringArrayCompatible(value)) {
    diagnostics.push(diagnostic("warning", "schema.stringArray.invalid", "Expected an array of strings.", path, sourcePath));
  }
}

function validateRequiredStringArray(value: unknown, path: string, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    diagnostics.push(diagnostic("error", "schema.requiredStringArray.invalid", "Expected a non-empty array of strings.", path, sourcePath));
    return;
  }
  if (value.length === 0) {
    diagnostics.push(diagnostic("error", "schema.requiredStringArray.empty", "Expected a non-empty array of strings.", path, sourcePath));
  }
}

function validateOptionalBoolean(
  value: unknown,
  path: string,
  label: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (value !== undefined && typeof value !== "boolean") {
    diagnostics.push(diagnostic("error", `schema.${label}.booleanInvalid`, `${label} must be a boolean.`, path, sourcePath));
  }
}

function validateGuardReactionDistribution(
  value: unknown,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Array.isArray(value) || value.length !== 6 || value.some((item) => typeof item !== "number" || item < 0)) {
    diagnostics.push(
      diagnostic(
        "error",
        "zone.guardReactionDistribution.invalid",
        "guardReactionDistribution must contain exactly 6 non-negative numbers.",
        path,
        sourcePath,
      ),
    );
  }
}

function validateNonNegativeNumberShape(
  value: unknown,
  path: string,
  label: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value) || value < 0)) {
    diagnostics.push(diagnostic("error", `schema.${label}.numberInvalid`, `${label} must be a non-negative number.`, path, sourcePath));
  }
}

function validateIntegerShape(
  value: unknown,
  path: string,
  label: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (value !== undefined && !Number.isInteger(value)) {
    diagnostics.push(diagnostic("error", `schema.${label}.integerInvalid`, `${label} must be an integer.`, path, sourcePath));
  }
}

function validateNonNegativeInteger(
  value: unknown,
  path: string,
  label: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || (value as number) < 0) {
    diagnostics.push(diagnostic("error", `gameRules.${label}.invalid`, `${label} must be a non-negative integer.`, path, sourcePath));
  }
}

function validatePositiveInteger(
  value: unknown,
  path: string,
  label: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (value === undefined) {
    return;
  }
  if (!Number.isInteger(value) || (value as number) <= 0) {
    diagnostics.push(diagnostic("error", `gameRules.${label}.invalid`, `${label} must be a positive integer.`, path, sourcePath));
  }
}

function validatePresetNames(
  items: Array<{ name?: string }> | undefined,
  path: string,
  label: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  const seen = new Set<string>();
  (items ?? []).forEach((item, index) => {
    if (!item.name) {
      diagnostics.push(diagnostic("warning", `${label}.name.missing`, `${label} entry has no name.`, `${path}[${index}].name`, sourcePath));
      return;
    }
    if (seen.has(item.name)) {
      diagnostics.push(diagnostic("warning", `${label}.name.duplicate`, `Duplicate ${label} name '${item.name}'.`, `${path}[${index}].name`, sourcePath));
    }
    seen.add(item.name);
  });
}

function validateTemplateLocalContentPools(template: RmgTemplate, gameData: GameDataIndex, sourcePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const localContentListIds = new Set((template.contentLists ?? []).map((list) => list.name).filter((name): name is string => Boolean(name)));

  (template.contentPools ?? []).forEach((pool) => {
    validateContentPool(pool, sourcePath, diagnostics);
    validatePoolIncludeLists(pool, gameData, [...localContentListIds], sourcePath, diagnostics);
  });

  return diagnostics;
}

function validatePoolIncludeLists(
  pool: ContentPoolConfig,
  gameData: GameDataIndex,
  localContentListIds: string[],
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  const local = new Set(localContentListIds);
  (pool.groups ?? []).forEach((group, groupIndex) => {
    (group.includeLists ?? []).forEach((listId, listIndex) => {
      const isLocal = local.has(listId);
      const isCore = gameData.contentLists.byName.has(listId);
      if (!isLocal && !isCore) {
        diagnostics.push(
          diagnostic(
            "error",
            "contentPool.includeList.unresolved",
            `Content list '${listId}' referenced by pool '${pool.name ?? ""}' does not resolve.`,
            `contentPools.${pool.name ?? "unknown"}.groups[${groupIndex}].includeLists[${listIndex}]`,
            sourcePath,
          ),
        );
      }
    });
  });
}

function validateContentPool(pool: ContentPoolConfig, sourcePath: string, diagnostics: Diagnostic[]): void {
  if (!pool.name) {
    diagnostics.push(diagnostic("warning", "contentPool.name.missing", "Content pool has no name.", "contentPools[].name", sourcePath));
  }
  validateValueDistribution(pool.valueDistribution, `contentPools.${pool.name ?? "unknown"}.valueDistribution`, sourcePath, diagnostics);
}

function validateValueDistribution(
  valueDistribution: ValueDistributionConfig | undefined,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (!valueDistribution) {
    return;
  }
  const priceBounds = valueDistribution.priceBounds ?? [];
  const weights = valueDistribution.weights ?? [];
  if (weights.length !== priceBounds.length + 1) {
    diagnostics.push(
      diagnostic(
        "error",
        "valueDistribution.bracketCount",
        `valueDistribution must have one more weight than price bound; got ${priceBounds.length} bounds and ${weights.length} weights.`,
        path,
        sourcePath,
      ),
    );
  }
  for (let i = 1; i < priceBounds.length; i++) {
    const previous = priceBounds[i - 1];
    const current = priceBounds[i];
    if (previous !== undefined && current !== undefined && current <= previous) {
      diagnostics.push(diagnostic("error", "valueDistribution.boundsOrder", "valueDistribution price bounds must be ascending.", path, sourcePath));
      break;
    }
  }
}

export function expandContentCountLimit(limit: ContentCountLimit, gameData: GameDataIndex): ContentCountLimit {
  if (!limit.includeLists?.length) {
    return limit;
  }
  const content = [...(limit.content ?? [])];
  for (const listId of limit.includeLists) {
    const list = gameData.contentLists.byName.get(listId)?.value;
    for (const item of list?.content ?? []) {
      content.push({
        ...(item.sid !== undefined ? { sid: item.sid } : {}),
        ...(item.variant !== undefined ? { variant: item.variant } : {}),
      });
    }
  }
  return { ...limit, content };
}
