import type { MandatoryContentPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, replaceStringReference, validateName } from "./helpers.js";
import type {
  MandatoryContentPresetSelector,
  MutationChange,
  MutationResult,
  SelectedMandatoryContentPreset,
  TemplateMutationInput,
} from "./mutationTypes.js";

export interface RenameMandatoryContentPresetInput extends TemplateMutationInput {
  preset: MandatoryContentPresetSelector;
  newName: string;
}

export function renameMandatoryContentPreset(input: RenameMandatoryContentPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const selected = selectMandatoryContentPreset(template, input.preset, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!validateName(input.newName, `${selected.path}.name`, "mandatoryContentPreset", diagnostics)) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const oldName = selected.preset.name;
  if (!oldName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.oldNameMissing",
        "Selected mandatory-content preset has no name to rename.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const duplicateIndex = (template.mandatoryContent ?? []).findIndex(
    (preset, index) => index !== selected.presetIndex && preset.name === input.newName,
  );
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.duplicateName",
        `Another mandatory-content preset already uses the name '${input.newName}'.`,
        `$.mandatoryContent[${duplicateIndex}].name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(selected.preset, "name", `${selected.path}.name`, input.newName, changes, "mandatory-content preset declaration");
  rewriteZoneMandatoryContentRefs(template, oldName, input.newName, changes);

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
