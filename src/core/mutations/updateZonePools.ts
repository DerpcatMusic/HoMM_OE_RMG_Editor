import type { RmgTemplate, Zone } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export type ZoneContentPoolField = "guardedContentPool" | "unguardedContentPool" | "resourcesContentPool";

export interface SetZoneContentPoolsInput extends VariantMutationInput {
  zone: ZoneSelector;
  field: ZoneContentPoolField;
  poolIds: string[];
}

export function setZoneContentPools(input: SetZoneContentPoolsInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const selected = selectZone(variantSelection.variant, variantSelection.path, input.zone, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (!Array.isArray(input.poolIds) || input.poolIds.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneContentPools.invalid",
        "Content pool alternatives must be non-empty string ids.",
        `${selected.path}.${input.field}`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.poolIds.length === 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zoneContentPools.empty",
        "Content pool alternatives cannot be empty because the generator samples one id.",
        `${selected.path}.${input.field}`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  setZonePoolField(selected.zone, input.field, input.poolIds, `${selected.path}.${input.field}`, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function setZonePoolField(
  zone: Zone,
  field: ZoneContentPoolField,
  poolIds: string[],
  path: string,
  changes: MutationChange[],
): void {
  const before = zone[field];
  const after = [...poolIds];
  if (JSON.stringify(before) === JSON.stringify(after)) {
    return;
  }
  zone[field] = after;
  changes.push({ path, before, after, reason: "zone content pool alternatives" });
}
