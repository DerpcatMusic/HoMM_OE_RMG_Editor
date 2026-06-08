import type { ContentPoolGroup, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult } from "./helpers.js";
import { cloneGroup, selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddContentPoolGroupInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  group: ContentPoolGroup;
  insertIndex?: number;
}

export function addContentPoolGroup(input: AddContentPoolGroupInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPoolForGroupEdit(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const groups = selected.pool.groups ?? [];
  selected.pool.groups = groups;

  const insertIndex = input.insertIndex ?? groups.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > groups.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolGroup.insertIndexInvalid",
        `Content pool group insert index ${insertIndex} is outside 0..${groups.length}.`,
        `${selected.path}.groups`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const group = cloneGroup(input.group);
  groups.splice(insertIndex, 0, group);
  changes.push({
    path: `${selected.path}.groups[${insertIndex}]`,
    before: undefined,
    after: group,
    reason: "content pool group added",
  });

  return buildMutationResult(template, changes, diagnostics);
}
