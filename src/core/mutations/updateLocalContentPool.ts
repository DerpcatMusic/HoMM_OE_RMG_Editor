import type { ContentID, ContentPoolConfig, ContentPoolGroup, RmgTemplate, ValueDistributionConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, recordValueChange, replaceStringReference, validateName } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface LocalContentPoolSettings {
  name?: string;
  groups?: ContentPoolGroup[];
  valueDistribution?: ValueDistributionConfig;
  bans?: ContentID[];
}

export interface UpdateLocalContentPoolInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  settings: LocalContentPoolSettings;
}

export function updateLocalContentPool(input: UpdateLocalContentPoolInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPool(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.settings.name !== undefined) {
    if (!validateName(input.settings.name, `${selected.path}.name`, "localContentPool", diagnostics)) {
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
      (pool, index) => index !== selected.poolIndex && pool.name === input.settings.name,
    );
    if (duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.localContentPool.duplicateName",
          `Another local content pool already uses the name '${input.settings.name}'.`,
          `$.contentPools[${duplicateIndex}].name`,
        ),
      );
      return buildMutationResult(template, changes, diagnostics);
    }

    recordStringChange(selected.pool, "name", `${selected.path}.name`, input.settings.name, changes, "local content pool declaration");
    rewriteZoneContentPoolRefs(template, oldName, input.settings.name, changes);
  }

  if (input.settings.groups !== undefined) {
    recordValueChange(selected.pool, "groups", `${selected.path}.groups`, cloneValue(input.settings.groups), changes, "local content pool setting");
  }

  if (input.settings.valueDistribution !== undefined) {
    recordValueChange(selected.pool, "valueDistribution", `${selected.path}.valueDistribution`, cloneValue(input.settings.valueDistribution), changes, "local content pool setting");
  }

  if (input.settings.bans !== undefined) {
    recordValueChange(selected.pool, "bans", `${selected.path}.bans`, cloneValue(input.settings.bans), changes, "local content pool setting");
  }

  return buildMutationResult(template, changes, diagnostics);
}

function selectLocalContentPool(
  template: RmgTemplate,
  selector: ContentPoolSelector,
  diagnostics: Diagnostic[],
): { pool: ContentPoolConfig; poolIndex: number; path: string } | undefined {
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

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
