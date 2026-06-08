import type { ZoneLayoutConfig } from "../rmg/rmgTypes.js";
import { listJsonFiles, readJsonFile } from "../json/readJson.js";
import { createNamedIndex, type IndexedByName } from "./namedIndex.js";

export type ZoneLayoutIndex = IndexedByName<ZoneLayoutConfig>;

export async function indexZoneLayouts(zoneLayoutsDir: string): Promise<ZoneLayoutIndex> {
  const files = await listJsonFiles(zoneLayoutsDir, true);
  const entries: Array<{ name: string | undefined; value: ZoneLayoutConfig; sourcePath: string }> = [];

  for (const file of files) {
    const json = await readJsonFile<unknown>(file);
    if (!Array.isArray(json.data)) {
      continue;
    }
    for (const item of json.data) {
      if (isRecord(item)) {
        const layout = item as ZoneLayoutConfig;
        entries.push({ name: layout.name, value: layout, sourcePath: file });
      }
    }
  }

  return createNamedIndex(entries);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
