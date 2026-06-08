import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { cloneValue, selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import { buildMutationResult } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface MoveContentPoolGroupInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  fromIndex: number;
  toIndex: number;
}

export function moveContentPoolGroup(input: MoveContentPoolGroupInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPoolForGroupEdit(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const groups = selected.pool.groups ?? [];
  if (!isValidIndex(input.fromIndex, groups.length)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolGroup.fromIndexInvalid",
        `Content pool group source index ${input.fromIndex} is outside 0..${Math.max(groups.length - 1, 0)}.`,
        `${selected.path}.groups[${input.fromIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!isValidIndex(input.toIndex, groups.length)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolGroup.toIndexInvalid",
        `Content pool group target index ${input.toIndex} is outside 0..${Math.max(groups.length - 1, 0)}.`,
        `${selected.path}.groups[${input.toIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.fromIndex === input.toIndex) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const before = cloneValue(groups);
  const [group] = groups.splice(input.fromIndex, 1);
  if (!group) {
    return buildMutationResult(template, changes, diagnostics);
  }
  groups.splice(input.toIndex, 0, group);
  changes.push({
    path: `${selected.path}.groups`,
    before,
    after: cloneValue(groups),
    reason: "content pool group moved",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isValidIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}
