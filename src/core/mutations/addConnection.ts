import { CONNECTION_TYPES, isEnumValue } from "../rmg/enums.js";
import type { Connection, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import type { DefaultConnectionOptions } from "./defaultObjects.js";
import { buildMutationResult, getVariant, validateName } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface AddConnectionInput extends VariantMutationInput {
  connection: DefaultConnectionOptions | Connection;
  insertIndex?: number;
}

export function addConnection(input: AddConnectionInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const connection = createConnectionForInsert(input.connection);
  const connections = variantSelection.variant.connections ?? [];
  variantSelection.variant.connections = connections;
  validateConnectionForInsert(connection, variantSelection.path, variantSelection.variant.zones?.map((zone) => zone.name), connections, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  const insertIndex = input.insertIndex ?? connections.length;
  if (!Number.isInteger(insertIndex) || insertIndex < 0 || insertIndex > connections.length) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.insertIndexInvalid",
        `Connection insert index ${insertIndex} is outside 0..${connections.length}.`,
        `${variantSelection.path}.connections`,
      ),
    );
    return buildMutationResult(template, changes, diagnostics);
  }

  connections.splice(insertIndex, 0, connection);
  changes.push({
    path: `${variantSelection.path}.connections[${insertIndex}]`,
    before: undefined,
    after: connection,
    reason: "connection added",
  });

  return buildMutationResult(template, changes, diagnostics);
}

function createConnectionForInsert(input: DefaultConnectionOptions | Connection): Connection {
  const connection = JSON.parse(JSON.stringify(input)) as Connection;
  connection.connectionType ??= "Default";
  if (connection.connectionType === "Portal") {
    connection.portalFromEnabled ??= true;
    connection.portalToEnabled ??= true;
  }
  return connection;
}

function validateConnectionForInsert(
  connection: Connection,
  variantPath: string,
  zoneNamesInput: (string | undefined)[] | undefined,
  connections: Connection[],
  diagnostics: Diagnostic[],
): void {
  const path = `${variantPath}.connections[]`;
  if (!connection.name || !validateName(connection.name, `${path}.name`, "connection", diagnostics)) {
    return;
  }
  const duplicateIndex = connections.findIndex((item) => item.name === connection.name);
  if (duplicateIndex !== -1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.duplicateName",
        `Another connection already uses the name '${connection.name}'.`,
        `${variantPath}.connections[${duplicateIndex}].name`,
      ),
    );
  }
  if (!isEnumValue(CONNECTION_TYPES, connection.connectionType)) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.connection.connectionTypeInvalid",
        `Invalid connection type '${connection.connectionType}'.`,
        `${path}.connectionType`,
      ),
    );
  }

  const zoneNames = new Set((zoneNamesInput ?? []).filter((name): name is string => Boolean(name)));
  if (!connection.from || !zoneNames.has(connection.from)) {
    diagnostics.push(diagnostic("error", "mutation.connection.fromMissing", `Zone '${connection.from ?? ""}' does not exist.`, `${path}.from`));
  }
  if (!connection.to || !zoneNames.has(connection.to)) {
    diagnostics.push(diagnostic("error", "mutation.connection.toMissing", `Zone '${connection.to ?? ""}' does not exist.`, `${path}.to`));
  }
  if (connection.from && connection.to && connection.from === connection.to) {
    diagnostics.push(diagnostic("error", "mutation.connection.selfLoop", "Connection endpoints must be different zones.", path));
  }
  if (connection.guardZone && !zoneNames.has(connection.guardZone)) {
    diagnostics.push(
      diagnostic("error", "mutation.connection.guardZoneMissing", `Guard zone '${connection.guardZone}' does not exist.`, `${path}.guardZone`),
    );
  }
}
