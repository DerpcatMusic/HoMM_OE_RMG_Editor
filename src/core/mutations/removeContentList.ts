import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordArrayRemove } from "./helpers.js";
import type { ContentListSelector, MutationChange, MutationResult, SelectedContentList, TemplateMutationInput } from "./mutationTypes.js";

export interface RemoveContentListInput extends TemplateMutationInput {
  list: ContentListSelector;
  cascade?: boolean;
}

export function removeContentList(input: RemoveContentListInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cascade = input.cascade ?? true;

  const selected = selectContentList(template, input.list, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const listName = selected.list.name;
  if (!listName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.oldNameMissing",
        "Selected content list has no name to remove.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const referencingGroups = findReferencingGroups(template, listName);

  if (!cascade && referencingGroups.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentList.hasReferences",
        `Content list '${listName}' is referenced by ${referencingGroups.length} pool group(s).`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (cascade) {
    for (const { poolIndex, groupIndex, path, includeLists } of referencingGroups) {
      for (let index = includeLists.length - 1; index >= 0; index--) {
        if (includeLists[index] === listName) {
          recordArrayRemove(
            includeLists,
            index,
            `${path}[${index}]`,
            changes,
            "content list reference removed",
          );
        }
      }
    }
  }

  const lists = template.contentLists ?? [];
  recordArrayRemove(lists, selected.listIndex, selected.path, changes, "content list removed");

  return buildMutationResult(template, changes, diagnostics);
}

interface GroupPoolReference {
  poolIndex: number;
  groupIndex: number;
  path: string;
  includeLists: string[];
}

function findReferencingGroups(template: RmgTemplate, listName: string): GroupPoolReference[] {
  const references: GroupPoolReference[] = [];
  (template.contentPools ?? []).forEach((pool, poolIndex) => {
    (pool.groups ?? []).forEach((group, groupIndex) => {
      const includeLists = group.includeLists;
      if (includeLists?.includes(listName)) {
        references.push({
          poolIndex,
          groupIndex,
          path: `$.contentPools[${poolIndex}].groups[${groupIndex}].includeLists`,
          includeLists,
        });
      }
    });
  });
  return references;
}

function selectContentList(
  template: RmgTemplate,
  selector: ContentListSelector,
  diagnostics: Diagnostic[],
): SelectedContentList | undefined {
  const lists = template.contentLists ?? [];
  const listIndex = "listIndex" in selector ? selector.listIndex : lists.findIndex((list) => list.name === selector.listName);
  const list = lists[listIndex];
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
