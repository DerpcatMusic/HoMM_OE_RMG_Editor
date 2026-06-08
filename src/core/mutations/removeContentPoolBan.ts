import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import { buildMutationResult, recordArrayRemove } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface RemoveContentPoolBanInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  banIndex: number;
}

export function removeContentPoolBan(input: RemoveContentPoolBanInput): MutationResult<RmgTemplate> {
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

  recordArrayRemove(bans, input.banIndex, `${selected.path}.bans[${input.banIndex}]`, changes, "content pool ban removed");

  return buildMutationResult(template, changes, diagnostics);
}
