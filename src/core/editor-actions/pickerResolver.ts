import { getEditorField } from "../editor-schema/index.js";
import { listArtifactOptions } from "../game-data/artifactCatalog.js";
import { listRmgContentOptions } from "../game-data/contentCatalog.js";
import type { GameDataIndex } from "../game-data/gameDataIndex.js";
import { listContentPoolOptions } from "../game-data/contentPoolSummary.js";
import { PLAYER_REFS } from "../rmg/enums.js";
import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import type { EditorActionSelection } from "./editorActionTypes.js";

export interface ResolveEditorPickerInput {
  template: RmgTemplate;
  fieldId: string;
  selection?: EditorActionSelection;
  gameData?: GameDataIndex;
  search?: string;
  limit?: number;
  includeUnknownReferencedContent?: boolean;
}

export interface EditorPickerOption {
  id: string;
  label: string;
  source: "enum" | "template" | "core" | "catalog";
  detail?: string;
  value?: unknown;
  disabled?: boolean;
}

export interface ResolveEditorPickerResult {
  fieldId: string;
  options: EditorPickerOption[];
  diagnostics: Diagnostic[];
}

export function resolveEditorPicker(input: ResolveEditorPickerInput): ResolveEditorPickerResult {
  const diagnostics: Diagnostic[] = [];
  const field = getEditorField(input.fieldId);
  if (!field) {
    diagnostics.push(diagnostic("error", "editorPicker.field.unknown", `Unknown editor field '${input.fieldId}'.`, "$"));
    return { fieldId: input.fieldId, options: [], diagnostics };
  }

  let options: EditorPickerOption[] = [];
  const allowedValues = field.validation?.allowedValues;
  if (allowedValues && field.kind === "enum") {
    options = allowedValues.map((value) => ({ id: value, label: value, source: "enum", value }));
    return finalizePickerResult(input, options, diagnostics);
  }

  switch (field.validation?.reference) {
    case "player":
      options = PLAYER_REFS.map((value) => ({ id: value, label: value, source: "enum", value }));
      break;
    case "zone":
      options = listZones(input.template, input.selection?.variantIndex);
      break;
    case "connection":
      options = listConnections(input.template, input.selection?.variantIndex);
      break;
    case "mainObjectIndex":
      options = listMainObjects(input.template, input.selection);
      break;
    case "contentPool":
      options = listContentPools(input);
      break;
    case "contentList":
      options = listContentLists(input);
      break;
    case "zoneLayout":
      options = listZoneLayouts(input);
      break;
    case "mandatoryContentPreset":
      options = (input.template.mandatoryContent ?? [])
        .map((preset, index) => optionFromName(preset.name, "template", `mandatoryContent[${index}]`))
        .filter((option): option is EditorPickerOption => Boolean(option));
      break;
    case "contentCountLimitPreset":
      options = (input.template.contentCountLimits ?? [])
        .map((preset, index) => optionFromName(preset.name, "template", `contentCountLimits[${index}]`))
        .filter((option): option is EditorPickerOption => Boolean(option));
      break;
    case "rmgContentSid":
      options = listRmgContent(input);
      break;
    case "artifactSid":
      options = listArtifacts(input);
      break;
    default:
      if (field.picker?.source === "enum" && allowedValues) {
        options = allowedValues.map((value) => ({ id: value, label: value, source: "enum", value }));
      }
      break;
  }

  if (requiresGameData(field.validation?.reference) && !input.gameData) {
    diagnostics.push(
      diagnostic(
        "warning",
        "editorPicker.gameDataMissing",
        `Picker for field '${input.fieldId}' needs GameDataIndex for complete catalog options.`,
        field.path,
      ),
    );
  }

  return finalizePickerResult(input, options, diagnostics);
}

function finalizePickerResult(
  input: ResolveEditorPickerInput,
  options: EditorPickerOption[],
  diagnostics: Diagnostic[],
): ResolveEditorPickerResult {
  const search = input.search?.trim().toLocaleLowerCase();
  const filtered = search
    ? options.filter((option) => [option.id, option.label, option.detail].some((value) => value?.toLocaleLowerCase().includes(search)))
    : options;
  return {
    fieldId: input.fieldId,
    options: filtered.slice(0, input.limit ?? filtered.length),
    diagnostics,
  };
}

function listZones(template: RmgTemplate, variantIndex: number | undefined): EditorPickerOption[] {
  const zones = variantIndex === undefined ? [] : template.variants?.[variantIndex]?.zones ?? [];
  return zones
    .map((zone, index) => optionFromName(zone.name, "template", `zones[${index}]`))
    .filter((option): option is EditorPickerOption => Boolean(option));
}

function listConnections(template: RmgTemplate, variantIndex: number | undefined): EditorPickerOption[] {
  const connections = variantIndex === undefined ? [] : template.variants?.[variantIndex]?.connections ?? [];
  return connections
    .map((connection, index) => optionFromName(connection.name, "template", `connections[${index}]`))
    .filter((option): option is EditorPickerOption => Boolean(option));
}

function listMainObjects(template: RmgTemplate, selection: EditorActionSelection | undefined): EditorPickerOption[] {
  if (selection?.variantIndex === undefined || !selection.zone) {
    return [];
  }
  const zones = template.variants?.[selection.variantIndex]?.zones ?? [];
  const zoneSelector = selection.zone;
  const zoneIndex = "zoneIndex" in zoneSelector
    ? zoneSelector.zoneIndex
    : zones.findIndex((zone) => zone.name === zoneSelector.zoneName);
  return (zones[zoneIndex]?.mainObjects ?? []).map((mainObject, index) => ({
    id: String(index),
    label: `${index}: ${mainObject.type ?? "MainObject"}`,
    source: "template",
    value: index,
  }));
}

function listContentPools(input: ResolveEditorPickerInput): EditorPickerOption[] {
  const localOptions = (input.template.contentPools ?? [])
    .map((pool, index) => optionFromName(pool.name, "template", `contentPools[${index}]`))
    .filter((option): option is EditorPickerOption => Boolean(option));
  if (!input.gameData) {
    return localOptions;
  }
  const coreOptions = listContentPoolOptions({ gameData: input.gameData, sampleSize: 3 })
    .filter((option) => option.source === "core")
    .map((option) => ({
      id: option.id,
      label: option.id,
      source: "core" as const,
      detail: `${option.groupCount} groups, ${option.directContentCount} direct entries`,
      value: option.id,
    }));
  return [...localOptions, ...coreOptions];
}

function listContentLists(input: ResolveEditorPickerInput): EditorPickerOption[] {
  const localOptions = (input.template.contentLists ?? [])
    .map((list, index) => optionFromName(list.name, "template", `contentLists[${index}]`))
    .filter((option): option is EditorPickerOption => Boolean(option));
  if (!input.gameData) {
    return localOptions;
  }
  const coreOptions = [...input.gameData.contentLists.byName.values()].map((entry) => ({
    id: entry.name,
    label: entry.name,
    source: "core" as const,
    detail: entry.sourcePath,
    value: entry.name,
  }));
  return [...localOptions, ...coreOptions].sort((left, right) => left.id.localeCompare(right.id));
}

function listZoneLayouts(input: ResolveEditorPickerInput): EditorPickerOption[] {
  const localOptions = (input.template.zoneLayouts ?? [])
    .map((layout, index) => optionFromName(layout.name, "template", `zoneLayouts[${index}]`))
    .filter((option): option is EditorPickerOption => Boolean(option));
  if (!input.gameData) {
    return localOptions;
  }
  const coreOptions = [...input.gameData.zoneLayouts.byName.values()].map((entry) => ({
    id: entry.name,
    label: entry.name,
    source: "core" as const,
    detail: entry.sourcePath,
    value: entry.name,
  }));
  return [...localOptions, ...coreOptions].sort((left, right) => left.id.localeCompare(right.id));
}

function listRmgContent(input: ResolveEditorPickerInput): EditorPickerOption[] {
  if (!input.gameData) {
    return [];
  }
  const optionsInput: Parameters<typeof listRmgContentOptions>[0] = {
    catalog: input.gameData.rmgContent,
    includeUnknownReferenced: input.includeUnknownReferencedContent ?? false,
  };
  if (input.search !== undefined) {
    optionsInput.search = input.search;
  }
  return listRmgContentOptions(optionsInput).map((entry) => ({
    id: entry.sid,
    label: entry.name ?? entry.sid,
    source: "catalog" as const,
    detail: [entry.kind, entry.tag, entry.biome].filter(Boolean).join(" / "),
    value: entry.sid,
    disabled: !entry.rmgPlaceable,
  }));
}

function listArtifacts(input: ResolveEditorPickerInput): EditorPickerOption[] {
  if (!input.gameData) {
    return [];
  }
  const optionsInput: Parameters<typeof listArtifactOptions>[0] = { catalog: input.gameData.artifacts };
  if (input.search !== undefined) {
    optionsInput.search = input.search;
  }
  return listArtifactOptions(optionsInput).map((entry) => ({
    id: entry.id,
    label: entry.name ?? entry.id,
    source: "catalog" as const,
    detail: [entry.slotName ?? entry.slot, entry.rarity, entry.setName].filter(Boolean).join(" / "),
    value: entry.id,
    disabled: !entry.rmgPlaceable,
  }));
}

function optionFromName(
  name: string | undefined,
  source: EditorPickerOption["source"],
  detail?: string,
): EditorPickerOption | undefined {
  if (!name) {
    return undefined;
  }
  const option: EditorPickerOption = {
    id: name,
    label: name,
    source,
    value: name,
  };
  if (detail) {
    option.detail = detail;
  }
  return option;
}

function requiresGameData(reference: string | undefined): boolean {
  return reference === "contentPool" || reference === "contentList" || reference === "zoneLayout" || reference === "rmgContentSid" || reference === "artifactSid";
}
