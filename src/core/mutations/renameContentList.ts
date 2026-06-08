import type { ContentList, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, replaceStringReference, validateName } from "./helpers.js";
import type { ContentListSelector, MutationChange, MutationResult, SelectedContentList, TemplateMutationInput } from "./mutationTypes.js";

export interface RenameContentListInput extends TemplateMutationInput {
  list: ContentListSelector;
  newName: string;
}

export function renameContentList(input: RenameContentListInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const selected = selectContentList(template, input.list, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!validateName(input.newName, `${selected.path}.name`, "contentList", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const oldName = selected.list.name;
  if (!oldName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.oldNameMissing",
        "Selected content list has no name to rename.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = (template.contentLists ?? []).findIndex(
    (list, index) => index !== selected.listIndex && list.name === input.newName,
  );
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.duplicateName",
        `Another content list already uses the name '${input.newName}'.`,
        `$.contentLists[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(selected.list, "name", `${selected.path}.name`, input.newName, changes, "content list declaration");
  rewriteIncludeListsRefs(template, oldName, input.newName, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function selectContentList(
  template: RmgTemplate,
  selector: ContentListSelector,
  diagnostics: Diagnostic[],
): SelectedContentList | undefined {
  const lists = template.contentLists ?? [];
  const listIndex = "listIndex" in selector ? selector.listIndex : lists.findIndex((list) => list.name === selector.listName);
  const list: ContentList | undefined = lists[listIndex];
  const path = `$.contentLists[${listIndex}]`;

  if (!list) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.missing",
        "listIndex" in selector
          ? `Content list index ${selector.listIndex} does not exist.`
          : `Content list '${selector.listName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { list, listIndex, path };
}

function rewriteIncludeListsRefs(
  template: RmgTemplate,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (template.contentPools ?? []).forEach((pool, poolIndex) => {
    (pool.groups ?? []).forEach((group, groupIndex) => {
      replaceStringReference(
        group,
        "includeLists",
        oldName,
        newName,
        `$.contentPools[${poolIndex}].groups[${groupIndex}].includeLists`,
        changes,
        "content pool group includeLists reference",
      );
    });
  });
}
