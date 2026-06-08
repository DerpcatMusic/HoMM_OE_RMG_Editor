import { CONNECTION_TYPES, type ConnectionType } from "../../core/rmg/enums.js";

export type ConditionalFieldStateKind = "active" | "inactivePreserved" | "invalid" | "sourceUncertain";

export interface ConditionalFieldState {
  state: ConditionalFieldStateKind;
  visible: boolean;
  enabled: boolean;
  required: boolean;
  reason: string;
}

export interface ConnectionConditionalContext {
  connectionType: string;
  hasPortalValues?: boolean;
  hasGateValues?: boolean;
  hasGuardValues?: boolean;
  hasCompatibilityValues?: boolean;
}

export interface ConnectionConditionalState {
  authoredType: string;
  knownType: ConnectionType | undefined;
  effectiveTypeText: string;
  summary: string;
  length: ConditionalFieldState;
  gatePlacement: ConditionalFieldState;
  gatePlacementArgs: ConditionalFieldState;
  guardZone: ConditionalFieldState;
  guardSquad: ConditionalFieldState;
  portal: ConditionalFieldState;
  compatibility: ConditionalFieldState;
}

const ACTIVE: Omit<ConditionalFieldState, "reason"> = {
  state: "active",
  visible: true,
  enabled: true,
  required: false,
};

export function getConnectionConditionalState(context: ConnectionConditionalContext): ConnectionConditionalState {
  const knownType = parseConnectionType(context.connectionType);
  if (!knownType) {
    return {
      authoredType: context.connectionType,
      knownType,
      effectiveTypeText: "unknown",
      summary: "Unknown connection type. Preserve values, but validate before saving as new authoring.",
      length: active("Unknown connection type; keep visible for repair."),
      gatePlacement: active("Unknown connection type; keep visible for repair."),
      gatePlacementArgs: active("Unknown connection type; keep visible for repair."),
      guardZone: active("Unknown connection type; keep visible for repair."),
      guardSquad: active("Unknown connection type; keep visible for repair."),
      portal: active("Unknown connection type; keep visible for repair."),
      compatibility: compatibilityState(context.hasCompatibilityValues),
    };
  }

  switch (knownType) {
    case "Default":
      return {
        authoredType: knownType,
        knownType,
        effectiveTypeText: "Direct if a valid gate exists, otherwise Portal",
        summary: "Default is intentionally conditional. Keep direct gate controls visible and keep portal settings as fallback.",
        length: active("Advisory for adjacency if the generated result becomes direct."),
        gatePlacement: active("Default can place a ground gate."),
        gatePlacementArgs: inactiveUnless(context.hasGateValues, "Only active when gate placement is NearZone."),
        guardZone: active("Only endpoint zones are meaningful; non-endpoints are discarded by the generator."),
        guardSquad: active("Used by direct guards or fallback portal squads."),
        portal: fallbackPortalState(context.hasPortalValues),
        compatibility: compatibilityState(context.hasCompatibilityValues),
      };
    case "Direct":
      return {
        authoredType: knownType,
        knownType,
        effectiveTypeText: "Direct if a valid gate exists, otherwise Portal",
        summary: "Direct needs a ground gate, but can fall back to Portal if gate placement fails.",
        length: active("Direct needs adjacency and uses length."),
        gatePlacement: active("Direct can place a ground gate."),
        gatePlacementArgs: inactiveUnless(context.hasGateValues, "Only active when gate placement is NearZone."),
        guardZone: active("Only endpoint zones are meaningful; non-endpoints are discarded by the generator."),
        guardSquad: active("Used for direct guards or fallback portal squads."),
        portal: fallbackPortalState(context.hasPortalValues),
        compatibility: compatibilityState(context.hasCompatibilityValues),
      };
    case "GladiatorArena":
      return {
        authoredType: knownType,
        knownType,
        effectiveTypeText: "GladiatorArena with required non-ramp gate",
        summary: "GladiatorArena is a special ground connection. It needs a valid gate and should align with arena win settings.",
        length: active("GladiatorArena needs adjacency and uses length."),
        gatePlacement: active("Arena placement needs a ground gate."),
        gatePlacementArgs: inactiveUnless(context.hasGateValues, "Only active when gate placement is NearZone."),
        guardZone: active("Only endpoint zones are meaningful; non-endpoints are discarded by the generator."),
        guardSquad: active("Used for the arena connection squad parameters."),
        portal: inactivePreserved(context.hasPortalValues, "Portal fields are not active for GladiatorArena."),
        compatibility: compatibilityState(context.hasCompatibilityValues),
      };
    case "Portal":
      return {
        authoredType: knownType,
        knownType,
        effectiveTypeText: "Portal",
        summary: "Portal places portal objects in both endpoint zones. Ground gate and adjacency controls are inactive.",
        length: inactivePreserved(false, "Portal does not need adjacency length."),
        gatePlacement: inactivePreserved(context.hasGateValues, "Portal does not place a ground gate."),
        gatePlacementArgs: inactivePreserved(context.hasGateValues, "Portal does not use gate placement args."),
        guardZone: inactivePreserved(false, "Portal has no ground gate guard zone."),
        guardSquad: active("Portal pair receives connection squad parameters."),
        portal: active("Portal active flags and placement rules are active."),
        compatibility: compatibilityState(context.hasCompatibilityValues),
      };
    case "Proximity":
      return {
        authoredType: knownType,
        knownType,
        effectiveTypeText: "Proximity adjacency only",
        summary: "Proximity affects layout adjacency but is not a traversable gate or portal target.",
        length: active("Proximity needs adjacency and uses length."),
        gatePlacement: inactivePreserved(context.hasGateValues, "Proximity does not place a ground gate."),
        gatePlacementArgs: inactivePreserved(context.hasGateValues, "Proximity does not use gate placement args."),
        guardZone: inactivePreserved(context.hasGuardValues, "Proximity has no guard position."),
        guardSquad: inactivePreserved(context.hasGuardValues, "Proximity does not place connection guards."),
        portal: inactivePreserved(context.hasPortalValues, "Proximity does not place portals."),
        compatibility: compatibilityState(context.hasCompatibilityValues),
      };
  }
}

export function isKnownConnectionType(value: string): value is ConnectionType {
  return parseConnectionType(value) !== undefined;
}

function parseConnectionType(value: string): ConnectionType | undefined {
  return CONNECTION_TYPES.find((type) => type === value);
}

function active(reason: string): ConditionalFieldState {
  return { ...ACTIVE, reason };
}

function inactiveUnless(hasValue: boolean | undefined, reason: string): ConditionalFieldState {
  return inactivePreserved(hasValue, reason);
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

function fallbackPortalState(hasValue: boolean | undefined): ConditionalFieldState {
  return {
    state: hasValue ? "inactivePreserved" : "active",
    visible: Boolean(hasValue),
    enabled: false,
    required: false,
    reason: "Only active if this connection falls back to generated Portal behavior.",
  };
}

function compatibilityState(hasValue: boolean | undefined): ConditionalFieldState {
  return {
    state: hasValue ? "sourceUncertain" : "active",
    visible: true,
    enabled: true,
    required: false,
    reason: "Official templates use some compatibility fields that are not fully declared in the inspected C# connection type.",
  };
}
