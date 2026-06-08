import type { ContentPoolConfig, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, replaceStringReference, validateName } from "./helpers.js";
import type {
  ContentPoolSelector,
  MutationChange,
  MutationResult,
  SelectedContentPool,
  TemplateMutationInput,
} from "./mutationTypes.js";

export interface RenameLocalContentPoolInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  newName: string;
}

export function renameLocalContentPool(input: RenameLocalContentPoolInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const selected = selectLocalContentPool(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!validateName(input.newName, `${selected.path}.name`, "localContentPool", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const oldName = selected.pool.name;
  if (!oldName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.oldNameMissing",
        "Selected local content pool has no name to rename.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = (template.contentPools ?? []).findIndex(
    (pool, index) => index !== selected.poolIndex && pool.name === input.newName,
  );
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.duplicateName",
        `Another local content pool already uses the name '${input.newName}'.`,
        `$.contentPools[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(selected.pool, "name", `${selected.path}.name`, input.newName, changes, "local content pool declaration");
  rewriteZoneContentPoolRefs(template, oldName, input.newName, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function selectLocalContentPool(
  template: RmgTemplate,
  selector: ContentPoolSelector,
  diagnostics: Diagnostic[],
): SelectedContentPool | undefined {
  const pools = template.contentPools ?? [];
  const poolIndex = "poolIndex" in selector ? selector.poolIndex : pools.findIndex((pool) => pool.name === selector.poolName);
  const pool: ContentPoolConfig | undefined = pools[poolIndex];
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

function rewriteZoneContentPoolRefs(
  template: RmgTemplate,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      for (const field of ["guardedContentPool", "unguardedContentPool", "resourcesContentPool"] as const) {
        replaceStringReference(
          zone,
          field,
          oldName,
          newName,
          `$.variants[${variantIndex}].zones[${zoneIndex}].${field}`,
          changes,
          "zone content pool reference",
        );
      }
    });
  });
}
