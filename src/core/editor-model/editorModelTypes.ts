import type { GameDataIndex } from "../game-data/gameDataIndex.js";
import type { TemplateFile, TemplateIndex } from "../indexers/templateIndex.js";
import type { ResolvedTemplate, ResolvedVariant } from "../resolver/resolvedTypes.js";
import type { RmgGraph, RmgGraphEdge, RmgGraphNode } from "../graph/graphTypes.js";
import type { Diagnostic } from "../validation/validationTypes.js";

export interface RmgEditorModel {
  gameData: GameDataIndex;
  templates: TemplateIndex;
  templateCards: TemplateCard[];
  templateModels: TemplateModel[];
  diagnostics: Diagnostic[];
  stats: EditorModelStats;
}

export interface TemplateCard {
  id: string;
  fileName: string;
  sourcePath: string;
  name: string;
  gameMode?: string;
  displayWinCondition?: string;
  sizeX: number;
  sizeZ: number;
  variants: number;
  zones: number;
  connections: number;
  players: string[];
  diagnostics: DiagnosticCounts;
}

export interface TemplateModel {
  id: string;
  file: TemplateFile;
  resolved: ResolvedTemplate;
  variants: VariantModel[];
  diagnostics: Diagnostic[];
}

export interface VariantModel {
  templateId: string;
  variantIndex: number;
  resolved: ResolvedVariant;
  graph: RmgGraph;
  diagnostics: Diagnostic[];
}

export interface EditorModelStats {
  templates: number;
  variants: number;
  zones: number;
  connections: number;
  contentPools: number;
  contentLists: number;
  zoneLayouts: number;
  artifacts: number;
  rmgContent: number;
  diagnostics: DiagnosticCounts;
}

export interface DiagnosticCounts {
  errors: number;
  warnings: number;
  info: number;
}

export interface EditorSelection {
  templateId?: string;
  variantIndex?: number;
  nodeId?: string;
  edgeId?: string;
}

export interface ResolvedEditorSelection {
  template?: TemplateModel;
  variant?: VariantModel;
  node?: RmgGraphNode;
  edge?: RmgGraphEdge;
}
