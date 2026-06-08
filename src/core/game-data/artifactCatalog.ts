import type { GameDataPaths } from "../paths/pathConfig.js";
import { createFileSystemCoreDataSource, type CoreDataSource } from "./coreDataSource.js";

export interface ArtifactCatalogIndex {
  byId: Map<string, ArtifactCatalogEntry>;
  entries: ArtifactCatalogEntry[];
  stats: ArtifactCatalogStats;
  language: string;
}

export interface ArtifactCatalogEntry {
  id: string;
  name?: string;
  description?: string;
  narrativeDescription?: string;
  upgradeDescription?: string;
  slot?: string;
  slotName?: string;
  rarity?: string;
  itemSet?: string;
  setName?: string;
  goodsValue?: number;
  maxLevel?: number;
  rewardForDestroy?: number;
  icon?: string;
  prefab?: string;
  mapTag: string;
  mapObject: boolean;
  rmgPlaceable: boolean;
  directArtifact: boolean;
  scrollContainer: boolean;
  globallyBanned: boolean;
  sourcePaths: string[];
  warnings: string[];
}

export interface ArtifactCatalogStats {
  totalMapArtifacts: number;
  wearableArtifacts: number;
  scrollContainers: number;
  globallyBanned: number;
  withLocalizedName: number;
  bySlot: Record<string, number>;
  byRarity: Record<string, number>;
}

export interface ListArtifactOptionsInput {
  catalog: ArtifactCatalogIndex;
  search?: string;
  slots?: readonly string[];
  rarities?: readonly string[];
  itemSets?: readonly string[];
  includeScrollContainers?: boolean;
  includeGloballyBanned?: boolean;
}

export async function indexArtifactCatalog(paths: GameDataPaths, language = "english"): Promise<ArtifactCatalogIndex> {
  return indexArtifactCatalogFromSource(createFileSystemCoreDataSource(paths.extractedCoreDir), language);
}

export async function indexArtifactCatalogFromSource(source: CoreDataSource, language = "english"): Promise<ArtifactCatalogIndex> {
  const mapObjectPath = "DB/map/objects/6_artifacts.json";
  const logicPath = "DB/objects_logic/items/artifacts.json";
  const itemSetsPath = "DB/items/item_sets/item_sets.json";
  const dataPath = "DB/data.json";
  const itemFiles = await source.listJsonFiles("DB/items/items", true);
  const languageTextsDir = `Lang/${language}/texts`;

  const [mapObjects, logicObjects, itemSets, data, tokens] = await Promise.all([
    readJsonArray<CoreMapObject>(source, mapObjectPath),
    readJsonArray<CoreArtifactLogic>(source, logicPath),
    readJsonArray<CoreItemSet>(source, itemSetsPath),
    readDataConfig(source, dataPath),
    readLocalizationTokens(source, languageTextsDir),
  ]);
  const itemRecords = await readItemRecords(source, itemFiles);
  const logicById = new Map(logicObjects.map((item) => [item.id, item]));
  const itemById = new Map(itemRecords.map((item) => [item.id, item]));
  const setById = new Map(itemSets.map((item) => [item.id, item]));

  const entries = mapObjects
    .filter((item) => item.id && item.tag === "Artifact")
    .map((mapObject) =>
      buildArtifactEntry({
        mapObject,
        mapObjectPath: source.sourcePath(mapObjectPath),
        logic: logicById.get(mapObject.id),
        logicPath: source.sourcePath(logicPath),
        item: itemById.get(mapObject.id),
        itemSet: itemById.get(mapObject.id)?.itemSet ? setById.get(itemById.get(mapObject.id)?.itemSet ?? "") : undefined,
        itemSetsPath: source.sourcePath(itemSetsPath),
        bannedItems: new Set(data.bannedItems ?? []),
        tokens,
        languageTextsDir: source.sourcePath(languageTextsDir),
      }),
    )
    .sort(compareArtifactEntries);

  return {
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    entries,
    stats: buildStats(entries),
    language,
  };
}

export function listArtifactOptions(input: ListArtifactOptionsInput): ArtifactCatalogEntry[] {
  const search = input.search?.trim().toLocaleLowerCase();
  const slots = input.slots ? new Set(input.slots) : undefined;
  const rarities = input.rarities ? new Set(input.rarities) : undefined;
  const itemSets = input.itemSets ? new Set(input.itemSets) : undefined;

  return input.catalog.entries.filter((entry) => {
    if (!input.includeScrollContainers && entry.scrollContainer) {
      return false;
    }
    if (!input.includeGloballyBanned && entry.globallyBanned) {
      return false;
    }
    if (slots && (!entry.slot || !slots.has(entry.slot))) {
      return false;
    }
    if (rarities && (!entry.rarity || !rarities.has(entry.rarity))) {
      return false;
    }
    if (itemSets && (!entry.itemSet || !itemSets.has(entry.itemSet))) {
      return false;
    }
    if (!search) {
      return true;
    }
    return [entry.id, entry.name, entry.slotName, entry.rarity, entry.itemSet, entry.setName]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLocaleLowerCase().includes(search));
  });
}

function buildArtifactEntry(input: {
  mapObject: CoreMapObject;
  mapObjectPath: string;
  logic: CoreArtifactLogic | undefined;
  logicPath: string;
  item: IndexedItemRecord | undefined;
  itemSet: CoreItemSet | undefined;
  itemSetsPath: string;
  bannedItems: ReadonlySet<string>;
  tokens: Map<string, string>;
  languageTextsDir: string;
}): ArtifactCatalogEntry {
  const item = input.item;
  const scrollContainer = !item && input.mapObject.id.endsWith("_box");
  const globallyBanned = input.bannedItems.has(input.mapObject.id);
  const sourcePaths = new Set<string>([input.mapObjectPath, input.languageTextsDir]);
  const warnings: string[] = [];
  if (input.logic) {
    sourcePaths.add(input.logicPath);
  }
  if (item) {
    sourcePaths.add(item.sourcePath);
  } else if (!scrollContainer) {
    warnings.push("missing-item-record");
  }
  if (input.itemSet) {
    sourcePaths.add(input.itemSetsPath);
  }
  if (globallyBanned) {
    warnings.push("globally-banned-item");
  }

  const name = lookupText(input.tokens, item?.name ?? `${input.mapObject.id}_name`);
  if (item && !name) {
    warnings.push("missing-localized-name");
  }

  const result: ArtifactCatalogEntry = {
    id: input.mapObject.id,
    mapTag: input.mapObject.tag,
    mapObject: true,
    rmgPlaceable: true,
    directArtifact: Boolean(item),
    scrollContainer,
    globallyBanned,
    sourcePaths: [...sourcePaths].sort(),
    warnings,
  };

  assignIfDefined(result, "name", name);
  assignIfDefined(result, "description", lookupText(input.tokens, item?.description ?? `${input.mapObject.id}_description`));
  assignIfDefined(
    result,
    "narrativeDescription",
    lookupText(input.tokens, item?.narrativeDescription ?? `${input.mapObject.id}_narrativeDescription`),
  );
  assignIfDefined(result, "upgradeDescription", lookupText(input.tokens, item?.upgradeDescription));
  assignIfDefined(result, "slot", item?.slot_);
  assignIfDefined(result, "slotName", item?.slot_ ? lookupSlotName(input.tokens, item.slot_) : undefined);
  assignIfDefined(result, "rarity", item?.rarity);
  assignIfDefined(result, "itemSet", item?.itemSet);
  assignIfDefined(result, "setName", lookupText(input.tokens, input.itemSet?.name));
  assignIfDefined(result, "goodsValue", input.logic?.goodsValue ?? item?.goodsValue);
  assignIfDefined(result, "maxLevel", item?.maxLevel);
  assignIfDefined(result, "rewardForDestroy", item?.rewardForDestroy);
  assignIfDefined(result, "icon", item?.icon);
  assignIfDefined(result, "prefab", input.mapObject.prefs?.[0]);

  return result;
}

function buildStats(entries: readonly ArtifactCatalogEntry[]): ArtifactCatalogStats {
  const bySlot: Record<string, number> = {};
  const byRarity: Record<string, number> = {};
  for (const entry of entries) {
    bySlot[entry.slot ?? "<none>"] = (bySlot[entry.slot ?? "<none>"] ?? 0) + 1;
    byRarity[entry.rarity ?? "<none>"] = (byRarity[entry.rarity ?? "<none>"] ?? 0) + 1;
  }
  return {
    totalMapArtifacts: entries.length,
    wearableArtifacts: entries.filter((entry) => entry.directArtifact).length,
    scrollContainers: entries.filter((entry) => entry.scrollContainer).length,
    globallyBanned: entries.filter((entry) => entry.globallyBanned).length,
    withLocalizedName: entries.filter((entry) => entry.name).length,
    bySlot,
    byRarity,
  };
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

async function readItemRecords(source: CoreDataSource, itemFiles: readonly string[]): Promise<IndexedItemRecord[]> {
  const result: IndexedItemRecord[] = [];
  for (const file of itemFiles) {
    const items = await readJsonArray<CoreItemRecord>(source, file);
    for (const item of items) {
      if (item.id) {
        result.push({ ...item, sourcePath: source.sourcePath(file) });
      }
    }
  }
  return result;
}

async function readDataConfig(source: CoreDataSource, filePath: string): Promise<CoreDataConfig> {
  const json = await source.readJson<unknown>(filePath);
  return isRecord(json) ? (json as CoreDataConfig) : {};
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

function lookupText(tokens: ReadonlyMap<string, string>, key: string | undefined): string | undefined {
  return key ? tokens.get(key) : undefined;
}

function lookupSlotName(tokens: ReadonlyMap<string, string>, slot: string): string | undefined {
  return tokens.get(slotToTextKey(slot)) ?? tokens.get(slot);
}

function slotToTextKey(slot: string): string {
  if (slot === "item_slot") {
    return "item";
  }
  if (slot === "unic_slot") {
    return "unic";
  }
  return slot;
}

function compareArtifactEntries(left: ArtifactCatalogEntry, right: ArtifactCatalogEntry): number {
  return (left.name ?? left.id).localeCompare(right.name ?? right.id);
}

function assignIfDefined<K extends keyof ArtifactCatalogEntry>(
  target: ArtifactCatalogEntry,
  key: K,
  value: ArtifactCatalogEntry[K] | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface CoreMapObject {
  id: string;
  tag: string;
  prefs?: string[];
}

interface CoreArtifactLogic {
  id: string;
  goodsValue?: number;
}

interface CoreItemSet {
  id: string;
  name?: string;
}

interface CoreItemRecord {
  id: string;
  slot_?: string;
  rarity?: string;
  itemSet?: string;
  icon?: string;
  name?: string;
  description?: string;
  narrativeDescription?: string;
  upgradeDescription?: string;
  goodsValue?: number;
  maxLevel?: number;
  rewardForDestroy?: number;
}

interface IndexedItemRecord extends CoreItemRecord {
  sourcePath: string;
}

interface CoreDataConfig {
  bannedItems?: string[];
}
