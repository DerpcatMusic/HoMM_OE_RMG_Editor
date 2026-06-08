import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { DEFAULT_ZONE_LAYOUT } from "../rmg/defaults.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, recordArrayRemove, recordStringChange } from "./helpers.js";
import type { MutationChange, MutationResult, SelectedZoneLayout, TemplateMutationInput, ZoneLayoutSelector } from "./mutationTypes.js";

export interface RemoveZoneLayoutInput extends TemplateMutationInput {
  layout: ZoneLayoutSelector;
  cascade?: boolean;
}

export function removeZoneLayout(input: RemoveZoneLayoutInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const cascade = input.cascade ?? true;

  const selected = selectZoneLayout(template, input.layout, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const layoutName = selected.layout.name;
  if (!layoutName) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneLayout.oldNameMissing",
        "Selected zone layout has no name to remove.",
        `${selected.path}.name`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  const referencingZones = findReferencingZones(template, layoutName);

  if (!cascade && referencingZones.length > 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneLayout.hasReferences",
        `Zone layout '${layoutName}' is referenced by ${referencingZones.length} zone(s).`,
        selected.path,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (cascade) {
    for (const { variantIndex, zoneIndex, path, zone } of referencingZones) {
      if (zone.layout === layoutName) {
        recordStringChange(
          zone,
          "layout",
          `${path}.layout`,
          DEFAULT_ZONE_LAYOUT,
          changes,
          "zone layout reference reset to default",
        );
      }
    }
  }

  const layouts = template.zoneLayouts ?? [];
  recordArrayRemove(layouts, selected.layoutIndex, selected.path, changes, "zone layout removed");

  return buildMutationResult(template, changes, diagnostics);
}

interface ZoneLayoutReference {
  variantIndex: number;
  zoneIndex: number;
  path: string;
  zone: NonNullable<NonNullable<RmgTemplate["variants"]>[number]["zones"]>[number];
}

function findReferencingZones(template: RmgTemplate, layoutName: string): ZoneLayoutReference[] {
  const references: ZoneLayoutReference[] = [];
  (template.variants ?? []).forEach((variant, variantIndex) => {
    (variant.zones ?? []).forEach((zone, zoneIndex) => {
      if (zone.layout === layoutName) {
        references.push({
          variantIndex,
          zoneIndex,
          path: `$.variants[${variantIndex}].zones[${zoneIndex}]`,
          zone,
        });
      }
    });
  });
  return references;
}

function selectZoneLayout(
  template: RmgTemplate,
  selector: ZoneLayoutSelector,
  diagnostics: Diagnostic[],
): SelectedZoneLayout | undefined {
  const layouts = template.zoneLayouts ?? [];
  const layoutIndex = "layoutIndex" in selector ? selector.layoutIndex : layouts.findIndex((layout) => layout.name === selector.layoutName);
  const layout = layouts[layoutIndex];
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
