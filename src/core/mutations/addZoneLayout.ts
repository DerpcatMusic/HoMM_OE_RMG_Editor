import type { RmgTemplate, ZoneLayoutConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddZoneLayoutInput extends TemplateMutationInput {
  layout: ZoneLayoutConfig | { name: string };
  insertIndex?: number;
}

export function addZoneLayout(input: AddZoneLayoutInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const layout = isCompleteLayout(input.layout) ? cloneLayout(input.layout) : createDefaultLayout(input.layout);
  const layoutName = layout.name;
  const layouts = template.zoneLayouts ?? [];
  template.zoneLayouts = layouts;

  if (!layoutName || !validateName(layoutName, `$.zoneLayouts[].name`, "zoneLayout", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = layouts.findIndex((item) => item.name === layoutName);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneLayout.duplicateName",
        `Another zone layout already uses the name '${layoutName}'.`,
        `$.zoneLayouts[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? layouts.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > layouts.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneLayout.insertIndexInvalid",
        `Zone layout insert index ${insertIndex} is outside 0..${layouts.length}.`,
        `$.zoneLayouts`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  layouts.splice(insertIndex, 0, layout);
  changes.push({
    path: `$.zoneLayouts[${insertIndex}]`,
    before: undefined,
    after: layout,
    reason: "zone layout added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isCompleteLayout(
  layout: ZoneLayoutConfig | { name: string },
): layout is ZoneLayoutConfig {
  return (
    "obstaclesFill" in layout ||
    "obstaclesFillVoid" in layout ||
    "lakesFill" in layout ||
    "minLakeArea" in layout ||
    "elevationClusterScale" in layout ||
    "elevationModes" in layout ||
    "roadClusterArea" in layout ||
    "guardedEncounterResourceFractions" in layout ||
    "ambientPickupDistribution" in layout
  );
}

function createDefaultLayout(
  options: { name: string },
): ZoneLayoutConfig {
  return {
    name: options.name,
  };
}

function cloneLayout(layout: ZoneLayoutConfig): ZoneLayoutConfig {
  return JSON.parse(JSON.stringify(layout)) as ZoneLayoutConfig;
}
