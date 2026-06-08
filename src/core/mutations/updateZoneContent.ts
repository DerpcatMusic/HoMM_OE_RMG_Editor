import type { RmgTemplate, Zone } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordValueChange, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export type ZoneContentBudgetField =
  | "guardedContentValue"
  | "guardedContentValuePerArea"
  | "unguardedContentValue"
  | "unguardedContentValuePerArea"
  | "resourcesValue"
  | "resourcesValuePerArea";

export type ZoneContentBudgets = Partial<Record<ZoneContentBudgetField, number>>;

export interface SetZoneContentBudgetsInput extends VariantMutationInput {
  zone: ZoneSelector;
  budgets: ZoneContentBudgets;
}

const BUDGET_FIELDS: readonly ZoneContentBudgetField[] = [
  "guardedContentValue",
  "guardedContentValuePerArea",
  "unguardedContentValue",
  "unguardedContentValuePerArea",
  "resourcesValue",
  "resourcesValuePerArea",
];

export function setZoneContentBudgets(input: SetZoneContentBudgetsInput): MutationResult<RmgTemplate> {
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

  const fields = BUDGET_FIELDS.filter((field) => input.budgets[field] !== undefined);
  if (fields.length === 0) {
    diagnostics.push(diagnostic("error", "mutation.zoneContentBudgets.empty", "At least one content budget field is required.", selected.path));
    return buildMutationResult(template, changes, diagnostics);
  }
  for (const field of fields) {
    const value = input.budgets[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.zoneContentBudgets.invalid",
          `Content budget '${field}' must be a non-negative finite number.`,
          `${selected.path}.${field}`,
        ),
      );
    }
  }
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  for (const field of fields) {
    setZoneBudgetField(selected.zone, field, input.budgets[field] as number, `${selected.path}.${field}`, changes);
  }

  return buildMutationResult(template, changes, diagnostics);
}

function setZoneBudgetField(
  zone: Zone,
  field: ZoneContentBudgetField,
  value: number,
  path: string,
  changes: MutationChange[],
): void {
  recordValueChange(zone, field, path, value, changes, "zone content budget");
}
