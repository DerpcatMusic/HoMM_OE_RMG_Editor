import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordArrayRemove } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface RemoveValueOverrideInput extends TemplateMutationInput {
  index: number;
}

export function removeValueOverride(input: RemoveValueOverrideInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const overrides = template.valueOverrides ?? [];
  if (!Number.isInteger(input.index) || input.index < 0 || input.index >= overrides.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.valueOverride.missing",
        `Value override index ${input.index} does not exist.`,
        `$.valueOverrides[${input.index}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordArrayRemove(overrides, input.index, `$.valueOverrides[${input.index}]`, changes, "value override removed");
  return buildMutationResult(template, changes, diagnostics);
}
