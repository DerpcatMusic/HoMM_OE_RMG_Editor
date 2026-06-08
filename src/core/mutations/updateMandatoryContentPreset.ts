import type { MandatoryContent, MandatoryContentPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, recordValueChange, replaceStringReference, validateName } from "./helpers.js";
import type {
  MandatoryContentPresetSelector,
  MutationChange,
  MutationResult,
  SelectedMandatoryContentPreset,
  TemplateMutationInput,
} from "./mutationTypes.js";

export interface MandatoryContentPresetSettings {
  name?: string;
  content?: MandatoryContent[];
}

export interface UpdateMandatoryContentPresetInput extends TemplateMutationInput {
  preset: MandatoryContentPresetSelector;
  settings: MandatoryContentPresetSettings;
}

export function updateMandatoryContentPreset(input: UpdateMandatoryContentPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const selected = selectMandatoryContentPreset(template, input.preset, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.settings.name !== undefined && input.settings.name !== selected.preset.name) {
    if (!validateName(input.settings.name, `${selected.path}.name`, "mandatoryContentPreset", diagnostics)) {
      return buildMutationResult(template, changes, diagnostics);
    }
    const duplicateIndex = (template.mandatoryContent ?? []).findIndex(
      (preset, index) => index !== selected.presetIndex && preset.name === input.settings.name,
    );
    if (duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.mandatoryContentPreset.duplicateName",
          `Another mandatory-content preset already uses the name '${input.settings.name}'.`,
          `$.mandatoryContent[${duplicateIndex}].name`,
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
      "mandatory-content preset declaration",
    );
    if (oldName) {
      rewriteZoneMandatoryContentRefs(template, oldName, input.settings.name, changes);
    }
  }

  if (input.settings.content !== undefined) {
    recordValueChange(
      selected.preset,
      "content",
      `${selected.path}.content`,
      input.settings.content,
      changes,
      "mandatory-content preset updated",
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}

function selectMandatoryContentPreset(
  template: RmgTemplate,
  selector: MandatoryContentPresetSelector,
  diagnostics: Diagnostic[],
): SelectedMandatoryContentPreset | undefined {
  const presets = template.mandatoryContent ?? [];
  const presetIndex =
    "presetIndex" in selector
      ? selector.presetIndex
      : presets.findIndex((preset) => preset.name === selector.presetName);
  const preset: MandatoryContentPreset | undefined = presets[presetIndex];
  const path = `$.mandatoryContent[${presetIndex}]`;

  if (!preset) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.missing",
        "presetIndex" in selector
          ? `Mandatory-content preset index ${selector.presetIndex} does not exist.`
          : `Mandatory-content preset '${selector.presetName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { preset, presetIndex, path };
}

function rewriteZoneMandatoryContentRefs(
  template: RmgTemplate,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      replaceStringReference(
        zone,
        "mandatoryContent",
        oldName,
        newName,
        `$.variants[${variantIndex}].zones[${zoneIndex}].mandatoryContent`,
        changes,
        "zone mandatory-content preset reference",
      );
    });
  });
}
