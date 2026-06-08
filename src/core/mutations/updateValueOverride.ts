import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordValueChange } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface ValueOverrideSettings {
  sid?: string;
  variant?: number;
  goodsValue?: number;
  guardValue?: number;
  aiValue?: number;
}

export interface UpdateValueOverrideInput extends TemplateMutationInput {
  index: number;
  settings: ValueOverrideSettings;
}

export function updateValueOverride(input: UpdateValueOverrideInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const overrides = template.valueOverrides ?? [];
  const override = overrides[input.index];
  if (!override || !Number.isInteger(input.index) || input.index < 0) {
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

  const sidChanging = input.settings.sid !== undefined && input.settings.sid !== override.sid;
  const variantChanging = input.settings.variant !== undefined && input.settings.variant !== override.variant;

  if (sidChanging || variantChanging) {
    const newSid = sidChanging ? input.settings.sid! : override.sid;
    const newVariant = variantChanging ? input.settings.variant! : override.variant;
    const duplicateIndex = overrides.findIndex(
      (o, i) => i !== input.index && o.sid === newSid && o.variant === newVariant,
    );
    if (duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.valueOverride.duplicate",
          `Another value override already exists for sid '${newSid}' and variant ${newVariant ?? "default"}.`,
          `$.valueOverrides[${duplicateIndex}]`,
        ),
      );
      return buildMutationResult(template, changes, diagnostics);
    }
  }

  if (input.settings.sid !== undefined && input.settings.sid.trim().length === 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.valueOverride.emptySid",
        "Value override sid cannot be empty.",
        `$.valueOverrides[${input.index}].sid`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  for (const key of ["sid", "variant", "goodsValue", "guardValue", "aiValue"] as const) {
    if (input.settings[key] !== undefined) {
      recordValueChange(
        override,
        key,
        `$.valueOverrides[${input.index}].${key}`,
        input.settings[key],
        changes,
        "value override updated",
      );
    }
  }

  return buildMutationResult(template, changes, diagnostics);
}
