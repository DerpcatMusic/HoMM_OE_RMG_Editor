import type { RmgTemplate, RoadConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";
import { cloneRoad, validateRoadConfig } from "./roadHelpers.js";

export interface AddZoneRoadInput extends VariantMutationInput {
  zone: ZoneSelector;
  road: RoadConfig;
  insertIndex?: number;
}

export function addZoneRoad(input: AddZoneRoadInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selected = selectZone(variantSelection.variant, variantSelection.path, input.zone, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const road = cloneRoad(input.road);
  validateRoadConfig(road, { template, variant: variantSelection.variant, zone: selected.zone, zonePath: selected.path }, `${selected.path}.roads[]`, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const roads = selected.zone.roads ?? [];
  selected.zone.roads = roads;
  const insertIndex = input.insertIndex ?? roads.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > roads.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.road.insertIndexInvalid",
        `Road insert index ${insertIndex} is outside 0..${roads.length}.`,
        `${selected.path}.roads`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  roads.splice(insertIndex, 0, road);
  changes.push({ path: `${selected.path}.roads[${insertIndex}]`, before: undefined, after: road, reason: "zone road added" });

  return buildMutationResult(template, changes, diagnostics);
}
