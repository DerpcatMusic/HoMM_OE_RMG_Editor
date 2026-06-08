import type { RmgTemplate, Zone } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { createDefaultZone, type DefaultZoneOptions } from "./defaultObjects.js";
import { buildMutationResult, getVariant, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface AddZoneInput extends VariantMutationInput {
  zone: DefaultZoneOptions | Zone;
  insertIndex?: number;
}

export function addZone(input: AddZoneInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const zone = isCompleteZone(input.zone) ? cloneZone(input.zone) : createDefaultZone(input.zone);
  const zoneName = zone.name;
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
        "mutation.zone.duplicateName",
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
        "mutation.zone.insertIndexInvalid",
        `Zone insert index ${insertIndex} is outside 0..${zones.length}.`,
        `${variantSelection.path}.zones`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  zones.splice(insertIndex, 0, zone);
  changes.push({
    path: `${variantSelection.path}.zones[${insertIndex}]`,
    before: undefined,
    after: zone,
    reason: "zone added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isCompleteZone(zone: DefaultZoneOptions | Zone): zone is Zone {
  return "guardedContentPool" in zone || "mainObjects" in zone || "zoneBiome" in zone;
}

function cloneZone(zone: Zone): Zone {
  return JSON.parse(JSON.stringify(zone)) as Zone;
}
