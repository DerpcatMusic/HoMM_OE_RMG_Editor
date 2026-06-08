import type { RmgTemplate, Variant } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { createDefaultVariant, type DefaultVariantOptions } from "./defaultObjects.js";
import { buildMutationResult } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddVariantInput extends TemplateMutationInput {
  variant?: DefaultVariantOptions | Variant;
  insertIndex?: number;
}

export function addVariant(input: AddVariantInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const variant = isCompleteVariant(input.variant) ? cloneVariant(input.variant) : createDefaultVariant();
  const variants = template.variants ?? [];
  template.variants = variants;

  const insertIndex = input.insertIndex ?? variants.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > variants.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.variant.insertIndexInvalid",
        `Variant insert index ${insertIndex} is outside 0..${variants.length}.`,
        "$.variants",
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  variants.splice(insertIndex, 0, variant);
  changes.push({
    path: `$.variants[${insertIndex}]`,
    before: undefined,
    after: variant,
    reason: "variant added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isCompleteVariant(variant: DefaultVariantOptions | Variant | undefined): variant is Variant {
  if (!variant) {
    return false;
  }
  return "orientation" in variant || "border" in variant || "zones" in variant || "connections" in variant;
}

function cloneVariant(variant: Variant): Variant {
  return JSON.parse(JSON.stringify(variant)) as Variant;
}
