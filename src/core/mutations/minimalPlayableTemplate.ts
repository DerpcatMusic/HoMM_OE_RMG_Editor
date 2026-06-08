import { PLAYER_REFS, type PlayerRef } from "../rmg/enums.js";
import type { Connection, MainObject, RmgTemplate, RoadConfig, Zone } from "../rmg/rmgTypes.js";
import type { WinConditionPresetId } from "../rmg/winConditions.js";
import {
  createDefaultConnection,
  createDefaultTemplate,
  createDefaultZone,
  type DefaultTemplateOptions,
} from "./defaultObjects.js";

export interface MinimalPlayableTemplateOptions extends DefaultTemplateOptions {
  playerCount?: number;
}

const PLAYER_ZONE_SUFFIXES = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export function createMinimalPlayableTemplate(options: MinimalPlayableTemplateOptions): RmgTemplate {
  const playerCount = options.playerCount ?? 2;
  if (!Number.isInteger(playerCount) || playerCount < 2 || playerCount > PLAYER_REFS.length) {
    throw new Error(`playerCount must be an integer from 2 to ${PLAYER_REFS.length}.`);
  }

  const template = createDefaultTemplate(options);
  const variant = template.variants?.[0];
  if (!variant) {
    throw new Error("Default template factory did not create a variant.");
  }

  const centerZone = createCenterZone(options.winConditionPreset);
  const zones: Zone[] = [centerZone];
  const connections: Connection[] = [];

  for (let index = 0; index < playerCount; index += 1) {
    const zoneName = `Spawn-${PLAYER_ZONE_SUFFIXES[index]}`;
    const connectionName = `${zoneName}-Center`;
    zones.push(createSpawnZone(zoneName, PLAYER_REFS[index] as PlayerRef, connectionName));
    connections.push(
      createDefaultConnection({
        name: connectionName,
        from: zoneName,
        to: "Center",
        connectionType: "Default",
        length: 1,
      }),
    );
  }

  if (centerZone.mainObjects && centerZone.mainObjects.length > 0) {
    centerZone.roads = connections.map((connection) => createRoadFromMainObjectToConnection(connection.name ?? ""));
  }

  variant.zones = zones;
  variant.connections = connections;
  variant.orientation = {
    ...variant.orientation,
    zeroAngleZone: "Spawn-A",
  };

  return template;
}

function createSpawnZone(name: string, playerRef: PlayerRef, connectionName: string): Zone {
  return {
    ...createDefaultZone({ name, size: 1 }),
    guardedContentValue: 50000,
    unguardedContentValue: 25000,
    resourcesValue: 20000,
    mainObjects: [createSpawnMainObject(playerRef)],
    zoneBiome: { type: "MatchMainObject", args: ["0"] },
    contentBiome: { type: "MatchZone", args: [] },
    metaObjectsBiome: { type: "MatchZone", args: [] },
    roads: [createRoadFromMainObjectToConnection(connectionName)],
  };
}

function createCenterZone(winConditionPreset: WinConditionPresetId | undefined): Zone {
  const mainObjects = winConditionPreset === "cityHold" ? [createCityHoldMainObject()] : [];
  return {
    ...createDefaultZone({ name: "Center", size: 1.2 }),
    guardedContentValue: 150000,
    unguardedContentValue: 50000,
    resourcesValue: 25000,
    mainObjects,
  };
}

function createSpawnMainObject(playerRef: PlayerRef): MainObject {
  return {
    type: "Spawn",
    spawn: playerRef,
    removeGuardIfHasOwner: true,
    guardChance: 0.5,
    guardValue: 2500,
    guardWeeklyIncrement: 0.1,
    buildingsConstructionSid: "default_buildings_construction",
    placement: "Uniform",
    placementArgs: ["true", "0.7", "0"],
  };
}

function createCityHoldMainObject(): MainObject {
  return {
    type: "City",
    holdCityWinCon: true,
    guardValue: 10000,
    guardWeeklyIncrement: 0.1,
    buildingsConstructionSid: "default_buildings_construction",
    faction: { type: "FromList", args: [] },
    placement: "Center",
    placementArgs: [],
  };
}

function createRoadFromMainObjectToConnection(connectionName: string): RoadConfig {
  return {
    type: "Stone",
    from: { type: "MainObject", args: ["0"] },
    to: { type: "Connection", args: [connectionName] },
  };
}
