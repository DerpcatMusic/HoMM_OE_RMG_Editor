import type { MandatoryContent, MandatoryContentPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddMandatoryContentPresetInput extends TemplateMutationInput {
  preset: { name: string; content?: MandatoryContent[] };
  insertIndex?: number;
}

export function addMandatoryContentPreset(input: AddMandatoryContentPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  if (!validateName(input.preset.name, `$.mandatoryContent[].name`, "mandatoryContentPreset", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  template.mandatoryContent ??= [];
  const presets = template.mandatoryContent;

  const duplicateIndex = presets.findIndex((preset) => preset.name === input.preset.name);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.duplicateName",
        `Another mandatory-content preset already uses the name '${input.preset.name}'.`,
        `$.mandatoryContent[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? presets.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > presets.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.insertIndexInvalid",
        `Mandatory-content preset insert index ${insertIndex} is outside 0..${presets.length}.`,
        `$.mandatoryContent`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const newPreset: MandatoryContentPreset = JSON.parse(JSON.stringify(input.preset)) as MandatoryContentPreset;
  presets.splice(insertIndex, 0, newPreset);
  changes.push({
    path: `$.mandatoryContent[${insertIndex}]`,
    before: undefined,
    after: newPreset,
    reason: "mandatory-content preset added",
  });

  return buildMutationResult(template, changes, diagnostics);
}
