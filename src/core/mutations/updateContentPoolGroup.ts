import type { ContentPoolGroup, ContentWeight, RmgTemplate } from "../rmg/rmgTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { cloneValue, selectContentPoolGroup } from "./contentPoolGroupHelpers.js";
import { buildMutationResult, recordDelete, recordValueChange } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";
import type { Diagnostic } from "../validation/validationTypes.js";

export interface ContentPoolGroupSettings {
  weight?: number | null;
  includeLists?: string[] | null;
  content?: ContentWeight[] | null;
}

export interface UpdateContentPoolGroupInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  groupIndex: number;
  settings: ContentPoolGroupSettings;
}

export function updateContentPoolGroup(input: UpdateContentPoolGroupInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectContentPoolGroup(template, input.pool, input.groupIndex, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  applyGroupField(selected.group, "weight", input.settings.weight, `${selected.groupPath}.weight`, changes);
  applyGroupField(selected.group, "includeLists", input.settings.includeLists, `${selected.groupPath}.includeLists`, changes);
  applyGroupField(selected.group, "content", input.settings.content, `${selected.groupPath}.content`, changes);

  return buildMutationResult(template, changes, diagnostics);
}

type ContentPoolGroupEditableKey = "weight" | "includeLists" | "content";

function applyGroupField(
  group: ContentPoolGroup,
  key: ContentPoolGroupEditableKey,
  value: number | string[] | ContentWeight[] | null | undefined,
  path: string,
  changes: MutationChange[],
): void {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    recordDelete(group, key, path, changes, "content pool group setting removed");
    return;
  }

  recordValueChange(group, key, path, cloneValue(value), changes, "content pool group setting");
}
