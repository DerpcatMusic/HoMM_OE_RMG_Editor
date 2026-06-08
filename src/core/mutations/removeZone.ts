import type {
  BiomeRule,
  Connection,
  FactionRule,
  PlacementRule,
  RmgTemplate,
  RoadConfig,
  RoadTargetConfig,
  Variant,
} from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import {
  buildMutationResult,
  getVariant,
  recordArrayRemove,
  recordDelete,
  recordStringChange,
  selectZone,
} from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface RemoveZoneInput extends VariantMutationInput {
  zone: ZoneSelector;
  cascadeConnections?: boolean;
  cleanupReferences?: boolean;
}

export function removeZone(input: RemoveZoneInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cascadeConnections = input.cascadeConnections ?? true;
  const cleanupReferences = input.cleanupReferences ?? true;
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selected = selectZone(variantSelection.variant, variantSelection.path, input.zone, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const zoneName = selected.zone.name;
  if (!zoneName) {
    diagnostics.push(diagnostic("error", "mutation.zone.oldNameMissing", "Selected zone has no name to remove.", `${selected.path}.name`));
    return buildMutationResult(template, changes, diagnostics);
  }

  const connections = variantSelection.variant.connections ?? [];
  variantSelection.variant.connections = connections;
  const incidentConnectionIndexes = connections
    .map((connection, index) => ({ connection, index }))
    .filter(({ connection }) => connection.from === zoneName || connection.to === zoneName)
    .map(({ index }) => index);

  if (!cascadeConnections && incidentConnectionIndexes.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.hasIncidentConnections",
        `Zone '${zoneName}' has ${incidentConnectionIndexes.length} incident connection(s).`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const removedConnectionNames = removeIncidentConnections(
    connections,
    incidentConnectionIndexes,
    variantSelection.path,
    changes,
  );

  const zones = variantSelection.variant.zones ?? [];
  recordArrayRemove(zones, selected.zoneIndex, selected.path, changes, "zone removed");

  if (cleanupReferences) {
    cleanupDeletedZoneReferences(variantSelection.variant, variantSelection.path, zoneName, changes);
    for (const connectionName of removedConnectionNames) {
      cleanupDeletedConnectionReferences(template, variantSelection.variant, variantSelection.path, connectionName, changes);
    }
  }

  if ((template.variants?.length ?? 0) > 1 && changes.some((change) => change.path.startsWith("$.mandatoryContent"))) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.zone.globalMandatoryContentTouched",
        "Zone removal cleaned template-global mandatoryContent placement rules; review other variants before saving.",
        "$.mandatoryContent",
      ),
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}

function removeIncidentConnections(
  connections: Connection[],
  connectionIndexes: number[],
  variantPath: string,
  changes: MutationChange[],
): string[] {
  const removedNames: string[] = [];
  for (const connectionIndex of [...connectionIndexes].sort((a, b) => b - a)) {
    const connection = connections[connectionIndex];
    if (connection?.name) {
      removedNames.push(connection.name);
    }
    recordArrayRemove(
      connections,
      connectionIndex,
      `${variantPath}.connections[${connectionIndex}]`,
      changes,
      "incident connection removed with zone",
    );
  }
  return removedNames;
}

function cleanupDeletedZoneReferences(
  variant: Variant,
  variantPath: string,
  zoneName: string,
  changes: MutationChange[],
): void {
  if (variant.orientation?.zeroAngleZone === zoneName) {
    recordDelete(variant.orientation, "zeroAngleZone", `${variantPath}.orientation.zeroAngleZone`, changes, "deleted zone orientation anchor");
  }

  (variant.connections ?? []).forEach((connection, connectionIndex) => {
    const path = `${variantPath}.connections[${connectionIndex}]`;
    if (connection.guardZone === zoneName) {
      recordDelete(connection, "guardZone", `${path}.guardZone`, changes, "deleted zone guard reference");
    }
    if (connection.gatePlacement === "NearZone" && connection.gatePlacementArgs?.[0] === zoneName) {
      recordStringChange(connection, "gatePlacement", `${path}.gatePlacement`, "Random", changes, "deleted zone gate anchor");
      recordDelete(connection, "gatePlacementArgs", `${path}.gatePlacementArgs`, changes, "deleted zone gate anchor args");
    }
  });

  (variant.zones ?? []).forEach((zone, zoneIndex) => {
    const path = `${variantPath}.zones[${zoneIndex}]`;
    cleanupBiomeRule(zone.zoneBiome, `${path}.zoneBiome`, zoneName, changes);
    cleanupBiomeRule(zone.contentBiome, `${path}.contentBiome`, zoneName, changes);
    cleanupBiomeRule(zone.metaObjectsBiome, `${path}.metaObjectsBiome`, zoneName, changes);

    (zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      const mainObjectPath = `${path}.mainObjects[${mainObjectIndex}]`;
      if (mainObject.placement === "NearZone" && mainObject.placementArgs?.[0] === zoneName) {
        recordStringChange(mainObject, "placement", `${mainObjectPath}.placement`, "Uniform", changes, "deleted zone main-object anchor");
        recordDelete(mainObject, "placementArgs", `${mainObjectPath}.placementArgs`, changes, "deleted zone placement args");
      }
      cleanupFactionRule(mainObject.faction, `${mainObjectPath}.faction`, zoneName, changes);
    });
  });
}

function cleanupDeletedConnectionReferences(
  template: RmgTemplate,
  variant: Variant,
  variantPath: string,
  connectionName: string,
  changes: MutationChange[],
): void {
  (variant.zones ?? []).forEach((zone, zoneIndex) => {
    const zonePath = `${variantPath}.zones[${zoneIndex}]`;
    removeRoadsTargetingConnection(zone.roads, `${zonePath}.roads`, connectionName, changes);
    (zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      if (mainObject.placement === "Connection" && mainObject.placementArgs?.[0] === connectionName) {
        recordStringChange(
          mainObject,
          "placement",
          `${zonePath}.mainObjects[${mainObjectIndex}].placement`,
          "Uniform",
          changes,
          "deleted connection main-object anchor",
        );
        recordDelete(
          mainObject,
          "placementArgs",
          `${zonePath}.mainObjects[${mainObjectIndex}].placementArgs`,
          changes,
          "deleted connection placement args",
        );
      }
    });
  });

  (variant.connections ?? []).forEach((connection, connectionIndex) => {
    const connectionPath = `${variantPath}.connections[${connectionIndex}]`;
    removePlacementRulesTargetingConnection(
      connection.portalPlacementRulesFrom,
      `${connectionPath}.portalPlacementRulesFrom`,
      connectionName,
      changes,
    );
    removePlacementRulesTargetingConnection(
      connection.portalPlacementRulesTo,
      `${connectionPath}.portalPlacementRulesTo`,
      connectionName,
      changes,
    );
  });

  (template.mandatoryContent ?? []).forEach((preset, presetIndex) => {
    (preset.content ?? []).forEach((content, contentIndex) => {
      removePlacementRulesTargetingConnection(
        content.rules,
        `$.mandatoryContent[${presetIndex}].content[${contentIndex}].rules`,
        connectionName,
        changes,
      );
    });
  });
}

function cleanupBiomeRule(
  rule: BiomeRule | undefined,
  path: string,
  zoneName: string,
  changes: MutationChange[],
): void {
  if (!rule) {
    return;
  }
  if (rule.type === "MatchZone" && rule.args?.[0] === zoneName) {
    replaceRuleArgs(rule, path, [], changes, "deleted zone MatchZone reference");
  }
  if (rule.type === "MatchMainObject" && rule.args?.[1] === zoneName) {
    recordStringChange(rule, "type", `${path}.type`, "MatchZone", changes, "deleted zone MatchMainObject reference");
    replaceRuleArgs(rule, path, [], changes, "deleted zone MatchMainObject args");
  }
  if (rule.type === "FromList") {
    removeRuleArgs(rule.args, `${path}.args`, (arg) => isDifferentFromZoneArg(arg, zoneName, "biome"), changes, "deleted zone biome exclusion");
  }
}

function cleanupFactionRule(
  rule: FactionRule | undefined,
  path: string,
  zoneName: string,
  changes: MutationChange[],
): void {
  if (!rule) {
    return;
  }
  if (rule.type === "Match" && rule.args?.[1] === zoneName) {
    recordStringChange(rule, "type", `${path}.type`, "FromList", changes, "deleted zone faction Match reference");
    replaceRuleArgs(rule, path, [], changes, "deleted zone faction Match args");
  }
  if (rule.type === "FromList") {
    removeRuleArgs(rule.args, `${path}.args`, (arg) => isDifferentFromZoneArg(arg, zoneName, "faction"), changes, "deleted zone faction exclusion");
  }
}

function removeRoadsTargetingConnection(
  roads: RoadConfig[] | undefined,
  path: string,
  connectionName: string,
  changes: MutationChange[],
): void {
  if (!roads) {
    return;
  }
  for (let index = roads.length - 1; index >= 0; index--) {
    const road = roads[index];
    if (road && (isConnectionRoadTarget(road.from, connectionName) || isConnectionRoadTarget(road.to, connectionName))) {
      recordArrayRemove(roads, index, `${path}[${index}]`, changes, "road targeting deleted connection removed");
    }
  }
}

function removePlacementRulesTargetingConnection(
  rules: PlacementRule[] | undefined,
  path: string,
  connectionName: string,
  changes: MutationChange[],
): void {
  if (!rules) {
    return;
  }
  for (let index = rules.length - 1; index >= 0; index--) {
    const rule = rules[index];
    if (rule?.type === "Connection" && rule.args?.[0] === connectionName) {
      recordArrayRemove(rules, index, `${path}[${index}]`, changes, "placement rule targeting deleted connection removed");
    }
  }
}

function isConnectionRoadTarget(target: RoadTargetConfig | undefined, connectionName: string): boolean {
  return target?.type === "Connection" && target.args?.[0] === connectionName;
}

function replaceRuleArgs(
  rule: BiomeRule | FactionRule,
  path: string,
  args: string[],
  changes: MutationChange[],
  reason: string,
): void {
  const before = rule.args;
  rule.args = args;
  changes.push({ path: `${path}.args`, before, after: args, reason });
}

function removeRuleArgs(
  args: string[] | undefined,
  path: string,
  predicate: (arg: string) => boolean,
  changes: MutationChange[],
  reason: string,
): void {
  if (!args) {
    return;
  }
  for (let index = args.length - 1; index >= 0; index--) {
    const arg = args[index];
    if (arg !== undefined && predicate(arg)) {
      recordArrayRemove(args, index, `${path}[${index}]`, changes, reason);
    }
  }
}

function isDifferentFromZoneArg(arg: string, zoneName: string, mode: "biome" | "faction"): boolean {
  const parts = arg.trim().split(/\s+/u);
  if (parts.length < 2 || parts[0] !== "differentFrom:") {
    return false;
  }
  const zoneTokenIndex = mode === "faction" ? 2 : parts.length >= 3 ? 2 : 1;
  return parts[zoneTokenIndex] === zoneName;
}
