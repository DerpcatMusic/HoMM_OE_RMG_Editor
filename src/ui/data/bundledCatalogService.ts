import type { CoreArchiveCatalogSummary, CoreCatalogOption } from "../state/editorSession.js";
import contentPoolsJson from "../public/game-data/content-pools.json" with { type: "json" };
import contentListsJson from "../public/game-data/content-lists.json" with { type: "json" };
import factionsJson from "../public/game-data/factions.json" with { type: "json" };
import biomesJson from "../public/game-data/biomes.json" with { type: "json" };
import heroesJson from "../public/game-data/heroes.json" with { type: "json" };
import magicsJson from "../public/game-data/magics.json" with { type: "json" };
import unitsJson from "../public/game-data/units.json" with { type: "json" };
import rmgContentJson from "../public/game-data/rmg-content.json" with { type: "json" };
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
