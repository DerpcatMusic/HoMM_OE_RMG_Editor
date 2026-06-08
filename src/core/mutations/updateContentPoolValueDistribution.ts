import type { RmgTemplate, ValueDistributionConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { cloneValue, selectLocalContentPoolForGroupEdit } from "./contentPoolGroupHelpers.js";
import { buildMutationResult, recordDelete, recordValueChange } from "./helpers.js";
import type { ContentPoolSelector, MutationChange, MutationResult, TemplateMutationInput } from "./mutationTypes.js";

export interface UpdateContentPoolValueDistributionInput extends TemplateMutationInput {
  pool: ContentPoolSelector;
  valueDistribution: ValueDistributionConfig | null;
}

export function updateContentPoolValueDistribution(
  input: UpdateContentPoolValueDistributionInput,
): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];

  const selected = selectLocalContentPoolForGroupEdit(template, input.pool, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.valueDistribution === null) {
    recordDelete(
      selected.pool,
      "valueDistribution",
      `${selected.path}.valueDistribution`,
      changes,
      "content pool value distribution removed",
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  validateValueDistribution(input.valueDistribution, `${selected.path}.valueDistribution`, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  recordValueChange(
    selected.pool,
    "valueDistribution",
    `${selected.path}.valueDistribution`,
    cloneValue(input.valueDistribution),
    changes,
    "content pool value distribution setting",
  );

  return buildMutationResult(template, changes, diagnostics);
}

function validateValueDistribution(
  valueDistribution: ValueDistributionConfig,
  path: string,
  diagnostics: Diagnostic[],
): void {
  const priceBounds = valueDistribution.priceBounds ?? [];
  const weights = valueDistribution.weights ?? [];

  if (!Array.isArray(priceBounds) || !Array.isArray(weights)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolValueDistribution.invalidShape",
        "Value distribution priceBounds and weights must be arrays.",
        path,
      ),
    );
    return;
  }

  if (weights.length !== priceBounds.length + 1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.contentPoolValueDistribution.invalidWeightCount",
        `Value distribution weights length must equal priceBounds length + 1, got ${weights.length} and ${priceBounds.length}.`,
        path,
      ),
    );
  }

  for (let index = 1; index < priceBounds.length; index++) {
    const previous = priceBounds[index - 1];
    const current = priceBounds[index];
    if (previous !== undefined && current !== undefined && current <= previous) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.contentPoolValueDistribution.boundsNotAscending",
          "Value distribution priceBounds must be strictly ascending.",
          `${path}.priceBounds[${index}]`,
        ),
      );
    }
  }
}
