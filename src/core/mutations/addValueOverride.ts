import type { ContentValueOverride, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddValueOverrideInput extends TemplateMutationInput {
  override: ContentValueOverride;
  insertIndex?: number;
}

export function addValueOverride(input: AddValueOverrideInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  if (!input.override.sid || input.override.sid.trim().length === 0) {
    diagnostics.push(
      diagnostic("error", "mutation.valueOverride.emptySid", "Value override sid cannot be empty.", "$.valueOverrides[].sid"),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  template.valueOverrides ??= [];
  const overrides = template.valueOverrides;

  const duplicateIndex = overrides.findIndex(
    (o) => o.sid === input.override.sid && o.variant === input.override.variant,
  );
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.valueOverride.duplicate",
        `Another value override already exists for sid '${input.override.sid}' and variant ${input.override.variant ?? "default"}.`,
        `$.valueOverrides[${duplicateIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? overrides.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > overrides.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.valueOverride.insertIndexInvalid",
        `Value override insert index ${insertIndex} is outside 0..${overrides.length}.`,
        "$.valueOverrides",
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const newOverride: ContentValueOverride = JSON.parse(JSON.stringify(input.override)) as ContentValueOverride;
  overrides.splice(insertIndex, 0, newOverride);
  changes.push({
    path: `$.valueOverrides[${insertIndex}]`,
    before: undefined,
    after: newOverride,
    reason: "value override added",
  });

  return buildMutationResult(template, changes, diagnostics);
}
