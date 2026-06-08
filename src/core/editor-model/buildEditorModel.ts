import { buildRmgGraph } from "../graph/buildGraph.js";
import type { GameDataIndex } from "../game-data/gameDataIndex.js";
import type { TemplateFile, TemplateIndex } from "../indexers/templateIndex.js";
import { resolveTemplate } from "../resolver/resolveTemplate.js";
import type { Diagnostic } from "../validation/validationTypes.js";
import { countDiagnostics } from "../validation/validationTypes.js";
import { validateGameDataIndex, validateResolvedTemplate } from "../validation/validateTemplate.js";
import type {
  DiagnosticCounts,
  EditorModelStats,
  RmgEditorModel,
  TemplateCard,
  TemplateModel,
  VariantModel,
} from "./editorModelTypes.js";

export interface BuildEditorModelInput {
  gameData: GameDataIndex;
  templates: TemplateIndex;
}

export function buildEditorModel(input: BuildEditorModelInput): RmgEditorModel {
  const diagnostics: Diagnostic[] = [...validateGameDataIndex(input.gameData)];
  const templateModels: TemplateModel[] = input.templates.templates.map((file) =>
    buildTemplateModel(file, input.gameData, diagnostics),
  );
  const templateCards = templateModels.map((model) => buildTemplateCard(model));

  return {
    gameData: input.gameData,
    templates: input.templates,
    templateCards,
    templateModels,
    diagnostics,
    stats: buildStats(input.gameData, templateModels, diagnostics),
  };
}

function buildTemplateModel(file: TemplateFile, gameData: GameDataIndex, globalDiagnostics: Diagnostic[]): TemplateModel {
  const resolved = resolveTemplate({
    template: file.template,
    sourcePath: file.sourcePath,
    gameData,
  });
  const templateDiagnostics = validateResolvedTemplate(resolved, gameData);
  globalDiagnostics.push(...templateDiagnostics);
  const templateId = templateModelId(file);
  const templateName = file.template.name ?? file.fileName;
  const variants: VariantModel[] = resolved.variants.map((variant) => ({
    templateId,
    variantIndex: variant.index,
    resolved: variant,
    graph: buildRmgGraph(variant, { templateName }),
    diagnostics: [
      ...variant.diagnostics,
      ...variant.zones.flatMap((zone) => zone.diagnostics),
      ...variant.connections.flatMap((connection) => connection.diagnostics),
    ],
  }));

  return {
    id: templateId,
    file,
    resolved,
    variants,
    diagnostics: templateDiagnostics,
  };
}

function buildTemplateCard(model: TemplateModel): TemplateCard {
  const zones = model.variants.reduce((total, variant) => total + variant.graph.nodes.length, 0);
  const connections = model.variants.reduce((total, variant) => total + variant.graph.edges.length, 0);
  const players = new Set<string>();

  for (const variant of model.variants) {
    for (const player of Object.keys(variant.graph.stats.playerRefs)) {
      players.add(player);
    }
  }

  return {
    id: model.id,
    fileName: model.file.fileName,
    sourcePath: model.file.sourcePath,
    name: model.file.template.name ?? model.file.fileName,
    ...(model.file.template.gameMode ? { gameMode: model.file.template.gameMode } : {}),
    ...(model.file.template.displayWinCondition ? { displayWinCondition: model.file.template.displayWinCondition } : {}),
    sizeX: model.file.template.sizeX ?? 0,
    sizeZ: model.file.template.sizeZ ?? 0,
    variants: model.variants.length,
    zones,
    connections,
    players: [...players].sort(),
    diagnostics: toCounts(model.diagnostics),
  };
}

function buildStats(gameData: GameDataIndex, templateModels: TemplateModel[], diagnostics: Diagnostic[]): EditorModelStats {
  return {
    templates: templateModels.length,
    variants: templateModels.reduce((total, model) => total + model.variants.length, 0),
    zones: templateModels.reduce(
      (total, model) => total + model.variants.reduce((variantTotal, variant) => variantTotal + variant.graph.nodes.length, 0),
      0,
    ),
    connections: templateModels.reduce(
      (total, model) => total + model.variants.reduce((variantTotal, variant) => variantTotal + variant.graph.edges.length, 0),
      0,
    ),
    contentPools: gameData.contentPools.byName.size,
    contentLists: gameData.contentLists.byName.size,
    zoneLayouts: gameData.zoneLayouts.byName.size,
    artifacts: gameData.artifacts.entries.length,
    rmgContent: gameData.rmgContent.entries.length,
    diagnostics: toCounts(diagnostics),
  };
}

export function templateModelId(file: TemplateFile): string {
  return file.fileName.replace(/\.rmg\.json$/u, "");
}

function toCounts(diagnostics: readonly Diagnostic[]): DiagnosticCounts {
  const counts = countDiagnostics(diagnostics);
  return {
    errors: counts.error,
    warnings: counts.warning,
    info: counts.info,
  };
}
