import { MAIN_OBJECT_PLACEMENTS, MAIN_OBJECT_TYPES, type MainObjectPlacement, type MainObjectType } from "../../core/rmg/enums.js";
import type { ConditionalFieldState } from "./connectionConditionals.js";

export interface MainObjectConditionalContext {
  objectType: string;
  placement: string;
  hasSpawn?: boolean;
  hasOwner?: boolean;
  hasHoldCity?: boolean;
  hasPlacementArgs?: boolean;
  hasFaction?: boolean;
  hasGrowthValues?: boolean;
  hasGuardValues?: boolean;
  hasBuildingValues?: boolean;
}

export interface MainObjectConditionalState {
  objectType: MainObjectType | undefined;
  placement: MainObjectPlacement | undefined;
  summary: string;
  spawn: ConditionalFieldState;
  owner: ConditionalFieldState;
  holdCity: ConditionalFieldState;
  placementArgs: ConditionalFieldState;
  faction: ConditionalFieldState;
  growth: ConditionalFieldState;
  guards: ConditionalFieldState;
  cityBuildings: ConditionalFieldState;
}

export function getMainObjectConditionalState(context: MainObjectConditionalContext): MainObjectConditionalState {
  const objectType = parseMainObjectType(context.objectType);
  const placement = parsePlacement(context.placement);
  const placementArgs = placementArgsState(placement, context.hasPlacementArgs);

  if (!objectType) {
    return {
      objectType,
      placement,
      summary: "Unknown main-object type. Keep fields editable so the template can be repaired without data loss.",
      spawn: active("Unknown type; preserve/edit spawn."),
      owner: active("Unknown type; preserve/edit owner."),
      holdCity: active("Unknown type; preserve/edit city-hold flag."),
      placementArgs,
      faction: active("Unknown type; preserve/edit faction rule."),
      growth: active("Unknown type; preserve/edit growth fields."),
      guards: active("Unknown type; preserve/edit guard fields."),
      cityBuildings: active("Unknown type; preserve/edit building SID fields."),
    };
  }

  switch (objectType) {
    case "Spawn":
      return {
        objectType,
        placement,
        summary: "Spawn requires a player spawn side and can still use faction, placement, growth, and guard settings.",
        spawn: required("Spawn main objects require a player reference."),
        owner: inactivePreserved(context.hasOwner, "Spawn uses spawn player, not owner."),
        holdCity: inactivePreserved(context.hasHoldCity, "Spawn is not a city-hold target."),
        placementArgs,
        faction: active("Spawn faction rule controls the starting town/faction unless lobby overrides apply."),
        growth: active("Spawn objects may use weekly unit increment settings."),
        guards: active("Spawn objects may use guard settings."),
        cityBuildings: inactivePreserved(context.hasBuildingValues, "Spawn does not use city/outpost building SID overrides."),
      };
    case "City":
      return {
        objectType,
        placement,
        summary: "City can be owned, factioned, used for city-hold, and can receive building SID overrides.",
        spawn: inactivePreserved(context.hasSpawn, "City does not require a spawn player reference."),
        owner: active("City can receive an explicit owner."),
        holdCity: active("City can be marked as the city-hold win-condition target."),
        placementArgs,
        faction: active("City faction rule resolves the generated city faction."),
        growth: active("City can use growth/unit increment settings."),
        guards: active("City can use guard settings."),
        cityBuildings: active("City building SID overrides are relevant."),
      };
    case "AbandonedOutpost":
      return {
        objectType,
        placement,
        summary: "AbandonedOutpost behaves like a city-like anchor for faction, owner, guards, and building constraints.",
        spawn: inactivePreserved(context.hasSpawn, "AbandonedOutpost does not require a spawn player reference."),
        owner: active("AbandonedOutpost can receive an explicit owner."),
        holdCity: active("Outpost city-hold flags are official-data-observed; validate against win settings."),
        placementArgs,
        faction: active("AbandonedOutpost faction rule resolves generated faction."),
        growth: active("AbandonedOutpost can use growth settings."),
        guards: active("AbandonedOutpost can use guard settings."),
        cityBuildings: active("Outpost building SID overrides are relevant."),
      };
    case "GladiatorArena":
      return {
        objectType,
        placement,
        summary: "GladiatorArena is a special arena anchor; most city/spawn fields are inactive unless preserving authored data.",
        spawn: inactivePreserved(context.hasSpawn, "GladiatorArena does not use spawn player references."),
        owner: inactivePreserved(context.hasOwner, "GladiatorArena is not an owned town anchor."),
        holdCity: inactivePreserved(context.hasHoldCity, "GladiatorArena is not a city-hold target."),
        placementArgs,
        faction: inactivePreserved(context.hasFaction, "GladiatorArena does not need a faction rule."),
        growth: inactivePreserved(context.hasGrowthValues, "GladiatorArena does not use city growth settings."),
        guards: active("Arena objects may still be guarded depending on template authoring."),
        cityBuildings: inactivePreserved(context.hasBuildingValues, "GladiatorArena does not use city building SID overrides."),
      };
  }
}

function placementArgsState(placement: MainObjectPlacement | undefined, hasValue: boolean | undefined): ConditionalFieldState {
  if (!placement) {
    return active("Unknown placement mode; keep args editable for repair.");
  }
  if (placement === "Connection") {
    return required("Connection placement requires connection-name args.");
  }
  if (placement === "NearZone") {
    return active("NearZone placement can use zone-name args.");
  }
  return inactivePreserved(hasValue, `${placement} placement does not consume placementArgs.`);
}

function parseMainObjectType(value: string): MainObjectType | undefined {
  return MAIN_OBJECT_TYPES.find((type) => type === value);
}

function parsePlacement(value: string): MainObjectPlacement | undefined {
  return MAIN_OBJECT_PLACEMENTS.find((type) => type === value);
}

function active(reason: string): ConditionalFieldState {
  return { state: "active", visible: true, enabled: true, required: false, reason };
}

function required(reason: string): ConditionalFieldState {
  return { state: "active", visible: true, enabled: true, required: true, reason };
}

function inactivePreserved(hasValue: boolean | undefined, reason: string): ConditionalFieldState {
  return {
    state: hasValue ? "inactivePreserved" : "active",
    visible: Boolean(hasValue),
    enabled: false,
    required: false,
    reason,
  };
}
