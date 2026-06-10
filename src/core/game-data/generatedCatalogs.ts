import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { GameDataPaths } from "../paths/pathConfig.js";
import { createZipCoreDataSource } from "./coreDataSource.js";
import { indexArtifactCatalogFromSource, type ArtifactCatalogEntry, type ArtifactCatalogStats } from "./artifactCatalog.js";
import { indexRmgContentCatalogFromSource, type RmgContentCatalogEntry, type RmgContentCatalogStats } from "./contentCatalog.js";
import {
  generateCoreCatalogsFromSource,
  readContentPoolConfigs,
  readContentListConfigs,
  type GeneratedBiomeCatalogEntry,
  type GeneratedContentListCatalogEntry,
  type GeneratedContentPoolCatalogEntry,
  type GeneratedFactionCatalogEntry,
  type GeneratedHeroCatalogEntry,
  type GeneratedMagicCatalogEntry,
  type GeneratedUnitCatalogEntry,
} from "./coreCatalogs.js";

export interface RefreshGeneratedCatalogsInput {
  paths: GameDataPaths;
  language?: string;
}

export interface GeneratedCatalogManifest {
  generatedAt: string;
  language: string;
  coreZipPath: string;
  coreZipSize: number;
  coreZipMtimeMs: number;
  sourceHash: string;
  catalogs: {
    artifacts: GeneratedCatalogFileInfo;
    rmgContent: GeneratedCatalogFileInfo;
    contentPools: GeneratedCatalogFileInfo;
    contentLists: GeneratedCatalogFileInfo;
    factions: GeneratedCatalogFileInfo;
    biomes: GeneratedCatalogFileInfo;
    heroes: GeneratedCatalogFileInfo;
    magics: GeneratedCatalogFileInfo;
    units: GeneratedCatalogFileInfo;
    contentPoolConfigs: GeneratedCatalogFileInfo;
    contentListConfigs: GeneratedCatalogFileInfo;
  };
}

export interface GeneratedCatalogFileInfo {
  path: string;
  entries: number;
}

export interface GeneratedArtifactCatalogFile {
  language: string;
  generatedAt: string;
  sourceHash: string;
  stats: ArtifactCatalogStats;
  entries: ArtifactCatalogEntry[];
}

export interface GeneratedRmgContentCatalogFile {
  language: string;
  generatedAt: string;
  sourceHash: string;
  stats: RmgContentCatalogStats;
  entries: RmgContentCatalogEntry[];
}

export interface GeneratedCoreCatalogFile<TEntry> {
  language: string;
  generatedAt: string;
  sourceHash: string;
  entries: TEntry[];
}

export async function refreshGeneratedCatalogs(input: RefreshGeneratedCatalogsInput): Promise<GeneratedCatalogManifest> {
  const language = input.language ?? "english";
  const source = createZipCoreDataSource(input.paths.coreZipPath);
  const coreZipStat = await fs.stat(input.paths.coreZipPath);
  const sourceHash = hashSource(input.paths.coreZipPath, coreZipStat.size, coreZipStat.mtimeMs);
  const generatedAt = new Date().toISOString();
  const [artifacts, rmgContent, coreCatalogs, fullPoolConfigs, fullListConfigs] = await Promise.all([
    indexArtifactCatalogFromSource(source, language),
    indexRmgContentCatalogFromSource(source, language),
    generateCoreCatalogsFromSource(source, language),
    readContentPoolConfigs(source),
    readContentListConfigs(source),
  ]);

  await fs.mkdir(input.paths.generatedDataDir, { recursive: true });
  const artifactsPath = path.join(input.paths.generatedDataDir, "artifacts.json");
  const rmgContentPath = path.join(input.paths.generatedDataDir, "rmg-content.json");
  const contentPoolsPath = path.join(input.paths.generatedDataDir, "content-pools.json");
  const contentListsPath = path.join(input.paths.generatedDataDir, "content-lists.json");
  const factionsPath = path.join(input.paths.generatedDataDir, "factions.json");
  const biomesPath = path.join(input.paths.generatedDataDir, "biomes.json");
  const heroesPath = path.join(input.paths.generatedDataDir, "heroes.json");
  const magicsPath = path.join(input.paths.generatedDataDir, "magics.json");
  const unitsPath = path.join(input.paths.generatedDataDir, "units.json");
  const manifestPath = path.join(input.paths.generatedDataDir, "manifest.json");
  const poolConfigsPath = path.join(input.paths.generatedDataDir, "content-pool-configs.json");
  const listConfigsPath = path.join(input.paths.generatedDataDir, "content-list-configs.json");
  const artifactFile: GeneratedArtifactCatalogFile = {
    language,
    generatedAt,
    sourceHash,
    stats: artifacts.stats,
    entries: artifacts.entries,
  };
  const rmgContentFile: GeneratedRmgContentCatalogFile = {
    language,
    generatedAt,
    sourceHash,
    stats: rmgContent.stats,
    entries: rmgContent.entries,
  };

  await fs.writeFile(artifactsPath, `${JSON.stringify(artifactFile, null, 2)}\n`, "utf8");
  await fs.writeFile(rmgContentPath, `${JSON.stringify(rmgContentFile, null, 2)}\n`, "utf8");
  await writeCoreCatalogFile(contentPoolsPath, language, generatedAt, sourceHash, coreCatalogs.contentPools);
  await writeCoreCatalogFile(contentListsPath, language, generatedAt, sourceHash, coreCatalogs.contentLists);
  await writeCoreCatalogFile(factionsPath, language, generatedAt, sourceHash, coreCatalogs.factions);
  await writeCoreCatalogFile(biomesPath, language, generatedAt, sourceHash, coreCatalogs.biomes);
  await writeCoreCatalogFile(heroesPath, language, generatedAt, sourceHash, coreCatalogs.heroes);
  await writeCoreCatalogFile(magicsPath, language, generatedAt, sourceHash, coreCatalogs.magics);
  await writeCoreCatalogFile(unitsPath, language, generatedAt, sourceHash, coreCatalogs.units);
  await fs.writeFile(poolConfigsPath, `${JSON.stringify({ language, generatedAt, sourceHash, entries: [...fullPoolConfigs.values()] }, null, 2)}\n`, "utf8");
  await fs.writeFile(listConfigsPath, `${JSON.stringify({ language, generatedAt, sourceHash, entries: [...fullListConfigs.values()] }, null, 2)}\n`, "utf8");

  const manifest: GeneratedCatalogManifest = {
    generatedAt,
    language,
    coreZipPath: input.paths.coreZipPath,
    coreZipSize: coreZipStat.size,
    coreZipMtimeMs: coreZipStat.mtimeMs,
    sourceHash,
    catalogs: {
      artifacts: {
        path: artifactsPath,
        entries: artifacts.entries.length,
      },
      rmgContent: {
        path: rmgContentPath,
        entries: rmgContent.entries.length,
      },
      contentPools: {
        path: contentPoolsPath,
        entries: coreCatalogs.contentPools.length,
      },
      contentLists: {
        path: contentListsPath,
        entries: coreCatalogs.contentLists.length,
      },
      factions: {
        path: factionsPath,
        entries: coreCatalogs.factions.length,
      },
      biomes: {
        path: biomesPath,
        entries: coreCatalogs.biomes.length,
      },
      heroes: {
        path: heroesPath,
        entries: coreCatalogs.heroes.length,
      },
      magics: {
        path: magicsPath,
        entries: coreCatalogs.magics.length,
      },
      units: {
        path: unitsPath,
        entries: coreCatalogs.units.length,
      },
      contentPoolConfigs: {
        path: poolConfigsPath,
        entries: fullPoolConfigs.size,
      },
      contentListConfigs: {
        path: listConfigsPath,
        entries: fullListConfigs.size,
      },
    },
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return manifest;
}

async function writeCoreCatalogFile<TEntry>(
  filePath: string,
  language: string,
  generatedAt: string,
  sourceHash: string,
  entries: TEntry[],
): Promise<void> {
  const file: GeneratedCoreCatalogFile<TEntry> = {
    language,
    generatedAt,
    sourceHash,
    entries,
  };
  await fs.writeFile(filePath, `${JSON.stringify(file, null, 2)}\n`, "utf8");
}

function hashSource(coreZipPath: string, size: number, mtimeMs: number): string {
  return crypto.createHash("sha256").update(coreZipPath).update(String(size)).update(String(mtimeMs)).digest("hex");
}

export type GeneratedContentPoolsCatalogFile = GeneratedCoreCatalogFile<GeneratedContentPoolCatalogEntry>;
export type GeneratedContentListsCatalogFile = GeneratedCoreCatalogFile<GeneratedContentListCatalogEntry>;
export type GeneratedFactionsCatalogFile = GeneratedCoreCatalogFile<GeneratedFactionCatalogEntry>;
export type GeneratedBiomesCatalogFile = GeneratedCoreCatalogFile<GeneratedBiomeCatalogEntry>;
export type GeneratedHeroesCatalogFile = GeneratedCoreCatalogFile<GeneratedHeroCatalogEntry>;
export type GeneratedMagicsCatalogFile = GeneratedCoreCatalogFile<GeneratedMagicCatalogEntry>;
export type GeneratedUnitsCatalogFile = GeneratedCoreCatalogFile<GeneratedUnitCatalogEntry>;
