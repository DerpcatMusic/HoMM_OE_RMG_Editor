import type { ContentList, ContentPoolConfig, ContentWeight } from "../rmg/rmgTypes.js";
import type { CoreDataSource } from "./coreDataSource.js";

export interface GeneratedCoreCatalogs {
  contentPools: GeneratedContentPoolCatalogEntry[];
  contentLists: GeneratedContentListCatalogEntry[];
  factions: GeneratedFactionCatalogEntry[];
  biomes: GeneratedBiomeCatalogEntry[];
  heroes: GeneratedHeroCatalogEntry[];
  magics: GeneratedMagicCatalogEntry[];
  units: GeneratedUnitCatalogEntry[];
}

export interface GeneratedContentPoolCatalogEntry {
  id: string;
  sourcePath: string;
  groupCount: number;
  includeListCount: number;
  directContentCount: number;
  positiveDirectContentCount: number;
  banCount: number;
  hasValueDistribution: boolean;
  sampleContent: ContentWeight[];
}

export interface GeneratedContentListCatalogEntry {
  id: string;
  sourcePath: string;
  contentCount: number;
  positiveContentCount: number;
  biomeFilteredContentCount: number;
  sampleContent: ContentWeight[];
}

export interface GeneratedFactionCatalogEntry {
  id: string;
  playable: boolean;
  sourcePath?: string;
  name?: string;
  description?: string;
  icon?: string;
  biome?: string;
  resourceName?: string;
  totalHeroCount: number;
  heroCount: number;
  campaignHeroCount: number;
}

export interface GeneratedBiomeCatalogEntry {
  id: string;
  faction?: string;
  waterObject?: string;
}

export interface GeneratedHeroCatalogEntry {
  id: string;
  sourcePath: string;
  name?: string;
  icon?: string;
  faction?: string;
  nativeBiome?: string;
  classType?: string;
  skillsRollVariant?: string;
  costGold?: number;
  startLevel?: number;
  startSquadCount: number;
  campaign: boolean;
  globallyBanned: boolean;
}

export interface GeneratedMagicCatalogEntry {
  id: string;
  sourcePath: string;
  name?: string;
  school?: string;
  rank?: number;
  usedOnMap?: boolean;
  battleMagic: boolean;
  globallyBanned: boolean;
}

export interface GeneratedUnitCatalogEntry {
  id: string;
  sourcePath: string;
  name?: string;
  faction?: string;
  tier?: number;
  squadValue?: number;
  upgradeSid?: string;
  tags: string[];
  globallyBanned: boolean;
}

export async function generateCoreCatalogsFromSource(source: CoreDataSource, language = "english"): Promise<GeneratedCoreCatalogs> {
  const [tokens, data, generatorConfig, biomeConfig, contentPools, contentLists, heroes, magics, units, factionRecords] =
    await Promise.all([
      readLocalizationTokens(source, `Lang/${language}/texts`),
      readDataConfig(source),
      readRecord(source, "generator/generator_config.json"),
      readRecord(source, "DB/biomes_info.json"),
      readContentPools(source),
      readContentLists(source),
      readHeroes(source),
      readMagics(source),
      readUnits(source),
      readFactionRecords(source),
    ]);

  return {
    contentPools,
    contentLists,
    factions: buildFactions({ data, factionRecords, heroes, tokens }),
    biomes: buildBiomes(biomeConfig, generatorConfig),
    heroes: buildHeroes({ heroes, data, tokens }),
    magics: buildMagics({ magics, data, tokens }),
    units: buildUnits({ units, data, tokens }),
  };
}

async function readContentPools(source: CoreDataSource): Promise<GeneratedContentPoolCatalogEntry[]> {
  const files = await source.listJsonFiles("generator/content_pools", true);
  const entries: GeneratedContentPoolCatalogEntry[] = [];
  for (const file of files) {
    for (const pool of await readJsonArray<ContentPoolConfig>(source, file)) {
      if (!pool.name) {
        continue;
      }
      const groups = pool.groups ?? [];
      const directContent = groups.flatMap((group) => group.content ?? []);
      entries.push({
        id: pool.name,
        sourcePath: source.sourcePath(file),
        groupCount: groups.length,
        includeListCount: groups.reduce((count, group) => count + (group.includeLists?.length ?? 0), 0),
        directContentCount: directContent.length,
        positiveDirectContentCount: directContent.filter((item) => (item.weight ?? 0) > 0).length,
        banCount: pool.bans?.length ?? 0,
        hasValueDistribution: pool.valueDistribution !== undefined,
        sampleContent: directContent.slice(0, 8),
      });
    }
  }
  return entries.sort((left, right) => left.id.localeCompare(right.id));
}

async function readContentLists(source: CoreDataSource): Promise<GeneratedContentListCatalogEntry[]> {
  const files = await source.listJsonFiles("generator/content_lists", true);
  const entries: GeneratedContentListCatalogEntry[] = [];
  for (const file of files) {
    for (const list of await readJsonArray<ContentList>(source, file)) {
      if (!list.name) {
        continue;
      }
      const content = list.content ?? [];
      entries.push({
        id: list.name,
        sourcePath: source.sourcePath(file),
        contentCount: content.length,
        positiveContentCount: content.filter((item) => (item.weight ?? 0) > 0).length,
        biomeFilteredContentCount: content.filter((item) => typeof item.biome === "string").length,
        sampleContent: content.slice(0, 8),
      });
    }
  }
  return entries.sort((left, right) => left.id.localeCompare(right.id));
}

async function readFactionRecords(source: CoreDataSource): Promise<IndexedFactionRecord[]> {
  const files = await source.listJsonFiles("DB/fractions", false);
  const records: IndexedFactionRecord[] = [];
  for (const file of files) {
    for (const item of await readJsonArray<CoreFactionRecord>(source, file)) {
      if (item.id) {
        records.push({ ...item, sourcePath: source.sourcePath(file) });
      }
    }
  }
  return records;
}

function buildFactions(input: {
  data: CoreDataConfig;
  factionRecords: readonly IndexedFactionRecord[];
  heroes: readonly IndexedHeroRecord[];
  tokens: ReadonlyMap<string, string>;
}): GeneratedFactionCatalogEntry[] {
  const ids = new Set([...(input.data.fractions ?? []), ...input.factionRecords.map((record) => record.id)]);
  const playable = new Set(input.data.availableFractions ?? []);
  const recordsById = new Map(input.factionRecords.map((record) => [record.id, record]));
  const heroCounts = countBy(input.heroes, (hero) => hero.fraction);
  const campaignHeroCounts = countBy(
    input.heroes.filter((hero) => isCampaignHero(hero, input.data)),
    (hero) => hero.fraction,
  );
  const standardHeroCounts = countBy(
    input.heroes.filter((hero) => !isCampaignHero(hero, input.data)),
    (hero) => hero.fraction,
  );
  return [...ids]
    .sort((left, right) => left.localeCompare(right))
    .map((id) => {
      const record = recordsById.get(id);
      const entry: GeneratedFactionCatalogEntry = {
        id,
        playable: playable.has(id),
        totalHeroCount: heroCounts.get(id) ?? 0,
        heroCount: standardHeroCounts.get(id) ?? 0,
        campaignHeroCount: campaignHeroCounts.get(id) ?? 0,
      };
      assignIfDefined(entry, "sourcePath", record?.sourcePath);
      assignIfDefined(entry, "name", lookupText(input.tokens, record?.name ?? `${id}_name`));
      assignIfDefined(entry, "description", lookupText(input.tokens, record?.desc));
      assignIfDefined(entry, "icon", record?.icon);
      assignIfDefined(entry, "biome", record?.biome);
      assignIfDefined(entry, "resourceName", record?.resourceName);
      return entry;
    });
}

function buildBiomes(biomeConfig: Record<string, unknown>, generatorConfig: Record<string, unknown>): GeneratedBiomeCatalogEntry[] {
  const factionByBiome = readKeyValMap(biomeConfig.fractionsByBiome);
  const waterByBiome = readKeyValMap(generatorConfig.waterForBiome);
  const ids = new Set([...factionByBiome.keys(), ...waterByBiome.keys()]);
  return [...ids]
    .sort((left, right) => left.localeCompare(right))
    .map((id) => {
      const entry: GeneratedBiomeCatalogEntry = { id };
      assignIfDefined(entry, "faction", factionByBiome.get(id));
      assignIfDefined(entry, "waterObject", waterByBiome.get(id));
      return entry;
    });
}

async function readHeroes(source: CoreDataSource): Promise<IndexedHeroRecord[]> {
  const files = await source.listJsonFiles("DB/heroes", true);
  const records: IndexedHeroRecord[] = [];
  for (const file of files) {
    for (const item of await readJsonArray<CoreHeroRecord>(source, file)) {
      if (item.id) {
        records.push({ ...item, sourcePath: source.sourcePath(file) });
      }
    }
  }
  return records;
}

function buildHeroes(input: {
  heroes: readonly IndexedHeroRecord[];
  data: CoreDataConfig;
  tokens: ReadonlyMap<string, string>;
}): GeneratedHeroCatalogEntry[] {
  const bannedHeroes = new Set(input.data.bannedHeroes ?? []);
  return input.heroes
    .map((hero) => {
      const entry: GeneratedHeroCatalogEntry = {
        id: hero.id,
        sourcePath: hero.sourcePath,
        startSquadCount: hero.startSquad?.length ?? 0,
        campaign: isCampaignHero(hero, input.data),
        globallyBanned: bannedHeroes.has(hero.id),
      };
      assignIfDefined(entry, "name", lookupText(input.tokens, `${hero.id}_name`));
      assignIfDefined(entry, "icon", hero.icon);
      assignIfDefined(entry, "faction", hero.fraction);
      assignIfDefined(entry, "nativeBiome", hero.nativeBiome);
      assignIfDefined(entry, "classType", hero.classType);
      assignIfDefined(entry, "skillsRollVariant", hero.skillsRollVariant);
      assignIfDefined(entry, "costGold", hero.costGold);
      assignIfDefined(entry, "startLevel", hero.startLevel);
      return entry;
    })
    .sort((left, right) => (left.name ?? left.id).localeCompare(right.name ?? right.id));
}

async function readMagics(source: CoreDataSource): Promise<IndexedMagicRecord[]> {
  const files = await source.listJsonFiles("DB/magics", true);
  const records: IndexedMagicRecord[] = [];
  for (const file of files) {
    for (const item of await readJsonArray<CoreMagicRecord>(source, file)) {
      if (item.id) {
        records.push({ ...item, sourcePath: source.sourcePath(file) });
      }
    }
  }
  return records;
}

function buildMagics(input: {
  magics: readonly IndexedMagicRecord[];
  data: CoreDataConfig;
  tokens: ReadonlyMap<string, string>;
}): GeneratedMagicCatalogEntry[] {
  const bannedMagics = new Set(input.data.bannedMagics ?? []);
  return input.magics
    .map((magic) => {
      const entry: GeneratedMagicCatalogEntry = {
        id: magic.id,
        sourcePath: magic.sourcePath,
        battleMagic: magic.battleMagic !== undefined,
        globallyBanned: bannedMagics.has(magic.id),
      };
      assignIfDefined(entry, "name", lookupText(input.tokens, magic.name ?? `${magic.id}_name`));
      assignIfDefined(entry, "school", magic.school_);
      assignIfDefined(entry, "rank", magic.rank);
      assignIfDefined(entry, "usedOnMap", magic.usedOnMap);
      return entry;
    })
    .sort((left, right) => (left.name ?? left.id).localeCompare(right.name ?? right.id));
}

async function readUnits(source: CoreDataSource): Promise<IndexedUnitRecord[]> {
  const files = await source.listJsonFiles("DB/units/units_logics", true);
  const records: IndexedUnitRecord[] = [];
  for (const file of files) {
    for (const item of await readJsonArray<CoreUnitRecord>(source, file)) {
      if (item.id) {
        records.push({ ...item, sourcePath: source.sourcePath(file) });
      }
    }
  }
  return records;
}

function buildUnits(input: {
  units: readonly IndexedUnitRecord[];
  data: CoreDataConfig;
  tokens: ReadonlyMap<string, string>;
}): GeneratedUnitCatalogEntry[] {
  const bannedUnits = new Set(input.data.bannedUnits ?? []);
  return input.units
    .map((unit) => {
      const entry: GeneratedUnitCatalogEntry = {
        id: unit.id,
        sourcePath: unit.sourcePath,
        tags: unit.tags ?? [],
        globallyBanned: bannedUnits.has(unit.id),
      };
      assignIfDefined(entry, "name", lookupText(input.tokens, `${unit.id}_name`));
      assignIfDefined(entry, "faction", unit.fraction);
      assignIfDefined(entry, "tier", unit.tier);
      assignIfDefined(entry, "squadValue", unit.squadValue);
      assignIfDefined(entry, "upgradeSid", unit.upgradeSid);
      return entry;
    })
    .sort((left, right) => (left.name ?? left.id).localeCompare(right.name ?? right.id));
}

async function readRecord(source: CoreDataSource, filePath: string): Promise<Record<string, unknown>> {
  const json = await source.readJson<unknown>(filePath);
  return isRecord(json) ? json : {};
}

async function readDataConfig(source: CoreDataSource): Promise<CoreDataConfig> {
  return (await readRecord(source, "DB/data.json")) as CoreDataConfig;
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
  if (isRecord(value) && Array.isArray(value.data)) {
    return value.data.filter(isRecord) as T[];
  }
  return [];
}

function readKeyValMap(value: unknown): Map<string, string> {
  const entries = Array.isArray(value) ? value : isRecord(value) && Array.isArray(value.data) ? value.data : [];
  const result = new Map<string, string>();
  for (const entry of entries) {
    if (!isRecord(entry) || typeof entry.key !== "string" || typeof entry.val !== "string") {
      continue;
    }
    result.set(entry.key, entry.val);
  }
  return result;
}

function lookupText(tokens: ReadonlyMap<string, string>, key: string | undefined): string | undefined {
  return key ? tokens.get(key) : undefined;
}

function countBy<T>(items: readonly T[], getKey: (item: T) => string | undefined): Map<string, number> {
  const result = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    if (key) {
      result.set(key, (result.get(key) ?? 0) + 1);
    }
  }
  return result;
}

function isCampaignHero(hero: IndexedHeroRecord, data: CoreDataConfig): boolean {
  return (data.campaignHeroes ?? []).includes(hero.id) || hero.sourcePath.includes("/campaign");
}

function assignIfDefined<T extends object, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface CoreDataConfig {
  fractions?: string[];
  availableFractions?: string[];
  campaignHeroes?: string[];
  bannedHeroes?: string[];
  bannedMagics?: string[];
  bannedUnits?: string[];
}

interface CoreFactionRecord {
  id: string;
  name?: string;
  desc?: string;
  icon?: string;
  biome?: string;
  resourceName?: string;
}

interface IndexedFactionRecord extends CoreFactionRecord {
  sourcePath: string;
}

interface CoreHeroRecord {
  id: string;
  icon?: string;
  fraction?: string;
  nativeBiome?: string;
  classType?: string;
  skillsRollVariant?: string;
  costGold?: number;
  startLevel?: number;
  startSquad?: unknown[];
}

interface IndexedHeroRecord extends CoreHeroRecord {
  sourcePath: string;
}

interface CoreMagicRecord {
  id: string;
  name?: string;
  school_?: string;
  rank?: number;
  usedOnMap?: boolean;
  battleMagic?: unknown;
}

interface IndexedMagicRecord extends CoreMagicRecord {
  sourcePath: string;
}

interface CoreUnitRecord {
  id: string;
  fraction?: string;
  tier?: number;
  squadValue?: number;
  upgradeSid?: string;
  tags?: string[];
}

interface IndexedUnitRecord extends CoreUnitRecord {
  sourcePath: string;
}
