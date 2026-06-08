import type { PlacementRule, RmgTemplate, RoadTargetConfig, Variant } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import {
  buildMutationResult,
  getVariant,
  recordStringChange,
  replaceArg,
  selectConnection,
  validateName,
} from "./helpers.js";
import type { ConnectionSelector, MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface RenameConnectionInput extends VariantMutationInput {
  connection: ConnectionSelector;
  newName: string;
}

export function renameConnection(input: RenameConnectionInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const selected = selectConnection(variantSelection.variant, variantSelection.path, input.connection, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!validateName(input.newName, `${selected.path}.name`, "connection", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const oldName = selected.connection.name;
  if (!oldName) {
    diagnostics.push(
      diagnostic("error", "mutation.connection.oldNameMissing", "Selected connection has no name to rename.", `${selected.path}.name`),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = (variantSelection.variant.connections ?? []).findIndex(
    (connection, index) => index !== selected.connectionIndex && connection.name === input.newName,
  );
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.duplicateName",
        `Another connection already uses the name '${input.newName}'.`,
        `${variantSelection.path}.connections[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(selected.connection, "name", `${selected.path}.name`, input.newName, changes, "connection declaration");
  rewriteConnectionReferences(template, variantSelection.variant, variantSelection.path, oldName, input.newName, changes);
  if ((template.variants?.length ?? 0) > 1 && changes.some((change) => change.path.startsWith("$.mandatoryContent"))) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.connection.globalMandatoryContentTouched",
        "Connection rename rewrote template-global mandatoryContent placement rules; review other variants before saving.",
        "$.mandatoryContent",
      ),
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}

function rewriteConnectionReferences(
  template: RmgTemplate,
  variant: Variant,
  variantPath: string,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (variant.zones ?? []).forEach((zone, zoneIndex) => {
    const zonePath = `${variantPath}.zones[${zoneIndex}]`;

    (zone.roads ?? []).forEach((road, roadIndex) => {
      rewriteRoadTarget(road.from, `${zonePath}.roads[${roadIndex}].from`, oldName, newName, changes);
      rewriteRoadTarget(road.to, `${zonePath}.roads[${roadIndex}].to`, oldName, newName, changes);
    });

    (zone.mainObjects ?? []).forEach((mainObject, mainObjectIndex) => {
      if (mainObject.placement === "Connection") {
        replaceArg(
          mainObject.placementArgs,
          0,
          oldName,
          newName,
          `${zonePath}.mainObjects[${mainObjectIndex}].placementArgs`,
          changes,
          "main object Connection placement reference",
        );
      }
    });
  });

  (variant.connections ?? []).forEach((connection, connectionIndex) => {
    const connectionPath = `${variantPath}.connections[${connectionIndex}]`;
    rewritePlacementRules(
      connection.portalPlacementRulesFrom,
      `${connectionPath}.portalPlacementRulesFrom`,
      oldName,
      newName,
      changes,
    );
    rewritePlacementRules(
      connection.portalPlacementRulesTo,
      `${connectionPath}.portalPlacementRulesTo`,
      oldName,
      newName,
      changes,
    );
  });

  (template.mandatoryContent ?? []).forEach((preset, presetIndex) => {
    (preset.content ?? []).forEach((content, contentIndex) => {
      rewritePlacementRules(
        content.rules,
        `$.mandatoryContent[${presetIndex}].content[${contentIndex}].rules`,
        oldName,
        newName,
        changes,
      );
    });
  });
}

function rewriteRoadTarget(
  target: RoadTargetConfig | undefined,
  path: string,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  if (target?.type !== "Connection") {
    return;
  }
  replaceArg(target.args, 0, oldName, newName, `${path}.args`, changes, "road Connection target reference");
}

function rewritePlacementRules(
  rules: PlacementRule[] | undefined,
  path: string,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (rules ?? []).forEach((rule, index) => {
    if (rule.type !== "Connection") {
      return;
    }
    replaceArg(rule.args, 0, oldName, newName, `${path}[${index}].args`, changes, "placement Connection reference");
  });
}
