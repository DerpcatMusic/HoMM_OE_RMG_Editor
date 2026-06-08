export const CONNECTION_TYPES = ["Default", "Direct", "GladiatorArena", "Portal", "Proximity"] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const GAME_MODES = ["Classic", "SingleHero"] as const;
export type GameMode = (typeof GAME_MODES)[number];

export const GATE_PLACEMENTS = ["Random", "Center", "NearZone"] as const;
export type GatePlacement = (typeof GATE_PLACEMENTS)[number];

export const MAIN_OBJECT_TYPES = ["City", "Spawn", "AbandonedOutpost", "GladiatorArena"] as const;
export type MainObjectType = (typeof MAIN_OBJECT_TYPES)[number];

export const MAIN_OBJECT_PLACEMENTS = ["Uniform", "Center", "Connection", "NearZone"] as const;
export type MainObjectPlacement = (typeof MAIN_OBJECT_PLACEMENTS)[number];

export const ROAD_TARGET_TYPES = ["Crossroads", "MainObject", "Connection", "MandatoryContent"] as const;
export type RoadTargetType = (typeof ROAD_TARGET_TYPES)[number];

export const ROAD_TYPES = ["Dirt", "Stone"] as const;
export type RoadType = (typeof ROAD_TYPES)[number];

export const FACTION_RULE_TYPES = ["FromList", "Match"] as const;
export type FactionRuleType = (typeof FACTION_RULE_TYPES)[number];

export const BIOME_RULE_TYPES = ["FromList", "MatchZone", "MatchMainObject"] as const;
export type BiomeRuleType = (typeof BIOME_RULE_TYPES)[number];

export const PLACEMENT_RULE_TYPES = [
  "Random",
  "Sid",
  "MainObject",
  "Crossroads",
  "Connection",
  "Road",
  "MandatoryContent",
] as const;
export type PlacementRuleType = (typeof PLACEMENT_RULE_TYPES)[number];

export const PLAYER_REFS = [
  "Player1",
  "Player2",
  "Player3",
  "Player4",
  "Player5",
  "Player6",
  "Player7",
  "Player8",
] as const;
export type PlayerRef = (typeof PLAYER_REFS)[number];

export const GUARD_REACTIONS = ["Aggressive", "Negative", "Common", "Friendly", "Peaceful", "Docile"] as const;
export type GuardReaction = (typeof GUARD_REACTIONS)[number];

export function isEnumValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
