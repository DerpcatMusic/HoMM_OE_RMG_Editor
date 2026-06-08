export { defaultGameDataPaths, type GameDataPaths } from "./paths/pathConfig.js";
export { readJsonFile, listJsonFiles } from "./json/readJson.js";
export { stringifyRmgTemplate, writeRmgTemplateFile } from "./json/writeJson.js";
export type { JsonFile, JsonObject, JsonValue } from "./json/jsonTypes.js";

export * from "./rmg/enums.js";
export * from "./rmg/defaults.js";
export * from "./rmg/winConditions.js";
export type * from "./rmg/rmgTypes.js";

export { indexGameData, type GameDataIndex } from "./game-data/gameDataIndex.js";
export {
  indexArtifactCatalog,
  indexArtifactCatalogFromSource,
  listArtifactOptions,
  type ArtifactCatalogEntry,
  type ArtifactCatalogIndex,
  type ArtifactCatalogStats,
  type ListArtifactOptionsInput,
} from "./game-data/artifactCatalog.js";
export { createFileSystemCoreDataSource, createZipCoreDataSource, type CoreDataSource } from "./game-data/coreDataSource.js";
export {
  indexRmgContentCatalogFromSource,
  listRmgContentOptions,
  type ListRmgContentOptionsInput,
  type RmgContentCatalogEntry,
  type RmgContentCatalogIndex,
  type RmgContentCatalogStats,
} from "./game-data/contentCatalog.js";
export {
  refreshAssetVisualCatalog,
  scanTexture2DDirectory,
  type AssetTextureEntry,
  type AssetVisualCandidate,
  type AssetVisualMapping,
  type GeneratedAssetVisualCatalogFile,
  type RefreshAssetVisualCatalogInput,
  type VisualCatalogKind,
} from "./game-data/assetVisualCatalog.js";
export {
  refreshGeneratedCatalogs,
  type GeneratedArtifactCatalogFile,
  type GeneratedBiomesCatalogFile,
  type GeneratedCatalogFileInfo,
  type GeneratedCatalogManifest,
  type GeneratedContentListsCatalogFile,
  type GeneratedContentPoolsCatalogFile,
  type GeneratedCoreCatalogFile,
  type GeneratedFactionsCatalogFile,
  type GeneratedHeroesCatalogFile,
  type GeneratedMagicsCatalogFile,
  type GeneratedRmgContentCatalogFile,
  type GeneratedUnitsCatalogFile,
  type RefreshGeneratedCatalogsInput,
} from "./game-data/generatedCatalogs.js";
export {
  generateCoreCatalogsFromSource,
  type GeneratedBiomeCatalogEntry,
  type GeneratedContentListCatalogEntry,
  type GeneratedContentPoolCatalogEntry,
  type GeneratedCoreCatalogs,
  type GeneratedFactionCatalogEntry,
  type GeneratedHeroCatalogEntry,
  type GeneratedMagicCatalogEntry,
  type GeneratedUnitCatalogEntry,
} from "./game-data/coreCatalogs.js";
export { indexContentPools, type ContentPoolIndex } from "./game-data/contentPoolIndex.js";
export { indexContentLists, type ContentListIndex } from "./game-data/contentListIndex.js";
export { indexZoneLayouts, type ZoneLayoutIndex } from "./game-data/zoneLayoutIndex.js";
export {
  listContentPoolOptions,
  summarizeContentPool,
  type ContentPoolOption,
  type ListContentPoolOptionsInput,
} from "./game-data/contentPoolSummary.js";
export type { DuplicateName, IndexedByName, IndexedEntry } from "./game-data/namedIndex.js";

export { indexTemplates, type TemplateFile, type TemplateIndex } from "./indexers/templateIndex.js";

export { resolveTemplate } from "./resolver/resolveTemplate.js";
export type * from "./resolver/resolvedTypes.js";

export { buildRmgGraph } from "./graph/buildGraph.js";
export { connectionBehavior } from "./graph/connectionBehavior.js";
export { inferZoneRole } from "./graph/zoneRole.js";
export type * from "./graph/graphTypes.js";

export { buildEditorModel, templateModelId } from "./editor-model/buildEditorModel.js";
export {
  firstTemplateSelection,
  getTemplateCard,
  getTemplateModel,
  getVariantModel,
  listTemplateCards,
  resolveEditorSelection,
} from "./editor-model/selectors.js";
export type * from "./editor-model/editorModelTypes.js";
export * from "./editor-schema/index.js";
export * from "./editor-actions/index.js";

export * from "./mutations/index.js";

export {
  collectResolvedDiagnostics,
  expandContentCountLimit,
  validateGameDataIndex,
  validateResolvedTemplate,
  validateTemplateShape,
} from "./validation/validateTemplate.js";
export { validateSemanticPlayability, type SemanticValidationOptions } from "./validation/semanticValidation.js";
export { countDiagnostics, diagnostic } from "./validation/validationTypes.js";
export type { Diagnostic, DiagnosticSeverity } from "./validation/validationTypes.js";
