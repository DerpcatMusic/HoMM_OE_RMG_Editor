import type { ContentPoolIndex } from "../game-data/contentPoolIndex.js";
import type { ContentPoolConfig, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface CloneCoreContentPoolToLocalInput extends TemplateMutationInput {
  contentPools: ContentPoolIndex;
  sourcePoolName: string;
  localName?: string;
  insertIndex?: number;
}

export function cloneCoreContentPoolToLocal(input: CloneCoreContentPoolToLocalInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  if (!validateName(input.sourcePoolName, "$.contentPools", "sourceContentPool", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const source = input.contentPools.byName.get(input.sourcePoolName);
  if (!source) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.coreContentPool.missing",
        `Core content pool '${input.sourcePoolName}' does not exist.`,
        "$.contentPools",
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const pools = template.contentPools ?? [];
  template.contentPools = pools;

  const localName = input.localName ?? nextAvailablePoolName(`${input.sourcePoolName}_local`, pools);
  if (!validateName(localName, "$.contentPools[].name", "localContentPool", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = pools.findIndex((pool) => pool.name === localName);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.localContentPool.duplicateName",
        `Another local content pool already uses the name '${localName}'.`,
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
        "$.contentPools",
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const clonedPool = clonePool(source.value);
  clonedPool.name = localName;
  pools.splice(insertIndex, 0, clonedPool);
  changes.push({
    path: `$.contentPools[${insertIndex}]`,
    before: undefined,
    after: clonedPool,
    reason: `core content pool cloned from '${source.name}'`,
  });

  return buildMutationResult(template, changes, diagnostics);
}

function nextAvailablePoolName(baseName: string, pools: ContentPoolConfig[]): string {
  const usedNames = new Set(pools.map((pool) => pool.name).filter((name): name is string => typeof name === "string"));
  if (!usedNames.has(baseName)) {
    return baseName;
  }

  for (let suffix = 2; ; suffix++) {
    const candidate = `${baseName}_${suffix}`;
    if (!usedNames.has(candidate)) {
      return candidate;
    }
  }
}

function clonePool(pool: ContentPoolConfig): ContentPoolConfig {
  return JSON.parse(JSON.stringify(pool)) as ContentPoolConfig;
}
