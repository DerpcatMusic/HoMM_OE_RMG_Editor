import {
  CONNECTION_TYPES,
  GATE_PLACEMENTS,
  GUARD_REACTIONS,
  isEnumValue,
  PLACEMENT_RULE_TYPES,
  type ConnectionType,
  type GatePlacement,
  type GuardReaction,
} from "../rmg/enums.js";
import type { Connection, PlacementRule, RmgTemplate, Variant } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordDelete, recordStringChange, recordValueChange, selectConnection, validateName } from "./helpers.js";
import type { ConnectionSelector, MutationChange, MutationResult, VariantMutationInput } from "./mutationTypes.js";

export interface ConnectionSettings {
  name?: string;
  from?: string;
  to?: string;
  connectionType?: ConnectionType;
  length?: number | null;
  portalFromEnabled?: boolean | null;
  portalToEnabled?: boolean | null;
  guardZone?: string | null;
  guardValue?: number | null;
  guardWeeklyIncrement?: number | null;
  guardReaction?: GuardReaction | null;
  guardEscape?: boolean | null;
  guardMatchGroup?: string | null;
  gatePlacement?: GatePlacement | null;
  gatePlacementArgs?: string[] | null;
  portalPlacementRulesFrom?: PlacementRule[] | null;
  portalPlacementRulesTo?: PlacementRule[] | null;
  road?: boolean | null;
  simTurnSquad?: boolean | null;
  guardRandomization?: number | null;
}

export interface UpdateConnectionSettingsInput extends VariantMutationInput {
  connection: ConnectionSelector;
  settings: ConnectionSettings;
  normalizePortalDefaults?: boolean;
}

export function updateConnectionSettings(input: UpdateConnectionSettingsInput): MutationResult<RmgTemplate> {
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

  validateConnectionSettings(
    input.settings,
    selected.connection,
    selected.connectionIndex,
    selected.path,
    variantSelection.variant,
    input.normalizePortalDefaults ?? true,
    diagnostics,
  );
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  applyConnectionSettings(selected.connection, selected.path, input.settings, input.normalizePortalDefaults ?? true, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function validateConnectionSettings(
  settings: ConnectionSettings,
  current: Connection,
  connectionIndex: number,
  path: string,
  variant: Variant,
  normalizePortalDefaults: boolean,
  diagnostics: Diagnostic[],
): void {
  const zoneNames = new Set((variant.zones ?? []).map((zone) => zone.name).filter((name): name is string => Boolean(name)));
  const nextName = settings.name ?? current.name;
  const nextFrom = settings.from ?? current.from;
  const nextTo = settings.to ?? current.to;
  const nextConnectionType = settings.connectionType ?? current.connectionType;
  const effectiveConnectionNames = buildEffectiveConnectionNameMap(variant.connections ?? [], connectionIndex, nextName);

  if (settings.name !== undefined) {
    if (typeof settings.name !== "string") {
      diagnostics.push(diagnostic("error", "mutation.connection.nameInvalid", "Connection name must be a string.", `${path}.name`));
    } else {
      validateName(settings.name, `${path}.name`, "connection", diagnostics);
    }
    const duplicateIndex = (variant.connections ?? []).findIndex((connection, index) => index !== connectionIndex && connection.name === settings.name);
    if (typeof settings.name === "string" && duplicateIndex !== -1) {
      diagnostics.push(
        diagnostic(
          "error",
          "mutation.connection.duplicateName",
          `Another connection already uses the name '${settings.name}'.`,
          path.replace(/\.connections\[\d+\]$/, `.connections[${duplicateIndex}].name`),
        ),
      );
    }
  }

  if (settings.connectionType !== undefined && !isEnumValue(CONNECTION_TYPES, settings.connectionType)) {
    diagnostics.push(
      diagnostic("error", "mutation.connection.connectionTypeInvalid", `Invalid connection type '${settings.connectionType}'.`, `${path}.connectionType`),
    );
  }

  if (settings.from !== undefined || settings.to !== undefined) {
    if (!nextFrom || !zoneNames.has(nextFrom)) {
      diagnostics.push(diagnostic("error", "mutation.connection.fromMissing", `Zone '${nextFrom ?? ""}' does not exist.`, `${path}.from`));
    }
    if (!nextTo || !zoneNames.has(nextTo)) {
      diagnostics.push(diagnostic("error", "mutation.connection.toMissing", `Zone '${nextTo ?? ""}' does not exist.`, `${path}.to`));
    }
    if (nextFrom && nextTo && nextFrom === nextTo) {
      diagnostics.push(diagnostic("error", "mutation.connection.selfLoop", "Connection endpoints must be different zones.", path));
    }
  }

  validateNullableNonNegativeNumber(settings.length, `${path}.length`, "length", diagnostics);
  validateNullableBoolean(settings.portalFromEnabled, `${path}.portalFromEnabled`, "portalFromEnabled", diagnostics);
  validateNullableBoolean(settings.portalToEnabled, `${path}.portalToEnabled`, "portalToEnabled", diagnostics);
  validateNullableInteger(settings.guardValue, `${path}.guardValue`, "guardValue", diagnostics);
  validateNullableNonNegativeNumber(settings.guardWeeklyIncrement, `${path}.guardWeeklyIncrement`, "guardWeeklyIncrement", diagnostics);
  validateNullableBoolean(settings.guardEscape, `${path}.guardEscape`, "guardEscape", diagnostics);
  validateNullableNonEmptyString(settings.guardMatchGroup, `${path}.guardMatchGroup`, "guardMatchGroup", diagnostics);
  validateNullableStringArray(settings.gatePlacementArgs, `${path}.gatePlacementArgs`, diagnostics);
  validateNullableBoolean(settings.road, `${path}.road`, "road", diagnostics);
  validateNullableBoolean(settings.simTurnSquad, `${path}.simTurnSquad`, "simTurnSquad", diagnostics);
  validateNullableNonNegativeNumber(settings.guardRandomization, `${path}.guardRandomization`, "guardRandomization", diagnostics);

  if (settings.guardReaction !== undefined && settings.guardReaction !== null && !isEnumValue(GUARD_REACTIONS, settings.guardReaction)) {
    diagnostics.push(
      diagnostic("error", "mutation.connection.guardReactionInvalid", `Invalid guard reaction '${settings.guardReaction}'.`, `${path}.guardReaction`),
    );
  }
  if (settings.gatePlacement !== undefined && settings.gatePlacement !== null && !isEnumValue(GATE_PLACEMENTS, settings.gatePlacement)) {
    diagnostics.push(
      diagnostic("error", "mutation.connection.gatePlacementInvalid", `Invalid gate placement '${settings.gatePlacement}'.`, `${path}.gatePlacement`),
    );
  }

  const nextGuardZone = nullableNext(settings.guardZone, current.guardZone);
  if (settings.guardZone !== undefined) {
    validateNullableNonEmptyString(settings.guardZone, `${path}.guardZone`, "guardZone", diagnostics);
  }
  if (nextGuardZone) {
    if (!zoneNames.has(nextGuardZone)) {
      diagnostics.push(diagnostic("error", "mutation.connection.guardZoneMissing", `Guard zone '${nextGuardZone}' does not exist.`, `${path}.guardZone`));
    } else if (nextFrom && nextTo && nextGuardZone !== nextFrom && nextGuardZone !== nextTo) {
      diagnostics.push(
        diagnostic(
          "warning",
          "mutation.connection.guardZoneIgnored",
          "The generator resolves guardZone, then ignores it when it is not one of the connection endpoints.",
          `${path}.guardZone`,
        ),
      );
    }
  }

  const nextGatePlacement = nullableNext(settings.gatePlacement, current.gatePlacement);
  const nextGatePlacementArgs = nullableNext(settings.gatePlacementArgs, current.gatePlacementArgs);
  if (nextGatePlacement === "NearZone") {
    const zoneArg = nextGatePlacementArgs?.[0];
    if (!zoneArg || !zoneNames.has(zoneArg)) {
      diagnostics.push(
        diagnostic("error", "mutation.connection.nearZoneMissing", `NearZone gate placement requires an existing zone name.`, `${path}.gatePlacementArgs`),
      );
    }
  } else if (settings.gatePlacementArgs !== undefined && settings.gatePlacementArgs !== null && (nextGatePlacementArgs?.length ?? 0) > 0) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.connection.gatePlacementArgsIgnored",
        "gatePlacementArgs are only used by NearZone gate placement.",
        `${path}.gatePlacementArgs`,
      ),
    );
  }

  const nextPortalPlacementRulesFrom = nullableNext(settings.portalPlacementRulesFrom, current.portalPlacementRulesFrom);
  const nextPortalPlacementRulesTo = nullableNext(settings.portalPlacementRulesTo, current.portalPlacementRulesTo);
  validatePortalPlacementRules(
    nextPortalPlacementRulesFrom,
    nextFrom,
    effectiveConnectionNames,
    `${path}.portalPlacementRulesFrom`,
    diagnostics,
  );
  validatePortalPlacementRules(
    nextPortalPlacementRulesTo,
    nextTo,
    effectiveConnectionNames,
    `${path}.portalPlacementRulesTo`,
    diagnostics,
  );

  const nextPortalFromEnabled = normalizePortalDefaults && settings.connectionType === "Portal"
    ? nullableNext(settings.portalFromEnabled, current.portalFromEnabled) ?? true
    : nullableNext(settings.portalFromEnabled, current.portalFromEnabled);
  const nextPortalToEnabled = normalizePortalDefaults && settings.connectionType === "Portal"
    ? nullableNext(settings.portalToEnabled, current.portalToEnabled) ?? true
    : nullableNext(settings.portalToEnabled, current.portalToEnabled);

  if (nextConnectionType === "Portal" && nextPortalFromEnabled === false && nextPortalToEnabled === false) {
    diagnostics.push(
      diagnostic(
        "warning",
        "mutation.connection.portalEndpointsDisabled",
        "Both portal endpoint enabled flags are false; the portal connection will create disabled portal endpoints.",
        path,
      ),
    );
  }

  warnIfGroundFieldsIgnored(settings, current, nextConnectionType, path, diagnostics);
  warnIfObservedOnlyFieldEdited(settings, path, diagnostics);
  warnIfGuardMatchGroupDiffers(settings, current, variant.connections ?? [], connectionIndex, path, diagnostics);
}

function applyConnectionSettings(
  connection: Connection,
  path: string,
  settings: ConnectionSettings,
  normalizePortalDefaults: boolean,
  changes: MutationChange[],
): void {
  if (settings.name !== undefined) {
    recordStringChange(connection, "name", `${path}.name`, settings.name, changes, "connection setting");
  }
  if (settings.from !== undefined) {
    recordStringChange(connection, "from", `${path}.from`, settings.from, changes, "connection setting");
  }
  if (settings.to !== undefined) {
    recordStringChange(connection, "to", `${path}.to`, settings.to, changes, "connection setting");
  }
  if (settings.connectionType !== undefined) {
    recordStringChange(connection, "connectionType", `${path}.connectionType`, settings.connectionType, changes, "connection setting");
  }

  for (const key of [
    "length",
    "portalFromEnabled",
    "portalToEnabled",
    "guardZone",
    "guardValue",
    "guardWeeklyIncrement",
    "guardReaction",
    "guardEscape",
    "guardMatchGroup",
    "gatePlacement",
    "gatePlacementArgs",
    "portalPlacementRulesFrom",
    "portalPlacementRulesTo",
    "road",
    "simTurnSquad",
    "guardRandomization",
  ] as const) {
    applyNullableSetting(connection, key, settings[key], `${path}.${key}`, changes);
  }

  if (normalizePortalDefaults && settings.connectionType === "Portal") {
    if (settings.portalFromEnabled === undefined && connection.portalFromEnabled === undefined) {
      recordValueChange(connection, "portalFromEnabled", `${path}.portalFromEnabled`, true, changes, "default enabled portal endpoint");
    }
    if (settings.portalToEnabled === undefined && connection.portalToEnabled === undefined) {
      recordValueChange(connection, "portalToEnabled", `${path}.portalToEnabled`, true, changes, "default enabled portal endpoint");
    }
  }
}

function validatePortalPlacementRules(
  rules: PlacementRule[] | null | undefined,
  contextZone: string | undefined,
  connectionNames: Map<string, Connection>,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (rules === undefined || rules === null) {
    return;
  }
  if (!Array.isArray(rules)) {
    diagnostics.push(diagnostic("error", "mutation.connection.portalPlacementRules.notArray", "Portal placement rules must be an array.", path));
    return;
  }
  rules.forEach((rule, index) => {
    const rulePath = `${path}[${index}]`;
    if (rule.type !== undefined && !isEnumValue(PLACEMENT_RULE_TYPES, rule.type)) {
      diagnostics.push(diagnostic("error", "mutation.connection.portalPlacementRuleTypeInvalid", `Invalid placement rule type '${rule.type}'.`, `${rulePath}.type`));
    }
    if (rule.args !== undefined && (!Array.isArray(rule.args) || rule.args.some((item) => typeof item !== "string"))) {
      diagnostics.push(diagnostic("error", "mutation.connection.portalPlacementRuleArgsInvalid", "Placement rule args must be strings.", `${rulePath}.args`));
    }
    validateOptionalNumber(rule.target, `${rulePath}.target`, "target", diagnostics);
    validateOptionalNumber(rule.targetMin, `${rulePath}.targetMin`, "targetMin", diagnostics);
    validateOptionalNumber(rule.targetMax, `${rulePath}.targetMax`, "targetMax", diagnostics);
    validateOptionalNonNegativeNumber(rule.weight, `${rulePath}.weight`, "weight", diagnostics);
    if (rule.targetMin !== undefined && rule.targetMax !== undefined && rule.targetMin > rule.targetMax) {
      diagnostics.push(diagnostic("error", "mutation.connection.portalPlacementRuleRangeInvalid", "targetMin cannot be greater than targetMax.", rulePath));
    }

    if (rule.type === "Connection") {
      const targetName = rule.args?.[0] ?? "";
      const targetConnection = connectionNames.get(targetName);
      if (!targetConnection) {
        diagnostics.push(
          diagnostic("error", "mutation.connection.portalPlacementRuleConnectionMissing", `Connection '${targetName}' does not exist.`, `${rulePath}.args`),
        );
        return;
      }
      if (targetConnection.connectionType === "Proximity") {
        diagnostics.push(
          diagnostic(
            "error",
            "mutation.connection.portalPlacementRuleProximityTarget",
            "Placement rules cannot target Proximity connections.",
            `${rulePath}.args`,
          ),
        );
      }
      if (contextZone && targetConnection.from !== contextZone && targetConnection.to !== contextZone) {
        diagnostics.push(
          diagnostic(
            "error",
            "mutation.connection.portalPlacementRuleWrongZone",
            `Connection '${targetName}' does not touch zone '${contextZone}'.`,
            `${rulePath}.args`,
          ),
        );
      }
    }
  });
}

function warnIfGroundFieldsIgnored(
  settings: ConnectionSettings,
  current: Connection,
  connectionType: string | undefined,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (connectionType !== "Portal" && connectionType !== "Proximity") {
    return;
  }
  const hasGuardFields =
    nullableNext(settings.guardZone, current.guardZone) !== undefined ||
    nullableNext(settings.guardValue, current.guardValue) !== undefined ||
    nullableNext(settings.guardWeeklyIncrement, current.guardWeeklyIncrement) !== undefined ||
    nullableNext(settings.guardReaction, current.guardReaction) !== undefined ||
    nullableNext(settings.guardEscape, current.guardEscape) !== undefined ||
    nullableNext(settings.guardMatchGroup, current.guardMatchGroup) !== undefined ||
    nullableNext(settings.gatePlacement, current.gatePlacement) !== undefined;
  if (!hasGuardFields) {
    return;
  }
  diagnostics.push(
    diagnostic(
      "warning",
      "mutation.connection.groundFieldsMayBeIgnored",
      `${connectionType} connections do not place a ground gate guard directly; guard and gate fields may be ignored unless the effective layout changes.`,
      path,
    ),
  );
}

function warnIfObservedOnlyFieldEdited(settings: ConnectionSettings, path: string, diagnostics: Diagnostic[]): void {
  for (const key of ["road", "simTurnSquad", "guardRandomization"] as const) {
    if (settings[key] === undefined) {
      continue;
    }
    diagnostics.push(
      diagnostic(
        "warning",
        `mutation.connection.${key}.observedOnly`,
        `${key} appears in official templates, but this field is not consumed by the inspected RandomMapTemplate.Connection C# model. Preserve it for compatibility.`,
        `${path}.${key}`,
      ),
    );
  }
}

function warnIfGuardMatchGroupDiffers(
  settings: ConnectionSettings,
  current: Connection,
  connections: Connection[],
  connectionIndex: number,
  path: string,
  diagnostics: Diagnostic[],
): void {
  const group = nullableNext(settings.guardMatchGroup, current.guardMatchGroup);
  if (!group) {
    return;
  }
  const nextGuardShape = {
    guardValue: nullableNext(settings.guardValue, current.guardValue),
    guardWeeklyIncrement: nullableNext(settings.guardWeeklyIncrement, current.guardWeeklyIncrement),
    guardReaction: nullableNext(settings.guardReaction, current.guardReaction),
    guardEscape: nullableNext(settings.guardEscape, current.guardEscape),
  };
  const mismatchedConnection = connections.find((connection, index) => {
    if (index === connectionIndex || connection.guardMatchGroup !== group) {
      return false;
    }
    return (
      connection.guardValue !== nextGuardShape.guardValue ||
      connection.guardWeeklyIncrement !== nextGuardShape.guardWeeklyIncrement ||
      connection.guardReaction !== nextGuardShape.guardReaction ||
      connection.guardEscape !== nextGuardShape.guardEscape
    );
  });
  if (!mismatchedConnection) {
    return;
  }
  diagnostics.push(
    diagnostic(
      "warning",
      "mutation.connection.guardMatchGroupMismatch",
      `Connection guardMatchGroup '${group}' should share guardValue, guardWeeklyIncrement, guardReaction, and guardEscape with every connection in the group.`,
      path,
    ),
  );
}

function buildEffectiveConnectionNameMap(connections: Connection[], selectedIndex: number, selectedName: string | undefined): Map<string, Connection> {
  const result = new Map<string, Connection>();
  connections.forEach((connection, index) => {
    const name = index === selectedIndex ? selectedName : connection.name;
    if (name) {
      result.set(name, connection);
    }
  });
  return result;
}

function applyNullableSetting(
  target: Connection,
  key: string,
  value: unknown,
  path: string,
  changes: MutationChange[],
): void {
  if (value === undefined) {
    return;
  }
  if (value === null) {
    recordDelete(target, key, path, changes, "connection setting removed");
    return;
  }
  recordValueChange(target, key, path, cloneValue(value), changes, "connection setting");
}

function nullableNext<T>(value: T | null | undefined, current: T | undefined): T | undefined {
  if (value === undefined) {
    return current;
  }
  if (value === null) {
    return undefined;
  }
  return value;
}

function validateNullableBoolean(value: unknown, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && value !== null && typeof value !== "boolean") {
    diagnostics.push(diagnostic("error", `mutation.connection.${label}.invalid`, `${label} must be a boolean.`, path));
  }
}

function validateNullableNonEmptyString(value: unknown, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && value !== null && (typeof value !== "string" || value.trim().length === 0)) {
    diagnostics.push(diagnostic("error", `mutation.connection.${label}.invalid`, `${label} must be a non-empty string.`, path));
  }
}

function validateNullableStringArray(value: unknown, path: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && value !== null && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) {
    diagnostics.push(diagnostic("error", "mutation.connection.stringArray.invalid", "Expected an array of strings.", path));
  }
}

function validateNullableInteger(value: unknown, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && value !== null && !Number.isInteger(value)) {
    diagnostics.push(diagnostic("error", `mutation.connection.${label}.invalid`, `${label} must be an integer.`, path));
  }
}

function validateNullableNonNegativeNumber(value: unknown, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && value !== null && (!isFiniteNumber(value) || (value as number) < 0)) {
    diagnostics.push(diagnostic("error", `mutation.connection.${label}.invalid`, `${label} must be a non-negative number.`, path));
  }
}

function validateOptionalNumber(value: unknown, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && !isFiniteNumber(value)) {
    diagnostics.push(diagnostic("error", `mutation.connection.${label}.invalid`, `${label} must be a number.`, path));
  }
}

function validateOptionalNonNegativeNumber(value: unknown, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && (!isFiniteNumber(value) || (value as number) < 0)) {
    diagnostics.push(diagnostic("error", `mutation.connection.${label}.invalid`, `${label} must be a non-negative number.`, path));
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
