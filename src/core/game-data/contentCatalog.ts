import type { CoreDataSource } from "./coreDataSource.js";

export interface RmgContentCatalogIndex {
  bySid: Map<string, RmgContentCatalogEntry>;
  entries: RmgContentCatalogEntry[];
  stats: RmgContentCatalogStats;
  language: string;
}

export interface RmgContentCatalogEntry {
  sid: string;
  kind: "mapObject" | "metaObject" | "unknownReferenced";
  rmgPlaceable: boolean;
  name?: string;
  tag?: string;
  biome?: string;
  metaType?: string;
  variantCount: number;
  officialRefs: number;
  officialPositiveRefs: number;
  value?: number;
  guardValue?: number;
  sourcePaths: string[];
  warnings: string[];
}

export interface RmgContentCatalogStats {
  total: number;
  mapObjects: number;
  metaObjects: number;
  unknownReferenced: number;
  officialReferenced: number;
  officialPositiveReferenced: number;
  byTag: Record<string, number>;
}

export interface ListRmgContentOptionsInput {
  catalog: RmgContentCatalogIndex;
  search?: string;
  tags?: readonly string[];
  kinds?: readonly RmgContentCatalogEntry["kind"][];
  includeUnknownReferenced?: boolean;
  officialOnly?: boolean;
}

export async function indexRmgContentCatalogFromSource(
  source: CoreDataSource,
  language = "english",
): Promise<RmgContentCatalogIndex> {
  const [mapObjects, metaObjects, logic, refs, tokens] = await Promise.all([
    readMapObjects(source),
    readMetaObjects(source),
    readLogicObjects(source),
    readOfficialContentRefs(source),
    readLocalizationTokens(source, `Lang/${language}/texts`),
  ]);

  const entriesBySid = new Map<string, RmgContentCatalogEntry>();
  for (const mapObject of mapObjects) {
    const logicObject = logic.get(mapObject.id);
    const ref = refs.get(mapObject.id);
    const entry: RmgContentCatalogEntry = {
      sid: mapObject.id,
      kind: "mapObject",
      rmgPlaceable: true,
      variantCount: logicObject?.variantCount ?? 0,
      officialRefs: ref?.total ?? 0,
      officialPositiveRefs: ref?.positive ?? 0,
      sourcePaths: [source.sourcePath(mapObject.sourcePath), ...(logicObject ? [source.sourcePath(logicObject.sourcePath)] : [])].sort(),
      warnings: [],
    };
    assignIfDefined(entry, "name", lookupText(tokens, `${mapObject.id}_name`));
    assignIfDefined(entry, "tag", mapObject.tag);
    assignIfDefined(entry, "biome", mapObject.biome);
    assignIfDefined(entry, "value", logicObject?.value ?? logicObject?.goodsValue);
    assignIfDefined(entry, "guardValue", logicObject?.guardValue ?? logicObject?.customGuardValue);
    entriesBySid.set(entry.sid, entry);
  }

  for (const metaObject of metaObjects) {
    const ref = refs.get(metaObject.sid);
    const entry: RmgContentCatalogEntry = {
      sid: metaObject.sid,
      kind: "metaObject",
      rmgPlaceable: true,
      variantCount: 0,
      officialRefs: ref?.total ?? 0,
      officialPositiveRefs: ref?.positive ?? 0,
      sourcePaths: [source.sourcePath("generator/generator_config.json")],
      warnings: [],
    };
    assignIfDefined(entry, "metaType", metaObject.type);
    assignIfDefined(entry, "value", metaObject.value);
    assignIfDefined(entry, "guardValue", metaObject.guardValue);
    entriesBySid.set(entry.sid, entry);
  }

  for (const [sid, ref] of refs) {
    if (entriesBySid.has(sid)) {
      continue;
    }
    entriesBySid.set(sid, {
      sid,
      kind: "unknownReferenced",
      rmgPlaceable: false,
      variantCount: 0,
      officialRefs: ref.total,
      officialPositiveRefs: ref.positive,
      sourcePaths: [...ref.sourcePaths].map((sourcePath) => source.sourcePath(sourcePath)).sort(),
      warnings: ["referenced-content-sid-does-not-resolve"],
    });
  }

  const entries = [...entriesBySid.values()].sort(compareEntries);
  return {
    bySid: new Map(entries.map((entry) => [entry.sid, entry])),
    entries,
    stats: buildStats(entries),
    language,
  };
}

export function listRmgContentOptions(input: ListRmgContentOptionsInput): RmgContentCatalogEntry[] {
  const search = input.search?.trim().toLocaleLowerCase();
  const tags = input.tags ? new Set(input.tags) : undefined;
  const kinds = input.kinds ? new Set(input.kinds) : undefined;
  return input.catalog.entries.filter((entry) => {
    if (!input.includeUnknownReferenced && entry.kind === "unknownReferenced") {
      return false;
    }
    if (input.officialOnly && entry.officialPositiveRefs <= 0) {
      return false;
    }
    if (tags && (!entry.tag || !tags.has(entry.tag))) {
      return false;
    }
    if (kinds && !kinds.has(entry.kind)) {
      return false;
    }
    if (!search) {
      return true;
    }
    return [entry.sid, entry.name, entry.tag, entry.metaType]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(search));
  });
}

async function readMapObjects(source: CoreDataSource): Promise<IndexedMapObject[]> {
  const files = await source.listJsonFiles("DB/map/objects", false);
  const result: IndexedMapObject[] = [];
  for (const file of files) {
    for (const item of await readJsonArray<CoreMapObject>(source, file)) {
      if (item.id) {
        result.push({ ...item, sourcePath: file });
      }
    }
  }
  return result;
}

async function readMetaObjects(source: CoreDataSource): Promise<CoreMetaObject[]> {
  const config = await source.readJson<unknown>("generator/generator_config.json");
  if (!isRecord(config) || !Array.isArray(config.metaObjects)) {
    return [];
  }
  return config.metaObjects.filter(isCoreMetaObject);
}

async function readLogicObjects(source: CoreDataSource): Promise<Map<string, IndexedLogicObject>> {
  const result = new Map<string, IndexedLogicObject>();
  const files = await source.listJsonFiles("DB/objects_logic", true);
  for (const file of files) {
    for (const item of await readJsonArray<CoreLogicObject>(source, file)) {
      if (!item.id) {
        continue;
      }
      result.set(item.id, {
        ...item,
        sourcePath: file,
        variantCount: Array.isArray(item.variants) ? item.variants.length : 0,
      });
    }
  }
  return result;
}

async function readOfficialContentRefs(source: CoreDataSource): Promise<Map<string, ContentRefStats>> {
  const result = new Map<string, ContentRefStats>();
  const contentListFiles = await source.listJsonFiles("generator/content_lists", true);
  const contentPoolFiles = await source.listJsonFiles("generator/content_pools", true);
  for (const file of contentListFiles) {
    for (const list of await readJsonArray<CoreContentList>(source, file)) {
      collectContentRefs(result, list.content ?? [], file);
    }
  }
  for (const file of contentPoolFiles) {
    for (const pool of await readJsonArray<CoreContentPool>(source, file)) {
      for (const group of pool.groups ?? []) {
        collectContentRefs(result, group.content ?? [], file);
      }
    }
  }
  return result;
}

function collectContentRefs(result: Map<string, ContentRefStats>, content: readonly CoreContentWeight[], sourcePath: string): void {
  for (const item of content) {
    if (!item.sid) {
      continue;
    }
    const current = result.get(item.sid) ?? { total: 0, positive: 0, sourcePaths: new Set<string>() };
    current.total += 1;
    if ((item.weight ?? 0) > 0) {
      current.positive += 1;
    }
    current.sourcePaths.add(sourcePath);
    result.set(item.sid, current);
  }
}

async function readLocalizationTokens(source: CoreDataSource, textsDir: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const files = await source.listJsonFiles(textsDir, false);
  for (const file of files) {
    const value = await source.readJson<unknown>(file);
    const tokens = isRecord(value) && Array.isArray(value.tokens) ? value.tokens : [];
    for (const token of tokens) {
      if (!isRecord(token) || typeof token.sid !== "string" || typeof token.text !== "string") {
        continue;
      }
      result.set(token.sid, token.text);
    }
  }
  return result;
}

async function readJsonArray<T>(source: CoreDataSource, filePath: string): Promise<T[]> {
  const value = await source.readJson<unknown>(filePath);
  if (Array.isArray(value)) {
    return value.filter(isRecord) as T[];
  }
  if (isRecord(value) && Array.isArray(value.array)) {
    return value.array.filter(isRecord) as T[];
  }
  return [];
}

function buildStats(entries: readonly RmgContentCatalogEntry[]): RmgContentCatalogStats {
  const byTag: Record<string, number> = {};
  for (const entry of entries) {
    byTag[entry.tag ?? entry.metaType ?? entry.kind] = (byTag[entry.tag ?? entry.metaType ?? entry.kind] ?? 0) + 1;
  }
  return {
    total: entries.length,
    mapObjects: entries.filter((entry) => entry.kind === "mapObject").length,
    metaObjects: entries.filter((entry) => entry.kind === "metaObject").length,
    unknownReferenced: entries.filter((entry) => entry.kind === "unknownReferenced").length,
    officialReferenced: entries.filter((entry) => entry.officialRefs > 0).length,
    officialPositiveReferenced: entries.filter((entry) => entry.officialPositiveRefs > 0).length,
    byTag,
  };
}

function lookupText(tokens: ReadonlyMap<string, string>, key: string): string | undefined {
  return tokens.get(key);
}

function compareEntries(left: RmgContentCatalogEntry, right: RmgContentCatalogEntry): number {
  return (left.name ?? left.sid).localeCompare(right.name ?? right.sid);
}

function assignIfDefined<K extends keyof RmgContentCatalogEntry>(
  target: RmgContentCatalogEntry,
  key: K,
  value: RmgContentCatalogEntry[K] | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCoreMetaObject(value: unknown): value is CoreMetaObject {
  return isRecord(value) && typeof value.sid === "string";
}

interface CoreMapObject {
  id: string;
  tag?: string;
  biome?: string;
}

interface IndexedMapObject extends CoreMapObject {
  sourcePath: string;
}

interface CoreMetaObject {
  sid: string;
  type?: string;
  value?: number;
  guardValue?: number;
}

interface CoreLogicObject {
  id: string;
  value?: number;
  goodsValue?: number;
  guardValue?: number;
  customGuardValue?: number;
  variants?: unknown[];
}

interface IndexedLogicObject extends CoreLogicObject {
  sourcePath: string;
  variantCount: number;
}

interface CoreContentList {
  content?: CoreContentWeight[];
}

interface CoreContentPool {
  groups?: Array<{ content?: CoreContentWeight[] }>;
}

interface CoreContentWeight {
  sid?: string;
  weight?: number;
}

interface ContentRefStats {
  total: number;
  positive: number;
  sourcePaths: Set<string>;
}
