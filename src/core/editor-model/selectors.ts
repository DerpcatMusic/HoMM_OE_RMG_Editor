import type { EditorSelection, ResolvedEditorSelection, RmgEditorModel, TemplateCard, TemplateModel, VariantModel } from "./editorModelTypes.js";

export function getTemplateModel(model: RmgEditorModel, templateId: string): TemplateModel | undefined {
  return model.templateModels.find((template) => template.id === templateId);
}

export function getTemplateCard(model: RmgEditorModel, templateId: string): TemplateCard | undefined {
  return model.templateCards.find((template) => template.id === templateId);
}

export function getVariantModel(template: TemplateModel, variantIndex: number): VariantModel | undefined {
  return template.variants.find((variant) => variant.variantIndex === variantIndex);
}

export function resolveEditorSelection(model: RmgEditorModel, selection: EditorSelection): ResolvedEditorSelection {
  const template = selection.templateId ? getTemplateModel(model, selection.templateId) : undefined;
  const variant = template && selection.variantIndex !== undefined ? getVariantModel(template, selection.variantIndex) : undefined;
  const node = variant && selection.nodeId ? variant.graph.nodes.find((candidate) => candidate.id === selection.nodeId) : undefined;
  const edge = variant && selection.edgeId ? variant.graph.edges.find((candidate) => candidate.id === selection.edgeId) : undefined;

  return {
    ...(template ? { template } : {}),
    ...(variant ? { variant } : {}),
    ...(node ? { node } : {}),
    ...(edge ? { edge } : {}),
  };
}

export function firstTemplateSelection(model: RmgEditorModel): EditorSelection {
  const template = model.templateModels[0];
  const variant = template?.variants[0];
  return {
    ...(template ? { templateId: template.id } : {}),
    ...(variant ? { variantIndex: variant.variantIndex } : {}),
  };
}

export function listTemplateCards(model: RmgEditorModel): TemplateCard[] {
  return [...model.templateCards].sort((a, b) => a.name.localeCompare(b.name));
}
