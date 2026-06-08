import type { ContentList, ContentWeight, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, recordValueChange, replaceStringReference, validateName } from "./helpers.js";
import type { ContentListSelector, MutationChange, MutationResult, SelectedContentList, TemplateMutationInput } from "./mutationTypes.js";

export interface ContentListSettings {
  name?: string;
  content?: ContentWeight[];
}

export interface UpdateContentListInput extends TemplateMutationInput {
  list: ContentListSelector;
  settings: ContentListSettings;
}

export function updateContentList(input: UpdateContentListInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectContentList(template, input.list, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.settings.name !== undefined && input.settings.name !== selected.list.name) {
    if (!validateName(input.settings.name, `${selected.path}.name`, "contentList", diagnostics)) {
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
      (list, index) => index !== selected.listIndex && list.name === input.settings.name,
    );
    if (duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.contentList.duplicateName",
          `Another content list already uses the name '${input.settings.name}'.`,
          `$.contentLists[${duplicateIndex}].name`,
        ),
      );
      return buildMutationResult(template, changes, diagnostics);
    }

    recordStringChange(
      selected.list,
      "name",
      `${selected.path}.name`,
      input.settings.name,
      changes,
      "content list declaration",
    );
    rewriteIncludeListsRefs(template, oldName, input.settings.name, changes);
  }

  if (input.settings.content !== undefined) {
    recordValueChange(
      selected.list,
      "content",
      `${selected.path}.content`,
      cloneValue(input.settings.content),
      changes,
      "content list setting",
    );
  }

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

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
