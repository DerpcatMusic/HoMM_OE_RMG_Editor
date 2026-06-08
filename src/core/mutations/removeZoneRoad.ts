import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordArrayRemove, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface RemoveZoneRoadInput extends VariantMutationInput {
  zone: ZoneSelector;
  roadIndex: number;
}

export function removeZoneRoad(input: RemoveZoneRoadInput): MutationResult<RmgTemplate> {
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

  const roads = selected.zone.roads ?? [];
  if (!Number.isInteger(input.roadIndex) || input.roadIndex < 0 || input.roadIndex >= roads.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.road.missing",
        `Road index ${input.roadIndex} does not exist.`,
        `${selected.path}.roads[${input.roadIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordArrayRemove(roads, input.roadIndex, `${selected.path}.roads[${input.roadIndex}]`, changes, "zone road removed");

  return buildMutationResult(template, changes, diagnostics);
}
