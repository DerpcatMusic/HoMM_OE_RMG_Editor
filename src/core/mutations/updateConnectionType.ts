import type { RmgTemplate } from "../rmg/rmgTypes.js";
import { CONNECTION_TYPES, isEnumValue, type ConnectionType } from "../rmg/enums.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordStringChange, recordValueChange, selectConnection } from "./helpers.js";
import type { ConnectionSelector, MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface UpdateConnectionTypeInput extends VariantMutationInput {
  connection: ConnectionSelector;
  connectionType: ConnectionType;
  portalFromEnabled?: boolean;
  portalToEnabled?: boolean;
  normalizePortalDefaults?: boolean;
}

export function updateConnectionType(input: UpdateConnectionTypeInput): MutationResult<RmgTemplate> {
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
  if (!isEnumValue(CONNECTION_TYPES, input.connectionType)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.connectionTypeInvalid",
        `Invalid connection type '${input.connectionType}'.`,
        `${selected.path}.connectionType`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  recordStringChange(
    selected.connection,
    "connectionType",
    `${selected.path}.connectionType`,
    input.connectionType,
    changes,
    "connection type",
  );

  if (input.portalFromEnabled !== undefined) {
    recordValueChange(
      selected.connection,
      "portalFromEnabled",
      `${selected.path}.portalFromEnabled`,
      input.portalFromEnabled,
      changes,
      "portal endpoint enabled flag",
    );
  }
  if (input.portalToEnabled !== undefined) {
    recordValueChange(
      selected.connection,
      "portalToEnabled",
      `${selected.path}.portalToEnabled`,
      input.portalToEnabled,
      changes,
      "portal endpoint enabled flag",
    );
  }
  if ((input.normalizePortalDefaults ?? true) && input.connectionType === "Portal") {
    if (selected.connection.portalFromEnabled === undefined) {
      recordValueChange(selected.connection, "portalFromEnabled", `${selected.path}.portalFromEnabled`, true, changes, "default enabled portal endpoint");
    }
    if (selected.connection.portalToEnabled === undefined) {
      recordValueChange(selected.connection, "portalToEnabled", `${selected.path}.portalToEnabled`, true, changes, "default enabled portal endpoint");
    }
  }

  return buildMutationResult(template, changes, diagnostics);
}
