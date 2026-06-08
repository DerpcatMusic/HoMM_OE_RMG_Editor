import type { MandatoryContentPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, hasStringReference, recordArrayRemove, removeStringReference } from "./helpers.js";
import type {
  MandatoryContentPresetSelector,
  MutationChange,
  MutationResult,
  SelectedMandatoryContentPreset,
  TemplateMutationInput,
} from "./mutationTypes.js";

export interface RemoveMandatoryContentPresetInput extends TemplateMutationInput {
  preset: MandatoryContentPresetSelector;
  cascade?: boolean;
}

export function removeMandatoryContentPreset(input: RemoveMandatoryContentPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cascade = input.cascade ?? true;
  const selected = selectMandatoryContentPreset(template, input.preset, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const presetName = selected.preset.name;
  if (!presetName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.oldNameMissing",
        "Selected mandatory-content preset has no name to remove.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const referencingZones: string[] = [];
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      if (hasStringReference(zone, "mandatoryContent", presetName)) {
        referencingZones.push(`$.variants[${variantIndex}].zones[${zoneIndex}]`);
      }
    });
  });

  if (!cascade && referencingZones.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mandatoryContentPreset.hasReferences",
        `Cannot remove mandatory-content preset '${presetName}' because it is referenced by zone(s).`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (cascade) {
    cleanupZoneMandatoryContentRefs(template, presetName, changes);
  }

  const presets = template.mandatoryContent ?? [];
  recordArrayRemove(presets, selected.presetIndex, selected.path, changes, "mandatory-content preset removed");

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

function cleanupZoneMandatoryContentRefs(template: RmgTemplate, presetName: string, changes: MutationChange[]): void {
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      removeStringReference(
        zone,
        "mandatoryContent",
        presetName,
        `$.variants[${variantIndex}].zones[${zoneIndex}].mandatoryContent`,
        changes,
        "zone mandatory-content preset reference removed",
      );
    });
  });
}
