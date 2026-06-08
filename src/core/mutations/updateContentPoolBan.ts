import type { ContentID, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { cloneValue, selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import { buildMutationResult } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface UpdateContentPoolBanInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  banIndex: number;
  ban: ContentID;
}

export function updateContentPoolBan(input: UpdateContentPoolBanInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPoolForGroupEdit(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const bans = selected.pool.bans ?? [];
  if (!Number.isInteger(input.banIndex) || input.banIndex < 0 || input.banIndex >= bans.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolBan.missing",
        `Content pool ban index ${input.banIndex} does not exist.`,
        `${selected.path}.bans[${input.banIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const before = bans[input.banIndex];
  const after = cloneValue(input.ban);
  bans[input.banIndex] = after;
  changes.push({
    path: `${selected.path}.bans[${input.banIndex}]`,
    before,
    after,
    reason: "content pool ban setting",
  });

  return buildMutationResult(template, changes, diagnostics);
}
