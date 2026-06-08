import path from "node:path";

export interface GameDataPaths {
  projectRoot: string;
  liveTemplatesDir: string;
  coreZipPath: string;
  generatedDataDir: string;
  extractedCoreDir: string;
  langDir: string;
  contentPoolsDir: string;
  contentListsDir: string;
  zoneLayoutsDir: string;
  encounterTemplatesDir: string;
  dbDir: string;
}

export function defaultGameDataPaths(projectRoot = process.cwd()): GameDataPaths {
  const extractedCoreDir = path.join(projectRoot, "extracted", "Core");
  const generatorDir = path.join(extractedCoreDir, "generator");

  return {
    projectRoot,
    liveTemplatesDir: path.join(projectRoot, "external", "map_templates"),
    coreZipPath: path.join(projectRoot, "external", "Core.zip"),
    generatedDataDir: path.join(projectRoot, ".cache", "game-data"),
    extractedCoreDir,
    langDir: path.join(extractedCoreDir, "Lang"),
    contentPoolsDir: path.join(generatorDir, "content_pools"),
    contentListsDir: path.join(generatorDir, "content_lists"),
    zoneLayoutsDir: path.join(generatorDir, "zone_layouts"),
    encounterTemplatesDir: path.join(generatorDir, "encounter_templates"),
    dbDir: path.join(extractedCoreDir, "DB"),
  };
}
