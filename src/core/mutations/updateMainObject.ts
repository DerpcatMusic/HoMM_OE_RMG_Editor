import {
  FACTION_RULE_TYPES,
  isEnumValue,
  MAIN_OBJECT_PLACEMENTS,
  MAIN_OBJECT_TYPES,
  PLAYER_REFS,
  type MainObjectPlacement,
  type MainObjectType,
  type PlayerRef,
} from "../rmg/enums.js";
import type { FactionRule, MainObject, RmgTemplate } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import {
  buildMutationResult,
  getVariant,
  recordDelete,
  recordValueChange,
  selectMainObject,
  selectZone,
} from "./helpers.js";
import type { MainObjectSelector, MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";

export interface MainObjectSettings {
  type?: MainObjectType;
  spawn?: PlayerRef | null;
  owner?: PlayerRef | null;
  isKeyObject?: boolean;
  holdCityWinCon?: boolean;
  placement?: MainObjectPlacement;
  placementArgs?: string[];
  faction?: FactionRule | null;
  enableWeeklyUnitIncrement?: boolean;
  initialUnitIncrement?: number;
  guardChance?: number;
  guardValue?: number;
  guardWeeklyIncrement?: number;
  guardRandomization?: number;
  removeGuardIfHasOwner?: boolean;
  buildingsConstructionSid?: string | null;
  buildingsBanSid?: string | null;
}

export interface UpdateMainObjectInput extends VariantMutationInput {
  zone: ZoneSelector;
  mainObject: MainObjectSelector;
  settings: MainObjectSettings;
}

export function updateMainObject(input: UpdateMainObjectInput): MutationResult<RmgTemplate> {
  const template = cloneTemplate(input.template);
  const diagnostics: Diagnostic[] = [];
  const changes: MutationChange[] = [];
  const variantSelection = getVariant({ template, variantIndex: input.variantIndex }, diagnostics);
  if (!variantSelection) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selectedZone = selectZone(variantSelection.variant, variantSelection.path, input.zone, diagnostics);
  if (!selectedZone) {
    return buildMutationResult(template, changes, diagnostics);
  }
  const selectedMainObject = selectMainObject(selectedZone, input.mainObject, diagnostics);
  if (!selectedMainObject) {
    return buildMutationResult(template, changes, diagnostics);
  }

  validateMainObjectSettings(
    input.settings,
    selectedMainObject.mainObject,
    selectedMainObject.path,
    new Set((variantSelection.variant.zones ?? []).map((zone) => zone.name).filter((name): name is string => Boolean(name))),
    new Set((variantSelection.variant.connections ?? []).map((connection) => connection.name).filter((name): name is string => Boolean(name))),
    diagnostics,
  );
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  applyMainObjectSettings(selectedMainObject.mainObject, selectedMainObject.path, input.settings, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function validateMainObjectSettings(
  settings: MainObjectSettings,
  current: MainObject,
  path: string,
  zoneNames: Set<string>,
  connectionNames: Set<string>,
  diagnostics: Diagnostic[],
): void {
  if (settings.type !== undefined && !isEnumValue(MAIN_OBJECT_TYPES, settings.type)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.typeInvalid", `Invalid main object type '${settings.type}'.`, `${path}.type`));
  }
  const nextType = settings.type ?? current.type;
  const nextSpawn = settings.spawn === null ? undefined : settings.spawn ?? current.spawn;
  if (nextType === "Spawn" && !isEnumValue(PLAYER_REFS, nextSpawn)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.spawnMissing", "Spawn main objects require spawn Player1..Player8.", `${path}.spawn`));
  }
  if (settings.spawn !== undefined && settings.spawn !== null && !isEnumValue(PLAYER_REFS, settings.spawn)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.spawnInvalid", `Invalid spawn '${settings.spawn}'.`, `${path}.spawn`));
  }
  if (settings.owner !== undefined && settings.owner !== null && !isEnumValue(PLAYER_REFS, settings.owner)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.ownerInvalid", `Invalid owner '${settings.owner}'.`, `${path}.owner`));
  }
  if (settings.placement !== undefined && !isEnumValue(MAIN_OBJECT_PLACEMENTS, settings.placement)) {
    diagnostics.push(
      diagnostic("error", "mutation.mainObject.placementInvalid", `Invalid placement '${settings.placement}'.`, `${path}.placement`),
    );
  }
  if (settings.placementArgs !== undefined && (!Array.isArray(settings.placementArgs) || settings.placementArgs.some((item) => typeof item !== "string"))) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.placementArgsInvalid", "placementArgs must be strings.", `${path}.placementArgs`));
  }
  const nextPlacement = settings.placement ?? current.placement;
  const nextPlacementArgs = settings.placementArgs ?? current.placementArgs;
  if (nextPlacement === "Connection" && !connectionNames.has(nextPlacementArgs?.[0] ?? "")) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.mainObject.connectionPlacementMissing",
        `Connection '${nextPlacementArgs?.[0] ?? ""}' does not exist.`,
        `${path}.placementArgs`,
      ),
    );
  }
  if (nextPlacement === "NearZone" && !zoneNames.has(nextPlacementArgs?.[0] ?? "")) {
    diagnostics.push(
      diagnostic("error", "mutation.mainObject.nearZoneMissing", `Zone '${nextPlacementArgs?.[0] ?? ""}' does not exist.`, `${path}.placementArgs`),
    );
  }
  validateFactionRule(settings.faction, `${path}.faction`, diagnostics);
  validateNonNegativeNumber(settings.initialUnitIncrement, `${path}.initialUnitIncrement`, "initialUnitIncrement", diagnostics);
  validateNonNegativeNumber(settings.guardChance, `${path}.guardChance`, "guardChance", diagnostics);
  validateNonNegativeNumber(settings.guardValue, `${path}.guardValue`, "guardValue", diagnostics);
  validateNonNegativeNumber(settings.guardWeeklyIncrement, `${path}.guardWeeklyIncrement`, "guardWeeklyIncrement", diagnostics);
  validateNonNegativeNumber(settings.guardRandomization, `${path}.guardRandomization`, "guardRandomization", diagnostics);
}

function applyMainObjectSettings(
  mainObject: MainObject,
  path: string,
  settings: MainObjectSettings,
  changes: MutationChange[],
): void {
  for (const key of [
    "type",
    "isKeyObject",
    "holdCityWinCon",
    "placement",
    "placementArgs",
    "enableWeeklyUnitIncrement",
    "initialUnitIncrement",
    "guardChance",
    "guardValue",
    "guardWeeklyIncrement",
    "guardRandomization",
    "removeGuardIfHasOwner",
  ] as const) {
    if (settings[key] !== undefined) {
      recordValueChange(mainObject, key, `${path}.${key}`, cloneValue(settings[key]), changes, "main object setting");
    }
  }

  applyNullableSetting(mainObject, "spawn", settings.spawn, `${path}.spawn`, changes);
  applyNullableSetting(mainObject, "owner", settings.owner, `${path}.owner`, changes);
  applyNullableSetting(mainObject, "faction", settings.faction, `${path}.faction`, changes);
  applyNullableSetting(mainObject, "buildingsConstructionSid", settings.buildingsConstructionSid, `${path}.buildingsConstructionSid`, changes);
  applyNullableSetting(mainObject, "buildingsBanSid", settings.buildingsBanSid, `${path}.buildingsBanSid`, changes);
}

function applyNullableSetting(
  target: MainObject,
  key: string,
  value: unknown,
  path: string,
  changes: MutationChange[],
): void {
  if (value === undefined) {
    return;
  }
  if (value === null) {
    recordDelete(target, key, path, changes, "main object setting removed");
    return;
  }
  recordValueChange(target, key, path, cloneValue(value), changes, "main object setting");
}

function validateFactionRule(rule: FactionRule | null | undefined, path: string, diagnostics: Diagnostic[]): void {
  if (rule === undefined || rule === null) {
    return;
  }
  if (!isEnumValue(FACTION_RULE_TYPES, rule.type)) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.factionTypeInvalid", `Invalid faction rule type '${rule.type}'.`, `${path}.type`));
  }
  if (rule.args !== undefined && (!Array.isArray(rule.args) || rule.args.some((item) => typeof item !== "string"))) {
    diagnostics.push(diagnostic("error", "mutation.mainObject.factionArgsInvalid", "Faction rule args must be strings.", `${path}.args`));
  }
}

function validateNonNegativeNumber(value: number | undefined, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && (typeof value !== "number" || value < 0)) {
    diagnostics.push(diagnostic("error", `mutation.mainObject.${label}.invalid`, `${label} must be a non-negative number.`, path));
  }
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
