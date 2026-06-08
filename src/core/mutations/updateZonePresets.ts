import type { RmgTemplate, Zone } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordValueChange, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface SetZonePresetAlternativesInput extends VariantMutationInput {
  zone: ZoneSelector;
  presetIds: string[];
}

export type SetZoneMandatoryContentPresetsInput = SetZonePresetAlternativesInput;
export type SetZoneContentCountLimitPresetsInput = SetZonePresetAlternativesInput;

export function setZoneMandatoryContentPresets(
  input: SetZoneMandatoryContentPresetsInput,
): MutationResult<RmgTemplate> {
  return setZonePresetAlternatives({
    ...input,
    field: "mandatoryContent",
    rootPresets: input.template.mandatoryContent,
    label: "mandatory-content",
  });
}

export function setZoneContentCountLimitPresets(
  input: SetZoneContentCountLimitPresetsInput,
): MutationResult<RmgTemplate> {
  return setZonePresetAlternatives({
    ...input,
    field: "contentCountLimits",
    rootPresets: input.template.contentCountLimits,
    label: "content-count-limit",
  });
}

interface InternalSetZonePresetAlternativesInput extends SetZonePresetAlternativesInput {
  field: "mandatoryContent" | "contentCountLimits";
  rootPresets: Array<{ name?: string }> | undefined;
  label: string;
}

function setZonePresetAlternatives(input: InternalSetZonePresetAlternativesInput): MutationResult<RmgTemplate> {
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

  validatePresetIds(input.presetIds, input.rootPresets, input.label, `${selected.path}.${input.field}`, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  recordValueChange(
    selected.zone as Zone,
    input.field,
    `${selected.path}.${input.field}`,
    [...input.presetIds],
    changes,
    `zone ${input.label} preset alternatives`,
  );

  return buildMutationResult(template, changes, diagnostics);
}

function validatePresetIds(
  presetIds: string[],
  rootPresets: Array<{ name?: string }> | undefined,
  label: string,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (!Array.isArray(presetIds) || presetIds.some((item) => typeof item !== "string")) {
    diagnostics.push(diagnostic("error", `mutation.${label}.presetIdsInvalid`, `${label} preset IDs must be strings.`, path));
    return;
  }

  const seen = new Set<string>();
  presetIds.forEach((presetId, index) => {
    if (presetId.trim().length === 0) {
      diagnostics.push(diagnostic("error", `mutation.${label}.presetIdEmpty`, `${label} preset ID cannot be empty.`, `${path}[${index}]`));
    }
    if (seen.has(presetId)) {
      diagnostics.push(
        diagnostic("warning", `mutation.${label}.presetIdDuplicate`, `Duplicate ${label} preset alternative '${presetId}'.`, `${path}[${index}]`),
      );
    }
    seen.add(presetId);
  });

  const availableIds = new Set((rootPresets ?? []).map((preset) => preset.name).filter((name): name is string => Boolean(name)));
  presetIds.forEach((presetId, index) => {
    if (!availableIds.has(presetId)) {
      diagnostics.push(
        diagnostic("error", `mutation.${label}.presetMissing`, `${label} preset '${presetId}' does not exist.`, `${path}[${index}]`),
      );
    }
  });
}
