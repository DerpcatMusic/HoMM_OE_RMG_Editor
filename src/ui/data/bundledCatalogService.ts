import type { CoreArchiveCatalogSummary, CoreCatalogOption } from "../state/editorSession.js";

interface CatalogFile<T> {
  language: string;
  generatedAt: string;
  sourceHash: string;
  entries: T[];
}

interface ContentPoolEntry {
  id: string;
  groupCount: number;
  positiveDirectContentCount: number;
}

interface FactionEntry {
  id: string;
  name?: string;
}

interface BiomeEntry {
  id: string;
  faction?: string;
}

interface RmgContentEntry {
  sid: string;
  name?: string;
  tag?: string;
  metaType?: string;
}

async function fetchCatalog<T>(path: string): Promise<CatalogFile<T>> {
  const response = await fetch(`/game-data/${path}`);
  if (!response.ok) throw new Error(`Failed to fetch ${path}: ${response.status}`);
  return response.json() as Promise<CatalogFile<T>>;
}

export async function fetchBundledCatalogSummary(): Promise<CoreArchiveCatalogSummary> {
  const [pools, lists, factions, biomes, _heroes, _magics, _units, rmgContent] = await Promise.all([
    fetchCatalog<ContentPoolEntry>("content-pools.json"),
    fetchCatalog<unknown>("content-lists.json"),
    fetchCatalog<FactionEntry>("factions.json"),
    fetchCatalog<BiomeEntry>("biomes.json"),
    fetchCatalog<unknown>("heroes.json"),
    fetchCatalog<unknown>("magics.json"),
    fetchCatalog<unknown>("units.json"),
    fetchCatalog<RmgContentEntry>("rmg-content.json"),
  ]);

  const contentPoolOptions = pools.entries.map((pool) => ({
    id: pool.id,
    label: `${pool.id} (${pool.groupCount} groups, ${pool.positiveDirectContentCount} content)`,
  }));

  return {
    contentPools: pools.entries.length,
    contentLists: lists.entries.length,
    factions: factions.entries.length,
    biomes: biomes.entries.length,
    heroes: _heroes.entries.length,
    magics: _magics.entries.length,
    units: _units.entries.length,
    rmgContent: rmgContent.entries.length,
    contentPoolOptions,
    guardedContentPoolOptions: contentPoolOptions.filter(isGuardedContentPoolOption),
    unguardedContentPoolOptions: contentPoolOptions.filter(isUnguardedContentPoolOption),
    resourceContentPoolOptions: contentPoolOptions.filter(isResourceContentPoolOption),
    rmgContentOptions: rmgContent.entries.map((content) => ({
      id: content.sid,
      label: [
        content.name ? `${content.name} (${content.sid})` : content.sid,
        content.tag,
        content.metaType,
      ].filter(Boolean).join(" / "),
    })),
    biomeOptions: biomes.entries.map((biome) => ({
      id: biome.id,
      label: biome.faction ? `${biome.id} (${biome.faction})` : biome.id,
    })),
    factionOptions: factions.entries.map((faction) => ({
      id: faction.id,
      label: faction.name ? `${faction.name} (${faction.id})` : faction.id,
    })),
  };
}

function isUnguardedContentPoolOption(option: CoreCatalogOption): boolean {
  return `${option.id} ${option.label}`.toLocaleLowerCase().includes("unguarded");
}

function isResourceContentPoolOption(option: CoreCatalogOption): boolean {
  const normalized = `${option.id} ${option.label}`.toLocaleLowerCase();
  return normalized.includes("resources") || normalized.includes("resource_pool");
}

function isGuardedContentPoolOption(option: CoreCatalogOption): boolean {
  return !isUnguardedContentPoolOption(option) && !isResourceContentPoolOption(option);
}
