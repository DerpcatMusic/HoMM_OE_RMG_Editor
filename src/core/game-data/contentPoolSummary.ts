import type { GameDataIndex } from "./gameDataIndex.js";
import type { ContentPoolConfig, ContentWeight, RmgTemplate } from "../rmg/rmgTypes.js";

export interface ContentPoolOption {
  id: string;
  source: "core" | "template-local";
  sourcePath?: string;
  groupCount: number;
  includeListCount: number;
  directContentCount: number;
  banCount: number;
  hasValueDistribution: boolean;
  sampleContent: ContentWeight[];
}

export interface ListContentPoolOptionsInput {
  gameData: GameDataIndex;
  template?: RmgTemplate;
  sampleSize?: number;
}

export function listContentPoolOptions(input: ListContentPoolOptionsInput): ContentPoolOption[] {
  const sampleSize = input.sampleSize ?? 6;
  const coreOptions = [...input.gameData.contentPools.byName.values()].map((entry) =>
    summarizeContentPool(entry.value.name ?? "", entry.value, "core", entry.sourcePath, sampleSize),
  );
  const localOptions = (input.template?.contentPools ?? [])
    .filter((pool) => pool.name)
    .map((pool) => summarizeContentPool(pool.name ?? "", pool, "template-local", undefined, sampleSize));
  return [...localOptions, ...coreOptions].sort((a, b) => a.id.localeCompare(b.id));
}

export function summarizeContentPool(
  id: string,
  pool: ContentPoolConfig,
  source: "core" | "template-local",
  sourcePath: string | undefined,
  sampleSize = 6,
): ContentPoolOption {
  const groups = pool.groups ?? [];
  const directContent = groups.flatMap((group) => group.content ?? []);
  return {
    id,
    source,
    ...(sourcePath ? { sourcePath } : {}),
    groupCount: groups.length,
    includeListCount: groups.reduce((count, group) => count + (group.includeLists?.length ?? 0), 0),
    directContentCount: directContent.length,
    banCount: pool.bans?.length ?? 0,
    hasValueDistribution: pool.valueDistribution !== undefined,
    sampleContent: directContent.slice(0, sampleSize),
  };
}
