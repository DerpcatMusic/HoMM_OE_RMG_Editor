import type { PlacementRule, RmgTemplate, RoadConfig, RoadTargetConfig, Variant } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import {
  buildMutationResult,
  getVariant,
  recordArrayRemove,
  recordDelete,
  recordStringChange,
  selectConnection,
} from "./helpers.js";
import type { ConnectionSelector, MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface RemoveConnectionInput extends VariantMutationInput {
  connection: ConnectionSelector;
  cleanupReferences?: boolean;
}

export function removeConnection(input: RemoveConnectionInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cleanupReferences = input.cleanupReferences ?? true;
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selected = selectConnection(variantSelection.variant, variantSelection.path, input.connection, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const connectionName = selected.connection.name;
  if (!connectionName) {
    diagnostics.push(diagnostic("error", "mutation.connection.oldNameMissing", "Selected connection has no name to remove.", `${selected.path}.name`));
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!cleanupReferences && connectionHasKnownReferences(template, variantSelection.variant, connectionName)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.referencesBlocked",
        `Connection '${connectionName}' is still referenced by roads, placements, or placement rules.`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordArrayRemove(
    variantSelection.variant.connections ?? [],
    selected.connectionIndex,
    selected.path,
    changes,
    "connection removed",
  );
  if (cleanupReferences) {
    cleanupDeletedConnectionReferences(template, variantSelection.variant, variantSelection.path, connectionName, changes);
  }

  if ((template.variants?.length ?? 0) > 1 && changes.some((change) => change.path.startsWith("$.mandatoryContent"))) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.connection.globalMandatoryContentTouched",
        "Connection removal cleaned template-global mandatoryContent placement rules; review other variants before saving.",
        "$.mandatoryContent",
      ),
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}

function connectionHasKnownReferences(template: RmgTemplate, variant: Variant, connectionName: string): boolean {
  return (
    (variant.zones ?? []).some((zone) =>
      (zone.roads ?? []).some((road) => isConnectionRoadTarget(road.from, connectionName) || isConnectionRoadTarget(road.to, connectionName)) ||
      (zone.mainObjects ?? []).some((mainObject) => mainObject.placement === "Connection" && mainObject.placementArgs?.[0] === connectionName),
    ) ||
    (variant.connections ?? []).some(
      (connection) =>
        placementRulesTargetConnection(connection.portalPlacementRulesFrom, connectionName) ||
        placementRulesTargetConnection(connection.portalPlacementRulesTo, connectionName),
    ) ||
    (template.mandatoryContent ?? []).some((preset) =>
      (preset.content ?? []).some((content) => placementRulesTargetConnection(content.rules, connectionName)),
    )
  );
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

function removeRoadsTargetingConnection(
  roads: RoadConfig[] | undefined,
  path: string,
  connectionName: string,
  changes: MutationChange[],
): void {
  if (!roads) {
    return;
  }
  for (let index = roads.length - 1; index >= 0; index -= 1) {
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
  for (let index = rules.length - 1; index >= 0; index -= 1) {
    const rule = rules[index];
    if (rule?.type === "Connection" && rule.args?.[0] === connectionName) {
      recordArrayRemove(rules, index, `${path}[${index}]`, changes, "placement rule targeting deleted connection removed");
    }
  }
}

function placementRulesTargetConnection(rules: PlacementRule[] | undefined, connectionName: string): boolean {
  return (rules ?? []).some((rule) => rule.type === "Connection" && rule.args?.[0] === connectionName);
}

function isConnectionRoadTarget(target: RoadTargetConfig | undefined, connectionName: string): boolean {
  return target?.type === "Connection" && target.args?.[0] === connectionName;
}
