import { isEnumValue, ROAD_TYPES, type RoadType } from "../rmg/enums.js";
import type { RmgTemplate, RoadConfig, RoadTargetConfig } from "../rmg/rmgTypes.js";
import { diagnostic, type Diagnostic } from "../validation/validationTypes.js";
import { cloneTemplate } from "./cloneTemplate.js";
import { buildMutationResult, getVariant, recordDelete, recordValueChange, selectZone } from "./helpers.js";
import type { MutationChange, MutationResult, VariantMutationInput, ZoneSelector } from "./mutationTypes.js";
import { cloneRoad, validateRoadConfig } from "./roadHelpers.js";

export interface RoadSettings {
  type?: RoadType | null;
  from?: RoadTargetConfig;
  to?: RoadTargetConfig;
}

export interface UpdateZoneRoadInput extends VariantMutationInput {
  zone: ZoneSelector;
  roadIndex: number;
  settings: RoadSettings;
}

export function updateZoneRoad(input: UpdateZoneRoadInput): MutationResult<RmgTemplate> {
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

  const road = selectRoad(selected.zone.roads, input.roadIndex, selected.path, diagnostics);
  if (!road) {
    return buildMutationResult(template, changes, diagnostics);
  }

  validateRoadSettings(input.settings, `${selected.path}.roads[${input.roadIndex}]`, diagnostics);
  const nextRoad = buildNextRoad(road, input.settings);
  validateRoadConfig(nextRoad, { template, variant: variantSelection.variant, zone: selected.zone, zonePath: selected.path }, `${selected.path}.roads[${input.roadIndex}]`, diagnostics);
  if (diagnostics.some((item) => item.severity === "error")) {
    return buildMutationResult(template, changes, diagnostics);
  }

  applyRoadSettings(road, `${selected.path}.roads[${input.roadIndex}]`, input.settings, changes);

  return buildMutationResult(template, changes, diagnostics);
}

function selectRoad(
  roads: RoadConfig[] | undefined,
  roadIndex: number,
  zonePath: string,
  diagnostics: Diagnostic[],
): RoadConfig | undefined {
  const road = roads?.[roadIndex];
  if (!road) {
    diagnostics.push(diagnostic("error", "mutation.zone.road.missing", `Road index ${roadIndex} does not exist.`, `${zonePath}.roads[${roadIndex}]`));
    return undefined;
  }
  return road;
}

function validateRoadSettings(settings: RoadSettings, path: string, diagnostics: Diagnostic[]): void {
  if (settings.type !== undefined && settings.type !== null && !isEnumValue(ROAD_TYPES, settings.type)) {
    diagnostics.push(diagnostic("error", "mutation.zone.road.typeInvalid", `Invalid road type '${settings.type}'.`, `${path}.type`));
  }
}

function buildNextRoad(road: RoadConfig, settings: RoadSettings): RoadConfig {
  const nextRoad = cloneRoad(road);
  if (settings.type !== undefined) {
    if (settings.type === null) {
      delete nextRoad.type;
    } else {
      nextRoad.type = settings.type;
    }
  }
  if (settings.from !== undefined) {
    nextRoad.from = cloneValue(settings.from);
  }
  if (settings.to !== undefined) {
    nextRoad.to = cloneValue(settings.to);
  }
  return nextRoad;
}

function applyRoadSettings(road: RoadConfig, path: string, settings: RoadSettings, changes: MutationChange[]): void {
  if (settings.type !== undefined) {
    if (settings.type === null) {
      recordDelete(road, "type", `${path}.type`, changes, "zone road setting removed");
    } else {
      recordValueChange(road, "type", `${path}.type`, settings.type, changes, "zone road setting");
    }
  }
  if (settings.from !== undefined) {
    recordValueChange(road, "from", `${path}.from`, cloneValue(settings.from), changes, "zone road setting");
  }
  if (settings.to !== undefined) {
    recordValueChange(road, "to", `${path}.to`, cloneValue(settings.to), changes, "zone road setting");
  }
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
