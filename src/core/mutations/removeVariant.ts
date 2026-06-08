import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordArrayRemove } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface RemoveVariantInput extends TemplateMutationInput {
  variantIndex: number;
}

export function removeVariant(input: RemoveVariantInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const variants = template.variants ?? [];
  template.variants = variants;

  if (variants.length === 1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.variant.onlyVariant",
        "Cannot remove the only variant; a template must have at least one variant.",
        `$.variants[${input.variantIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  recordArrayRemove(variants, input.variantIndex, variantSelection.path, changes, "variant removed");

  return buildMutationResult(template, changes, diagnostics);
}
