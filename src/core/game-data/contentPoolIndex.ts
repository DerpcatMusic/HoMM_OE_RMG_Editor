import type { ContentPoolConfig } from "../rmg/rmgTypes.js";
import { listJsonFiles, readJsonFile } from "../json/readJson.js";
import { createNamedIndex, type IndexedByName } from "./namedIndex.js";

export type ContentPoolIndex = IndexedByName<ContentPoolConfig>;

export async function indexContentPools(contentPoolsDir: string): Promise<ContentPoolIndex> {
  const files = await listJsonFiles(contentPoolsDir, true);
  const entries: Array<{ name: string | undefined; value: ContentPoolConfig; sourcePath: string }> = [];

  for (const file of files) {
    const json = await readJsonFile<unknown>(file);
    if (!Array.isArray(json.data)) {
      continue;
    }
    for (const item of json.data) {
      if (isRecord(item)) {
        const pool = item as ContentPoolConfig;
        entries.push({ name: pool.name, value: pool, sourcePath: file });
      }
    }
  }

  return createNamedIndex(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
