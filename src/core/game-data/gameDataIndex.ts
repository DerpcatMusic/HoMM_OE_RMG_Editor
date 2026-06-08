import type { GameDataPaths } from "../paths/pathConfig.js";
import { indexArtifactCatalog, type ArtifactCatalogIndex } from "./artifactCatalog.js";
import { createFileSystemCoreDataSource } from "./coreDataSource.js";
import { indexContentLists, type ContentListIndex } from "./contentListIndex.js";
import { indexRmgContentCatalogFromSource, type RmgContentCatalogIndex } from "./contentCatalog.js";
import { indexContentPools, type ContentPoolIndex } from "./contentPoolIndex.js";
import { indexZoneLayouts, type ZoneLayoutIndex } from "./zoneLayoutIndex.js";

export interface GameDataIndex {
  paths: GameDataPaths;
  contentPools: ContentPoolIndex;
  contentLists: ContentListIndex;
  zoneLayouts: ZoneLayoutIndex;
  artifacts: ArtifactCatalogIndex;
  rmgContent: RmgContentCatalogIndex;
}

export async function indexGameData(paths: GameDataPaths): Promise<GameDataIndex> {
  const coreSource = createFileSystemCoreDataSource(paths.extractedCoreDir);
  const [contentPools, contentLists, zoneLayouts, artifacts, rmgContent] = await Promise.all([
    indexContentPools(paths.contentPoolsDir),
    indexContentLists(paths.contentListsDir),
    indexZoneLayouts(paths.zoneLayoutsDir),
    indexArtifactCatalog(paths),
    indexRmgContentCatalogFromSource(coreSource),
  ]);

  return {
    paths,
    contentPools,
    contentLists,
    zoneLayouts,
    artifacts,
    rmgContent,
  };
}
