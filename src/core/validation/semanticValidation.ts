import { PLAYER_REFS } from "../rmg/enums.js";
import type { PlayerRef } from "../rmg/enums.js";
import { normalizeStringArray } from "../rmg/stringArrayCompat.js";
import type {
  MainObject,
  PlacementRule,
  RmgTemplate,
  RoadConfig,
  RoadTargetConfig,
  WinConditions,
  Zone,
} from "../rmg/rmgTypes.js";
import type { ResolvedTemplate, ResolvedVariant, ResolvedZone } from "../resolver/resolvedTypes.js";
import { diagnostic, type Diagnostic } from "./validationTypes.js";

export interface SemanticValidationOptions {
  warnEmptyZones?: boolean;
}

interface SpawnInfo {
  player: string;
  zoneName: string;
  zoneIndex: number;
  mainObjectIndex: number;
}

const PLAYER_REF_SET = new Set<string>(PLAYER_REFS);

export function validateSemanticPlayability(
  resolved: ResolvedTemplate,
  options: SemanticValidationOptions = {},
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const warnEmptyZones = options.warnEmptyZones ?? true;

  resolved.variants.forEach((variant) => {
    validateVariantSpawns(variant, resolved.sourcePath, diagnostics);
    validatePlayerCoverage(variant, resolved.sourcePath, diagnostics);
    validateConnectionReferenceIntegrity(variant, resolved.template, resolved.sourcePath, diagnostics);
    validateZoneBudgets(variant, resolved.sourcePath, diagnostics, warnEmptyZones);
    validateSpecialWinConditionStructure(variant, resolved.template.gameRules?.winConditions, resolved.template, resolved.sourcePath, diagnostics);
  });

  return diagnostics;
}

function validateVariantSpawns(variant: ResolvedVariant, sourcePath: string, diagnostics: Diagnostic[]): void {
  const spawns = collectSpawns(variant);
  const players = new Set(spawns.map((spawn) => spawn.player));
  const variantPath = `$.variants[${variant.index}]`;

  if (players.size < 2) {
    diagnostics.push(
      diagnostic(
        "error",
        "semantic.players.tooFew",
        `Variant must define at least two distinct player spawns; found ${players.size}.`,
        `${variantPath}.zones`,
        sourcePath,
      ),
    );
    return;
  }

  const graph = buildZoneGraph(variant);
  for (const spawn of spawns) {
    const incidentCount = graph.get(spawn.zoneName)?.size ?? 0;
    if (incidentCount === 0 && (variant.zones.length > 1 || spawns.length > 1)) {
      diagnostics.push(
        diagnostic(
          "error",
          "semantic.spawn.disconnected",
          `Spawn for ${spawn.player} is in zone '${spawn.zoneName}', which has no valid connections.`,
          `${variantPath}.zones[${spawn.zoneIndex}].mainObjects[${spawn.mainObjectIndex}]`,
          sourcePath,
        ),
      );
    }
  }

  const firstSpawn = spawns[0];
  if (!firstSpawn) {
    return;
  }
  const reachable = collectReachableZones(firstSpawn.zoneName, graph);
  for (const spawn of spawns.slice(1)) {
    if (!reachable.has(spawn.zoneName)) {
      diagnostics.push(
        diagnostic(
          "error",
          "semantic.spawn.componentDisconnected",
          `Spawn zone '${spawn.zoneName}' is not connected to spawn zone '${firstSpawn.zoneName}'.`,
          `${variantPath}.zones[${spawn.zoneIndex}]`,
          sourcePath,
        ),
      );
    }
  }
}

function validatePlayerCoverage(variant: ResolvedVariant, sourcePath: string, diagnostics: Diagnostic[]): void {
  const variantPath = `$.variants[${variant.index}]`;
  let maxPlayerIndex = 0;
  for (const zone of variant.zones) {
    for (const mo of zone.zone.mainObjects ?? []) {
      if (mo.spawn && PLAYER_REF_SET.has(mo.spawn)) {
        const idx = PLAYER_REFS.indexOf(mo.spawn as PlayerRef) + 1;
        if (idx > maxPlayerIndex) {
          maxPlayerIndex = idx;
        }
      }
    }
  }
  for (let i = 0; i < maxPlayerIndex; i += 1) {
    const playerRef = PLAYER_REFS[i];
    const hasZone = variant.zones.some((zone) =>
      (zone.zone.mainObjects ?? []).some((mo) => mo.spawn === playerRef || mo.owner === playerRef),
    );
    if (!hasZone) {
      diagnostics.push(
        diagnostic(
          "error",
          "semantic.player.missingZone",
          `${playerRef} has no zone. Every player needs at least one zone.`,
          `${variantPath}.zones`,
          sourcePath,
        ),
      );
    }
  }
}

function validateConnectionReferenceIntegrity(
  variant: ResolvedVariant,
  template: RmgTemplate,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  const variantPath = `$.variants[${variant.index}]`;
  const connectionNames = new Set(
    (variant.variant.connections ?? []).map((connection) => connection.name).filter((name): name is string => Boolean(name)),
  );

  variant.zones.forEach((resolvedZone) => {
    const zone = resolvedZone.zone;
    const zonePath = `${variantPath}.zones[${resolvedZone.index}]`;
    (zone.roads ?? []).forEach((road, roadIndex) => {
      validateRoadTargetIntegrity(road, zone, variant, template, `${zonePath}.roads[${roadIndex}]`, sourcePath, diagnostics);
    });
    (zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      if (mainObject.placement === "Connection") {
        const connectionName = mainObject.placementArgs?.[0];
        if (!connectionName || !connectionNames.has(connectionName)) {
          diagnostics.push(
            diagnostic(
              "error",
              "semantic.mainObject.connectionPlacementMissing",
              `Main object is placed at missing connection '${connectionName ?? ""}'.`,
              `${zonePath}.mainObjects[${mainObjectIndex}].placementArgs`,
              sourcePath,
            ),
          );
        }
      }
    });
  });

  (variant.variant.connections ?? []).forEach((connection, connectionIndex) => {
    const connectionPath = `${variantPath}.connections[${connectionIndex}]`;
    validatePlacementRuleConnectionRefs(
      connection.portalPlacementRulesFrom,
      connectionNames,
      `${connectionPath}.portalPlacementRulesFrom`,
      sourcePath,
      diagnostics,
    );
    validatePlacementRuleConnectionRefs(
      connection.portalPlacementRulesTo,
      connectionNames,
      `${connectionPath}.portalPlacementRulesTo`,
      sourcePath,
      diagnostics,
    );
  });

  if ((template.variants?.length ?? 0) > 1) {
    return;
  }
  (template.mandatoryContent ?? []).forEach((preset, presetIndex) => {
    (preset.content ?? []).forEach((content, contentIndex) => {
      validatePlacementRuleConnectionRefs(
        content.rules,
        connectionNames,
        `$.mandatoryContent[${presetIndex}].content[${contentIndex}].rules`,
        sourcePath,
        diagnostics,
      );
    });
  });
}

function validateZoneBudgets(
  variant: ResolvedVariant,
  sourcePath: string,
  diagnostics: Diagnostic[],
  warnEmptyZones: boolean,
): void {
  const variantPath = `$.variants[${variant.index}]`;
  variant.zones.forEach((zone) => {
    const zonePath = `${variantPath}.zones[${zone.index}]`;
    validatePoolBudget("guarded", zone.zone.guardedContentValue, zone.zone.guardedContentValuePerArea, zone.guardedContentPools, `${zonePath}.guardedContentPool`, sourcePath, diagnostics);
    validatePoolBudget(
      "unguarded",
      zone.zone.unguardedContentValue,
      zone.zone.unguardedContentValuePerArea,
      zone.unguardedContentPools,
      `${zonePath}.unguardedContentPool`,
      sourcePath,
      diagnostics,
    );
    validatePoolBudget(
      "resources",
      zone.zone.resourcesValue,
      zone.zone.resourcesValuePerArea,
      zone.resourcesContentPools,
      `${zonePath}.resourcesContentPool`,
      sourcePath,
      diagnostics,
    );

    if (
      warnEmptyZones &&
      zoneHasNoContentBudget(zone.zone) &&
      (zone.zone.mainObjects?.length ?? 0) === 0 &&
      normalizeStringArray(zone.zone.mandatoryContent).length === 0
    ) {
      diagnostics.push(
        diagnostic(
          "warning",
          "semantic.zone.empty",
          `Zone '${zone.zone.name ?? zone.index}' has no main objects, mandatory content, or random-content budget.`,
          zonePath,
          sourcePath,
        ),
      );
    }
  });
}

function validateSpecialWinConditionStructure(
  variant: ResolvedVariant,
  winConditions: WinConditions | undefined,
  template: RmgTemplate,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (!winConditions) {
    return;
  }
  const variantPath = `$.variants[${variant.index}]`;
  const allMainObjects = variant.zones.flatMap((zone) => zone.zone.mainObjects ?? []);
  if (winConditions.cityHold && !allMainObjects.some((mainObject) => mainObject.holdCityWinCon === true)) {
    diagnostics.push(
      diagnostic(
        "error",
        "semantic.cityHold.targetMissing",
        "City Hold win condition requires at least one main object with holdCityWinCon: true.",
        `${variantPath}.zones`,
        sourcePath,
      ),
    );
  }

  const displaysFinalBattle = template.displayWinCondition === "win_condition_4" || template.displayWinCondition === "win_condition_7";
  if (displaysFinalBattle && !winConditions.gladiatorArena) {
    diagnostics.push(
      diagnostic(
        "warning",
        "semantic.finalBattle.flagMissing",
        "Final Battle display condition is selected, but gameRules.winConditions.gladiatorArena is not enabled.",
        "$.gameRules.winConditions.gladiatorArena",
        sourcePath,
      ),
    );
  }

  if (displaysFinalBattle || winConditions.gladiatorArena) {
    const hasGladiatorAnchor =
      (variant.variant.connections ?? []).some((connection) => connection.connectionType === "GladiatorArena") ||
      allMainObjects.some((mainObject) => mainObject.type === "GladiatorArena");
    if (!hasGladiatorAnchor) {
      diagnostics.push(
        diagnostic(
          "warning",
          "semantic.finalBattle.anchorMissing",
          "Final Battle/gladiator win setup has no GladiatorArena connection or main object in this variant.",
          variantPath,
          sourcePath,
        ),
      );
    }
  }
}

function validateRoadTargetIntegrity(
  road: RoadConfig,
  zone: Zone,
  variant: ResolvedVariant,
  template: RmgTemplate,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  validateRoadTarget(road.from, zone, variant, template, `${path}.from`, sourcePath, diagnostics);
  validateRoadTarget(road.to, zone, variant, template, `${path}.to`, sourcePath, diagnostics);
}

function validateRoadTarget(
  target: RoadTargetConfig | undefined,
  zone: Zone,
  variant: ResolvedVariant,
  template: RmgTemplate,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  if (!target) {
    return;
  }
  if (target.type === "Connection") {
    const connectionName = target.args?.[0];
    const matchingConnection = (variant.variant.connections ?? []).find((connection) => connection.name === connectionName);
    if (!connectionName || !matchingConnection) {
      diagnostics.push(
        diagnostic("error", "semantic.road.connectionMissing", `Road targets missing connection '${connectionName ?? ""}'.`, `${path}.args`, sourcePath),
      );
    } else if (matchingConnection.connectionType === "Proximity") {
      diagnostics.push(
        diagnostic("error", "semantic.road.proximityConnection", `Road targets Proximity connection '${connectionName}'.`, `${path}.args`, sourcePath),
      );
    } else if (zone.name && matchingConnection.from !== zone.name && matchingConnection.to !== zone.name) {
      diagnostics.push(
        diagnostic(
          "error",
          "semantic.road.connectionWrongZone",
          `Road targets connection '${connectionName}', which does not touch zone '${zone.name}'.`,
          `${path}.args`,
          sourcePath,
        ),
      );
    }
  }
  if (target.type === "MainObject") {
    const index = Number.parseInt(target.args?.[0] ?? "", 10);
    if (!Number.isInteger(index) || index < 0 || index >= (zone.mainObjects?.length ?? 0)) {
      diagnostics.push(
        diagnostic("error", "semantic.road.mainObjectMissing", `Road targets missing main object index '${target.args?.[0] ?? ""}'.`, `${path}.args`, sourcePath),
      );
    }
  }
  if (target.type === "MandatoryContent") {
    const contentName = target.args?.[0];
    const contentNames = collectMandatoryContentEntryNames(zone, template);
    if (!contentName || !contentNames.has(contentName)) {
      diagnostics.push(
        diagnostic(
          "error",
          "semantic.road.mandatoryContentMissing",
          `Road targets missing mandatory-content entry '${contentName ?? ""}'.`,
          `${path}.args`,
          sourcePath,
        ),
      );
    }
  }
}

function collectMandatoryContentEntryNames(zone: Zone, template: RmgTemplate): Set<string> {
  const result = new Set<string>();
  const presetIds = normalizeStringArray(zone.mandatoryContent);
  for (const presetId of presetIds) {
    const preset = (template.mandatoryContent ?? []).find((item) => item.name === presetId);
    for (const content of preset?.content ?? []) {
      if (content.name) {
        result.add(content.name);
      }
    }
  }
  return result;
}

function validatePlacementRuleConnectionRefs(
  rules: PlacementRule[] | undefined,
  connectionNames: Set<string>,
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  (rules ?? []).forEach((rule, index) => {
    if (rule.type !== "Connection") {
      return;
    }
    const connectionName = rule.args?.[0];
    if (!connectionName || !connectionNames.has(connectionName)) {
      diagnostics.push(
        diagnostic(
          "error",
          "semantic.placementRule.connectionMissing",
          `Placement rule targets missing connection '${connectionName ?? ""}'.`,
          `${path}[${index}].args`,
          sourcePath,
        ),
      );
    }
  });
}

function validatePoolBudget(
  label: string,
  flatBudget: number | undefined,
  areaBudget: number | undefined,
  pools: ResolvedZone["guardedContentPools"],
  path: string,
  sourcePath: string,
  diagnostics: Diagnostic[],
): void {
  const hasBudget = (flatBudget ?? 0) > 0 || (areaBudget ?? 0) > 0;
  if (!hasBudget) {
    return;
  }
  if (pools.length === 0 || pools.some((pool) => pool.source === "missing" || !pool.value)) {
    diagnostics.push(
      diagnostic(
        "error",
        `semantic.zone.${label}PoolMissing`,
        `Zone has ${label} content budget but not all ${label} content-pool alternatives resolve.`,
        path,
        sourcePath,
      ),
    );
  }
}

function collectSpawns(variant: ResolvedVariant): SpawnInfo[] {
  const spawns: SpawnInfo[] = [];
  variant.zones.forEach((resolvedZone) => {
    (resolvedZone.zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      if (!isPlayerSpawn(mainObject)) {
        return;
      }
      spawns.push({
        player: mainObject.spawn,
        zoneName: resolvedZone.zone.name ?? `#${resolvedZone.index}`,
        zoneIndex: resolvedZone.index,
        mainObjectIndex,
      });
    });
  });
  return spawns;
}

function isPlayerSpawn(mainObject: MainObject): mainObject is MainObject & { spawn: string } {
  return mainObject.type === "Spawn" && typeof mainObject.spawn === "string" && PLAYER_REF_SET.has(mainObject.spawn);
}

function buildZoneGraph(variant: ResolvedVariant): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  for (const resolvedZone of variant.zones) {
    if (resolvedZone.zone.name) {
      graph.set(resolvedZone.zone.name, new Set());
    }
  }
  for (const connection of variant.connections) {
    const from = connection.fromZone?.zone.name;
    const to = connection.toZone?.zone.name;
    if (!from || !to) {
      continue;
    }
    graph.get(from)?.add(to);
    graph.get(to)?.add(from);
  }
  return graph;
}

function collectReachableZones(start: string, graph: Map<string, Set<string>>): Set<string> {
  const reachable = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current)) {
      continue;
    }
    reachable.add(current);
    for (const next of graph.get(current) ?? []) {
      if (!reachable.has(next)) {
        queue.push(next);
      }
    }
  }
  return reachable;
}

function zoneHasNoContentBudget(zone: Zone): boolean {
  return [
    zone.guardedContentValue,
    zone.guardedContentValuePerArea,
    zone.unguardedContentValue,
    zone.unguardedContentValuePerArea,
    zone.resourcesValue,
    zone.resourcesValuePerArea,
  ].every((value) => (value ?? 0) <= 0);
}
