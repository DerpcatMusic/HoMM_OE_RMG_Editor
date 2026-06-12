import type { CoreArchiveCatalogSummary, CoreCatalogOption } from "../state/editorSession.js";
import type { ContentPoolConfig, ContentList } from "../../core/rmg/rmgTypes.js";
import contentPoolsJson from "./game-data/content-pools.json" with { type: "json" };
import contentListsJson from "./game-data/content-lists.json" with { type: "json" };
import contentPoolConfigsJson from "./game-data/content-pool-configs.json" with { type: "json" };
import contentListConfigsJson from "./game-data/content-list-configs.json" with { type: "json" };
import factionsJson from "./game-data/factions.json" with { type: "json" };
import biomesJson from "./game-data/biomes.json" with { type: "json" };
import heroesJson from "./game-data/heroes.json" with { type: "json" };
import magicsJson from "./game-data/magics.json" with { type: "json" };
import unitsJson from "./game-data/units.json" with { type: "json" };
import rmgContentJson from "./game-data/rmg-content.json" with { type: "json" };
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
  variantCount?: number;
  sourcePaths?: string[];
}
export function getBundledCatalogSummary(): CoreArchiveCatalogSummary {
  const pools = contentPoolsJson as CatalogFile<ContentPoolEntry>;
  const lists = contentListsJson as CatalogFile<unknown>;
  const factions = factionsJson as CatalogFile<FactionEntry>;
  const biomes = biomesJson as CatalogFile<BiomeEntry>;
  const heroes = heroesJson as CatalogFile<unknown>;
  const magics = magicsJson as CatalogFile<unknown>;
  const units = unitsJson as CatalogFile<unknown>;
  const rmgContent = rmgContentJson as CatalogFile<RmgContentEntry>;
  const contentPoolOptions = pools.entries.map((pool) => ({
    id: pool.id,
    label: `${pool.id} (${pool.groupCount} groups, ${pool.positiveDirectContentCount} content)`,
  }));
  return {
    contentPools: pools.entries.length,
    contentLists: lists.entries.length,
    factions: factions.entries.length,
    biomes: biomes.entries.length,
    heroes: heroes.entries.length,
    magics: magics.entries.length,
    units: units.entries.length,
    rmgContent: rmgContent.entries.length,
    contentPoolOptions,
    guardedContentPoolOptions: contentPoolOptions.filter(isGuardedContentPoolOption),
    unguardedContentPoolOptions: contentPoolOptions.filter(isUnguardedContentPoolOption),
    resourceContentPoolOptions: contentPoolOptions.filter(isResourceContentPoolOption),
    rmgContentOptions: rmgContent.entries.map((content) => {
      const category = [content.tag, content.metaType].filter(Boolean).join(" / ");
      return {
        id: content.sid,
        label: content.name ? `${content.name} (${content.sid})` : content.sid,
        ...(category ? { category } : {}),
        ...(content.variantCount !== undefined ? { variantCount: content.variantCount } : {}),
        ...(content.sourcePaths ? { sourcePaths: content.sourcePaths } : {}),
      };
    }),
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
export function getBundledContentPoolIndex(): Map<string, ContentPoolConfig> {
  const configs = contentPoolConfigsJson as CatalogFile<ContentPoolConfig>;
  const map = new Map<string, ContentPoolConfig>();
  for (const pool of configs.entries) {
    if (pool.name && !map.has(pool.name)) {
      map.set(pool.name, pool);
    }
  }
  return map;
}
export function getBundledContentListIndex(): Map<string, ContentList> {
  const configs = contentListConfigsJson as CatalogFile<ContentList>;
  const map = new Map<string, ContentList>();
  for (const list of configs.entries) {
    if (list.name && !map.has(list.name)) {
      map.set(list.name, list);
    }
  }
  return map;
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
