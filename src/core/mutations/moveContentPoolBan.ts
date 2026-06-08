import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { cloneValue, selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import { buildMutationResult } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface MoveContentPoolBanInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  fromIndex: number;
  toIndex: number;
}

export function moveContentPoolBan(input: MoveContentPoolBanInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPoolForGroupEdit(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const bans = selected.pool.bans ?? [];
  if (!isValidIndex(input.fromIndex, bans.length)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolBan.fromIndexInvalid",
        `Content pool ban source index ${input.fromIndex} is outside 0..${Math.max(bans.length - 1, 0)}.`,
        `${selected.path}.bans[${input.fromIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!isValidIndex(input.toIndex, bans.length)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolBan.toIndexInvalid",
        `Content pool ban target index ${input.toIndex} is outside 0..${Math.max(bans.length - 1, 0)}.`,
        `${selected.path}.bans[${input.toIndex}]`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.fromIndex === input.toIndex) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const before = cloneValue(bans);
  const [ban] = bans.splice(input.fromIndex, 1);
  if (!ban) {
    return buildMutationResult(template, changes, diagnostics);
  }
  bans.splice(input.toIndex, 0, ban);
  changes.push({
    path: `${selected.path}.bans`,
    before,
    after: cloneValue(bans),
    reason: "content pool ban moved",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isValidIndex(index: number, length: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < length;
}
