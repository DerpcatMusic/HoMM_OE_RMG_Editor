import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { selectContentPoolGroup } from "./contentPoolGroupHelpers.js";
import { buildMutationResult, recordArrayRemove } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";
import type { Diagnostic } from "../validation/validationTypes.js";

export interface RemoveContentPoolGroupInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  groupIndex: number;
}

export function removeContentPoolGroup(input: RemoveContentPoolGroupInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectContentPoolGroup(template, input.pool, input.groupIndex, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const groups = selected.pool.groups ?? [];
  recordArrayRemove(groups, selected.groupIndex, selected.groupPath, changes, "content pool group removed");

  return buildMutationResult(template, changes, diagnostics);
}
