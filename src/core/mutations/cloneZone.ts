import type { RmgTemplate, Zone } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, selectZone, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface CloneZoneInput extends VariantMutationInput {
  zone: ZoneSelector;
  newName: string;
  insertIndex?: number;
}

export function cloneZone(input: CloneZoneInput): MutationResult<RmgTemplate> {
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

  const clonedZone = deepCloneZone(selected.zone);
  clonedZone.name = input.newName;

  const zoneName = clonedZone.name;
  const zones = variantSelection.variant.zones ?? [];
  variantSelection.variant.zones = zones;

  if (!zoneName || !validateName(zoneName, `${variantSelection.path}.zones[].name`, "zone", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = zones.findIndex((item) => item.name === zoneName);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.clone.duplicateName",
        `Another zone already uses the name '${zoneName}'.`,
        `${variantSelection.path}.zones[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? zones.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > zones.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.clone.insertIndexInvalid",
        `Zone insert index ${insertIndex} is outside 0..${zones.length}.`,
        `${variantSelection.path}.zones`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  zones.splice(insertIndex, 0, clonedZone);
  changes.push({
    path: `${variantSelection.path}.zones[${insertIndex}]`,
    before: undefined,
    after: clonedZone,
    reason: "zone cloned",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function deepCloneZone(zone: Zone): Zone {
  return JSON.parse(JSON.stringify(zone)) as Zone;
}
