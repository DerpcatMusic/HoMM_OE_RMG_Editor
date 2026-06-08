import type { ContentPoolConfig, ContentPoolGroup, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import type { ContentPoolSelector } from "./mutationTypes.js";

export interface SelectedLocalContentPool {
  pool: ContentPoolConfig;
  poolIndex: number;
  path: string;
}

export interface SelectedContentPoolGroup extends SelectedLocalContentPool {
  group: ContentPoolGroup;
  groupIndex: number;
  groupPath: string;
}

export function selectLocalContentPoolForGroupEdit(
  template: RmgTemplate,
  selector: ContentPoolSelector,
  diagnostics: Diagnostic[],
): SelectedLocalContentPool | undefined {
  const pools = template.contentPools ?? [];
  const poolIndex = "poolIndex" in selector ? selector.poolIndex : pools.findIndex((pool) => pool.name === selector.poolName);
  const pool = pools[poolIndex];
  const path = `$.contentPools[${poolIndex}]`;

  if (!pool) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.missing",
        "poolIndex" in selector
          ? `Local content pool index ${selector.poolIndex} does not exist.`
          : `Local content pool '${selector.poolName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { pool, poolIndex, path };
}

export function selectContentPoolGroup(
  template: RmgTemplate,
  selector: ContentPoolSelector,
  groupIndex: number,
  diagnostics: Diagnostic[],
): SelectedContentPoolGroup | undefined {
  const selected = selectLocalContentPoolForGroupEdit(template, selector, diagnostics);
  if (!selected) {
    return undefined;
  }

  const groups = selected.pool.groups ?? [];
  const group = groups[groupIndex];
  const groupPath = `${selected.path}.groups[${groupIndex}]`;

  if (!group) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolGroup.missing",
        `Content pool group index ${groupIndex} does not exist.`,
        groupPath,
      ),
    );
    return undefined;
  }

  return { ...selected, group, groupIndex, groupPath };
}

export function cloneGroup(group: ContentPoolGroup): ContentPoolGroup {
  return JSON.parse(JSON.stringify(group)) as ContentPoolGroup;
}

export function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
