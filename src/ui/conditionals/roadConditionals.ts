import { ROAD_TARGET_TYPES, type RoadTargetType } from "../../core/rmg/enums.js";
import type { ConditionalFieldState } from "./connectionConditionals.js";

export interface RoadTargetConditionalState {
  targetType: RoadTargetType | undefined;
  args: ConditionalFieldState;
  summary: string;
}

export function getRoadTargetConditionalState(targetTypeValue: string, hasArgs: boolean): RoadTargetConditionalState {
  const targetType = ROAD_TARGET_TYPES.find((type) => type === targetTypeValue);
  if (!targetType) {
    return {
      targetType,
      args: active("Unknown road target type; keep args editable for repair."),
      summary: "Unknown target type. The generator may drop this road unless the type is valid.",
    };
  }

  switch (targetType) {
    case "Crossroads":
      return {
        targetType,
        args: inactivePreserved(hasArgs, "Crossroads road target uses no args."),
        summary: "Crossroads targets the zone road hub and needs no argument.",
      };
    case "MainObject":
      return {
        targetType,
        args: required("MainObject road target requires a zone-local main-object index."),
        summary: "MainObject roads target a main object inside the selected zone.",
      };
    case "Connection":
      return {
        targetType,
        args: required("Connection road target requires a non-Proximity connection name touching this zone."),
        summary: "Connection roads target an authored connection endpoint in this zone.",
      };
    case "MandatoryContent":
      return {
        targetType,
        args: required("MandatoryContent road target requires an entry name from a selected mandatory preset."),
        summary: "MandatoryContent roads target a guaranteed content entry and imply designated encounter behavior.",
      };
  }
}

function active(reason: string): ConditionalFieldState {
  return { state: "active", visible: true, enabled: true, required: false, reason };
}

function required(reason: string): ConditionalFieldState {
  return { state: "active", visible: true, enabled: true, required: true, reason };
}

function inactivePreserved(hasValue: boolean, reason: string): ConditionalFieldState {
  return {
    state: hasValue ? "inactivePreserved" : "active",
    visible: hasValue,
    enabled: false,
    required: false,
    reason,
  };
}
