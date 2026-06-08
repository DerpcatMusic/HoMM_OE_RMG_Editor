import type { ContentList } from "../rmg/rmgTypes.js";
import { listJsonFiles, readJsonFile } from "../json/readJson.js";
import { createNamedIndex, type IndexedByName } from "./namedIndex.js";

export type ContentListIndex = IndexedByName<ContentList>;

export async function indexContentLists(contentListsDir: string): Promise<ContentListIndex> {
  const files = await listJsonFiles(contentListsDir, true);
  const entries: Array<{ name: string | undefined; value: ContentList; sourcePath: string }> = [];

  for (const file of files) {
    const json = await readJsonFile<unknown>(file);
    if (!Array.isArray(json.data)) {
      continue;
    }
    for (const item of json.data) {
      if (isRecord(item)) {
        const list = item as ContentList;
        entries.push({ name: list.name, value: list, sourcePath: file });
      }
    }
  }

  return createNamedIndex(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
