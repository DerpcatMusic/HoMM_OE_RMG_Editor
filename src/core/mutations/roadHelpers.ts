import { isEnumValue, ROAD_TARGET_TYPES, ROAD_TYPES, type RoadType } from "../rmg/enums.js";
import type { RmgTemplate, RoadConfig, RoadTargetConfig, Variant, Zone } from "../rmg/rmgTypes.js";
import { normalizeStringArray } from "../rmg/stringArrayCompat.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";

export interface RoadValidationContext {
  template: RmgTemplate;
  variant: Variant;
  zone: Zone;
  zonePath: string;
}

export interface RoadStubInput {
  connectionName: string;
  mainObjectIndex?: number;
  type?: RoadType;
}

export function createRoadStub(stub: RoadStubInput): RoadConfig {
  return {
    ...(stub.type ? { type: stub.type } : {}),
    from: { type: "MainObject", args: [String(stub.mainObjectIndex ?? 0)] },
    to: { type: "Connection", args: [stub.connectionName] },
  };
}

export function validateRoadConfig(
  road: RoadConfig,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (road.type !== undefined && !isEnumValue(ROAD_TYPES, road.type)) {
    diagnostics.push(diagnostic("error", "mutation.zone.road.typeInvalid", `Invalid road type '${road.type}'.`, `${path}.type`));
  }
  validateRequiredRoadTarget(road.from, context, `${path}.from`, diagnostics);
  validateRequiredRoadTarget(road.to, context, `${path}.to`, diagnostics);
}

export function validateRoadStub(
  stub: RoadStubInput,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (typeof stub.connectionName !== "string" || stub.connectionName.trim().length === 0) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadStub.connectionNameInvalid", "Road stub connectionName must be a non-empty string.", `${path}.connectionName`));
  }
  const mainObjectIndex = stub.mainObjectIndex ?? 0;
  if (!Number.isInteger(mainObjectIndex) || mainObjectIndex < 0) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadStub.mainObjectIndexInvalid", "Road stub mainObjectIndex must be a non-negative integer.", `${path}.mainObjectIndex`));
  }
  if (stub.type !== undefined && !isEnumValue(ROAD_TYPES, stub.type)) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadStub.typeInvalid", `Invalid road type '${stub.type}'.`, `${path}.type`));
  }
  validateRoadConfig(createRoadStub(stub), context, path, diagnostics);
}

export function cloneRoad(road: RoadConfig): RoadConfig {
  return JSON.parse(JSON.stringify(road)) as RoadConfig;
}

function validateRequiredRoadTarget(
  target: RoadTargetConfig | undefined,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (!target) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.missing", "Road target is required.", path));
    return;
  }
  validateRoadTarget(target, context, path, diagnostics);
}

function validateRoadTarget(
  target: RoadTargetConfig,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (!isEnumValue(ROAD_TARGET_TYPES, target.type)) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.typeInvalid", `Invalid road target type '${target.type}'.`, `${path}.type`));
    return;
  }
  if (target.args !== undefined && (!Array.isArray(target.args) || target.args.some((item) => typeof item !== "string"))) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.argsInvalid", "Road target args must be strings.", `${path}.args`));
    return;
  }

  switch (target.type) {
    case "Crossroads":
      warnIgnoredArgs(target, path, "Crossroads road targets do not use args.", diagnostics);
      return;
    case "MainObject":
      validateMainObjectTarget(target, context, path, diagnostics);
      return;
    case "Connection":
      validateConnectionTarget(target, context, path, diagnostics);
      return;
    case "MandatoryContent":
      validateMandatoryContentTarget(target, context, path, diagnostics);
      return;
  }
}

function validateMainObjectTarget(
  target: RoadTargetConfig,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  const indexText = target.args?.[0];
  if (!isIntegerString(indexText)) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.mainObjectIndexInvalid", "MainObject road targets require args[0] as a main-object index.", `${path}.args`));
    return;
  }
  const index = Number(indexText);
  if (index < 0 || index >= (context.zone.mainObjects?.length ?? 0)) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.mainObjectMissing", `Main object index ${index} does not exist in this zone.`, `${path}.args`));
  }
  warnExtraArgs(target, path, 1, diagnostics);
}

function validateConnectionTarget(
  target: RoadTargetConfig,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  const connectionName = target.args?.[0];
  if (!connectionName) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.connectionMissing", "Connection road targets require args[0] as a connection name.", `${path}.args`));
    return;
  }

  const matches = (context.variant.connections ?? []).filter((connection) => connection.name === connectionName);
  const connection = matches[0];
  if (!connection) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.connectionMissing", `Connection '${connectionName}' does not exist.`, `${path}.args`));
    return;
  }
  if (matches.length > 1) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.zone.roadTarget.connectionNameAmbiguous",
        `Connection name '${connectionName}' is duplicated; the generator resolves the first match.`,
        `${path}.args`,
      ),
    );
  }
  if (connection.connectionType === "Proximity") {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.proximityConnection", `Connection '${connectionName}' is a Proximity connection.`, `${path}.args`));
  }
  if (!context.zone.name) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.zoneNameMissing", "Road owner zone must have a name to validate connection targets.", context.zonePath));
  } else if (connection.from !== context.zone.name && connection.to !== context.zone.name) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.roadTarget.connectionWrongZone",
        `Connection '${connectionName}' does not touch zone '${context.zone.name}'.`,
        `${path}.args`,
      ),
    );
  }
  warnExtraArgs(target, path, 1, diagnostics);
}

function validateMandatoryContentTarget(
  target: RoadTargetConfig,
  context: RoadValidationContext,
  path: string,
  diagnostics: Diagnostic[],
): void {
  const contentName = target.args?.[0];
  if (!contentName) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadTarget.mandatoryContentMissing", "MandatoryContent road targets require args[0] as a mandatory-content entry name.", `${path}.args`));
    return;
  }

  const presetIds = normalizeStringArray(context.zone.mandatoryContent);
  if (presetIds.length === 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.roadTarget.mandatoryContentPresetMissing",
        `Road targets mandatory content '${contentName}', but the zone has no mandatoryContent preset alternatives.`,
        `${path}.args`,
      ),
    );
    return;
  }

  let foundInPresets = 0;
  let resolvedPresetCount = 0;
  for (const presetId of presetIds) {
    const preset = (context.template.mandatoryContent ?? []).find((item) => item.name === presetId);
    if (!preset) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.zone.roadTarget.mandatoryContentPresetUnresolved",
          `Mandatory-content preset '${presetId}' does not exist.`,
          `${context.zonePath}.mandatoryContent`,
        ),
      );
      continue;
    }
    resolvedPresetCount++;
    if ((preset.content ?? []).some((content) => content.name === contentName)) {
      foundInPresets++;
    }
  }

  if (foundInPresets === 0) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.roadTarget.mandatoryContentEntryMissing",
        `Mandatory-content entry '${contentName}' does not exist in this zone's preset alternatives.`,
        `${path}.args`,
      ),
    );
  } else if (resolvedPresetCount > foundInPresets) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.zone.roadTarget.mandatoryContentEntryNotInAllPresets",
        `Mandatory-content entry '${contentName}' is not present in every preset alternative, so this road can fail depending on the sampled preset.`,
        `${path}.args`,
      ),
    );
  }
  warnExtraArgs(target, path, 1, diagnostics);
}

function warnIgnoredArgs(target: RoadTargetConfig, path: string, message: string, diagnostics: Diagnostic[]): void {
  if ((target.args?.length ?? 0) > 0) {
    diagnostics.push(diagnostic("warning", "mutation.zone.roadTarget.argsIgnored", message, `${path}.args`));
  }
}

function warnExtraArgs(target: RoadTargetConfig, path: string, expectedCount: number, diagnostics: Diagnostic[]): void {
  if ((target.args?.length ?? 0) > expectedCount) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.zone.roadTarget.extraArgsIgnored",
        `Road target only uses args[0]; extra args are ignored by the generator.`,
        `${path}.args`,
      ),
    );
  }
}

function isIntegerString(value: string | undefined): value is string {
  return value !== undefined && /^-?\d+$/.test(value);
}
