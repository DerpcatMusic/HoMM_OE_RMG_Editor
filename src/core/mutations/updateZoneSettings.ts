import {
  BIOME_RULE_TYPES,
  isEnumValue,
} from "../rmg/enums.js";
import type { BiomeRule, RmgTemplate, RoadConfig, Zone } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordValueChange, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";
import { createRoadStub, validateRoadConfig, validateRoadStub, type RoadStubInput } from "./roadHelpers.js";

export interface ZoneSettings {
  size?: number;
  layout?: string;
  zoneBiome?: BiomeRule;
  contentBiome?: BiomeRule;
  metaObjectsBiome?: BiomeRule;
  crossroadsPosition?: number;
  diplomacyModifier?: number;
  guardCutoffValue?: number;
  guardMultiplier?: number;
  guardRandomization?: number;
  guardWeeklyIncrement?: number;
  guardReactionDistribution?: number[];
}

export interface UpdateZoneSettingsInput extends VariantMutationInput {
  zone: ZoneSelector;
  settings?: ZoneSettings;
  roads?: RoadConfig[];
  clearRoads?: boolean;
  roadStubs?: RoadStubInput[];
}

export function updateZoneSettings(input: UpdateZoneSettingsInput): MutationResult<RmgTemplate> {
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

  const roadOperationCount = [input.roads !== undefined, input.clearRoads === true, input.roadStubs !== undefined].filter(Boolean).length;
  if (roadOperationCount > 1) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.roads.conflict",
        "Use only one of roads, clearRoads, or roadStubs in a single update.",
        `${selected.path}.roads`,
      ),
    );
  }
  validateZoneSettings(input.settings, selected.path, diagnostics);
  validateRoads(input.roads, template, variantSelection.variant, selected.zone, `${selected.path}.roads`, diagnostics);
  validateRoadStubs(input.roadStubs, template, variantSelection.variant, selected.zone, `${selected.path}.roads`, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  if (input.settings) {
    applyZoneSettings(selected.zone, selected.path, input.settings, changes);
  }
  if (input.roads !== undefined) {
    recordValueChange(selected.zone, "roads", `${selected.path}.roads`, cloneValue(input.roads), changes, "zone roads replaced");
  } else if (input.clearRoads) {
    recordValueChange(selected.zone, "roads", `${selected.path}.roads`, [], changes, "zone roads cleared");
  } else if (input.roadStubs !== undefined) {
    const roads = input.roadStubs.map((stub) => createRoadStub(stub));
    recordValueChange(selected.zone, "roads", `${selected.path}.roads`, roads, changes, "zone road stubs generated");
  }

  return buildMutationResult(template, changes, diagnostics);
}

function applyZoneSettings(zone: Zone, zonePath: string, settings: ZoneSettings, changes: MutationChange[]): void {
  for (const key of [
    "size",
    "layout",
    "zoneBiome",
    "contentBiome",
    "metaObjectsBiome",
    "crossroadsPosition",
    "diplomacyModifier",
    "guardCutoffValue",
    "guardMultiplier",
    "guardRandomization",
    "guardWeeklyIncrement",
    "guardReactionDistribution",
  ] as const) {
    if (settings[key] !== undefined) {
      recordValueChange(zone, key, `${zonePath}.${key}`, cloneValue(settings[key]), changes, "zone setting");
    }
  }
}

function validateZoneSettings(settings: ZoneSettings | undefined, zonePath: string, diagnostics: Diagnostic[]): void {
  if (!settings) {
    return;
  }
  validatePositiveNumber(settings.size, `${zonePath}.size`, "zone size", diagnostics);
  validateNonEmptyString(settings.layout, `${zonePath}.layout`, "layout", diagnostics);
  validateBiomeRule(settings.zoneBiome, `${zonePath}.zoneBiome`, diagnostics);
  validateBiomeRule(settings.contentBiome, `${zonePath}.contentBiome`, diagnostics);
  validateBiomeRule(settings.metaObjectsBiome, `${zonePath}.metaObjectsBiome`, diagnostics);
  validateNumber(settings.crossroadsPosition, `${zonePath}.crossroadsPosition`, "crossroadsPosition", diagnostics);
  validateNumber(settings.diplomacyModifier, `${zonePath}.diplomacyModifier`, "diplomacyModifier", diagnostics);
  validateNonNegativeNumber(settings.guardCutoffValue, `${zonePath}.guardCutoffValue`, "guardCutoffValue", diagnostics);
  validateNonNegativeNumber(settings.guardMultiplier, `${zonePath}.guardMultiplier`, "guardMultiplier", diagnostics);
  validateNonNegativeNumber(settings.guardRandomization, `${zonePath}.guardRandomization`, "guardRandomization", diagnostics);
  validateNonNegativeNumber(settings.guardWeeklyIncrement, `${zonePath}.guardWeeklyIncrement`, "guardWeeklyIncrement", diagnostics);
  if (
    settings.guardReactionDistribution !== undefined &&
    (!Array.isArray(settings.guardReactionDistribution) ||
      settings.guardReactionDistribution.length !== 6 ||
      settings.guardReactionDistribution.some((item) => typeof item !== "number" || item < 0))
  ) {
    diagnostics.push(
      diagnostic(
        "error",
        "mutation.zone.guardReactionDistribution.invalid",
        "guardReactionDistribution must contain exactly 6 non-negative numbers.",
        `${zonePath}.guardReactionDistribution`,
      ),
    );
  }
}

function validateBiomeRule(rule: BiomeRule | undefined, path: string, diagnostics: Diagnostic[]): void {
  if (rule === undefined) {
    return;
  }
  if (!isEnumValue(BIOME_RULE_TYPES, rule.type)) {
    diagnostics.push(diagnostic("error", "mutation.zone.biomeRule.invalid", `Invalid biome rule type '${rule.type}'.`, `${path}.type`));
  }
  if (rule.args !== undefined && (!Array.isArray(rule.args) || rule.args.some((item) => typeof item !== "string"))) {
    diagnostics.push(diagnostic("error", "mutation.zone.biomeRule.argsInvalid", "Biome rule args must be strings.", `${path}.args`));
  }
}

function validateRoads(
  roads: RoadConfig[] | undefined,
  template: RmgTemplate,
  variant: NonNullable<RmgTemplate["variants"]>[number],
  zone: Zone,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (roads === undefined) {
    return;
  }
  if (!Array.isArray(roads)) {
    diagnostics.push(diagnostic("error", "mutation.zone.roads.notArray", "Roads must be an array.", path));
    return;
  }
  roads.forEach((road, index) => {
    validateRoadConfig(road, { template, variant, zone, zonePath: path.replace(/\.roads$/, "") }, `${path}[${index}]`, diagnostics);
  });
}

function validateRoadStubs(
  stubs: RoadStubInput[] | undefined,
  template: RmgTemplate,
  variant: NonNullable<RmgTemplate["variants"]>[number],
  zone: Zone,
  path: string,
  diagnostics: Diagnostic[],
): void {
  if (stubs === undefined) {
    return;
  }
  if (!Array.isArray(stubs)) {
    diagnostics.push(diagnostic("error", "mutation.zone.roadStubs.notArray", "Road stubs must be an array.", path));
    return;
  }
  stubs.forEach((stub, index) => {
    validateRoadStub(stub, { template, variant, zone, zonePath: path.replace(/\.roads$/, "") }, `${path}[${index}]`, diagnostics);
  });
}

function validatePositiveNumber(value: number | undefined, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && (typeof value !== "number" || value <= 0)) {
    diagnostics.push(diagnostic("error", `mutation.zone.${label}.invalid`, `${label} must be a positive number.`, path));
  }
}

function validateNonNegativeNumber(value: number | undefined, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && (typeof value !== "number" || value < 0)) {
    diagnostics.push(diagnostic("error", `mutation.zone.${label}.invalid`, `${label} must be a non-negative number.`, path));
  }
}

function validateNumber(value: number | undefined, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && typeof value !== "number") {
    diagnostics.push(diagnostic("error", `mutation.zone.${label}.invalid`, `${label} must be a number.`, path));
  }
}

function validateNonEmptyString(value: string | undefined, path: string, label: string, diagnostics: Diagnostic[]): void {
  if (value !== undefined && value.trim().length === 0) {
    diagnostics.push(diagnostic("error", `mutation.zone.${label}.empty`, `${label} cannot be empty.`, path));
  }
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
