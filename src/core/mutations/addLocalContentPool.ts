import type { ContentPoolConfig, ContentPoolGroup, ContentID, RmgTemplate, ValueDistributionConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface AddLocalContentPoolInput extends TemplateMutationInput {
  pool:
    | ContentPoolConfig
    | {
        name: string;
        groups?: ContentPoolGroup[];
        valueDistribution?: ValueDistributionConfig;
        bans?: ContentID[];
      };
  insertIndex?: number;
}

export function addLocalContentPool(input: AddLocalContentPoolInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const pool = isCompletePool(input.pool) ? clonePool(input.pool) : createDefaultPool(input.pool);
  const poolName = pool.name;
  const pools = template.contentPools ?? [];
  template.contentPools = pools;

  if (!poolName || !validateName(poolName, `$.contentPools[].name`, "localContentPool", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = pools.findIndex((item) => item.name === poolName);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.duplicateName",
        `Another local content pool already uses the name '${poolName}'.`,
        `$.contentPools[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? pools.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > pools.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.insertIndexInvalid",
        `Local content pool insert index ${insertIndex} is outside 0..${pools.length}.`,
        `$.contentPools`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  pools.splice(insertIndex, 0, pool);
  changes.push({
    path: `$.contentPools[${insertIndex}]`,
    before: undefined,
    after: pool,
    reason: "local content pool added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function isCompletePool(
  pool: ContentPoolConfig | { name: string; groups?: ContentPoolGroup[]; valueDistribution?: ValueDistributionConfig; bans?: ContentID[] },
): pool is ContentPoolConfig {
  return "valueDistribution" in pool || "groups" in pool || "bans" in pool;
}

function createDefaultPool(
  options: { name: string; groups?: ContentPoolGroup[]; valueDistribution?: ValueDistributionConfig; bans?: ContentID[] },
): ContentPoolConfig {
  return {
    name: options.name,
    ...(options.groups ? { groups: options.groups } : {}),
    ...(options.valueDistribution ? { valueDistribution: options.valueDistribution } : {}),
    ...(options.bans ? { bans: options.bans } : {}),
  };
}

function clonePool(pool: ContentPoolConfig): ContentPoolConfig {
  return JSON.parse(JSON.stringify(pool)) as ContentPoolConfig;
}
