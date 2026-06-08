import type { ContentID, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { cloneValue, selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import { buildMutationResult } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddContentPoolBanInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  ban: ContentID;
  insertIndex?: number;
}

export function addContentPoolBan(input: AddContentPoolBanInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPoolForGroupEdit(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const bans = selected.pool.bans ?? [];
  selected.pool.bans = bans;

  const insertIndex = input.insertIndex ?? bans.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > bans.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolBan.insertIndexInvalid",
        `Content pool ban insert index ${insertIndex} is outside 0..${bans.length}.`,
        `${selected.path}.bans`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const ban = cloneValue(input.ban);
  bans.splice(insertIndex, 0, ban);
  changes.push({
    path: `${selected.path}.bans[${insertIndex}]`,
    before: undefined,
    after: ban,
    reason: "content pool ban added",
  });

  return buildMutationResult(template, changes, diagnostics);
}
