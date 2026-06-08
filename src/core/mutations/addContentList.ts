import type { ContentList, ContentWeight, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddContentListInput extends TemplateMutationInput {
  list: ContentList | { name: string; content?: ContentWeight[] };
  insertIndex?: number;
}

export function addContentList(input: AddContentListInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const list = isCompleteList(input.list) ? cloneList(input.list) : createDefaultList(input.list);
  const listName = list.name;
  const lists = template.contentLists ?? [];
  template.contentLists = lists;

  if (!listName || !validateName(listName, `$.contentLists[].name`, "contentList", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = lists.findIndex((item) => item.name === listName);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.duplicateName",
        `Another content list already uses the name '${listName}'.`,
        `$.contentLists[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? lists.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > lists.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.insertIndexInvalid",
        `Content list insert index ${insertIndex} is outside 0..${lists.length}.`,
        `$.contentLists`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  lists.splice(insertIndex, 0, list);
  changes.push({
    path: `$.contentLists[${insertIndex}]`,
    before: undefined,
    after: list,
    reason: "content list added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isCompleteList(
  list: ContentList | { name: string; content?: ContentWeight[] },
): list is ContentList {
  return "content" in list;
}

function createDefaultList(
  options: { name: string; content?: ContentWeight[] },
): ContentList {
  return {
    name: options.name,
    ...(options.content ? { content: options.content } : {}),
  };
}

function cloneList(list: ContentList): ContentList {
  return JSON.parse(JSON.stringify(list)) as ContentList;
}
