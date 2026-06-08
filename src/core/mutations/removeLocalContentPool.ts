import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordArrayRemove } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface RemoveLocalContentPoolInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  cascade?: boolean;
}

export function removeLocalContentPool(input: RemoveLocalContentPoolInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cascade = input.cascade ?? true;

  const selected = selectLocalContentPool(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const poolName = selected.pool.name;
  if (!poolName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.oldNameMissing",
        "Selected local content pool has no name to remove.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const referencingZones = findReferencingZones(template, poolName);

  if (!cascade && referencingZones.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.hasReferences",
        `Local content pool '${poolName}' is referenced by ${referencingZones.length} zone(s).`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (cascade) {
    for (const { variantIndex, zoneIndex, zone, field } of referencingZones) {
      const array = zone[field];
      if (!array) {
        continue;
      }
      const path = `$.variants[${variantIndex}].zones[${zoneIndex}].${field}`;
      for (let index = array.length - 1; index >= 0; index--) {
        if (array[index] === poolName) {
          recordArrayRemove(array, index, `${path}[${index}]`, changes, "local content pool reference removed");
        }
      }
    }
  }

  const pools = template.contentPools ?? [];
  recordArrayRemove(pools, selected.poolIndex, selected.path, changes, "local content pool removed");

  return buildMutationResult(template, changes, diagnostics);
}

interface ZonePoolReference {
  variantIndex: number;
  zoneIndex: number;
  zone: NonNullable<NonNullable<RmgTemplate["variants"]>[number]["zones"]>[number];
  field: "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool";
}

function findReferencingZones(template: RmgTemplate, poolName: string): ZonePoolReference[] {
  const references: ZonePoolReference[] = [];
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      for (const field of ["guardedContentPool", "unguardedContentPool", "resourcesContentPool"] as const) {
        const array = zone[field];
        if (array?.includes(poolName)) {
          references.push({ variantIndex, zoneIndex, zone, field });
        }
      }
    });
  });
  return references;
}

function selectLocalContentPool(
  template: RmgTemplate,
  selector: ContentPoolSelector,
  diagnostics: Diagnostic[],
): { pool: NonNullable<RmgTemplate["contentPools"]>[number]; poolIndex: number; path: string } | undefined {
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
