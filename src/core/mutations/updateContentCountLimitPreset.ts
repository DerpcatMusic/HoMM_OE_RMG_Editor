import type { ContentCountLimit, ContentCountLimitPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, recordValueChange, replaceStringReference, validateName } from "./helpers.js";
import type {
  ContentCountLimitPresetSelector,
  MutationChange,
  MutationResult,
  SelectedContentCountLimitPreset,
  TemplateMutationInput,
} from "./mutationTypes.js";

export interface ContentCountLimitPresetSettings {
  name?: string;
  limits?: ContentCountLimit[];
}

export interface UpdateContentCountLimitPresetInput extends TemplateMutationInput {
  preset: ContentCountLimitPresetSelector;
  settings: ContentCountLimitPresetSettings;
}

export function updateContentCountLimitPreset(input: UpdateContentCountLimitPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const selected = selectContentCountLimitPreset(template, input.preset, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.settings.name !== undefined && input.settings.name !== selected.preset.name) {
    if (!validateName(input.settings.name, `${selected.path}.name`, "contentCountLimitPreset", diagnostics)) {
      return buildMutationResult(template, changes, diagnostics);
    }
    const duplicateIndex = (template.contentCountLimits ?? []).findIndex(
      (preset, index) => index !== selected.presetIndex && preset.name === input.settings.name,
    );
    if (duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.contentCountLimitPreset.duplicateName",
          `Another content-count-limit preset already uses the name '${input.settings.name}'.`,
          `$.contentCountLimits[${duplicateIndex}].name`,
        ),
      );
      return buildMutationResult(template, changes, diagnostics);
    }
    const oldName = selected.preset.name;
    recordStringChange(
      selected.preset,
      "name",
      `${selected.path}.name`,
      input.settings.name,
      changes,
      "content-count-limit preset declaration",
    );
    if (oldName) {
      rewriteZoneContentCountLimitRefs(template, oldName, input.settings.name, changes);
    }
  }

  if (input.settings.limits !== undefined) {
    recordValueChange(
      selected.preset,
      "limits",
      `${selected.path}.limits`,
      input.settings.limits,
      changes,
      "content-count-limit preset updated",
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}

function selectContentCountLimitPreset(
  template: RmgTemplate,
  selector: ContentCountLimitPresetSelector,
  diagnostics: Diagnostic[],
): SelectedContentCountLimitPreset | undefined {
  const presets = template.contentCountLimits ?? [];
  const presetIndex =
    "presetIndex" in selector
      ? selector.presetIndex
      : presets.findIndex((preset) => preset.name === selector.presetName);
  const preset: ContentCountLimitPreset | undefined = presets[presetIndex];
  const path = `$.contentCountLimits[${presetIndex}]`;

  if (!preset) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentCountLimitPreset.missing",
        "presetIndex" in selector
          ? `Content-count-limit preset index ${selector.presetIndex} does not exist.`
          : `Content-count-limit preset '${selector.presetName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { preset, presetIndex, path };
}

function rewriteZoneContentCountLimitRefs(
  template: RmgTemplate,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      replaceStringReference(
        zone,
        "contentCountLimits",
        oldName,
        newName,
        `$.variants[${variantIndex}].zones[${zoneIndex}].contentCountLimits`,
        changes,
        "zone content-count-limit preset reference",
      );
    });
  });
}
