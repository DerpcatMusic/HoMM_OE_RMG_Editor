import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordDelete, recordStringChange, selectConnection } from "./helpers.js";
import type { ConnectionSelector, MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface UpdateConnectionEndpointsInput extends VariantMutationInput {
  connection: ConnectionSelector;
  from: string;
  to: string;
}

export function updateConnectionEndpoints(input: UpdateConnectionEndpointsInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const selected = selectConnection(variantSelection.variant, variantSelection.path, input.connection, diagnostics);
  if (!selected) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const zoneNames = new Set((variantSelection.variant.zones ?? []).map((zone) => zone.name).filter((name): name is string => Boolean(name)));
  if (!zoneNames.has(input.from)) {
    diagnostics.push(diagnostic("error", "mutation.connection.fromMissing", `Zone '${input.from}' does not exist.`, `${selected.path}.from`));
  }
  if (!zoneNames.has(input.to)) {
    diagnostics.push(diagnostic("error", "mutation.connection.toMissing", `Zone '${input.to}' does not exist.`, `${selected.path}.to`));
  }
  if (input.from === input.to) {
    diagnostics.push(diagnostic("error", "mutation.connection.selfLoop", "Connection endpoints must be different zones.", selected.path));
  }
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(selected.connection, "from", `${selected.path}.from`, input.from, changes, "connection endpoint");
  recordStringChange(selected.connection, "to", `${selected.path}.to`, input.to, changes, "connection endpoint");

  if (
    selected.connection.guardZone !== undefined &&
    selected.connection.guardZone !== input.from &&
    selected.connection.guardZone !== input.to
  ) {
    recordDelete(
      selected.connection,
      "guardZone",
      `${selected.path}.guardZone`,
      changes,
      "guardZone must be one of the connection endpoints",
    );
  }

  return buildMutationResult(template, changes, diagnostics);
}
