import type { ContentCountLimit, ContentCountLimitPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddContentCountLimitPresetInput extends TemplateMutationInput {
  preset: { name: string; limits?: ContentCountLimit[] };
  insertIndex?: number;
}

export function addContentCountLimitPreset(input: AddContentCountLimitPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  if (!validateName(input.preset.name, `$.contentCountLimits[].name`, "contentCountLimitPreset", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  template.contentCountLimits ??= [];
  const presets = template.contentCountLimits;

  const duplicateIndex = presets.findIndex((preset) => preset.name === input.preset.name);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentCountLimitPreset.duplicateName",
        `Another content-count-limit preset already uses the name '${input.preset.name}'.`,
        `$.contentCountLimits[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? presets.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > presets.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentCountLimitPreset.insertIndexInvalid",
        `Content-count-limit preset insert index ${insertIndex} is outside 0..${presets.length}.`,
        `$.contentCountLimits`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const newPreset: ContentCountLimitPreset = JSON.parse(JSON.stringify(input.preset)) as ContentCountLimitPreset;
  presets.splice(insertIndex, 0, newPreset);
  changes.push({
    path: `$.contentCountLimits[${insertIndex}]`,
    before: undefined,
    after: newPreset,
    reason: "content-count-limit preset added",
  });

  return buildMutationResult(template, changes, diagnostics);
}
