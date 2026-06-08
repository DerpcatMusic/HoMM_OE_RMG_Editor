import type { ContentCountLimitPreset, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, hasStringReference, recordArrayRemove, removeStringReference } from "./helpers.js";
import type {
  ContentCountLimitPresetSelector,
  MutationChange,
  MutationResult,
  SelectedContentCountLimitPreset,
  TemplateMutationInput,
} from "./mutationTypes.js";

export interface RemoveContentCountLimitPresetInput extends TemplateMutationInput {
  preset: ContentCountLimitPresetSelector;
  cascade?: boolean;
}

export function removeContentCountLimitPreset(input: RemoveContentCountLimitPresetInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cascade = input.cascade ?? true;
  const selected = selectContentCountLimitPreset(template, input.preset, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const presetName = selected.preset.name;
  if (!presetName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentCountLimitPreset.oldNameMissing",
        "Selected content-count-limit preset has no name to remove.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const referencingZones: string[] = [];
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      if (hasStringReference(zone, "contentCountLimits", presetName)) {
        referencingZones.push(`$.variants[${variantIndex}].zones[${zoneIndex}]`);
      }
    });
  });

  if (!cascade && referencingZones.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentCountLimitPreset.hasReferences",
        `Cannot remove content-count-limit preset '${presetName}' because it is referenced by zone(s).`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (cascade) {
    cleanupZoneContentCountLimitRefs(template, presetName, changes);
  }

  const presets = template.contentCountLimits ?? [];
  recordArrayRemove(presets, selected.presetIndex, selected.path, changes, "content-count-limit preset removed");

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

function cleanupZoneContentCountLimitRefs(template: RmgTemplate, presetName: string, changes: MutationChange[]): void {
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      removeStringReference(
        zone,
        "contentCountLimits",
        presetName,
        `$.variants[${variantIndex}].zones[${zoneIndex}].contentCountLimits`,
        changes,
        "zone content-count-limit preset reference removed",
      );
    });
  });
}
