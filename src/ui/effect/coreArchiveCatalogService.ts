import { Effect } from "effect";
import { generateCoreCatalogsFromSource } from "../../core/game-data/coreCatalogs.js";
import { indexRmgContentCatalogFromSource } from "../../core/game-data/contentCatalog.js";
import type { CoreArchiveCatalogSummary } from "../state/editorSession.js";
import { createBrowserZipCoreDataSource } from "./browserZipCoreDataSource.js";
import { CoreArchiveError } from "./errors.js";

export function parseCoreArchiveCatalogSummaryEffect(
  file: File,
): Effect.Effect<CoreArchiveCatalogSummary, CoreArchiveError, never> {
  return Effect.gen(function* () {
    const source = yield* createBrowserZipCoreDataSource(file);
    const catalogs = yield* Effect.tryPromise({
      try: () => generateCoreCatalogsFromSource(source),
      catch: (cause) => new CoreArchiveError({ message: "Core catalog generation failed.", cause }),
    });
    const rmgContent = yield* Effect.tryPromise({
      try: () => indexRmgContentCatalogFromSource(source),
      catch: (cause) => new CoreArchiveError({ message: "RMG content catalog indexing failed.", cause }),
    });
    const contentPoolOptions = catalogs.contentPools.map((pool) => ({
      id: pool.id,
      label: `${pool.id} (${pool.groupCount} groups, ${pool.positiveDirectContentCount} content)`,
    }));
    return {
      contentPools: catalogs.contentPools.length,
      contentLists: catalogs.contentLists.length,
      factions: catalogs.factions.length,
      biomes: catalogs.biomes.length,
      heroes: catalogs.heroes.length,
      magics: catalogs.magics.length,
      units: catalogs.units.length,
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
      biomeOptions: catalogs.biomes.map((biome) => ({
        id: biome.id,
        label: biome.faction ? `${biome.id} (${biome.faction})` : biome.id,
      })),
      factionOptions: catalogs.factions.map((faction) => ({
        id: faction.id,
        label: faction.name ? `${faction.name} (${faction.id})` : faction.id,
      })),
    };
  });
}

function isUnguardedContentPoolOption(option: { id: string; label: string }): boolean {
  return `${option.id} ${option.label}`.toLocaleLowerCase().includes("unguarded");
}

function isResourceContentPoolOption(option: { id: string; label: string }): boolean {
  const normalized = `${option.id} ${option.label}`.toLocaleLowerCase();
  return normalized.includes("resources") || normalized.includes("resource_pool");
}

function isGuardedContentPoolOption(option: { id: string; label: string }): boolean {
  return !isUnguardedContentPoolOption(option) && !isResourceContentPoolOption(option);
}
