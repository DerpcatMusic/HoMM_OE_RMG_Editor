import type { RmgTemplate, ZoneLayoutConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordStringChange, recordValueChange, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, SelectedZoneLayout, TemplateMutationInput, ZoneLayoutSelector } from "./mutationTypes.js";

export interface ZoneLayoutSettings {
  name?: string;
  obstaclesFill?: number;
  obstaclesFillVoid?: number;
  lakesFill?: number;
  minLakeArea?: number;
  elevationClusterScale?: number;
  elevationModes?: Record<string, unknown>[];
  roadClusterArea?: number;
  guardedEncounterResourceFractions?: Record<string, unknown>;
  ambientPickupDistribution?: Record<string, unknown>;
}

export interface UpdateZoneLayoutInput extends TemplateMutationInput {
  layout: ZoneLayoutSelector;
  settings: ZoneLayoutSettings;
}

export function updateZoneLayout(input: UpdateZoneLayoutInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectZoneLayout(template, input.layout, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.settings.name !== undefined && input.settings.name !== selected.layout.name) {
    if (!validateName(input.settings.name, `${selected.path}.name`, "zoneLayout", diagnostics)) {
      return buildMutationResult(template, changes, diagnostics);
    }

    const oldName = selected.layout.name;
    if (!oldName) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.zoneLayout.oldNameMissing",
          "Selected zone layout has no name to rename.",
          `${selected.path}.name`,
        ),
      );
      return buildMutationResult(template, changes, diagnostics);
    }

    const duplicateIndex = (template.zoneLayouts ?? []).findIndex(
      (layout, index) => index !== selected.layoutIndex && layout.name === input.settings.name,
    );
    if (duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.zoneLayout.duplicateName",
          `Another zone layout already uses the name '${input.settings.name}'.`,
          `$.zoneLayouts[${duplicateIndex}].name`,
        ),
      );
      return buildMutationResult(template, changes, diagnostics);
    }

    recordStringChange(
      selected.layout,
      "name",
      `${selected.path}.name`,
      input.settings.name,
      changes,
      "zone layout declaration",
    );
    rewriteZoneLayoutRefs(template, oldName, input.settings.name, changes);
  }

  const fields: (keyof ZoneLayoutSettings)[] = [
    "obstaclesFill",
    "obstaclesFillVoid",
    "lakesFill",
    "minLakeArea",
    "elevationClusterScale",
    "elevationModes",
    "roadClusterArea",
    "guardedEncounterResourceFractions",
    "ambientPickupDistribution",
  ];

  for (const field of fields) {
    if (input.settings[field] !== undefined) {
      recordValueChange(
        selected.layout,
        field,
        `${selected.path}.${field}`,
        cloneValue(input.settings[field]),
        changes,
        "zone layout setting",
      );
    }
  }

  return buildMutationResult(template, changes, diagnostics);
}

function selectZoneLayout(
  template: RmgTemplate,
  selector: ZoneLayoutSelector,
  diagnostics: Diagnostic[],
): SelectedZoneLayout | undefined {
  const layouts = template.zoneLayouts ?? [];
  const layoutIndex = "layoutIndex" in selector ? selector.layoutIndex : layouts.findIndex((layout) => layout.name === selector.layoutName);
  const layout: ZoneLayoutConfig | undefined = layouts[layoutIndex];
  const path = `$.zoneLayouts[${layoutIndex}]`;

  if (!layout) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneLayout.missing",
        "layoutIndex" in selector
          ? `Zone layout index ${selector.layoutIndex} does not exist.`
          : `Zone layout '${selector.layoutName}' does not exist.`,
        path,
      ),
    );
    return undefined;
  }

  return { layout, layoutIndex, path };
}

function rewriteZoneLayoutRefs(
  template: RmgTemplate,
  oldName: string,
  newName: string,
  changes: MutationChange[],
): void {
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      if (zone.layout === oldName) {
        recordStringChange(
          zone,
          "layout",
          `$.variants[${variantIndex}].zones[${zoneIndex}].layout`,
          newName,
          changes,
          "zone layout reference",
        );
      }
    });
  });
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
